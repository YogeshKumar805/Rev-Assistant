import { useState, useRef, useCallback } from 'react';

export interface AudioRecorderOptions {
  onAudioData?: (audioData: ArrayBuffer) => void;
  onAudioLevels?: (levels: number[]) => void;
  sampleRate?: number;
  bufferSize?: number;
}

export function useAudioRecorder(options: AudioRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const sampleRate = options.sampleRate || 16000;
  const bufferSize = options.bufferSize || 4096;

  const calculateAudioLevels = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);
    
    const numBars = 7;
    const barWidth = Math.floor(dataArrayRef.current.length / numBars);
    const levels: number[] = [];

    for (let i = 0; i < numBars; i++) {
      const start = i * barWidth;
      const end = Math.min(start + barWidth, dataArrayRef.current.length);
      let sum = 0;

      for (let j = start; j < end; j++) {
        sum += dataArrayRef.current[j];
      }

      const average = sum / (end - start);
      levels.push(average / 255); // Normalize to 0-1
    }

    options.onAudioLevels?.(levels);

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(calculateAudioLevels);
    }
  }, [isRecording, options]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported in this browser');
      }

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: sampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;

      // Create audio context for analysis
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: sampleRate,
      });

      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      source.connect(analyserRef.current);
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      // Create MediaRecorder for actual audio data
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          // Convert blob to ArrayBuffer
          event.data.arrayBuffer().then((arrayBuffer) => {
            options.onAudioData?.(arrayBuffer);
          });
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording failed');
        setIsRecording(false);
      };

      // Start recording in chunks
      mediaRecorder.start(100); // 100ms chunks
      setIsRecording(true);

      // Start audio level visualization
      calculateAudioLevels();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      setIsSupported(false);
      console.error('Error starting recording:', err);
    }
  }, [sampleRate, options, calculateAudioLevels]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isSupported,
    error,
    startRecording,
    stopRecording,
    toggleRecording,
  };
}
