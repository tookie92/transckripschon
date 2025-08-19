'use client'

import axios from 'axios'
import { useCallback, useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import AudioPlayer from '@/components/AudioPlayer'
import { UrlDialog } from '@/components/UrlDialog'
import { AudioRecorderDialog } from '@/components/AudioRecorderDialog'
import { Loader } from 'lucide-react'
import { Transcriber, SpeakerCountOption } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export enum AudioSource {
  URL = 'URL',
  FILE = 'FILE',
  RECORDING = 'RECORDING'
}

interface AudioData {
  buffer: AudioBuffer
  url: string
  source: AudioSource
  mimeType: string
}

export default function AudioManager({
  transcriber
}: {
  transcriber: Transcriber
}) {
  const [audioData, setAudioData] = useState<AudioData | undefined>(undefined)
  const [url, setUrl] = useState<string | undefined>(undefined)
  const [speakerCount, setSpeakerCount] = useState<SpeakerCountOption>(1) // Défaut à 1
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onUrlChange = (url: string) => {
    transcriber.onInputChange()
    setAudioData(undefined)
    setUrl(url)
  }

  const resetAudio = () => {
    transcriber.onInputChange()
    setAudioData(undefined)
    setUrl(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const setAudioFromRecording = async (data: Blob) => {
    resetAudio()

    const blobUrl = URL.createObjectURL(data)
    const fileReader = new FileReader()

    fileReader.onloadend = async () => {
      const audioCTX = new AudioContext({ sampleRate: 16000 })
      const arrayBuffer = fileReader.result as ArrayBuffer
      const decoded = await audioCTX.decodeAudioData(arrayBuffer)

      setAudioData({
        buffer: decoded,
        url: blobUrl,
        source: AudioSource.RECORDING,
        mimeType: data.type
      })
    }

    fileReader.readAsArrayBuffer(data)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    transcriber.onInputChange()
    const file = event.target.files?.[0]
    if (!file) return

    resetAudio()

    try {
      const blobUrl = URL.createObjectURL(file)
      const fileReader = new FileReader()

      fileReader.onloadend = async () => {
        const audioCTX = new AudioContext({ sampleRate: 16000 })
        const arrayBuffer = fileReader.result as ArrayBuffer
        const decoded = await audioCTX.decodeAudioData(arrayBuffer)

        setAudioData({
          buffer: decoded,
          url: blobUrl,
          source: AudioSource.FILE,
          mimeType: file.type
        })
      }

      fileReader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Error processing audio file:', error)
    }
  }

  const downloadAudioFromUrl = useCallback(
    async (
      url: string | undefined,
      requestAbortController: AbortController
    ) => {
      if (url) {
        try {
          setAudioData(undefined)

          const { data, headers } = (await axios.get(url, {
            signal: requestAbortController.signal,
            responseType: 'arraybuffer'
          })) as {
            data: ArrayBuffer
            headers: { 'content-type': string }
          }

          let mimeType = headers['content-type']
          if (!mimeType || mimeType === 'audio/wave') {
            mimeType = 'audio/wav'
          }

          const audioCTX = new AudioContext({ sampleRate: 16000 })
          const blobUrl = URL.createObjectURL(
            new Blob([data], { type: 'audio/*' })
          )

          const decoded = await audioCTX.decodeAudioData(data)

          setAudioData({
            buffer: decoded,
            url: blobUrl,
            source: AudioSource.URL,
            mimeType: mimeType
          })
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
      downloadAudioFromUrl(url, requestAbortController)
      return () => {
        requestAbortController.abort()
      }
    }
  }, [downloadAudioFromUrl, url])

  return (
    <section className='w-full max-w-2xl rounded-lg border p-6 shadow-md'>
      <div className='flex h-full flex-col items-start gap-6'>
        <div className='flex w-full items-center justify-between'>
          <UrlDialog onUrlChange={onUrlChange} />

          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload File
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <AudioRecorderDialog
              onLoad={data => {
                transcriber.onInputChange()
                setAudioFromRecording(data)
              }}
            />
          </div>
        </div>

        {audioData && (
          <>
            <AudioPlayer
              audioUrl={audioData.url}
              mimeType={audioData.mimeType}
            />

            {/* Sélecteur du nombre de locuteurs */}
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
              <Button onClick={() => transcriber.start(audioData.buffer, speakerCount)}>
                {transcriber.isModelLoading ? (
                  <>
                    <Loader className='animate-spin mr-2' />
                    <span>Model loading</span>
                  </>
                ) : transcriber.isProcessing ? (
                  <>
                    <Loader className='animate-spin mr-2' />
                    <span>Transcription in progress</span>
                  </>
                ) : (
                  <span>Transcript ({speakerCount} speaker{speakerCount !== 1 ? 's' : ''})</span>
                )}
              </Button>

              <Button variant='outline' onClick={resetAudio}>
                Reset
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}