import { GoogleGenAI } from "@google/genai";
import { WebSocket } from "ws";

export class GeminiLiveService {
  private clients: Map<WebSocket, any> = new Map();
  private genAI: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    this.genAI = new GoogleGenAI({ apiKey });
  }

  async configure(config: any, clientWs: WebSocket) {
    try {
      console.log('Configuring Gemini Live session with config:', config);
      
      // Store client configuration
      this.clients.set(clientWs, {
        config,
        session: null,
        audioBuffer: [],
        isProcessing: false
      });

      // Send confirmation to client
      this.sendToClient(clientWs, {
        type: 'configured',
        success: true
      });

    } catch (error) {
      console.error('Error configuring Gemini Live session:', error);
      this.sendToClient(clientWs, {
        type: 'error',
        message: 'Failed to configure session'
      });
    }
  }

  async sendAudio(audioData: any, clientWs: WebSocket) {
    try {
      const clientData = this.clients.get(clientWs);
      if (!clientData) {
        throw new Error('Client not configured');
      }

      // Add audio to buffer
      clientData.audioBuffer.push(audioData);

      // Process audio in real-time if not already processing
      if (!clientData.isProcessing) {
        await this.processAudioBuffer(clientWs);
      }

    } catch (error) {
      console.error('Error sending audio to Gemini:', error);
      this.sendToClient(clientWs, {
        type: 'error',
        message: 'Failed to process audio'
      });
    }
  }

  async endInput(clientWs: WebSocket) {
    try {
      const clientData = this.clients.get(clientWs);
      if (!clientData) {
        return;
      }

      console.log('Processing end of input...');
      
      // Process any remaining audio in buffer
      if (clientData.audioBuffer.length > 0) {
        await this.processAudioBuffer(clientWs, true);
      }

    } catch (error) {
      console.error('Error ending input:', error);
      this.sendToClient(clientWs, {
        type: 'error',
        message: 'Failed to end input'
      });
    }
  }

  async resetSession(clientWs: WebSocket) {
    try {
      const clientData = this.clients.get(clientWs);
      if (!clientData) {
        return;
      }

      // Reset client data
      clientData.audioBuffer = [];
      clientData.isProcessing = false;
      clientData.session = null;

      this.sendToClient(clientWs, {
        type: 'session_reset',
        success: true
      });

    } catch (error) {
      console.error('Error resetting session:', error);
      this.sendToClient(clientWs, {
        type: 'error',
        message: 'Failed to reset session'
      });
    }
  }

  async updateSettings(settings: any, clientWs: WebSocket) {
    try {
      const clientData = this.clients.get(clientWs);
      if (!clientData) {
        return;
      }

      // Update client configuration
      clientData.config = { ...clientData.config, ...settings };

      this.sendToClient(clientWs, {
        type: 'settings_updated',
        success: true
      });

    } catch (error) {
      console.error('Error updating settings:', error);
      this.sendToClient(clientWs, {
        type: 'error',
        message: 'Failed to update settings'
      });
    }
  }

  private async processAudioBuffer(clientWs: WebSocket, isComplete: boolean = false) {
    const clientData = this.clients.get(clientWs);
    if (!clientData || clientData.audioBuffer.length === 0) {
      return;
    }

    clientData.isProcessing = true;

    try {
      // Combine audio buffer
      const combinedAudio = this.combineAudioData(clientData.audioBuffer);
      
      // Convert to text using speech recognition
      const userText = await this.speechToText(combinedAudio);
      
      if (userText) {
        // Send user message to client
        this.sendToClient(clientWs, {
          type: 'user_message',
          text: userText
        });

        // Detect language
        const detectedLanguage = this.detectLanguage(userText);
        this.sendToClient(clientWs, {
          type: 'language_detected',
          language: detectedLanguage
        });

        // Generate response using Gemini
        const response = await this.generateResponse(userText, clientData.config, detectedLanguage);
        
        if (response.text) {
          // Convert text to speech
          const audioResponse = await this.textToSpeech(response.text, detectedLanguage);
          
          // Send response to client
          this.sendToClient(clientWs, {
            type: 'audio',
            text: response.text,
            audio: audioResponse
          });
        }
      }

      // Clear processed audio from buffer
      if (isComplete) {
        clientData.audioBuffer = [];
      } else {
        // Keep only recent audio for continuous processing
        clientData.audioBuffer = clientData.audioBuffer.slice(-5);
      }

    } catch (error) {
      console.error('Error processing audio buffer:', error);
      this.sendToClient(clientWs, {
        type: 'error',
        message: 'Failed to process audio'
      });
    } finally {
      clientData.isProcessing = false;
    }
  }

  private combineAudioData(audioBuffer: any[]): string {
    // Combine all audio data into a single base64 string
    const combinedBuffers = audioBuffer.map(audio => audio.data).join('');
    return combinedBuffers;
  }

  private async speechToText(audioData: string): Promise<string> {
    try {
      // For now, simulate speech-to-text
      // In a real implementation, you would use a proper STT service
      // or Gemini's audio input capabilities
      
      // Mock responses for demonstration
      const mockResponses = [
        "RV400 ki price kya hai?",
        "Book a test ride karna hai",
        "Kya colors available hain?",
        "Battery life kitni hai?",
        "What is the top speed?"
      ];
      
      return mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
    } catch (error) {
      console.error('Error in speech-to-text:', error);
      return "";
    }
  }

  private detectLanguage(text: string): string {
    // Simple language detection based on script and common words
    const hindiPattern = /[\u0900-\u097F]/; // Devanagari script
    const hinglishPatterns = /\b(kya|hai|ki|ka|ke|aur|toh|hoga|hain|chahiye|mein|main)\b/i;
    
    if (hindiPattern.test(text)) {
      return 'hindi';
    } else if (hinglishPatterns.test(text)) {
      return 'hinglish';
    } else {
      return 'english';
    }
  }

  private async generateResponse(userText: string, config: any, language: string): Promise<{ text: string }> {
    try {
      const languageInstruction = this.getLanguageInstruction(language);
      const prompt = `${config.systemInstruction}\n\n${languageInstruction}\n\nUser question: ${userText}`;

      const result = await this.genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      const text = result.text || "";

      return { text };

    } catch (error) {
      console.error('Error generating response:', error);
      
      // Fallback responses based on language
      const fallbackResponses = {
        hindi: "मुझे खुशी होगी आपकी मदद करने में। Revolt Motors के बारे में और पूछें।",
        hinglish: "Main aapki help kar sakta hun. Revolt Motors ke baare mein aur kuch puchiye.",
        english: "I'd be happy to help you with Revolt Motors information. Please ask me anything about our bikes."
      };
      
      return { text: fallbackResponses[language as keyof typeof fallbackResponses] || fallbackResponses.english };
    }
  }

  private getLanguageInstruction(language: string): string {
    switch (language) {
      case 'hindi':
        return "कृपया हिंदी में उत्तर दें।";
      case 'hinglish':
        return "Please respond in Hinglish (Hindi-English mix), the way people commonly speak in India.";
      case 'english':
      default:
        return "Please respond in clear, concise Indian English.";
    }
  }

  private async textToSpeech(text: string, language: string): Promise<string> {
    try {
      // For now, return empty string as we would need a TTS service
      // In a real implementation, you could use:
      // - Google Cloud Text-to-Speech
      // - Azure Speech Services
      // - Or other TTS APIs
      
      // Return empty string - client will display text only
      return "";
      
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      return "";
    }
  }

  private sendToClient(clientWs: WebSocket, data: any) {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify(data));
    }
  }

  cleanup(clientWs: WebSocket) {
    this.clients.delete(clientWs);
  }
}
