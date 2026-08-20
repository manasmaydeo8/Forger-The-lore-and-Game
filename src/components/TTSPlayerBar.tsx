import React from 'react';
import { TTSVoice } from '../types';
import { isAudioPlaying, stopAllAudio } from '../services/ttsService';
import { Volume2, VolumeX, Square, Mic, Radio } from 'lucide-react';

interface TTSPlayerBarProps {
  voice: TTSVoice;
  onStop: () => void;
  activeTextSnippet?: string;
}

export const TTSPlayerBar: React.FC<TTSPlayerBarProps> = ({
  voice,
  onStop,
  activeTextSnippet,
}) => {
  return (
    <div className="fixed bottom-3 right-3 sm:right-6 z-40 max-w-md w-full bg-[#0a0a0a]/95 border border-[#222] rounded-lg p-3 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className="w-8 h-8 rounded bg-[#0d0d0d] border border-[#222] flex items-center justify-center shrink-0">
          <Radio className="w-4 h-4 text-white animate-pulse" />
        </div>

        <div className="overflow-hidden">
          <div className="flex items-center space-x-2">
            <span className="font-mono text-[10px] font-bold text-white tracking-wider uppercase">
              Gemini 3.1 Flash TTS
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white text-black font-bold uppercase">
              {voice}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 truncate font-serif mt-0.5">
            {activeTextSnippet || 'Narrating Story Arc...'}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        {/* Animated wave bars */}
        <div className="flex items-center space-x-0.5 px-2 py-1 bg-[#0d0d0d] rounded border border-[#222]">
          <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1 h-5 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
          <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:450ms]" />
        </div>

        <button
          onClick={() => {
            stopAllAudio();
            onStop();
          }}
          title="Stop Narration"
          className="p-2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>
      </div>
    </div>
  );
};
