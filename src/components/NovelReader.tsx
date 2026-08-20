import React, { useState } from 'react';
import { StorySection, TTSVoice } from '../types';
import { fetchTTSAudio, playAudioUrl, stopAllAudio, narrateText } from '../services/ttsService';
import { SoundFX } from '../utils/soundEffects';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  BookOpen,
  Zap,
  AlertTriangle,
  Layers,
  ChevronRight,
  ChevronLeft,
  Type,
  Loader2,
} from 'lucide-react';

interface NovelReaderProps {
  section: StorySection;
  allSections: StorySection[];
  onSelectSection: (id: any) => void;
  voice: TTSVoice;
  onOpenForge: () => void;
}

export const NovelReader: React.FC<NovelReaderProps> = ({
  section,
  allSections,
  onSelectSection,
  voice,
  onOpenForge,
}) => {
  const [activeParagraphId, setActiveParagraphId] = useState<string | null>(null);
  const [isLoadingTTS, setIsLoadingTTS] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>('normal');
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans'>('serif');

  const currentSecIdx = allSections.findIndex((s) => s.id === section.id);
  const prevSection = currentSecIdx > 0 ? allSections[currentSecIdx - 1] : null;
  const nextSection = currentSecIdx < allSections.length - 1 ? allSections[currentSecIdx + 1] : null;

  const handlePlayParagraphTTS = async (pId: string, text: string) => {
    if (activeParagraphId === pId) {
      stopAllAudio();
      setActiveParagraphId(null);
      return;
    }

    try {
      setIsLoadingTTS(pId);
      stopAllAudio();

      const cleanedText = text.replace(/\*\*/g, '').replace(/\n+/g, ' ');
      setIsLoadingTTS(null);
      setActiveParagraphId(pId);

      await narrateText(
        cleanedText,
        voice,
        () => {
          setActiveParagraphId(null);
        },
        () => {
          setActiveParagraphId(null);
          setIsLoadingTTS(null);
        }
      );
    } catch (e) {
      console.warn('Paragraph audio narration notification:', e);
      setIsLoadingTTS(null);
      setActiveParagraphId(null);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case 'large':
        return 'text-lg leading-relaxed';
      case 'huge':
        return 'text-xl leading-loose';
      default:
        return 'text-base leading-relaxed';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Reader Controls Toolbar */}
      <div className="sticky top-16 z-30 backdrop-blur-md bg-[#0a0a0a]/95 border border-[#1a1a1a] p-3 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-4 h-4 text-white" />
          <span className="font-mono text-xs text-white font-semibold uppercase tracking-wider">
            {section.part}: {section.title}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Font Family Switcher */}
          <div className="flex items-center space-x-1 bg-[#0d0d0d] p-1 rounded border border-[#222]">
            <button
              onClick={() => setFontFamily('serif')}
              className={`px-2.5 py-1 rounded font-serif text-xs transition ${
                fontFamily === 'serif' ? 'bg-white text-black font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Serif
            </button>
            <button
              onClick={() => setFontFamily('sans')}
              className={`px-2.5 py-1 rounded font-sans text-xs transition ${
                fontFamily === 'sans' ? 'bg-white text-black font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Sans
            </button>
          </div>

          {/* Font Size Switcher */}
          <div className="flex items-center space-x-1 bg-[#0d0d0d] p-1 rounded border border-[#222]">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded font-mono text-xs transition ${
                fontSize === 'normal' ? 'bg-white text-black font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-1 rounded font-mono text-xs font-bold transition ${
                fontSize === 'large' ? 'bg-white text-black font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('huge')}
              className={`px-2 py-1 rounded font-mono text-xs font-bold transition ${
                fontSize === 'huge' ? 'bg-white text-black font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              A++
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Title Card */}
      <div className="text-center py-6 border-b border-[#1a1a1a] space-y-2.5">
        <div className="inline-block px-3 py-0.5 rounded bg-[#0d0d0d] border border-[#222] text-slate-400 font-mono text-[10px] uppercase tracking-[0.2em]">
          {section.part}
        </div>
        <h1 className="text-2xl sm:text-3xl font-light font-cinzel text-white tracking-wide">
          {section.title}
        </h1>
        <p className="text-slate-500 text-xs font-mono max-w-xl mx-auto tracking-wider uppercase">
          {section.subtitle}
        </p>
      </div>

      {/* Story Content Blocks */}
      <div className={`space-y-6 ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>
        {section.paragraphs.map((p, idx) => {
          const isPlayingThis = activeParagraphId === p.id;
          const isLoadingThis = isLoadingTTS === p.id;

          return (
            <div
              key={p.id}
              className={`group relative p-5 sm:p-6 rounded-lg transition-all duration-300 border ${
                isPlayingThis
                  ? 'bg-[#0d0d0d] border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.04)]'
                  : 'bg-[#080808] border-[#151515] hover:border-[#222] hover:bg-[#0a0a0a]'
              }`}
            >
              {/* Paragraph Audio Narrator Trigger */}
              <div className="absolute top-4 right-4 opacity-70 group-hover:opacity-100 transition">
                <button
                  onClick={() => handlePlayParagraphTTS(p.id, p.text)}
                  title={`Narrate this paragraph (${voice})`}
                  className={`p-2 rounded text-xs flex items-center space-x-1.5 transition border ${
                    isPlayingThis
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse'
                      : 'bg-[#0d0d0d] text-slate-300 border-[#222] hover:border-slate-500 hover:text-white'
                  }`}
                >
                  {isLoadingThis ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isPlayingThis ? (
                    <Pause className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline font-mono text-[10px] uppercase">
                    {isPlayingThis ? 'Stop' : voice}
                  </span>
                </button>
              </div>

              {/* Text rendering */}
              <div className={`space-y-4 ${getFontSizeClass()}`}>
                {p.text.split('\n\n').map((line, lIdx) => (
                  <p
                    key={lIdx}
                    className={`${
                      p.type === 'internal'
                        ? 'text-cyan-100 italic'
                        : p.ambientMood === 'demonic'
                        ? 'text-rose-200 font-medium'
                        : 'text-slate-300'
                    }`}
                  >
                    {line}
                  </p>
                ))}
              </div>

              {/* Embedded System Windows */}
              {p.systemData && (
                <div
                  className={`mt-6 p-4 sm:p-5 rounded transition-all font-mono text-xs sm:text-sm ${
                    p.systemData.type === 'error'
                      ? 'corrupted-window text-rose-200'
                      : p.systemData.type === 'crystal'
                      ? 'bg-[#0d0d0d] border border-white/40 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                      : 'bg-[#0d0d0d] border border-[#222] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-[#222] pb-2 mb-3">
                    <div className="flex items-center space-x-2">
                      {p.systemData.type === 'error' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                      ) : p.systemData.type === 'crystal' ? (
                        <Zap className="w-4 h-4 text-white animate-pulse" />
                      ) : (
                        <Layers className="w-4 h-4 text-white" />
                      )}
                      <span className="text-xs uppercase tracking-wider font-bold text-white">
                        {p.systemData.title}
                      </span>
                    </div>
                    {p.systemData.rank && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#151515] text-slate-300 border border-[#222] uppercase">
                        Rank: {p.systemData.rank}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 font-mono text-xs sm:text-sm">
                    {p.systemData.lines.map((sysLine, sIdx) => (
                      <div key={sIdx} className="flex items-start space-x-2">
                        <span className="text-slate-500 select-none">›</span>
                        <span
                          className={
                            sysLine.includes('ERROR') || sysLine.includes('CORRUPTED') || sysLine.includes('DEMONIC')
                              ? 'text-rose-400 font-bold'
                              : sysLine.includes('FORGER')
                              ? 'text-white font-bold'
                              : 'text-slate-300'
                          }
                        >
                          {sysLine}
                        </span>
                      </div>
                    ))}
                  </div>

                  {p.systemData.title.includes('FORGER SYSTEM') && (
                    <div className="mt-3 pt-2 border-t border-[#1a1a1a] flex justify-end">
                      <button
                        onClick={onOpenForge}
                        className="text-xs font-mono px-3 py-1 rounded bg-white text-black font-bold uppercase tracking-wider hover:bg-slate-200 flex items-center space-x-1.5 transition"
                      >
                        <span>Analyze in System Forge</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Chapter Bottom Navigation */}
      <div className="pt-6 border-t border-[#1a1a1a] flex items-center justify-between gap-4">
        {prevSection ? (
          <button
            onClick={() => {
              SoundFX.playSystemNotification();
              onSelectSection(prevSection.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded bg-[#0a0a0a] border border-[#1a1a1a] text-slate-300 hover:border-[#333] hover:text-white text-xs sm:text-sm font-mono uppercase tracking-wider transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous: {prevSection.title}</span>
          </button>
        ) : (
          <div />
        )}

        {nextSection ? (
          <button
            onClick={() => {
              SoundFX.playSystemNotification();
              onSelectSection(nextSection.id);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center space-x-2 px-5 py-2.5 rounded bg-white text-black hover:bg-slate-200 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider transition shadow-lg"
          >
            <span>Next: {nextSection.title}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={onOpenForge}
            className="flex items-center space-x-2 px-5 py-2.5 rounded bg-white text-black hover:bg-slate-200 text-xs sm:text-sm font-mono font-bold uppercase tracking-wider transition shadow-lg"
          >
            <span>Enter Skill Forge</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
