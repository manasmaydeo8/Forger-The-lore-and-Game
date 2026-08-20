import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Convert 24kHz 16-bit mono PCM/L16 into standard WAV base64
function pcmToWavBase64(pcmBase64: string, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): string {
  try {
    const pcmBuffer = Buffer.from(pcmBase64, 'base64');
    // If it already has a valid RIFF/WAVE header, don't double wrap
    if (
      pcmBuffer.length >= 12 &&
      pcmBuffer.slice(0, 4).toString('ascii') === 'RIFF' &&
      pcmBuffer.slice(8, 12).toString('ascii') === 'WAVE'
    ) {
      return pcmBase64;
    }

    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);

    // RIFF chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);

    // fmt sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size
    header.writeUInt16LE(1, 20);  // AudioFormat 1 = PCM
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);

    // data sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    const wavBuffer = Buffer.concat([header, pcmBuffer]);
    return wavBuffer.toString('base64');
  } catch (err) {
    console.error('Error converting PCM to WAV:', err);
    return pcmBase64;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// TTS Endpoint using gemini-3.1-flash-tts-preview
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Fenrir' } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text parameter is required.' });
      return;
    }

    const ai = getAI();
    const allowedVoices = ['Fenrir', 'Zephyr', 'Charon', 'Kore', 'Puck'];
    const chosenVoice = allowedVoices.includes(voice) ? voice : 'Fenrir';

    // Optimize prompt for immersive fantasy storytelling narration
    const prompt = `Narrate with dramatic, cinematic intensity and solemn pacing suitable for a dark fantasy light novel:\n\n${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-tts-preview',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: chosenVoice },
          },
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const audioPart = parts.find((p: any) => p.inlineData?.data) || parts[0];
    const base64Audio = audioPart?.inlineData?.data;
    const mimeType = audioPart?.inlineData?.mimeType || 'audio/l16; rate=24000; channels=1';

    if (!base64Audio) {
      res.status(500).json({ error: 'No audio returned from TTS model.' });
      return;
    }

    // Extract sample rate if specified in mimeType (e.g. rate=24000)
    let sampleRate = 24000;
    const rateMatch = mimeType.match(/rate=(\d+)/i);
    if (rateMatch) {
      sampleRate = parseInt(rateMatch[1], 10);
    }

    // Extract channels if specified in mimeType (e.g. channels=1)
    let numChannels = 1;
    const channelMatch = mimeType.match(/channels=(\d+)/i);
    if (channelMatch) {
      numChannels = parseInt(channelMatch[1], 10);
    }

    // Convert raw PCM/L16 to playable WAV base64
    const wavBase64 = pcmToWavBase64(base64Audio, sampleRate, numChannels, 16);
    const dataUrl = `data:audio/wav;base64,${wavBase64}`;

    res.json({
      audioUrl: dataUrl,
      voice: chosenVoice,
      format: 'audio/wav',
      sampleRate,
    });
  } catch (error: any) {
    console.error('TTS generation failed:', error);
    res.status(500).json({ error: error.message || 'TTS generation failed.' });
  }
});

// Interactive Skill Forge Analysis Endpoint
app.post('/api/gemini/forge-analysis', async (req, res) => {
  try {
    const { skillName, description, userMana = 87 } = req.body;
    const ai = getAI();

    const systemInstruction = `You are the mysterious Forger System Interface from the dark fantasy world of Aetheria.
Aryan holds the Unique Skill [FORGER] (Public Rank F, True Rank Unknown).
When analyzing a skill to forge:
Provide structured analysis in JSON:
{
  "skillName": string,
  "publicRank": "F" | "E" | "D" | "C" | "B" | "A" | "S" | "EX",
  "trueRank": string,
  "manaCostPermanent": number (1 to 25),
  "activeManaCost": number,
  "magicalStructure": string,
  "manaFlow": string,
  "ignitionPhase": string,
  "compressionRatio": string,
  "stages": [
    { "stage": 1, "name": string, "effect": string },
    { "stage": 5, "name": string, "effect": string },
    { "stage": 10, "name": string, "effect": string },
    { "stage": 15, "name": string, "effect": string }
  ],
  "corruptionDetected": boolean,
  "corruptionWarning": string | null,
  "systemLog": string
}`;

    const prompt = `Analyze this skill for the Forger system: Name: "${skillName || 'Unknown Skill'}", Context/Idea: "${description || 'Basic combat skill'}". Aryan currently has ${userMana} Permanent Mana remaining.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    res.json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    console.error('Skill analysis failed:', error);
    res.status(500).json({ error: error.message || 'Skill analysis failed.' });
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FORGER server running at http://localhost:${PORT}`);
  });
}

start().catch(console.error);
