'use client'

import Transcript from '@/components/transcript'
import AudioManager from '@/components/AudioManager'
import { useTranscriber } from '@/hooks/useTranscriber'
import { Progress } from '@/components/ui/progress'

export default function Home() {
  const transcriber = useTranscriber()

  return (
    <section className='py-24 h-screen w-full flex items-center justify-center '>
      <div className='container max-w-7xl px-4'>

        <div className='flex flex-col items-center justify-center w-full '>
          <h1 className='text-5xl font-extrabold tracking-tight sm:text-7xl'>
            Transkripschon
          </h1>
          <p className='mt-1 ml-3'>made for our interview(no need to comment about the name of the app 🤪)</p>
          <div className='flex-col w-1/3 mt-6'>
            <div className='flex items-center justify-between text-sm font-medium'>
                <span>
                  {transcriber.modelLoadingProgress === 0 && `Model not loaded`}
                  {transcriber.isModelLoading && `Loading model`}
                  {transcriber.modelLoadingProgress === 100 && `Model ready`}
                </span>
                <span>{transcriber.modelLoadingProgress.toFixed()}%</span>
              </div>
              
              <Progress
                className='mt-1 w-full rounded-lg'
                value={transcriber.modelLoadingProgress}
                max={1}
              />
          </div>
        </div>
        <div className='mt-8 flex flex-col gap-6 sm:flex-row'>
          <AudioManager transcriber={transcriber} />
          <Transcript transcriber={transcriber} />
        </div>
      </div>
      {/* <div className='container max-w-7xl'>
        <div className='flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex-1'>
            <h1 className='text-5xl font-extrabold tracking-tight sm:text-7xl'>
              Transkripschon
            </h1>
            <p className='mt-1 ml-3'>made for our interview</p>
          </div>
          <div className='flex-1'>
            <div className='flex items-center justify-between text-sm font-medium'>
              <span>
                {transcriber.modelLoadingProgress === 0 && `Model not loaded`}
                {transcriber.isModelLoading && `Loading model`}
                {transcriber.modelLoadingProgress === 100 && `Model ready`}
              </span>
              <span>{transcriber.modelLoadingProgress.toFixed()}%</span>
            </div>

            <Progress
              className='mt-1 w-full rounded-lg'
              value={transcriber.modelLoadingProgress}
              max={1}
            />
          </div>
        </div>

        <div className='mt-8 flex flex-col gap-6 sm:flex-row'>
          <AudioManager transcriber={transcriber} />
          <Transcript transcriber={transcriber} />
        </div>
      </div> */}
    </section>
  )
}