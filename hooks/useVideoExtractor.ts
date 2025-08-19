import { useState, useCallback } from 'react';

export function useVideoAudioExtractor() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState(0);

  const extractAudioFromVideo = useCallback(async (file: File): Promise<AudioBuffer> => {
    setIsExtracting(true);
    setProgress(0);
    
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const audioContext = new AudioContext({ sampleRate: 16000 });
      
      video.src = URL.createObjectURL(file);
      video.muted = false;
      video.crossOrigin = 'anonymous';
      
      const audioData: Float32Array[] = [];
      
      video.onloadedmetadata = async () => {
        try {
          const source = audioContext.createMediaElementSource(video);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          
          source.connect(processor);
          processor.connect(audioContext.destination);
          
          processor.onaudioprocess = (event) => {
            const inputData = event.inputBuffer.getChannelData(0);
            audioData.push(new Float32Array(inputData));
          };
          
          const progressInterval = setInterval(() => {
            if (video.duration > 0) {
              const newProgress = (video.currentTime / video.duration) * 100;
              setProgress(newProgress);
            }
          }, 100);
          
          video.onended = () => {
            clearInterval(progressInterval);
            processor.disconnect();
            source.disconnect();
            
            if (audioData.length === 0) {
              reject(new Error('No audio data captured'));
              setIsExtracting(false);
              return;
            }
            
            // Combiner les données audio
            const totalLength = audioData.reduce((sum, data) => sum + data.length, 0);
            const combinedData = new Float32Array(totalLength);
            let offset = 0;
            
            for (const data of audioData) {
              combinedData.set(data, offset);
              offset += data.length;
            }
            
            // CORRECTION : Méthode optimisée pour trouver l'amplitude max
            let maxAmplitude = 0;
            for (let i = 0; i < combinedData.length; i++) {
              const amplitude = Math.abs(combinedData[i]);
              if (amplitude > maxAmplitude) {
                maxAmplitude = amplitude;
              }
            }
            
            // Normaliser l'audio si nécessaire
            if (maxAmplitude > 0 && maxAmplitude < 0.5) {
              for (let i = 0; i < combinedData.length; i++) {
                combinedData[i] = combinedData[i] / maxAmplitude;
              }
            }
            
            // Créer le buffer audio final
            const audioBuffer = audioContext.createBuffer(1, totalLength, 16000);
            audioBuffer.getChannelData(0).set(combinedData);
            
            resolve(audioBuffer);
            setIsExtracting(false);
            setProgress(100);
          };
          
          video.onerror = () => {
            clearInterval(progressInterval);
            reject(new Error('Video playback error'));
            setIsExtracting(false);
          };
          
          await video.play();
          
        } catch (error) {
          reject(error);
          setIsExtracting(false);
        }
      };
      
      video.onerror = () => {
        reject(new Error('Video loading error'));
        setIsExtracting(false);
      };
    });
  }, []);

  return { extractAudioFromVideo, isExtracting, progress };
}