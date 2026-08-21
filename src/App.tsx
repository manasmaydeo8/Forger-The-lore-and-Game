/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { STORY_SECTIONS } from './data/storyData';
import { INITIAL_ARYAN_STATS, INITIAL_SKILLS } from './data/skillsData';
import { StorySectionId, TTSVoice, CharacterStats, ForgedSkill, SaveSlotData } from './types';
import { SoundFX } from './utils/soundEffects';
import { isAudioPlaying, stopAllAudio } from './services/ttsService';
import { saveSlot, loadSlot, getLatestSave } from './utils/saveManager';

import { Navbar } from './components/Navbar';
import { CinematicViewer } from './components/CinematicViewer';
import { NovelReader } from './components/NovelReader';
import { ForgeLab } from './components/ForgeLab';
import { ArenaCombat } from './components/ArenaCombat';
import { CharacterCodex } from './components/CharacterCodex';
import { ArtifactVault } from './components/ArtifactVault';
import { MultiplayerRealm } from './components/MultiplayerRealm';
import { TTSPlayerBar } from './components/TTSPlayerBar';
import { SaveManagerModal } from './components/SaveManagerModal';
import { Check, Sparkles, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'cinematic' | 'reader' | 'forge' | 'arena' | 'codex' | 'multiplayer' | 'artifacts'>('cinematic');
  const [currentSectionId, setCurrentSectionId] = useState<StorySectionId>('prologue-world');
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>('Fenrir');
  const [isAmbientActive, setIsAmbientActive] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);

  const [stats, setStats] = useState<CharacterStats>(INITIAL_ARYAN_STATS);
  const [skills, setSkills] = useState<ForgedSkill[]>(INITIAL_SKILLS);

  // Save System UI States
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [lastSavedText, setLastSavedText] = useState<string | null>(null);
  const [saveToast, setSaveToast] = useState<{ message: string; type: 'save' | 'load' | 'auto' } | null>(null);
  const isInitialMount = useRef(true);

  // On first load, check if previous save exists and restore
  useEffect(() => {
    try {
      const latest = getLatestSave();
      if (latest && latest.stats && latest.skills) {
        setStats(latest.stats);
        setSkills(latest.skills);
        if (latest.currentSectionId) setCurrentSectionId(latest.currentSectionId);
        if (latest.activeTab) setActiveTab(latest.activeTab);
        if (latest.selectedVoice) setSelectedVoice(latest.selectedVoice);
        setLastSavedText('Restored');
        setSaveToast({ message: `Chronicle restored from previous session (${latest.label})`, type: 'load' });
        setTimeout(() => setSaveToast(null), 3500);
      }
    } catch (e) {
      console.warn('Could not auto-restore save', e);
    }
  }, []);

  // Debounced Auto-Save
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      const saved = saveSlot({
        id: 'autosave',
        label: 'Chronicle Auto-Save',
        stats,
        skills,
        currentSectionId,
        activeTab,
        selectedVoice,
      });

      if (saved) {
        setLastSavedText('Auto-saved');
        setSaveToast({ message: 'Chronicle progression auto-saved', type: 'auto' });
        setTimeout(() => setSaveToast(null), 2500);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [stats, skills, currentSectionId, activeTab, selectedVoice]);

  const handleQuickSave = () => {
    SoundFX.playSkillForged();
    const saved = saveSlot({
      id: 'quicksave',
      label: 'Quick Save Matrix',
      stats,
      skills,
      currentSectionId,
      activeTab,
      selectedVoice,
    });

    if (saved) {
      setLastSavedText('Quick-saved');
      setSaveToast({ message: '⚡ Quick Save recorded successfully!', type: 'save' });
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  const handleLoadSaveData = (data: SaveSlotData) => {
    setStats(data.stats);
    setSkills(data.skills);
    setCurrentSectionId(data.currentSectionId);
    setActiveTab(data.activeTab || 'cinematic');
    if (data.selectedVoice) setSelectedVoice(data.selectedVoice);
    setLastSavedText('Loaded');
    setSaveToast({ message: `Loaded: ${data.label}`, type: 'load' });
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleResetGameData = () => {
    setStats(INITIAL_ARYAN_STATS);
    setSkills(INITIAL_SKILLS);
    setCurrentSectionId('prologue-world');
    setActiveTab('cinematic');
    setLastSavedText(null);
    setSaveToast({ message: 'Progress reset to Chapter 1 baseline', type: 'auto' });
    setTimeout(() => setSaveToast(null), 3000);
  };

  const currentSection =
    STORY_SECTIONS.find((s) => s.id === currentSectionId) || STORY_SECTIONS[0];

  // Poll or monitor audio playing state
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlayingTTS(isAudioPlaying());
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Calculate bound permanent mana, usable capacity, and dynamic strategic stance
  const boundPermanentMana = skills
    .filter((s) => s.isForged)
    .reduce((acc, s) => acc + (s.permanentManaCost || 0), 0);
  const usablePermanentManaCap = Math.max(0, stats.maxPermanentMana - boundPermanentMana);

  const freeRatio = stats.maxPermanentMana > 0 ? usablePermanentManaCap / stats.maxPermanentMana : 1;
  let strategicStance: 'Pure Wellspring' | 'Balanced Arsenal' | 'Overcharged Sovereign' | 'Soul Strain Hazard' = 'Pure Wellspring';
  let dynamicRate = 3;
  let dynamicInterval = 2.0;

  if (freeRatio >= 0.65) {
    strategicStance = 'Pure Wellspring';
    dynamicRate = 4;
    dynamicInterval = 1.5;
  } else if (freeRatio >= 0.35) {
    strategicStance = 'Balanced Arsenal';
    dynamicRate = 3;
    dynamicInterval = 2.0;
  } else if (freeRatio >= 0.12) {
    strategicStance = 'Overcharged Sovereign';
    dynamicRate = 2;
    dynamicInterval = 2.5;
  } else {
    strategicStance = 'Soul Strain Hazard';
    dynamicRate = 1;
    dynamicInterval = 3.5;
  }

  // Keep stats in sync with bound mana & usable cap
  useEffect(() => {
    setStats((prev) => {
      const clampedPermanent = Math.min(prev.permanentMana, usablePermanentManaCap);
      if (
        prev.boundPermanentMana === boundPermanentMana &&
        prev.usablePermanentManaCap === usablePermanentManaCap &&
        prev.strategicStance === strategicStance &&
        prev.permanentMana === clampedPermanent
      ) {
        return prev;
      }
      return {
        ...prev,
        boundPermanentMana,
        usablePermanentManaCap,
        strategicStance,
        permanentMana: clampedPermanent,
      };
    });
  }, [boundPermanentMana, usablePermanentManaCap, strategicStance]);

  // Autonomic Mana Replenishment Loop (Aryan's Innate Skill: Primordial Mana Wellspring)
  // Automatically increases Aryan's mana whenever it drops below its usable designated capacity
  useEffect(() => {
    const replenishIntervalMs = Math.round(dynamicInterval * 1000);
    
    const manaTimer = setInterval(() => {
      setStats((prev) => {
        const currentCap = prev.usablePermanentManaCap ?? usablePermanentManaCap;
        const needsPermanentReplenish = prev.permanentMana < currentCap;
        const needsActiveReplenish = prev.activeMana < prev.maxActiveMana;

        if (!needsPermanentReplenish && !needsActiveReplenish) {
          if (prev.isReplenishing) {
            return { ...prev, isReplenishing: false };
          }
          return prev;
        }

        const newPermanent = Math.min(currentCap, prev.permanentMana + dynamicRate);
        const newActive = Math.min(prev.maxActiveMana, prev.activeMana + dynamicRate);

        return {
          ...prev,
          permanentMana: newPermanent,
          activeMana: newActive,
          isReplenishing: newPermanent < currentCap || newActive < prev.maxActiveMana,
        };
      });
    }, replenishIntervalMs);

    return () => clearInterval(manaTimer);
  }, [dynamicInterval, dynamicRate, usablePermanentManaCap]);

  const handleToggleAmbient = () => {
    const newState = SoundFX.toggleAmbient();
    setIsAmbientActive(newState);
  };

  const handleStopAllTTS = () => {
    stopAllAudio();
    setIsPlayingTTS(false);
  };

  const handleLevelUp = () => {
    setStats((prev) => ({
      ...prev,
      level: prev.level + 1,
      strength: prev.strength + 2,
      agility: prev.agility + 3,
      defense: prev.defense + 1,
      intelligence: prev.intelligence + 4,
      maxPermanentMana: prev.maxPermanentMana + 10,
      permanentMana: prev.permanentMana + 10,
    }));
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#e2e8f0] flex flex-col selection:bg-white/20 selection:text-white font-sans">
      {/* Primary Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentSectionId={currentSectionId}
        onSelectSection={(id) => setCurrentSectionId(id)}
        selectedVoice={selectedVoice}
        onSelectVoice={(v) => setSelectedVoice(v)}
        isAmbientActive={isAmbientActive}
        onToggleAmbient={handleToggleAmbient}
        isPlayingTTS={isPlayingTTS}
        isLoadingTTS={isLoadingTTS}
        onStopTTS={handleStopAllTTS}
        stats={stats}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
        onQuickSave={handleQuickSave}
        lastSavedText={lastSavedText}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'cinematic' && (
          <CinematicViewer
            section={currentSection}
            allSections={STORY_SECTIONS}
            onSelectSection={(id) => setCurrentSectionId(id)}
            voice={selectedVoice}
            onOpenForge={() => {
              SoundFX.playSkillForged();
              setActiveTab('forge');
            }}
          />
        )}

        {activeTab === 'reader' && (
          <NovelReader
            section={currentSection}
            allSections={STORY_SECTIONS}
            onSelectSection={(id) => setCurrentSectionId(id)}
            voice={selectedVoice}
            onOpenForge={() => {
              SoundFX.playSkillForged();
              setActiveTab('forge');
            }}
          />
        )}

        {activeTab === 'forge' && (
          <ForgeLab
            stats={stats}
            onUpdateStats={setStats}
            skills={skills}
            onUpdateSkills={setSkills}
            voice={selectedVoice}
          />
        )}

        {activeTab === 'arena' && (
          <ArenaCombat
            stats={stats}
            onUpdateStats={setStats}
            skills={skills}
            onUpdateSkills={setSkills}
            onLevelUp={handleLevelUp}
            voice={selectedVoice}
          />
        )}

        {activeTab === 'codex' && (
          <CharacterCodex
            stats={stats}
            onUpdateStats={setStats}
            skills={skills}
            onUpdateSkills={setSkills}
            onLevelUp={handleLevelUp}
            voice={selectedVoice}
          />
        )}

        {activeTab === 'artifacts' && (
          <ArtifactVault
            stats={stats}
            onUpdateStats={setStats}
            voice={selectedVoice}
          />
        )}

        {activeTab === 'multiplayer' && (
          <MultiplayerRealm
            stats={stats}
            onUpdateStats={setStats}
            skills={skills}
            voice={selectedVoice}
          />
        )}
      </main>

      {/* Save Manager Modal */}
      <SaveManagerModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        stats={stats}
        skills={skills}
        currentSectionId={currentSectionId}
        activeTab={activeTab}
        selectedVoice={selectedVoice}
        onLoadSave={handleLoadSaveData}
        onResetGame={handleResetGameData}
      />

      {/* Floating Save Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div
            className={`px-4 py-2.5 rounded-lg shadow-2xl border text-xs font-mono flex items-center space-x-2.5 backdrop-blur-md ${
              saveToast.type === 'load'
                ? 'bg-purple-950/90 border-purple-600 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                : saveToast.type === 'save'
                ? 'bg-cyan-950/90 border-cyan-500 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                : 'bg-[#121218]/90 border-slate-700 text-slate-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]'
            }`}
          >
            {saveToast.type === 'load' ? (
              <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
            ) : saveToast.type === 'save' ? (
              <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            ) : (
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            )}
            <span>{saveToast.message}</span>
          </div>
        </div>
      )}

      {/* Floating Persistent TTS Player Indicator when active */}
      {isPlayingTTS && (
        <TTSPlayerBar
          voice={selectedVoice}
          onStop={handleStopAllTTS}
        />
      )}

      {/* Footer info */}
      <footer className="border-t border-[#1a1a1a] py-6 text-center text-xs font-mono text-slate-500">
        <p className="tracking-wider uppercase text-[11px]">FORGER: The Trash Skill That Shouldn't Exist • Opening Narration & Chapter 1</p>
        <p className="mt-1 text-[10px] text-slate-600">
          Powered by Gemini 3.1 Flash TTS (<code className="text-slate-400">gemini-3.1-flash-tts-preview</code>)
        </p>
      </footer>
    </div>
  );
}
