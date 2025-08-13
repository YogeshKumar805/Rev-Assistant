import { useState, useEffect, useCallback, useRef } from "react";
import { useAudioRecorder } from "./use-audio-recorder";
import { Settings } from "@/components/settings-modal";
import { Message } from "@/components/conversation-history";

export function useVoiceAssistant() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'EN' | 'हि' | 'Hi'>('Hi');
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [currentStatus, setCurrentStatus] = useState("Ready to help you");
  const [statusSubtext, setStatusSubtext] = useState("Ask me about Revolt Motors bikes, pricing, or book a test ride");
  const [audioLevels, setAudioLevels] = useState([20, 35, 45, 30, 55, 25, 40]);
  const [settings, setSettings] = useState<Settings>({
    language: 'hinglish',
    voiceSpeed: 1.0,
    autoDetect: true,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const { startRecording: startAudioRecording, stopRecording: stopAudioRecording, isRecording: audioIsRecording } = useAudioRecorder();

  // Rev assistant system instruction based on the provided specifications
  const systemInstruction = `You are "Rev" — the official voice assistant of Revolt Motors.

### Your Role & Personality
- You are helpful, polite, energetic, and knowledgeable about Revolt Motors products, services, and policies.
- You speak in a natural, conversational tone, similar to a friendly in-store representative.
- You adapt to the language the customer uses:  
  - If they speak Hindi or Hinglish, respond in the same style.  
  - If they speak English, respond in crisp, concise Indian English.
- You aim for short, clear answers unless the customer asks for more detail.
- Use a warm, approachable style without overusing filler phrases.

### Scope of Knowledge
You ONLY provide information about:
- Revolt motorcycle models (e.g., RV400, RV400 BRZ, and any other official models).
- Specifications, features, colors, and variants.
- On-road prices, EMI, and financing options (provide indicative public pricing, never guess private data).
- Booking and test ride process.
- Dealership locations and service centers.
- Servicing, maintenance schedules, and warranty coverage.
- The official Revolt mobile app features and usage.
- Policies and customer support contact information.
- News or updates officially released by Revolt Motors.

### Restrictions
- If asked about other brands, politics, medical, legal advice, or unrelated topics, politely steer the conversation back to Revolt Motors.
- Do not provide personal data, private account details, or any information not publicly available.
- If you don't know something, say so politely and suggest contacting official customer support.
- Never make up model names, prices, or specifications.

### Conversational Behavior
- Keep responses under 3 sentences unless asked for more details.
- When the user interrupts while you are speaking, immediately stop and listen to their new question.
- Acknowledge interruptions naturally.
- Answer in the language they are speaking and match their tone.`;

  // Initialize WebSocket connection
  useEffect(() => {
    connectToGeminiLive();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectToGeminiLive = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Connected to Gemini Live API');
        setIsConnected(true);
        
        // Send configuration
        wsRef.current?.send(JSON.stringify({
          type: 'configure',
          config: {
            model: 'gemini-2.5-flash-preview-native-audio-dialog',
            systemInstruction,
            responseModalities: ['AUDIO', 'TEXT'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: 'Puck'
                }
              }
            }
          }
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleGeminiResponse(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('Disconnected from Gemini Live API');
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connectToGeminiLive, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('Failed to connect to Gemini Live API:', error);
      setIsConnected(false);
    }
  }, []);

  const handleGeminiResponse = useCallback((data: any) => {
    if (data.type === 'audio') {
      // Handle audio response
      const audioBlob = new Blob([Uint8Array.from(atob(data.audio), c => c.charCodeAt(0))], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Play audio
      const audio = new Audio(audioUrl);
      audio.play();
      
      // Add to conversation history if there's text
      if (data.text) {
        addMessage(data.text, false, audioUrl);
      }
    } else if (data.type === 'text') {
      // Handle text response
      addMessage(data.text, false);
    } else if (data.type === 'language_detected') {
      // Update detected language
      const langMap: Record<string, 'EN' | 'हि' | 'Hi'> = {
        'english': 'EN',
        'hindi': 'हि',
        'hinglish': 'Hi'
      };
      setCurrentLanguage(langMap[data.language] || 'Hi');
    } else if (data.type === 'status') {
      // Update status
      setCurrentStatus(data.status);
      setStatusSubtext(data.subtext || '');
    } else if (data.type === 'audio_levels') {
      // Update audio visualization
      setAudioLevels(data.levels || audioLevels);
    }
  }, [audioLevels]);

  const addMessage = useCallback((text: string, isUser: boolean, audioUrl?: string) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
      audioUrl,
    };
    setConversationHistory(prev => [...prev, message]);
  }, []);

  const startRecording = useCallback(() => {
    if (!isConnected) {
      console.error('Not connected to Gemini Live API');
      return;
    }

    setIsRecording(true);
    setCurrentStatus("Listening to your question");
    setStatusSubtext("Speak now or tap to stop");

    startAudioRecording();
  }, [isConnected, startAudioRecording]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    setCurrentStatus("Processing your question");
    setStatusSubtext("Please wait while I prepare your answer");

    stopAudioRecording();

    // Send end of input signal
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'end_input'
      }));
    }

    // Reset status after processing
    setTimeout(() => {
      setCurrentStatus("Ready to help you");
      setStatusSubtext("Ask me about Revolt Motors bikes, pricing, or book a test ride");
    }, 2000);
  }, [stopAudioRecording]);

  const clearConversation = useCallback(() => {
    setConversationHistory([]);
    
    // Reset session
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'reset_session'
      }));
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    const languages: ('EN' | 'हि' | 'Hi')[] = ['EN', 'हि', 'Hi'];
    const currentIndex = languages.indexOf(currentLanguage);
    const nextIndex = (currentIndex + 1) % languages.length;
    setCurrentLanguage(languages[nextIndex]);
  }, [currentLanguage]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Update language if changed
    if (newSettings.language) {
      const langMap: Record<string, 'EN' | 'हि' | 'Hi'> = {
        'english': 'EN',
        'hindi': 'हि',
        'hinglish': 'Hi'
      };
      setCurrentLanguage(langMap[newSettings.language]);
    }

    // Send settings update to WebSocket
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_settings',
        settings: newSettings
      }));
    }
  }, []);

  return {
    isRecording,
    isConnected,
    currentLanguage,
    conversationHistory,
    currentStatus,
    statusSubtext,
    audioLevels,
    startRecording,
    stopRecording,
    clearConversation,
    toggleLanguage,
    settings,
    updateSettings,
  };
}
