import React, { useState } from 'react';
import { CharacterStats, TTSVoice } from '../types';
import { fetchTTSAudio, playAudioUrl, stopAllAudio, narrateText } from '../services/ttsService';
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
  RefreshCw,
  RotateCw,
} from 'lucide-react';

interface CharacterCodexProps {
  stats: CharacterStats;
  onUpdateStats?: (newStats: CharacterStats) => void;
  onLevelUp: () => void;
  voice: TTSVoice;
}

export const CharacterCodex: React.FC<CharacterCodexProps> = ({
  stats,
  onUpdateStats,
  onLevelUp,
  voice,
}) => {
  const [selectedLoreId, setSelectedLoreId] = useState<string>('aryan-origin');
  const [isPlayingLore, setIsPlayingLore] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const isManaUnderCapacity = stats.permanentMana < stats.maxPermanentMana;

  const LORE_ENTRIES = [
    {
      id: 'aryan-origin',
      title: 'Aryan: The Empty Child',
      subtitle: 'The boy born with nothing who learned everything',
      content:
        'Born in a small border village, Aryan possessed Mana so low he could not summon a flame at age five or reinforce his flesh at age ten. Mocked as "The Empty Child", he spent eighteen years reading every tome on ancient magic theory, anatomy, alchemy, monster biology, and weapon forging. That academic comprehension became the catalyst for the Forger system.',
    },
    {
      id: 'aryan-innate-wellspring',
      title: 'Innate Skill: Primordial Wellspring',
      subtitle: 'Autonomic atmospheric mana siphon & perpetual replenishment',
      content:
        'Unlike standard mages of Aetheria who require hours of meditation or costly alchemical potions to restore depleted mana, Aryan carries a primordial innate constitution: the Primordial Mana Wellspring. Whenever his mana drops below its designated soul capacity, his core naturally breathes in and filters atmospheric mana particles, automatically replenishing his reserves over time without any conscious effort.',
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
      setIsLoadingAudio(false);
      setIsPlayingLore(true);

      await narrateText(
        textToSpeak,
        voice,
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

            {/* Permanent Mana & Strategic Core Gauge */}
            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="flex justify-between items-center text-slate-400 mb-1.5 text-[11px] uppercase tracking-wider">
                  <span className="flex items-center space-x-1.5">
                    <Zap className={`w-3.5 h-3.5 ${isManaUnderCapacity ? 'text-cyan-400 animate-pulse' : 'text-cyan-500'}`} />
                    <span>Soul Mana Equilibrium:</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-bold">
                      {stats.permanentMana} / {stats.usablePermanentManaCap ?? (stats.maxPermanentMana - (stats.boundPermanentMana || 0))} MP
                    </span>
                    <span className="text-purple-400 text-[10px]">
                      ({stats.boundPermanentMana || 0} MP Bound)
                    </span>
                  </div>
                </div>

                {/* Multi-segment Soul Bar */}
                <div className="w-full h-2.5 bg-[#151515] rounded-full overflow-hidden border border-[#222] flex">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isManaUnderCapacity
                        ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]'
                        : 'bg-cyan-600 shadow-[0_0_8px_rgba(8,145,178,0.5)]'
                    }`}
                    style={{ width: `${(stats.permanentMana / stats.maxPermanentMana) * 100}%` }}
                  />
                  <div
                    className="h-full bg-cyan-950/70"
                    style={{
                      width: `${Math.max(
                        0,
                        (((stats.usablePermanentManaCap ?? (stats.maxPermanentMana - (stats.boundPermanentMana || 0))) - stats.permanentMana) /
                          stats.maxPermanentMana) *
                          100
                      )}%`,
                    }}
                  />
                  <div
                    className="h-full bg-purple-600 shadow-[0_0_6px_rgba(168,85,247,0.4)]"
                    style={{ width: `${((stats.boundPermanentMana || 0) / stats.maxPermanentMana) * 100}%` }}
                  />
                </div>
              </div>

              {/* Strategic Stance Indicator */}
              <div className="flex items-center justify-between text-[11px] p-2 rounded bg-[#0d0d0d] border border-[#222]">
                <span className="text-slate-400 uppercase tracking-wider text-[10px]">Current Soul Stance:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                  stats.strategicStance === 'Pure Wellspring'
                    ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800'
                    : stats.strategicStance === 'Balanced Arsenal'
                    ? 'bg-blue-950/80 text-blue-300 border border-blue-800'
                    : stats.strategicStance === 'Overcharged Sovereign'
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                    : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                }`}>
                  {stats.strategicStance || 'Pure Wellspring'}
                </span>
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

            {/* Innate Skill: Primordial Mana Wellspring Feature Card */}
            <div className="p-3.5 rounded-lg bg-[#071318] border border-cyan-900/70 space-y-2.5 font-mono">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
                      {stats.innateSkill?.name || 'Primordial Mana Wellspring'}
                    </span>
                    <span className="text-[9px] text-cyan-400/90 uppercase tracking-widest font-semibold">
                      {stats.innateSkill?.tier || 'INNATE PASSIVE CONSTITUTION'}
                    </span>
                  </div>
                </div>

                {onUpdateStats && (
                  <button
                    onClick={() => {
                      if (stats.permanentMana > 20) {
                        SoundFX.playFireballIgnition();
                        onUpdateStats({
                          ...stats,
                          permanentMana: Math.max(0, stats.permanentMana - 20),
                        });
                      }
                    }}
                    title="Drain 20 MP to test automatic replenishment"
                    className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-[9px] font-bold uppercase tracking-wider transition shrink-0"
                  >
                    Test Drain (-20 MP)
                  </button>
                )}
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {stats.innateSkill?.description ||
                  'Aryan\'s unique biological constitution: an autonomic atmospheric conduit that continuously siphons and purifies surrounding mana, automatically replenishing his mana pool over time whenever it drops below its designated capacity without manual action.'}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-cyan-900/50 text-[10px] text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <RefreshCw className={`w-3 h-3 ${isManaUnderCapacity ? 'text-cyan-400 animate-spin' : 'text-slate-500'}`} />
                  <span>Rate: <strong className="text-cyan-300">+{stats.innateSkill?.replenishRate || 3} MP</strong> / {stats.innateSkill?.replenishInterval || 2}s</span>
                </div>
                <div>
                  Status: <strong className={isManaUnderCapacity ? 'text-cyan-400 animate-pulse' : 'text-emerald-400'}>
                    {isManaUnderCapacity ? 'AUTONOMIC REPLENISHING' : 'CAPACITY OPTIMAL'}
                  </strong>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
