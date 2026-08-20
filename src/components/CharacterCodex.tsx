import React, { useState } from 'react';
import { CharacterStats, TTSVoice } from '../types';
import { fetchTTSAudio, playAudioUrl, stopAllAudio } from '../services/ttsService';
import { SoundFX } from '../utils/soundEffects';
import {
  Shield,
  Zap,
  BookOpen,
  User,
  Heart,
  Brain,
  Sword,
  Activity,
  Flame,
  Globe,
  AlertTriangle,
  Sparkles,
  Volume2,
  Loader2,
} from 'lucide-react';

interface CharacterCodexProps {
  stats: CharacterStats;
  onLevelUp: () => void;
  voice: TTSVoice;
}

export const CharacterCodex: React.FC<CharacterCodexProps> = ({
  stats,
  onLevelUp,
  voice,
}) => {
  const [selectedLoreId, setSelectedLoreId] = useState<string>('aryan-origin');
  const [isPlayingLore, setIsPlayingLore] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const LORE_ENTRIES = [
    {
      id: 'aryan-origin',
      title: 'Aryan: The Empty Child',
      subtitle: 'The boy born with nothing who learned everything',
      content:
        'Born in a small border village, Aryan possessed Mana so low he could not summon a flame at age five or reinforce his flesh at age ten. Mocked as "The Empty Child", he spent eighteen years reading every tome on ancient magic theory, anatomy, alchemy, monster biology, and weapon forging. That academic comprehension became the catalyst for the Forger system.',
    },
    {
      id: 'aetheria-world',
      title: 'The World of Aetheria',
      subtitle: 'A realm where Skills dictate sovereign destiny',
      content:
        'In Aetheria, magical power is woven into the soul from birth. Upon reaching the age of eighteen, citizens enter the Temple of Awakening to touch an ancient crystal. Skills are publicly categorized from F-Rank (crafting/trash) up to S-Rank (nation-shaking miracles). Kings rule and heroes are chosen strictly based on awakened gifts.',
    },
    {
      id: 'awakening-crystal',
      title: 'The Awakening Crystal & White Anomaly',
      subtitle: 'The prehistoric monolith older than the kingdom',
      content:
        'Normal awakenings radiate gold, blue, or crimson light. When Aryan touched the crystal, it remained dark for five agonizing seconds before erupting in an unprecedented blast of pure white mana that shook the entire temple structure. The crystal registered [ONE SKILL: FORGER], masking its infinite true potential from human eyes.',
    },
    {
      id: 'demonic-threat',
      title: 'The Demonic Infiltration',
      subtitle: 'Ancient abyssal runes embedded inside monster souls',
      content:
        'When Aryan analyzed a forest goblin\'s "Predator Instinct", the Forger system uncovered a critical anomaly: foreign demonic mana signatures embedded inside the creature\'s soul matrix. Monsters in Aetheria are not natural fauna; they are carriers of an ancient sleeping demonic army waiting for the appointed hour.',
    },
  ];

  const currentLore = LORE_ENTRIES.find((l) => l.id === selectedLoreId) || LORE_ENTRIES[0];

  const handlePlayLoreTTS = async () => {
    if (isPlayingLore) {
      stopAllAudio();
      setIsPlayingLore(false);
      return;
    }

    try {
      setIsLoadingAudio(true);
      const textToSpeak = `${currentLore.title}. ${currentLore.subtitle}. ${currentLore.content}`;
      const url = await fetchTTSAudio(textToSpeak, voice);
      setIsLoadingAudio(false);
      setIsPlayingLore(true);

      playAudioUrl(
        url,
        () => setIsPlayingLore(false),
        () => {
          setIsPlayingLore(false);
          setIsLoadingAudio(false);
        }
      );
    } catch (e) {
      setIsLoadingAudio(false);
      setIsPlayingLore(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Title */}
      <div className="border-b border-[#1a1a1a] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 text-xs font-mono text-slate-500 uppercase tracking-widest">
            <span>CODEX & CHARACTER SHEET</span>
            <span>•</span>
            <span>AETHERIA ARCHIVES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-light font-cinzel text-white mt-1.5 tracking-wide">
            Host Identity & Core Lore
          </h1>
        </div>

        <button
          onClick={() => {
            SoundFX.playSkillForged();
            onLevelUp();
          }}
          className="px-4 py-2 rounded bg-white text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-slate-200 flex items-center space-x-2 transition"
        >
          <Sparkles className="w-4 h-4" />
          <span>Simulate Defeating Goblin (Level Up)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Aryan's Status Sheet */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-lg space-y-6">
            <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-11 h-11 rounded bg-[#0d0d0d] border border-[#222] flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-mono text-white tracking-wide">{stats.name}</h2>
                  <p className="text-xs text-slate-500 font-mono tracking-wider uppercase mt-0.5">{stats.title}</p>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest block">LEVEL</span>
                <span className="text-2xl font-bold text-white">{stats.level}</span>
              </div>
            </div>

            {/* Core Attributes */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="bg-[#0d0d0d] p-3 rounded border border-[#222] flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Sword className="w-3.5 h-3.5 text-rose-400" />
                  <span className="uppercase tracking-wider text-[11px]">Strength</span>
                </div>
                <span className="text-white font-bold">{stats.strength}</span>
              </div>

              <div className="bg-[#0d0d0d] p-3 rounded border border-[#222] flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="uppercase tracking-wider text-[11px]">Agility</span>
                </div>
                <span className="text-white font-bold">{stats.agility}</span>
              </div>

              <div className="bg-[#0d0d0d] p-3 rounded border border-[#222] flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span className="uppercase tracking-wider text-[11px]">Defense</span>
                </div>
                <span className="text-white font-bold">{stats.defense}</span>
              </div>

              <div className="bg-[#0d0d0d] p-3 rounded border border-[#222] flex items-center justify-between">
                <div className="flex items-center space-x-2 text-slate-400">
                  <Brain className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="uppercase tracking-wider text-[11px]">Intelligence</span>
                </div>
                <span className="text-white font-bold">{stats.intelligence}</span>
              </div>
            </div>

            {/* Permanent Mana & Core Gauge */}
            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between text-slate-400 mb-1.5 text-[11px] uppercase tracking-wider">
                  <span>Permanent Soul Mana:</span>
                  <span className="text-white font-bold">{stats.permanentMana} / {stats.maxPermanentMana} MP</span>
                </div>
                <div className="w-full h-1.5 bg-[#151515] rounded-full overflow-hidden border border-[#222]">
                  <div
                    className="h-full bg-cyan-600 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(8,145,178,0.5)]"
                    style={{ width: `${(stats.permanentMana / stats.maxPermanentMana) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1.5 text-[11px] uppercase tracking-wider">
                  <span>Mana Core Integrity:</span>
                  <span className="text-emerald-400 font-bold">{stats.manaCoreIntegrity}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#151515] rounded-full overflow-hidden border border-[#222]">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    style={{ width: `${stats.manaCoreIntegrity}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Status Traits */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Active Soul Traits:</span>
              <div className="space-y-1.5 font-mono text-xs">
                {stats.statusEffects.map((eff, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded bg-[#0d0d0d] border border-[#222] text-slate-300 flex items-center space-x-2"
                  >
                    <span className="text-slate-500">›</span>
                    <span>{eff}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: World Lore Encyclopedia */}
        <div className="lg:col-span-7 space-y-6">
          {/* Lore Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {LORE_ENTRIES.map((entry) => {
              const isSelected = entry.id === selectedLoreId;
              return (
                <button
                  key={entry.id}
                  onClick={() => {
                    SoundFX.playSystemNotification();
                    setSelectedLoreId(entry.id);
                    stopAllAudio();
                    setIsPlayingLore(false);
                  }}
                  className={`p-3 rounded border text-left font-mono text-xs transition ${
                    isSelected
                      ? 'bg-[#0d0d0d] text-white border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.05)]'
                      : 'bg-[#0a0a0a] text-slate-400 border-[#1a1a1a] hover:border-[#333] hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold truncate text-white">{entry.title}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{entry.subtitle}</div>
                </button>
              );
            })}
          </div>

          {/* Lore Display Card */}
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 sm:p-8 rounded-lg space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1a1a1a] pb-4">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                  Aetheria Archive Document
                </span>
                <h3 className="text-xl sm:text-2xl font-light font-cinzel text-white mt-1">
                  {currentLore.title}
                </h3>
                <p className="text-xs text-slate-400 font-sans mt-0.5">{currentLore.subtitle}</p>
              </div>

              {/* TTS Narration Trigger */}
              <button
                onClick={handlePlayLoreTTS}
                disabled={isLoadingAudio}
                className={`flex items-center space-x-2 px-4 py-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition ${
                  isPlayingLore
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse'
                    : 'bg-white text-black hover:bg-slate-200'
                }`}
              >
                {isLoadingAudio ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                <span>{isPlayingLore ? 'Stop Audio' : `Read Aloud (${voice})`}</span>
              </button>
            </div>

            <p className="text-base sm:text-lg font-serif text-slate-200 leading-relaxed">
              {currentLore.content}
            </p>

            {/* Mysterious Hint Box */}
            <div className="p-4 rounded bg-[#0d0d0d] border border-[#222] space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>The Unsolved Secret: The Ancient Forger</span>
              </div>
              <p className="text-xs text-slate-400 font-sans italic">
                "And somewhere in the darkness... someone was already watching him. Someone who knew the name Forger. And that person was not human."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
