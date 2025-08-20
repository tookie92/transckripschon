'use client'

import Transcript from '@/components/transcript'
import { useTranscriber } from '@/hooks/useTranscriber'
import MediaManager from '@/components/MediaManager'

export default function Home() {
  const transcriber = useTranscriber()

  return (
    <section className='py-24 h-screen w-full flex items-center justify-center '>
      <div className='container max-w-7xl px-4'>

        <div className='flex flex-col items-center justify-center w-full '>
          <h1 className='text-5xl font-extrabold tracking-tight sm:text-7xl text-myGreen-500'>
            Transkripschon
          </h1>
          <p className='mt-1 ml-3'>made for our interview(no need to comment about the name of the app 🤪)</p>
          
        </div>
        <div className='mt-8 flex flex-col gap-6 sm:flex-row'>
          <MediaManager transcriber={transcriber} />
          <Transcript transcriber={transcriber} />
        </div>
      </div>
      
    </section>
  )
}