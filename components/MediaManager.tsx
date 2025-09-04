'use client'

import axios from 'axios'
import { useCallback, useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import AudioPlayer from '@/components/AudioPlayer'
import { UrlDialog } from '@/components/UrlDialog'
import { AudioRecorderDialog } from '@/components/AudioRecorderDialog'
import { Loader, VideoIcon, AudioLinesIcon, LanguagesIcon } from 'lucide-react'
import { Transcriber, SpeakerCountOption, MediaSource } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useVideoAudioExtractor } from '@/hooks/useVideoExtractor'

interface MediaData {
  buffer: AudioBuffer
  url: string
  source: MediaSource
  mimeType: string
  duration?: number
}

export default function MediaManager({
  transcriber
}: {
  transcriber: Transcriber
}) {
  const [mediaData, setMediaData] = useState<MediaData | undefined>(undefined)
  const [url, setUrl] = useState<string | undefined>(undefined)
  const [speakerCount, setSpeakerCount] = useState<SpeakerCountOption>(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const { extractAudioFromVideo, isExtracting, progress } = useVideoAudioExtractor()

  const onUrlChange = (url: string) => {
    transcriber.onInputChange()
    setMediaData(undefined)
    setUrl(url)
  }

  const resetMedia = () => {
    transcriber.onInputChange()
    setMediaData(undefined)
    setUrl(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = ''
    }
  }

  const setMediaFromRecording = async (data: Blob) => {
    resetMedia()

    const blobUrl = URL.createObjectURL(data)
    const fileReader = new FileReader()

    fileReader.onloadend = async () => {
      const audioCTX = new AudioContext({ sampleRate: 16000 })
      const arrayBuffer = fileReader.result as ArrayBuffer
      const decoded = await audioCTX.decodeAudioData(arrayBuffer)

      setMediaData({
        buffer: decoded,
        url: blobUrl,
        source: MediaSource.RECORDING,
        mimeType: data.type
      })
    }

    fileReader.readAsArrayBuffer(data)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    transcriber.onInputChange()
    const file = event.target.files?.[0]
    if (!file) return

    resetMedia()

    try {
      const blobUrl = URL.createObjectURL(file)
      
      if (file.type.startsWith('audio/')) {
        const fileReader = new FileReader()
        fileReader.onloadend = async () => {
          const audioCTX = new AudioContext({ sampleRate: 16000 })
          const arrayBuffer = fileReader.result as ArrayBuffer
          const decoded = await audioCTX.decodeAudioData(arrayBuffer)

          setMediaData({
            buffer: decoded,
            url: blobUrl,
            source: MediaSource.FILE,
            mimeType: file.type
          })
        }
        fileReader.readAsArrayBuffer(file)
      }
    } catch (error) {
      console.error('Error processing file:', error)
    }
  }

  const handleVideoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    transcriber.onInputChange()
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('video/')) return

    resetMedia()

    try {
      const audioBuffer = await extractAudioFromVideo(file)
      const blobUrl = URL.createObjectURL(file)

      setMediaData({
        buffer: audioBuffer,
        url: blobUrl,
        source: MediaSource.VIDEO,
        mimeType: file.type
      })
    } catch (error) {
      console.error('Error extracting audio from video:', error)
    }
  }

  const downloadMediaFromUrl = useCallback(
    async (
      url: string | undefined,
      requestAbortController: AbortController
    ) => {
      if (url) {
        try {
          setMediaData(undefined)

          const { data, headers } = (await axios.get(url, {
            signal: requestAbortController.signal,
            responseType: 'arraybuffer'
          })) as {
            data: ArrayBuffer
            headers: { 'content-type': string }
          }

          let mimeType = headers['content-type']
          if (!mimeType) {
            mimeType = 'audio/*'
          }

          const blobUrl = URL.createObjectURL(new Blob([data], { type: mimeType }))

          if (mimeType.startsWith('audio/') || mimeType === 'audio/wave') {
            if (mimeType === 'audio/wave') {
              mimeType = 'audio/wav'
            }
            
            const audioCTX = new AudioContext({ sampleRate: 16000 })
            const decoded = await audioCTX.decodeAudioData(data)

            setMediaData({
              buffer: decoded,
              url: blobUrl,
              source: MediaSource.URL,
              mimeType: mimeType
            })
          } else if (mimeType.startsWith('video/')) {
            console.error('Video URL extraction is not supported. Please use video file upload.')
          }

        } catch (error) {
          console.log('Request failed or aborted', error)
        }
      }
    },
    []
  )

  useEffect(() => {
    if (url) {
      const requestAbortController = new AbortController()
      downloadMediaFromUrl(url, requestAbortController)
      return () => {
        requestAbortController.abort()
      }
    }
  }, [downloadMediaFromUrl, url])

  return (
    <section className='w-full max-w-2xl rounded-lg border bg-white p-6 shadow-md dark:bg-gray-800'>
      <div className='flex h-full flex-col items-start gap-6'>
        <div className='flex w-full items-center justify-between'>
          <UrlDialog onUrlChange={onUrlChange} />

          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <AudioLinesIcon className="h-4 w-4" />
              Audio
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <Button 
              variant="outline"
              onClick={() => videoInputRef.current?.click()}
              className="flex items-center gap-2"
              disabled={isExtracting}
            >
              <VideoIcon className="h-4 w-4" />
              Video
            </Button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
            />

            <AudioRecorderDialog
              onLoad={data => {
                transcriber.onInputChange()
                setMediaFromRecording(data)
              }}
            />
          </div>
        </div>

        {isExtracting && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Extracting audio from video...</span>
              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {mediaData && (
          <>
            <AudioPlayer
              audioUrl={mediaData.url}
              mimeType={mediaData.mimeType}
            />

            <div className="w-full">
              <div className={`inline-flex items-center rounded-full px-3 py-1 text-sm ${
                mediaData.source === MediaSource.VIDEO 
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {mediaData.source === MediaSource.VIDEO ? (
                  <>
                    <VideoIcon className="h-4 w-4 mr-1" />
                    Video Source
                  </>
                ) : (
                  <>
                    <AudioLinesIcon className="h-4 w-4 mr-1" />
                    Audio Source
                  </>
                )}
              </div>
            </div>

            {transcriber.output?.language && (
              <div className="w-full">
                <div className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  <LanguagesIcon className="h-4 w-4 mr-1" />
                  Detected: {transcriber.output.language}
                </div>
              </div>
            )}

            <div className="w-full">
              <label className="block text-sm font-medium mb-2">
                Number of speakers
              </label>
              <Select 
                value={speakerCount.toString()} 
                onValueChange={(value) => setSpeakerCount(parseInt(value) as SpeakerCountOption)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 speaker</SelectItem>
                  <SelectItem value="2">2 speakers</SelectItem>
                  <SelectItem value="3">3 speakers</SelectItem>
                  <SelectItem value="4">4 speakers</SelectItem>
                  <SelectItem value="5">5 speakers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='mt-auto flex w-full items-center justify-between'>
              <Button 
                onClick={() => transcriber.start(mediaData.buffer, speakerCount)}
                disabled={isExtracting || transcriber.isProcessing}
                className="min-w-[200px]"
              >
                {transcriber.isModelLoading ? (
                  <>
                    <Loader className='animate-spin mr-2' />
                    <span>Loading model...</span>
                  </>
                ) : transcriber.isProcessing ? (
                  <>
                    <Loader className='animate-spin mr-2' />
                    <span>Transcribing...</span>
                  </>
                ) : (
                  <span>Transcribe ({speakerCount} speaker{speakerCount !== 1 ? 's' : ''})</span>
                )}
              </Button>

              <Button variant='outline' onClick={resetMedia}>
                Reset
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}