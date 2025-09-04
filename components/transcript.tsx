import { useCallback, useMemo } from 'react';
import { Transcriber, SpeakerColors } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DownloadIcon, LanguagesIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Transcript({ transcriber }: { transcriber: Transcriber }) {
  const output = transcriber.output;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const speakerColors: SpeakerColors = useMemo<SpeakerColors>(() => ({
    'Speaker 1': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Speaker 2': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Speaker 3': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Speaker 4': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Speaker 5': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  }), []);

  const exportTranscript = useCallback((format: 'txt' | 'srt' = 'txt') => {
    if (!output) return;

    let content = '';
    const languageInfo = output.language ? `Language: ${output.language}\n\n` : '';

    if (format === 'txt') {
      content = languageInfo + output.segments.map(segment => 
        `[${formatTime(segment.start)} - ${formatTime(segment.end)}] ${segment.speaker}: ${segment.text}`
      ).join('\n\n');
    } else if (format === 'srt') {
      content = output.segments.map((segment, index) => {
        const start = new Date(segment.start * 1000).toISOString().substr(11, 12);
        const end = new Date(segment.end * 1000).toISOString().substr(11, 12);
        return `${index + 1}\n${start.replace('.', ',')} --> ${end.replace('.', ',')}\n${segment.speaker}: ${segment.text}\n`;
      }).join('\n');
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [output]);

  const transcriptContent = useMemo(() => {
    if (!output) return null;
    
    return (
      <>
        {/* Language display */}
        {output.language && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <LanguagesIcon className="h-4 w-4" />
            <span>Detected language: <strong>{output.language}</strong></span>
          </div>
        )}

        {/* Speakers */}
        <div className="mb-4 flex flex-wrap gap-2">
          {output.speakers.map((speaker) => (
            <span 
              key={speaker}
              className={`rounded-full px-3 py-1 text-sm ${
                speakerColors[speaker] || 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              {speaker}
            </span>
          ))}
        </div>

        {/* Transcript segments */}
        <div className="space-y-3">
          {output.segments.map((segment, i) => (
            <div key={i} className="flex gap-3 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div className="flex flex-col items-center min-w-[60px]">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(segment.start)}
                </span>
                <span className={`mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  speakerColors[segment.speaker] || 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {segment.speaker.split(' ')[1]}
                </span>
              </div>
              <p className="flex-1 text-gray-800 dark:text-gray-200 leading-relaxed">
                {segment.text}
              </p>
            </div>
          ))}
        </div>
      </>
    );
  }, [output, speakerColors]);

  return (
    <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow dark:border-gray-700 dark:bg-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Transcription</h2>
        
        {output && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <DownloadIcon className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportTranscript('txt')}>
                TXT Format
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportTranscript('srt')}>
                SRT Format (subtitles)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {transcriber.isProcessing ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
                <div className="h-4 flex-1 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>
            ))}
          </div>
        ) : output ? (
          transcriptContent
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            Upload audio or record to start transcription
          </p>
        )}
      </div>
    </div>
  );
}