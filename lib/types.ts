export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker: string;
}

export interface TranscriberData {
  segments: TranscriptSegment[];
  text: string;
  speakers: string[];
}

export interface Transcriber {
  onInputChange: () => void;
  isProcessing: boolean;
  isModelLoading: boolean;
  modelLoadingProgress: number;
  start: (audioData: AudioBuffer | undefined, speakerCount?: number | 'auto') => void;
  output?: TranscriberData;
}

export type SpeakerColors = {
  [key: string]: string;
};

// Nouveau type pour le sélecteur
export type SpeakerCountOption = 'auto' | 1 | 2 | 3 | 4 | 5;
export type ExportFormat = 'txt' | 'srt';