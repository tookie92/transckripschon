export interface TranscriberData {
  text: string
  timestamp: [number, number | null]
}

export interface Transcriber {
  onInputChange: () => void
  isProcessing: boolean
  isModelLoading: boolean
  modelLoadingProgress: number
  start: (audioData: AudioBuffer | undefined) => void
  output?: TranscriberData
}