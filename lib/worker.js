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
  static model = 'Xenova/whisper-small'; // Multilingual model
}

// Fonction simplifiée pour assigner les locuteurs
function assignSpeakers(segments, speakerCount = 1) {
  const speakers = [];
  
  // Crée les noms des locuteurs
  for (let i = 0; i < speakerCount; i++) {
    speakers.push(`Speaker ${i + 1}`);
  }

  // Pour un seul locuteur, assignez simplement tout au locuteur 1
  if (speakerCount === 1) {
    return segments.map(segment => ({
      ...segment,
      speaker: speakers[0]
    }));
  }

  // Pour plusieurs locuteurs, utilisez une logique simple de changement basée sur les pauses
  let currentSpeaker = 0;
  return segments.map((segment, index) => {
    // Change de locuteur si pause significative (>1.5s)
    if (index > 0 && segment.start - segments[index - 1].end > 1.5) {
      currentSpeaker = (currentSpeaker + 1) % speakerCount;
    }
    
    return {
      ...segment,
      speaker: speakers[currentSpeaker]
    };
  });
}

self.addEventListener('message', async (event) => {
  const { audio, speakerCount } = event.data;
  
  try {
    const transcriber = await AutomaticSpeechRecognitionPipelineFactory.getInstance(
      (progress) => {
        self.postMessage({ status: 'progress', progress: progress * 100 });
      }
    );

    const options = {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
      // Optionally force German language detection
      // language: 'german', // or 'de' - this helps with accuracy for German
      task: 'transcribe' // Ensure transcription mode
    };

    const output = await transcriber(audio, options);

    // Formatage des segments
    const segments = output.chunks.map(chunk => ({
      start: chunk.timestamp[0],
      end: chunk.timestamp[1],
      text: chunk.text.trim()
    }));

    // Assignation des locuteurs
    const segmentsWithSpeakers = assignSpeakers(segments, speakerCount);
    
    // Extraction des locuteurs uniques
    const uniqueSpeakers = [...new Set(segmentsWithSpeakers.map(s => s.speaker))];

    self.postMessage({
      status: 'complete',
      data: {
        segments: segmentsWithSpeakers,
        text: output.text,
        speakers: uniqueSpeakers,
        language: output.language // The detected language
      }
    });

  } catch (error) {
    self.postMessage({
      status: 'error',
      error: error.message
    });
  }
});