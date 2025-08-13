import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from './use-toast';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  language?: string;
}

interface VoiceSettings {
  preferredLanguage: string;
  voiceSpeed: number;
  autoDetectLanguage: boolean;
  pushToTalk: boolean;
}

export function useVoiceChat() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Connecting to Rev...");
  const [statusSubtext, setStatusSubtext] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));
  const [settings, setSettings] = useState<VoiceSettings>({
    preferredLanguage: 'hinglish',
    voiceSpeed: 1,
    autoDetectLanguage: true,
    pushToTalk: false,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      setCurrentStatus("Rev is ready to chat!");
      setStatusSubtext("Tap the mic to start talking");
      console.log('Connected to voice assistant WebSocket');
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'audio_response':
            // Handle audio response from assistant
            if (data.audio && data.text) {
              const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
              audio.play();
              
              const assistantMessage: Message = {
                id: Date.now().toString(),
                text: data.text,
                sender: 'assistant',
                timestamp: new Date(),
                language: data.language || 'hinglish'
              };
              
              setMessages(prev => [...prev, assistantMessage]);
            }
            setIsProcessing(false);
            setCurrentStatus("Rev is ready to chat!");
            setStatusSubtext("Tap the mic to start talking");
            break;
            
          case 'text_response':
            // Handle text-only response
            const textMessage: Message = {
              id: Date.now().toString(),
              text: data.text,
              sender: 'assistant',
              timestamp: new Date(),
              language: data.language || 'hinglish'
            };
            
            setMessages(prev => [...prev, textMessage]);
            setIsProcessing(false);
            setCurrentStatus("Rev is ready to chat!");
            setStatusSubtext("Tap the mic to start talking");
            break;
            
          case 'error':
            toast({
              title: "Error",
              description: data.message || "Something went wrong",
              variant: "destructive",
            });
            setIsProcessing(false);
            setCurrentStatus("Rev is ready to chat!");
            setStatusSubtext("Tap the mic to start talking");
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      setCurrentStatus("Disconnected from Rev");
      setStatusSubtext("Trying to reconnect...");
      console.log('Disconnected from voice assistant WebSocket');
      
      // Reconnect after 2 seconds
      setTimeout(connect, 2000);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to Rev. Please check your internet connection.",
        variant: "destructive",
      });
    };
  }, [toast]);

  // Start recording audio
  const startRecording = useCallback(async () => {
    if (!isConnected) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      streamRef.current = stream;
      setIsRecording(true);
      setCurrentStatus("Listening to your question");
      setStatusSubtext("Speak now or tap to stop");

      // Create MediaRecorder for audio capture
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm;codecs=opus' });
        
        // Convert to base64 and send to server
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'voice_message',
              audio: base64Audio,
              mimeType: 'audio/webm;codecs=opus',
              language: settings.preferredLanguage,
              autoDetectLanguage: settings.autoDetectLanguage
            }));
          }
        };
        reader.readAsDataURL(audioBlob);
        
        setIsProcessing(true);
        setCurrentStatus("Rev is thinking...");
        setStatusSubtext("Processing your question");
      };

      mediaRecorder.start();

      // Simulate audio levels for visualization
      const levelInterval = setInterval(() => {
        if (isRecording) {
          const newLevels = Array.from({ length: 20 }, () => Math.random() * 0.8 + 0.2);
          setAudioLevels(newLevels);
        }
      }, 100);

      // Clean up interval when recording stops
      const originalStop = mediaRecorder.stop.bind(mediaRecorder);
      mediaRecorder.stop = () => {
        clearInterval(levelInterval);
        originalStop();
      };

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  }, [isConnected, isRecording, settings.preferredLanguage, settings.autoDetectLanguage, toast]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setIsRecording(false);
    setAudioLevels(Array(20).fill(0));
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([]);
    toast({
      title: "Conversation Cleared",
      description: "Chat history has been reset",
    });
  }, [toast]);

  // Initialize connection on mount
  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [connect]);

  return {
    isConnected,
    isRecording,
    isProcessing,
    currentStatus,
    statusSubtext,
    messages,
    audioLevels,
    settings,
    setSettings,
    toggleRecording,
    clearConversation,
  };
}