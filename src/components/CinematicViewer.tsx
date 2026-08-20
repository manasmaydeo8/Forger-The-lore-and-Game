import React, { useState, useEffect, useRef } from 'react';
import { StorySection, TTSVoice } from '../types';
import { SoundFX } from '../utils/soundEffects';
import { fetchTTSAudio, playAudioUrl, stopAllAudio, narrateText } from '../services/ttsService';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Volume2,
  Sparkles,
  Zap,
  AlertTriangle,
  Flame,
  Layers,
  FastForward,
  Loader2,
  Eye,
  Crosshair,
} from 'lucide-react';

interface CinematicViewerProps {
  section: StorySection;
  allSections: StorySection[];
  onSelectSection: (id: any) => void;
  voice: TTSVoice;
  onOpenForge: () => void;
}

export const CinematicViewer: React.FC<CinematicViewerProps> = ({
  section,
  allSections,
  onSelectSection,
  voice,
  onOpenForge,
}) => {
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentParagraph = section.paragraphs[currentParagraphIndex] || section.paragraphs[0];
  const isFirstParagraph = currentParagraphIndex === 0;
  const isLastParagraph = currentParagraphIndex === section.paragraphs.length - 1;

  // Reset index when section changes
  useEffect(() => {
    setCurrentParagraphIndex(0);
    stopAllAudio();
    setIsPlaying(false);
  }, [section.id]);

  // Sound effects on paragraph change
  useEffect(() => {
    if (currentParagraph?.systemData?.type === 'error') {
      SoundFX.playDemonicAnomaly();
    } else if (currentParagraph?.systemData?.type === 'crystal') {
      SoundFX.playCrystalPulse();
    } else if (currentParagraph?.systemData?.type === 'system' || currentParagraph?.systemData?.type === 'status') {
      SoundFX.playSystemNotification();
    } else if (currentParagraph?.text.includes('Fireball') || currentParagraph?.text.includes('flame')) {
      SoundFX.playFireballIgnition();
    }
  }, [currentParagraphIndex, section.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && !isLastParagraph) {
        handleNext();
      } else if (e.key === 'ArrowLeft' && !isFirstParagraph) {
        handlePrev();
      } else if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON') {
        e.preventDefault();
        handleToggleTTS();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentParagraphIndex, isLastParagraph, isFirstParagraph, isPlaying]);

  const handleNext = () => {
    if (!isLastParagraph) {
      setCurrentParagraphIndex((prev) => prev + 1);
      stopAudio();
    } else {
      // Go to next section if available
      const currentSecIdx = allSections.findIndex((s) => s.id === section.id);
      if (currentSecIdx < allSections.length - 1) {
        onSelectSection(allSections[currentSecIdx + 1].id);
      }
    }
  };

  const handlePrev = () => {
    if (!isFirstParagraph) {
      setCurrentParagraphIndex((prev) => prev - 1);
      stopAudio();
    }
  };

  const stopAudio = () => {
    stopAllAudio();
    setIsPlaying(false);
  };

  const handleToggleTTS = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    try {
      setIsLoadingAudio(true);
      setAudioError(null);

      // Clean text for speech
      const textToSpeak = currentParagraph.text
        .replace(/\*\*/g, '')
        .replace(/\n+/g, ' ');

      setIsLoadingAudio(false);
      setIsPlaying(true);

      await narrateText(
        textToSpeak,
        voice,
        () => {
          setIsPlaying(false);
          if (autoAdvance && !isLastParagraph) {
            setCurrentParagraphIndex((prev) => prev + 1);
          }
        },
        (err) => {
          setIsPlaying(false);
          setIsLoadingAudio(false);
          setAudioError('Narration stream error. Please try again.');
        }
      );
    } catch (err: any) {
      setIsLoadingAudio(false);
      setIsPlaying(false);
      setAudioError(err.message || 'Failed to generate voice narration');
    }
  };

  // Determine atmospheric background visual theme based on current scene mood
  const getSceneTheme = () => {
    const mood = currentParagraph.ambientMood;
    switch (mood) {
      case 'explosion':
        return {
          bg: 'bg-[#080808]',
          accent: 'border-white/30 shadow-[0_0_60px_rgba(255,255,255,0.15)]',
          badge: 'bg-white/10 text-white border-white/30',
          glow: 'glow-white',
        };
      case 'demonic':
        return {
          bg: 'bg-[#0a0506]',
          accent: 'border-rose-500/30 shadow-[0_0_40px_rgba(244,63,94,0.15)]',
          badge: 'bg-rose-950/60 text-rose-300 border-rose-800/40',
          glow: 'glow-crimson',
        };
      case 'temple':
        return {
          bg: 'bg-[#05070a]',
          accent: 'border-cyan-900/40 shadow-[0_0_40px_rgba(8,145,178,0.15)]',
          badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/40',
          glow: 'glow-cyan',
        };
      case 'forest':
        return {
          bg: 'bg-[#050906]',
          accent: 'border-emerald-900/40 shadow-[0_0_40px_rgba(16,185,129,0.1)]',
          badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40',
          glow: '',
        };
      case 'room':
        return {
          bg: 'bg-[#070605]',
          accent: 'border-amber-900/40 shadow-[0_0_40px_rgba(245,158,11,0.1)]',
          badge: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
          glow: '',
        };
      default:
        return {
          bg: 'bg-[#050505]',
          accent: 'border-[#1a1a1a] shadow-[0_0_40px_rgba(0,0,0,0.8)]',
          badge: 'bg-[#0d0d0d] text-slate-300 border-[#222]',
          glow: '',
        };
    }
  };

  const theme = getSceneTheme();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Chapter Title Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1a1a1a] pb-4">
        <div>
          <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
            <span className="px-2 py-0.5 rounded bg-[#0d0d0d] border border-[#222] text-white uppercase tracking-wider font-bold">
              {section.part}
            </span>
            <span>•</span>
            <span className="text-slate-500 uppercase tracking-widest text-[10px]">{section.estimatedReadTime} read</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-light tracking-wide text-white mt-1.5 font-cinzel">
            {section.title}
          </h1>
          <p className="text-xs text-slate-400 font-sans tracking-wide mt-0.5">{section.subtitle}</p>
        </div>

        {/* Section Step Progress Line Indicators */}
        <div className="flex items-center space-x-1.5 bg-[#0a0a0a] p-2 rounded-lg border border-[#1a1a1a]">
          {section.paragraphs.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentParagraphIndex(idx);
                stopAudio();
              }}
              title={`Scene segment ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentParagraphIndex
                  ? 'w-6 bg-white shadow-[0_0_8px_white]'
                  : idx < currentParagraphIndex
                  ? 'w-3 bg-slate-600'
                  : 'w-2 bg-[#222] hover:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Primary Cinematic Screen Box */}
      <div
        className={`relative min-h-[460px] sm:min-h-[520px] rounded-xl ${theme.bg} border ${theme.accent} p-6 sm:p-10 flex flex-col justify-between overflow-hidden transition-all duration-700`}
      >
        {/* Background Ambient Visual Graphics - Subtle Radiant Glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 0%, transparent 65%)',
              opacity: currentParagraph.ambientMood === 'explosion' ? 0.25 : 0.08,
            }}
          />

          {/* Grid Scanline overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Demonic glitch particles when demonic */}
          {currentParagraph.ambientMood === 'demonic' && (
            <div className="absolute inset-0 bg-red-950/20 mix-blend-color-dodge animate-pulse" />
          )}
        </div>

        {/* Top Header Information in Theater View */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span
              className={`text-[10px] font-mono uppercase px-2.5 py-1 rounded border ${theme.badge} flex items-center space-x-1.5 tracking-wider font-bold`}
            >
              <Sparkles className="w-3 h-3 text-white" />
              <span>Scene {currentParagraphIndex + 1} / {section.paragraphs.length}</span>
            </span>

            {currentParagraph.type === 'internal' && (
              <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-[#0d0d0d] border border-[#222] tracking-wider uppercase">
                [Aryan Inner Monologue]
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoAdvance(!autoAdvance)}
              className={`text-xs px-2.5 py-1 rounded border font-mono transition flex items-center space-x-1.5 ${
                autoAdvance
                  ? 'bg-white/10 text-white border-white/20'
                  : 'bg-[#0d0d0d] text-slate-500 border-[#222]'
              }`}
            >
              <FastForward className="w-3 h-3" />
              <span className="text-[10px] uppercase tracking-wider">Auto-Advance: {autoAdvance ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* Center Stage: Narration / Dialogue & System Popup */}
        <div className="relative z-10 my-auto py-8 max-w-3xl mx-auto w-full text-center space-y-6">
          {/* Main Story Paragraph Text */}
          <div className="space-y-4">
            {currentParagraph.text.split('\n\n').map((line, lIdx) => (
              <p
                key={lIdx}
                className={`leading-relaxed transition-all duration-300 font-serif ${
                  currentParagraph.type === 'internal'
                    ? 'text-lg sm:text-2xl text-slate-300 italic'
                    : currentParagraph.ambientMood === 'demonic'
                    ? 'text-lg sm:text-2xl text-rose-100 font-medium'
                    : 'text-lg sm:text-2xl text-white font-light'
                }`}
              >
                {line}
              </p>
            ))}
          </div>

          {/* Floating Elegant System Window / Error Popup */}
          {currentParagraph.systemData && (
            <div
              className={`mt-6 text-left max-w-xl mx-auto p-4 sm:p-5 rounded-lg transition-all duration-500 ${
                currentParagraph.systemData.type === 'error'
                  ? 'corrupted-window text-rose-200'
                  : currentParagraph.systemData.type === 'crystal'
                  ? 'bg-[#0d0d0d] border border-white/40 text-white shadow-[0_0_30px_rgba(255,255,255,0.15)]'
                  : 'system-window text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between border-b border-[#222] pb-2.5 mb-3">
                <div className="flex items-center space-x-2">
                  {currentParagraph.systemData.type === 'error' ? (
                    <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                  ) : currentParagraph.systemData.type === 'crystal' ? (
                    <Zap className="w-4 h-4 text-white animate-pulse" />
                  ) : (
                    <Layers className="w-4 h-4 text-cyan-400" />
                  )}
                  <span className="font-mono text-xs uppercase tracking-widest font-bold text-white">
                    {currentParagraph.systemData.title}
                  </span>
                </div>
                {currentParagraph.systemData.rank && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white text-black font-bold uppercase tracking-wider">
                    Rank: {currentParagraph.systemData.rank}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 font-mono text-xs sm:text-sm">
                {currentParagraph.systemData.lines.map((sysLine, sIdx) => (
                  <div key={sIdx} className="flex items-start space-x-2">
                    <span className="text-cyan-400 select-none">›</span>
                    <span
                      className={
                        sysLine.includes('ERROR') || sysLine.includes('CORRUPTED') || sysLine.includes('DEMONIC')
                          ? 'text-rose-300 font-bold'
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

              {/* Quick Forge action button inside system popup */}
              {currentParagraph.systemData.title.includes('FORGER SYSTEM') && (
                <div className="mt-3 pt-2 border-t border-[#1a1a1a] flex justify-end">
                  <button
                    onClick={onOpenForge}
                    className="text-xs font-mono px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center space-x-1.5 transition"
                  >
                    <span>Open Forger Console</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Audio Error message */}
          {audioError && (
            <div className="text-xs font-mono text-rose-400 bg-rose-950/60 border border-rose-800 px-3 py-1.5 rounded-lg inline-block">
              {audioError}
            </div>
          )}
        </div>

        {/* Bottom Control Deck */}
        <div className="relative z-10 pt-4 border-t border-[#1a1a1a] flex flex-wrap items-center justify-between gap-4">
          {/* Previous Scene Button */}
          <button
            id="prev-scene-btn"
            onClick={handlePrev}
            disabled={isFirstParagraph}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded text-xs font-medium border transition ${
              isFirstParagraph
                ? 'opacity-30 cursor-not-allowed border-[#1a1a1a] text-slate-600'
                : 'bg-[#0d0d0d] border-[#222] text-slate-300 hover:bg-[#151515] hover:border-slate-500 hover:text-white'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline tracking-wider uppercase text-[10px]">Previous</span>
          </button>

          {/* Center: Gemini 3.1 Flash TTS Narration Master Button */}
          <div className="flex items-center space-x-3">
            <button
              id="narrate-scene-btn"
              onClick={handleToggleTTS}
              disabled={isLoadingAudio}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded font-mono text-xs uppercase tracking-wider transition-all duration-300 ${
                isPlaying
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse'
                  : 'bg-white text-black font-bold hover:bg-slate-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
              }`}
            >
              {isLoadingAudio ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Voice ({voice})...</span>
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Narration</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Narrate ({voice})</span>
                </>
              )}
            </button>

            {isPlaying && (
              <div className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#0d0d0d] rounded border border-[#222]">
                <span className="w-1 h-3 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-5 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-2 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
                <span className="w-1 h-4 bg-white rounded-full animate-bounce [animation-delay:450ms]" />
              </div>
            )}
          </div>

          {/* Next Scene Button */}
          <button
            id="next-scene-btn"
            onClick={handleNext}
            className="flex items-center space-x-1.5 px-4 py-2 rounded text-xs font-medium border bg-[#0d0d0d] border-[#222] text-slate-300 hover:bg-[#151515] hover:border-slate-500 hover:text-white transition"
          >
            <span className="tracking-wider uppercase text-[10px]">{isLastParagraph ? 'Next Chapter' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chapter Overview & Quick Scene Jumper */}
      <div className="bg-[#0a0a0a] rounded-lg border border-[#1a1a1a] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 uppercase tracking-widest">
            <Eye className="w-3.5 h-3.5 text-white" />
            <span>Scene Breakdown ({section.paragraphs.length} segments)</span>
          </div>
          <button
            onClick={() => setShowFullTranscript(!showFullTranscript)}
            className="text-xs text-slate-400 hover:text-white font-mono tracking-wider"
          >
            {showFullTranscript ? 'Collapse List' : 'View Full Script'}
          </button>
        </div>

        {showFullTranscript && (
          <div className="space-y-1.5 mt-3 pt-3 border-t border-[#1a1a1a]">
            {section.paragraphs.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => {
                  setCurrentParagraphIndex(idx);
                  stopAudio();
                }}
                className={`p-2.5 rounded text-xs cursor-pointer transition flex items-start space-x-3 ${
                  idx === currentParagraphIndex
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'text-slate-400 hover:bg-[#111] hover:text-slate-200'
                }`}
              >
                <span className="font-mono text-[10px] text-slate-500 mt-0.5">#{idx + 1}</span>
                <p className="line-clamp-2">{p.text.replace(/\n+/g, ' ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
