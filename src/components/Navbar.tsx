import React, { useState } from 'react';
import { STORY_SECTIONS } from '../data/storyData';
import { StorySectionId, TTSVoice, CharacterStats } from '../types';
import { SoundFX } from '../utils/soundEffects';
import {
  Sparkles,
  BookOpen,
  Film,
  Hammer,
  Shield,
  Volume2,
  VolumeX,
  Mic,
  ChevronDown,
  Radio,
  Zap,
  RotateCw,
  Sword,
  Save,
  Check,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'cinematic' | 'reader' | 'forge' | 'arena' | 'codex';
  setActiveTab: (tab: 'cinematic' | 'reader' | 'forge' | 'arena' | 'codex') => void;
  currentSectionId: StorySectionId;
  onSelectSection: (id: StorySectionId) => void;
  selectedVoice: TTSVoice;
  onSelectVoice: (voice: TTSVoice) => void;
  isAmbientActive: boolean;
  onToggleAmbient: () => void;
  isPlayingTTS: boolean;
  isLoadingTTS: boolean;
  onStopTTS: () => void;
  stats?: CharacterStats;
  onOpenSaveModal?: () => void;
  onQuickSave?: () => void;
  lastSavedText?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentSectionId,
  onSelectSection,
  selectedVoice,
  onSelectVoice,
  isAmbientActive,
  onToggleAmbient,
  isPlayingTTS,
  isLoadingTTS,
  onStopTTS,
  stats,
  onOpenSaveModal,
  onQuickSave,
  lastSavedText,
}) => {
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showVoiceDropdown, setShowVoiceDropdown] = useState(false);

  const currentSection = STORY_SECTIONS.find((s) => s.id === currentSectionId) || STORY_SECTIONS[0];
  const isManaUnderCapacity = stats && stats.permanentMana < stats.maxPermanentMana;

  const voices: { id: TTSVoice; label: string; desc: string }[] = [
    { id: 'Fenrir', label: 'Fenrir', desc: 'Deep & Solemn (Recommended)' },
    { id: 'Zephyr', label: 'Zephyr', desc: 'Cinematic Epic' },
    { id: 'Charon', label: 'Charon', desc: 'Dark & Mysterious' },
    { id: 'Kore', label: 'Kore', desc: 'Resonant Mythic' },
    { id: 'Puck', label: 'Puck', desc: 'Energetic Arcane' },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0a0a0a]/95 border-b border-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Title & System Indicator */}
        <div className="flex items-center space-x-4">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab('cinematic')}
          >
            <div className="w-2.5 h-2.5 bg-white rounded-full shadow-[0_0_8px_white] transition-transform group-hover:scale-125" />
            <div className="flex items-center space-x-2.5">
              <span className="text-sm tracking-[0.3em] uppercase font-bold text-white font-mono">
                FORGER SYSTEM
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-white text-black font-bold uppercase tracking-wider rounded">
                v1.0.4
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-[10px] tracking-[0.2em] uppercase text-slate-500 pl-4 border-l border-[#1a1a1a]">
            <span>Temple of Awakening</span>
            <span className="hidden xl:inline text-slate-600">•</span>
            <span className="hidden xl:inline">Host: Aryan</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">18th Year Cycle</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-1 rounded-lg bg-[#0d0d0d] border border-[#222222] text-xs font-medium">
          <button
            id="nav-tab-cinematic"
            onClick={() => {
              SoundFX.playSystemNotification();
              setActiveTab('cinematic');
            }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded transition ${
              activeTab === 'cinematic'
                ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.08)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span className="tracking-wide">Cinematic</span>
          </button>

          <button
            id="nav-tab-reader"
            onClick={() => {
              SoundFX.playSystemNotification();
              setActiveTab('reader');
            }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded transition ${
              activeTab === 'reader'
                ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.08)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="tracking-wide">Reader</span>
          </button>

          <button
            id="nav-tab-forge"
            onClick={() => {
              SoundFX.playSkillForged();
              setActiveTab('forge');
            }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded transition ${
              activeTab === 'forge'
                ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.08)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hammer className="w-3.5 h-3.5 text-cyan-400" />
            <span className="tracking-wide">Forge Lab</span>
          </button>

          <button
            id="nav-tab-arena"
            onClick={() => {
              SoundFX.playFireballIgnition();
              setActiveTab('arena');
            }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded transition ${
              activeTab === 'arena'
                ? 'bg-purple-950/80 text-purple-200 border border-purple-600 shadow-[0_0_12px_rgba(168,85,247,0.2)] font-semibold'
                : 'text-purple-400/80 hover:text-purple-200'
            }`}
          >
            <Sword className="w-3.5 h-3.5 text-purple-400" />
            <span className="tracking-wide">Arena Combat</span>
          </button>

          <button
            id="nav-tab-codex"
            onClick={() => {
              SoundFX.playSystemNotification();
              setActiveTab('codex');
            }}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded transition ${
              activeTab === 'codex'
                ? 'bg-white/10 text-white border border-white/20 shadow-[0_0_12px_rgba(255,255,255,0.08)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="tracking-wide">Codex & Stats</span>
          </button>
        </nav>

        {/* Live Aryan Mana & Innate Wellspring HUD */}
        {stats && (
          <div className="flex items-center space-x-2">
            {/* Mana Pool */}
            <div
              onClick={() => {
                SoundFX.playSystemNotification();
                setActiveTab('codex');
              }}
              title={`Aryan's Permanent Mana Pool: ${stats.permanentMana}/${stats.maxPermanentMana} MP. Innate Replenishment: ${
                isManaUnderCapacity ? 'Autonomously recovering +' + stats.innateSkill.replenishRate + ' MP/tick' : 'Capacity full'
              }`}
              className="cursor-pointer group flex items-center space-x-2.5 px-3 py-1.5 rounded bg-[#0d0d0d] border border-[#222] hover:border-cyan-500/50 transition font-mono text-xs"
            >
              <div className="flex items-center space-x-1.5">
                <Zap className={`w-3.5 h-3.5 ${isManaUnderCapacity ? 'text-cyan-400 animate-pulse' : 'text-cyan-500'}`} />
                <span className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold">MP</span>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center justify-between space-x-1.5 text-[11px]">
                  <span className="font-bold text-white group-hover:text-cyan-300 transition">
                    {stats.permanentMana}
                  </span>
                  <span className="text-[10px] text-slate-500">/ {stats.maxPermanentMana}</span>
                  {isManaUnderCapacity && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 animate-pulse flex items-center space-x-0.5">
                      <RotateCw className="w-2.5 h-2.5 animate-spin" />
                      <span>+{stats.innateSkill.replenishRate}</span>
                    </span>
                  )}
                </div>
                <div className="w-14 h-1 bg-[#1a1a1a] rounded-full overflow-hidden mt-0.5">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isManaUnderCapacity ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${Math.min(100, (stats.permanentMana / stats.maxPermanentMana) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Mana Crystals Balance */}
            <div
              onClick={() => {
                SoundFX.playCrystalPulse();
                setActiveTab('forge');
              }}
              title={`Monster Mana Crystals: ${stats.manaCrystals || 0}. Harvested from Encounter Arena corpses. Used in Forge Lab to evolve skills.`}
              className="cursor-pointer group flex items-center space-x-2 px-3 py-1.5 rounded bg-[#0d0d0d] border border-amber-900/40 hover:border-amber-500/70 transition font-mono text-xs shadow-[0_0_10px_rgba(245,158,11,0.05)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <div className="flex items-baseline space-x-1">
                <span className="font-bold text-amber-300 group-hover:text-amber-200 text-[11px]">
                  {stats.manaCrystals || 0}
                </span>
                <span className="text-[9px] text-amber-500/80 uppercase font-semibold">💎 Crystals</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions / Chapter & TTS settings */}
        <div className="flex items-center space-x-2.5">
          {/* Chapter Selector Dropdown */}
          <div className="relative">
            <button
              id="chapter-selector-btn"
              onClick={() => {
                setShowSectionDropdown(!showSectionDropdown);
                setShowVoiceDropdown(false);
              }}
              className="flex items-center space-x-2 px-3 py-1.5 rounded bg-[#0d0d0d] border border-[#222] text-xs text-slate-200 hover:border-slate-500 transition font-mono"
            >
              <span className="text-slate-400 font-semibold">{currentSection.part}:</span>
              <span className="max-w-[100px] truncate text-white">{currentSection.title}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {showSectionDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-lg bg-[#0a0a0a] border border-[#222] shadow-2xl p-1.5 z-50">
                <div className="text-[10px] uppercase font-mono text-slate-500 px-2.5 py-1.5 border-b border-[#1a1a1a] tracking-wider">
                  Story Chronicle
                </div>
                <div className="py-1 space-y-0.5 max-h-72 overflow-y-auto">
                  {STORY_SECTIONS.map((sec, idx) => (
                    <button
                      key={sec.id}
                      onClick={() => {
                        SoundFX.playSystemNotification();
                        onSelectSection(sec.id);
                        setShowSectionDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded text-xs transition flex flex-col ${
                        sec.id === currentSectionId
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'text-slate-300 hover:bg-[#151515]'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                        {sec.part} {idx + 1}
                      </span>
                      <span className="font-medium truncate text-white">{sec.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Voice Selector */}
          <div className="relative">
            <button
              id="voice-selector-btn"
              onClick={() => {
                setShowVoiceDropdown(!showVoiceDropdown);
                setShowSectionDropdown(false);
              }}
              title="Gemini 3.1 Flash TTS Voice"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-[#0d0d0d] border border-[#222] text-xs text-slate-200 hover:border-slate-500 transition font-mono"
            >
              <Mic className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-white font-medium">{selectedVoice}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {showVoiceDropdown && (
              <div className="absolute right-0 mt-2 w-60 rounded-lg bg-[#0a0a0a] border border-[#222] shadow-2xl p-1.5 z-50">
                <div className="text-[10px] uppercase font-mono text-slate-400 px-2.5 py-1.5 border-b border-[#1a1a1a] flex items-center justify-between tracking-wider">
                  <span>Gemini 3.1 Flash TTS</span>
                  <Radio className="w-3 h-3 text-white animate-pulse" />
                </div>
                <div className="py-1 space-y-0.5">
                  {voices.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        onSelectVoice(v.id);
                        setShowVoiceDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded text-xs transition ${
                        v.id === selectedVoice
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'text-slate-300 hover:bg-[#151515]'
                      }`}
                    >
                      <div className="font-medium text-white">{v.label}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ambient Soundscape Button */}
          <button
            id="toggle-ambient-btn"
            onClick={onToggleAmbient}
            title={isAmbientActive ? 'Ambient Synth: Active' : 'Ambient Synth: Muted'}
            className={`p-2 rounded border transition ${
              isAmbientActive
                ? 'bg-white/10 text-white border-white/30 shadow-[0_0_10px_rgba(255,255,255,0.15)]'
                : 'bg-[#0d0d0d] text-slate-400 border-[#222] hover:text-white'
            }`}
          >
            {isAmbientActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Save & Load Archive Matrix Button */}
          {onOpenSaveModal && (
            <div className="flex items-center space-x-1 pl-1 border-l border-slate-800">
              <button
                id="nav-save-matrix-btn"
                onClick={() => {
                  SoundFX.playMatrixPulse();
                  onOpenSaveModal();
                }}
                title="Open Chronicle Save & Archive Matrix"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-800/60 hover:border-cyan-500/80 text-cyan-200 text-xs font-mono transition shadow-[0_0_10px_rgba(6,182,212,0.15)] group"
              >
                <Save className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline font-semibold text-[11px] tracking-wider">Save</span>
                {lastSavedText && (
                  <span className="hidden lg:inline text-[9px] text-cyan-400/70 font-sans">
                    ({lastSavedText})
                  </span>
                )}
              </button>

              {onQuickSave && (
                <button
                  id="nav-quicksave-btn"
                  onClick={() => {
                    onQuickSave();
                  }}
                  title="Instant Quick Save"
                  className="p-1.5 rounded bg-[#0e0e12] hover:bg-cyan-950 border border-slate-800 hover:border-cyan-700 text-slate-400 hover:text-cyan-300 text-xs font-mono transition"
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
