import { useCallback, useMemo, useState } from 'react';
import { useWorker } from '@/hooks/useWorker';
import { Transcriber, TranscriberData } from '@/lib/types';

export function useTranscriber(): Transcriber {
  const [output, setOutput] = useState<TranscriberData | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0);

  // On initialise le worker
  const webWorker = useWorker((event) => {
    const message = event.data;

    switch (message.status) {
      case 'progress':
        setModelLoadingProgress(message.progress);
        break;
      
      case 'complete':
        setOutput(message.data);
        setIsProcessing(false);
        break;
      
      case 'initiate':
        setIsModelLoading(true);
        break;
      
      case 'ready':
        setIsModelLoading(false);
        break;
      
      case 'error':
        setIsProcessing(false);
        console.error("Erreur de transcription:", message.error);
        break;
      
      default:
        break;
    }
  });

  // Réinitialise la transcription quand l'input change
  const onInputChange = useCallback(() => {
    setOutput(undefined);
  }, []);

  // Fonction pour démarrer la transcription
  const start = useCallback(
    async (audioData: AudioBuffer | undefined, speakerCount: number | 'auto' = 'auto') => {
      if (!audioData) return;

      setOutput(undefined);
      setIsProcessing(true);

      try {
        // Convertit l'audio en format compatible avec Whisper
        let audio: Float32Array;
        if (audioData.numberOfChannels === 2) {
          // Si stéréo, on mixe les 2 canaux
          const left = audioData.getChannelData(0);
          const right = audioData.getChannelData(1);
          audio = new Float32Array(left.length);
          for (let i = 0; i < audio.length; i++) {
            audio[i] = (left[i] + right[i]) / 2;
          }
        } else {
          // Si mono, on prend directement le canal
          audio = audioData.getChannelData(0);
        }

        // Envoie à notre worker
        webWorker?.postMessage({ 
          audio,
          speakerCount: speakerCount === 'auto' ? null : speakerCount
        });

      } catch (error) {
        console.error("Erreur de préparation audio:", error);
        setIsProcessing(false);
      }
    },
    [webWorker]
  );

  // On retourne tout sous forme d'objet
  return useMemo(() => ({
    onInputChange,
    isProcessing,
    isModelLoading,
    modelLoadingProgress,
    start,
    output
  }), [
    onInputChange,
    isProcessing,
    isModelLoading,
    modelLoadingProgress,
    start,
    output
  ]);
}