import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

class PipelineFactory {
  static task = null;
  static model = null;
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

class AutomaticSpeechRecognitionPipelineFactory extends PipelineFactory {
  static task = 'automatic-speech-recognition';
  static model = 'Xenova/whisper-tiny.en';
}

// Détection basique des locuteurs
function detectSpeakers(segments) {
  const speakerSegments = [];
  let currentSpeaker = 'A';
  let lastEnd = 0;

  for (const segment of segments) {
    // Changement de locuteur si pause > 1.5 secondes
    if (segment.start - lastEnd > 1.5) {
      currentSpeaker = currentSpeaker === 'A' ? 'B' : 'A';
    }

    speakerSegments.push({
      ...segment,
      speaker: currentSpeaker
    });

    lastEnd = segment.end;
  }

  return speakerSegments;
}

self.addEventListener('message', async (event) => {
  const { audio } = event.data;
  
  try {
    const transcriber = await AutomaticSpeechRecognitionPipelineFactory.getInstance(
      (progress) => {
        self.postMessage({
          status: 'progress',
          progress: progress * 100
        });
      }
    );

    const options = {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true
    };

    const output = await transcriber(audio, options);

    // Formatage des segments avec détection des locuteurs
    const segments = output.chunks.map(chunk => ({
      start: chunk.timestamp[0],
      end: chunk.timestamp[1],
      text: chunk.text.trim()
    }));

    const segmentsWithSpeakers = detectSpeakers(segments);

    self.postMessage({
      status: 'complete',
      task: 'automatic-speech-recognition',
      data: {
        segments: segmentsWithSpeakers,
        text: output.text
      }
    });

  } catch (error) {
    self.postMessage({
      status: 'error',
      task: 'automatic-speech-recognition',
      data: error.message
    });
  }
});