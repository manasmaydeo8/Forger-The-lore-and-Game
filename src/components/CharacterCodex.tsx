import React, { useState } from 'react';
import { CharacterStats, ForgedSkill, TTSVoice } from '../types';
import { fetchTTSAudio, playAudioUrl, stopAllAudio, narrateText } from '../services/ttsService';
import { SoundFX } from '../utils/soundEffects';
import { calculateActiveSynergies, calculateCombatPower, getSkillSynergyMultiplier } from '../utils/synergy';
import { CombatArena } from './CombatArena';
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
  Skull,
  Link,
  Layers,
  Award,
  ChevronRight,
} from 'lucide-react';

interface CharacterCodexProps {
  stats: CharacterStats;
  onUpdateStats?: (newStats: CharacterStats) => void;
  skills?: ForgedSkill[];
  onUpdateSkills?: (newSkills: ForgedSkill[]) => void;
  onLevelUp: () => void;
  voice: TTSVoice;
}

export const CharacterCodex: React.FC<CharacterCodexProps> = ({
  stats,
  onUpdateStats,
  skills = [],
  onUpdateSkills,
  onLevelUp,
  voice,
}) => {
  const [activeTab, setActiveTab] = useState<'sheet' | 'arena' | 'lore'>('sheet');
  const [selectedLoreId, setSelectedLoreId] = useState<string>('aryan-origin');
  const [isPlayingLore, setIsPlayingLore] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const isManaUnderCapacity = stats.permanentMana < stats.maxPermanentMana;
  const activeSynergies = calculateActiveSynergies(skills).filter((s) => s.isActive);
  const totalPowerMultiplier = activeSynergies.reduce((acc, syn) => acc * syn.multiplier, 1.0);
  const combatPower = calculateCombatPower(stats, skills, calculateActiveSynergies(skills));
  const forgedSkills = skills.filter((s) => s.isForged);

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
      {/* Page Title & Navigation Tabs */}
      <div className="border-b border-[#1a1a1a] pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 text-xs font-mono text-slate-500 uppercase tracking-widest">
            <span>CODEX & CHARACTER SHEET</span>
            <span>•</span>
            <span>AETHERIA ARCHIVES</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-light font-cinzel text-white mt-1.5 tracking-wide">
            Host Identity, Synergies & Encounters
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Section Mode Switcher */}
          <div className="flex items-center space-x-1.5 bg-[#0a0a0a] p-1 rounded-lg border border-[#1f1f1f]">
            <button
              onClick={() => {
                SoundFX.playSystemNotification();
                setActiveTab('sheet');
              }}
              className={`px-3 py-1.5 rounded font-mono text-xs uppercase tracking-wider flex items-center space-x-1.5 transition ${
                activeTab === 'sheet'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Host Sheet & Synergies</span>
            </button>

            <button
              onClick={() => {
                SoundFX.playSystemNotification();
                setActiveTab('arena');
              }}
              className={`px-3 py-1.5 rounded font-mono text-xs uppercase tracking-wider flex items-center space-x-1.5 transition ${
                activeTab === 'arena'
                  ? 'bg-rose-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Skull className="w-3.5 h-3.5" />
              <span>Encounter Arena</span>
            </button>

            <button
              onClick={() => {
                SoundFX.playSystemNotification();
                setActiveTab('lore');
              }}
              className={`px-3 py-1.5 rounded font-mono text-xs uppercase tracking-wider flex items-center space-x-1.5 transition ${
                activeTab === 'lore'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>World Lore</span>
            </button>
          </div>

          <button
            onClick={() => {
              SoundFX.playSkillForged();
              onLevelUp();
            }}
            className="px-3.5 py-1.5 rounded bg-[#151515] hover:bg-[#202020] text-slate-200 border border-[#2a2a2a] text-xs font-mono font-bold uppercase tracking-wider flex items-center space-x-1.5 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate Level Up (+Stats)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: HOST STATUS SHEET & ACTIVE SYNERGIES */}
      {activeTab === 'sheet' && (
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

              {/* Combat Rating & Vital Points */}
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="bg-[#0d0d0d] p-3 rounded border border-cyan-900/60 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-cyan-400">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="uppercase tracking-wider text-[11px]">Combat Rating</span>
                  </div>
                  <span className="text-cyan-300 font-bold">{combatPower} CP</span>
                </div>

                <div className="bg-[#0d0d0d] p-3 rounded border border-emerald-900/60 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-emerald-400">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span className="uppercase tracking-wider text-[11px]">Max Vitality</span>
                  </div>
                  <span className="text-emerald-300 font-bold">{stats.maxHp || (100 + stats.defense * 8 + stats.strength * 4)} HP</span>
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

              {/* Mana Crystals Inventory Banner */}
              <div className="bg-[#0f0d06] p-3 rounded border border-amber-900/60 font-mono text-xs flex items-center justify-between shadow-[0_0_12px_rgba(245,158,11,0.06)]">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                  <div>
                    <span className="text-amber-300 font-bold uppercase tracking-wider text-[11px] block">
                      Monster Mana Crystals Stockpile
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      Harvested from Encounter Arena corpses • Fuels Forge Lab Evolution
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-amber-300 font-mono">
                    {stats.manaCrystals || 0} 💎
                  </span>
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

          {/* Right Column: Bonus Multiplier System & Equipped Skills Synergy Codex */}
          <div className="lg:col-span-7 space-y-6">
            {/* Active Synergy Bonus Multipliers Feature Block */}
            <div className="p-6 rounded-lg bg-[#080d14] border border-cyan-700/50 space-y-5 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cyan-950 pb-3">
                <div>
                  <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <Link className="w-4 h-4 text-cyan-400" />
                    <span>Active Multiplier System (Related Skills Synergies)</span>
                  </div>
                  <h3 className="text-lg font-bold font-mono text-white mt-0.5">
                    Equipped Skill Power Multipliers
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 rounded bg-emerald-950 text-emerald-300 font-mono text-xs font-bold border border-emerald-800">
                    +{Math.round((totalPowerMultiplier - 1) * 100)}% Global Multiplier
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                When Aryan equips two or more <strong>'Related'</strong> skills in his active Forger soul matrices, the overlapping magical geometries construct a resonant power circuit. This grants high-tier multiplier boosts across all linked spell stages in both the Forge Lab and live combat.
              </p>

              {/* List of Active Synergies */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 font-bold block">
                  Active Multiplier Circuits ({activeSynergies.length} Activated):
                </span>

                {activeSynergies.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeSynergies.map((syn) => (
                      <div
                        key={syn.synergy.id}
                        className="p-3.5 rounded bg-[#04111d] border border-cyan-500/40 font-mono text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{syn.synergy.name}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-700">
                            +{Math.round((syn.multiplier - 1) * 100)}% Power Boost
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-sans">{syn.synergy.description}</p>
                        <div className="pt-2 border-t border-cyan-950 text-[10px] text-cyan-300 flex flex-wrap gap-1 items-center">
                          <span className="text-slate-400">Triggered by:</span>
                          {syn.matchingSkills.map((sk) => (
                            <span key={sk.id} className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-200 border border-cyan-800">
                              {sk.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded bg-[#0a0a0a] border border-[#222] text-xs font-mono text-slate-400 space-y-2">
                    <p className="text-slate-300">
                      ⚡ No 2+ related skills currently equipped to activate multipliers.
                    </p>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Go to the <strong>Forge Lab</strong> and forge complementary skills (e.g. Fireball + Glacial Spike or Mana Shield + Titan Aegis) to unlock active synergy bonuses.
                    </p>
                  </div>
                )}
              </div>

              {/* Equipped Skills Breakdown with Individual Multipliers */}
              <div className="pt-3 border-t border-cyan-950/80 space-y-3">
                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400 font-bold block">
                  Active Forged Skills & Effective Power Ratings:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {forgedSkills.map((sk) => {
                    const { totalMultiplier: mult } = getSkillSynergyMultiplier(sk, activeSynergies);
                    return (
                      <div
                        key={sk.id}
                        className="p-3 rounded bg-[#0a0a0a] border border-[#222] font-mono text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white truncate max-w-[150px]">{sk.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-slate-300 border border-[#333]">
                            Stage {sk.currentStage}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Synergy Multiplier:</span>
                          <span className={mult > 1 ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                            {mult.toFixed(2)}x ({mult > 1 ? `+${Math.round((mult - 1) * 100)}%` : 'Base'})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 text-[9px] text-slate-500 pt-1">
                          {sk.synergyTags?.map((tag) => (
                            <span key={tag} className="px-1 py-0.2 rounded bg-[#111] text-slate-400 border border-[#222]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ENCOUNTER BESTIARY & COMBAT ARENA */}
      {activeTab === 'arena' && (
        <CombatArena
          stats={stats}
          onUpdateStats={onUpdateStats || (() => {})}
          skills={skills}
          onUpdateSkills={onUpdateSkills}
          onLevelUp={onLevelUp}
          voice={voice}
        />
      )}

      {/* VIEW 3: WORLD LORE ARCHIVES */}
      {activeTab === 'lore' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lore Selector Tabs */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500 font-bold block mb-2">
              Historical Chronicles ({LORE_ENTRIES.length})
            </span>
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
                  className={`w-full p-3.5 rounded border text-left font-mono text-xs transition ${
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
          <div className="lg:col-span-8 bg-[#0a0a0a] border border-[#1a1a1a] p-6 sm:p-8 rounded-lg space-y-6">
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
      )}
    </div>
  );
};

