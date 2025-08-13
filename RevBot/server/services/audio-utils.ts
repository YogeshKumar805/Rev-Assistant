export class AudioUtils {
  static convertTo16BitPCM(audioBuffer: ArrayBuffer): Buffer {
    // Convert audio to 16-bit PCM mono at 16kHz
    const inputArray = new Float32Array(audioBuffer);
    const outputArray = new Int16Array(inputArray.length);
    
    for (let i = 0; i < inputArray.length; i++) {
      // Clamp the float values to [-1, 1] and convert to 16-bit int
      const clampedValue = Math.max(-1, Math.min(1, inputArray[i]));
      outputArray[i] = clampedValue < 0 ? clampedValue * 0x8000 : clampedValue * 0x7FFF;
    }
    
    return Buffer.from(outputArray.buffer);
  }

  static resampleTo16kHz(audioBuffer: ArrayBuffer, originalSampleRate: number): ArrayBuffer {
    if (originalSampleRate === 16000) {
      return audioBuffer;
    }

    const inputArray = new Float32Array(audioBuffer);
    const resampleRatio = 16000 / originalSampleRate;
    const outputLength = Math.floor(inputArray.length * resampleRatio);
    const outputArray = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const sourceIndex = i / resampleRatio;
      const index = Math.floor(sourceIndex);
      const fractional = sourceIndex - index;

      if (index + 1 < inputArray.length) {
        // Linear interpolation
        outputArray[i] = inputArray[index] * (1 - fractional) + inputArray[index + 1] * fractional;
      } else {
        outputArray[i] = inputArray[index];
      }
    }

    return outputArray.buffer;
  }

  static detectVoiceActivity(audioBuffer: ArrayBuffer, threshold: number = 0.01): boolean {
    const inputArray = new Float32Array(audioBuffer);
    let sum = 0;

    for (let i = 0; i < inputArray.length; i++) {
      sum += Math.abs(inputArray[i]);
    }

    const average = sum / inputArray.length;
    return average > threshold;
  }

  static calculateAudioLevels(audioBuffer: ArrayBuffer, numBars: number = 7): number[] {
    const inputArray = new Float32Array(audioBuffer);
    const chunkSize = Math.floor(inputArray.length / numBars);
    const levels: number[] = [];

    for (let i = 0; i < numBars; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, inputArray.length);
      let sum = 0;

      for (let j = start; j < end; j++) {
        sum += Math.abs(inputArray[j]);
      }

      const average = sum / (end - start);
      levels.push(Math.min(1, average * 10)); // Amplify and clamp
    }

    return levels;
  }
}
