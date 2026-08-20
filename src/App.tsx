/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { STORY_SECTIONS } from './data/storyData';
import { INITIAL_ARYAN_STATS, INITIAL_SKILLS } from './data/skillsData';
import { StorySectionId, TTSVoice, CharacterStats, ForgedSkill } from './types';
import { SoundFX } from './utils/soundEffects';
import { isAudioPlaying, stopAllAudio } from './services/ttsService';

import { Navbar } from './components/Navbar';
import { CinematicViewer } from './components/CinematicViewer';
import { NovelReader } from './components/NovelReader';
import { ForgeLab } from './components/ForgeLab';
import { CharacterCodex } from './components/CharacterCodex';
import { TTSPlayerBar } from './components/TTSPlayerBar';

export default function App() {
  const [activeTab, setActiveTab] = useState<'cinematic' | 'reader' | 'forge' | 'codex'>('cinematic');
  const [currentSectionId, setCurrentSectionId] = useState<StorySectionId>('prologue-world');
  const [selectedVoice, setSelectedVoice] = useState<TTSVoice>('Fenrir');
  const [isAmbientActive, setIsAmbientActive] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);

  const [stats, setStats] = useState<CharacterStats>(INITIAL_ARYAN_STATS);
  const [skills, setSkills] = useState<ForgedSkill[]>(INITIAL_SKILLS);

  const currentSection =
    STORY_SECTIONS.find((s) => s.id === currentSectionId) || STORY_SECTIONS[0];

  // Poll or monitor audio playing state
  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlayingTTS(isAudioPlaying());
    }, 400);
    return () => clearInterval(interval);
  }, []);

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

        {activeTab === 'codex' && (
          <CharacterCodex
            stats={stats}
            onLevelUp={handleLevelUp}
            voice={selectedVoice}
          />
        )}
      </main>

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
