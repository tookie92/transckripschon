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
  start: (audioData: AudioBuffer | undefined, speakerCount?: number) => void;
  output?: TranscriberData;
}

export type SpeakerColors = {
  [key: string]: string;
};

export type SpeakerCountOption = 1 | 2 | 3 | 4 | 5;

// Nouveau type pour les sources
export enum MediaSource {
  URL = 'URL',
  FILE = 'FILE',
  RECORDING = 'RECORDING',
  VIDEO = 'VIDEO' // Nouvelle source
}

export interface MediaData {
  buffer: AudioBuffer;
  url: string;
  source: MediaSource;
  mimeType: string;
  duration?: number; // Optionnel pour la vidéo
}
export type ExportFormat = 'txt' | 'srt';