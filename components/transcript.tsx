import { Transcriber } from '@/lib/types';

interface Props {
  transcriber: Transcriber;
}

export default function Transcript({ transcriber }: Props) {
  const output = transcriber.output;
  const isProcessing = transcriber.isProcessing;

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <section className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-md dark:border-gray-700 dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Transcription</h2>
      
      <div className="mt-4 max-h-96 overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
        {isProcessing ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-5 w-16 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
                <div className="h-5 flex-1 animate-pulse rounded bg-gray-300 dark:bg-gray-600" />
              </div>
            ))}
          </div>
        ) : output ? (
          <div className="space-y-4">
            {output.segments.map((segment, index) => (
              <div key={index} className="group flex gap-4 hover:bg-gray-100/50 dark:hover:bg-gray-600/50">
                <div className="flex flex-col items-center pt-1">
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {formatTimestamp(segment.start)}
                  </span>
                  {segment.speaker && (
                    <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {segment.speaker}
                    </span>
                  )}
                </div>
                <p className="flex-1 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                  {segment.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No Transcription available</p>
        )}
      </div>

      {output && (
        <div className="mt-4 flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Time of discussion: {output.segments.length > 0 ? formatTimestamp(output.segments[output.segments.length - 1].end) : '0:00'}</span>
          <span>{output.segments.length} segments</span>
        </div>
      )}
    </section>
  );
}