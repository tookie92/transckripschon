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
  language?: string; // Added language detection
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

export type SpeakerCountOption = 1 | 2 | 3 | 4 | 5;

export enum MediaSource {
  URL = 'URL',
  FILE = 'FILE',
  RECORDING = 'RECORDING',
  VIDEO = 'VIDEO'
}

export interface MediaData {
  buffer: AudioBuffer;
  url: string;
  source: MediaSource;
  mimeType: string;
  duration?: number;
}

export type ExportFormat = 'txt' | 'srt';