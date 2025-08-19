export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker: string;
}

export interface TranscriberData {
  segments: TranscriptSegment[];
  text: string;
}

export interface Transcriber {
  onInputChange: () => void;
  isProcessing: boolean;
  isModelLoading: boolean;
  modelLoadingProgress: number;
  start: (audioData: AudioBuffer | undefined) => void;
  output?: TranscriberData;
}