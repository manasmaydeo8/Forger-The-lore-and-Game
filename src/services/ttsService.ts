import { TTSVoice } from '../types';

// Audio Cache map to keep spoken audio snippets in memory
const audioCache = new Map<string, string>();

let currentAudio: HTMLAudioElement | null = null;
let currentBufferSource: AudioBufferSourceNode | null = null;
let sharedAudioCtx: AudioContext | null = null;
let isCurrentlyPlaying = false;

function getSharedAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AudioCtxClass();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export async function fetchTTSAudio(text: string, voice: TTSVoice = 'Fenrir'): Promise<string> {
  const cacheKey = `${voice}:::${text.trim()}`;
  if (audioCache.has(cacheKey)) {
    return audioCache.get(cacheKey)!;
  }

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), voice }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `TTS request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.audioUrl) {
      throw new Error('No audio URL returned from server');
    }

    audioCache.set(cacheKey, data.audioUrl);
    return data.audioUrl;
  } catch (err: any) {
    console.warn('TTS API error:', err);
    throw err;
  }
}

/**
 * Plays an audio URL (data URL or blob) with automatic Web Audio API fallback
 */
export function playAudioUrl(
  url: string,
  onEnd?: () => void,
  onError?: (err: any) => void
): HTMLAudioElement {
  stopAllAudio();
  isCurrentlyPlaying = true;

  const audio = new Audio();
  currentAudio = audio;

  let hasEnded = false;
  const finish = () => {
    if (hasEnded) return;
    hasEnded = true;
    isCurrentlyPlaying = false;
    if (currentAudio === audio) {
      currentAudio = null;
    }
    if (onEnd) onEnd();
  };

  const handleFallback = async (originalErr?: any) => {
    try {
      // Attempt Web Audio API decoding fallback
      const ctx = getSharedAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Convert data URL to array buffer
      const base64Index = url.indexOf('base64,');
      if (base64Index === -1) {
        throw new Error('Invalid audio data URL');
      }

      const base64Str = url.substring(base64Index + 7);
      const binaryString = atob(base64Str);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      currentBufferSource = source;

      source.onended = () => {
        if (currentBufferSource === source) {
          currentBufferSource = null;
        }
        finish();
      };

      source.start(0);
      isCurrentlyPlaying = true;
    } catch (fallbackErr) {
      console.warn('Web Audio fallback also failed:', fallbackErr);
      isCurrentlyPlaying = false;
      if (currentAudio === audio) {
        currentAudio = null;
      }
      if (onError) onError(originalErr || fallbackErr);
    }
  };

  audio.onended = finish;

  audio.onerror = () => {
    const errorDetails = audio.error
      ? `Error code ${audio.error.code}: ${audio.error.message}`
      : 'Audio playback failed';
    console.warn('HTMLAudio error, attempting Web Audio decoder:', errorDetails);
    handleFallback(new Error(errorDetails));
  };

  audio.src = url;
  audio.play().catch((playErr) => {
    console.warn('Audio play() promise rejected:', playErr.message || playErr);
    handleFallback(playErr);
  });

  return audio;
}

export function stopAllAudio() {
  isCurrentlyPlaying = false;

  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio.src = '';
    } catch {}
    currentAudio = null;
  }

  if (currentBufferSource) {
    try {
      currentBufferSource.stop();
      currentBufferSource.disconnect();
    } catch {}
    currentBufferSource = null;
  }

  // Also cancel any browser speech synthesis if active
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {}
  }
}

export function isAudioPlaying(): boolean {
  if (isCurrentlyPlaying) return true;
  if (currentAudio && !currentAudio.paused && !currentAudio.ended) return true;
  if (currentBufferSource) return true;
  return false;
}

