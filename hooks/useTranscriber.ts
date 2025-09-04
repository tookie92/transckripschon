import { useCallback, useMemo, useState } from 'react';
import { useWorker } from '@/hooks/useWorker';
import { Transcriber, TranscriberData } from '@/lib/types';

export function useTranscriber(): Transcriber {
  const [output, setOutput] = useState<TranscriberData | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoadingProgress, setModelLoadingProgress] = useState(0);

  const webWorker = useWorker((event) => {
    const message = event.data;

    switch (message.status) {
      case 'progress':
        setModelLoadingProgress(message.progress);
        break;
      
      case 'complete':
        setOutput({
          segments: message.data.segments,
          text: message.data.text,
          speakers: message.data.speakers,
          language: message.data.language
        });
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
        console.error("Transcription error:", message.error);
        break;
      
      default:
        break;
    }
  });

  const onInputChange = useCallback(() => {
    setOutput(undefined);
  }, []);

  const start = useCallback(
    async (audioData: AudioBuffer | undefined, speakerCount: number | 'auto' = 'auto') => {
      if (!audioData) return;

      setOutput(undefined);
      setIsProcessing(true);

      try {
        let audio: Float32Array;
        if (audioData.numberOfChannels === 2) {
          const left = audioData.getChannelData(0);
          const right = audioData.getChannelData(1);
          audio = new Float32Array(left.length);
          for (let i = 0; i < audio.length; i++) {
            audio[i] = (left[i] + right[i]) / 2;
          }
        } else {
          audio = audioData.getChannelData(0);
        }

        webWorker?.postMessage({ 
          audio,
          speakerCount: speakerCount === 'auto' ? null : speakerCount
        });

      } catch (error) {
        console.error("Audio preparation error:", error);
        setIsProcessing(false);
      }
    },
    [webWorker]
  );

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