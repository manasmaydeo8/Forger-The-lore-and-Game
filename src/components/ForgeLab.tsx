import React, { useState } from 'react';
import { CharacterStats, ForgedSkill, TTSVoice, getSkillEvolutionCrystalCost } from '../types';
import { SoundFX } from '../utils/soundEffects';
import { fetchTTSAudio, playAudioUrl, stopAllAudio, narrateText } from '../services/ttsService';
import { SkillEvolutionGraph } from './SkillEvolutionGraph';
import { calculateActiveSynergies, getSkillSynergyMultiplier, calculateCombatPower } from '../utils/synergy';
import { validateSkillSafety, getDailySkillQuota, recordSkillCreation } from '../utils/skillSafetyValidator';
import {
  Hammer,
  Zap,
  Flame,
  Eye,
  Activity,
  AlertTriangle,
  Sparkles,
  Shield,
  Layers,
  ChevronRight,
  TrendingUp,
  Cpu,
  Info,
  Loader2,
  Volume2,
  CheckCircle2,
  RefreshCw,
  GitBranch,
  Network,
  Sword,
  Link,
  FlameKindling,
  ShieldAlert,
  Clock,
} from 'lucide-react';

interface ForgeLabProps {
  stats: CharacterStats;
  onUpdateStats: (newStats: CharacterStats) => void;
  skills: ForgedSkill[];
  onUpdateSkills: (newSkills: ForgedSkill[]) => void;
  voice: TTSVoice;
}

export const ForgeLab: React.FC<ForgeLabProps> = ({
  stats,
  onUpdateStats,
  skills,
  onUpdateSkills,
  voice,
}) => {
  const [selectedSkillId, setSelectedSkillId] = useState<string>(skills[0]?.id || 'fireball-spell');
  const [forgeTab, setForgeTab] = useState<'tree' | 'catalog' | 'split'>('split');
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillDesc, setCustomSkillDesc] = useState('');
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [analyzedSkillResult, setAnalyzedSkillResult] = useState<any | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [forgeSuccessMsg, setForgeSuccessMsg] = useState<string | null>(null);
  const [isSpeakingResult, setIsSpeakingResult] = useState(false);
  const [evolutionTab, setEvolutionTab] = useState<'crystals' | 'synthesis'>('crystals');
  const [selectedDonorSkillIds, setSelectedDonorSkillIds] = useState<string[]>([]);

  const selectedSkill = skills.find((s) => s.id === selectedSkillId) || skills[0];

  // Active Synergies calculation
  const allSynergies = calculateActiveSynergies(skills);
  const activeSynergies = allSynergies.filter((s) => s.isActive);
  const totalPowerMultiplier = activeSynergies.reduce((acc, syn) => acc * syn.multiplier, 1.0);
  const combatPower = calculateCombatPower(stats, skills, allSynergies);
  const selectedSkillMultiplier = selectedSkill ? getSkillSynergyMultiplier(selectedSkill, allSynergies).totalMultiplier : 1.0;

  // Evolve skill using Mana Crystals
  const handleEvolveWithCrystals = (skill: ForgedSkill) => {
    if (skill.currentStage >= skill.maxStages) return;
    const cost = getSkillEvolutionCrystalCost(skill);
    const currentCrystals = stats.manaCrystals || 0;

    if (currentCrystals < cost) {
      alert(
        `INSUFFICIENT MANA CRYSTALS!\n\nEvolution to Stage ${skill.currentStage + 1} requires ${cost} Mana Crystals, but Aryan only holds ${currentCrystals} Crystals.\n\nDefeat monsters in the Encounter Arena and harvest their corpses to obtain more Mana Crystals.`
      );
      return;
    }

    SoundFX.playCrystalPulse();
    setTimeout(() => SoundFX.playSkillForged(), 300);

    // Deduct crystals
    onUpdateStats({
      ...stats,
      manaCrystals: currentCrystals - cost,
    });

    const nextStageNum = skill.currentStage + 1;
    const stageObj = skill.stages.find((st) => st.stage === nextStageNum) || {
      stage: nextStageNum,
      name: `Enhanced Resonance Tier ${nextStageNum}`,
      effect: `Multiplies skill power by ${(1 + nextStageNum * 0.35).toFixed(1)}x; expands soul matrix resonance.`,
      description: `Deepened soul engraving at stage ${nextStageNum}.`,
      manaMultiplier: 1 + nextStageNum * 0.35,
    };

    const updatedSkills = skills.map((s) => {
      if (s.id === skill.id) {
        const existingStages = [...s.stages];
        if (!existingStages.some((st) => st.stage === nextStageNum)) {
          existingStages.push(stageObj);
          existingStages.sort((a, b) => a.stage - b.stage);
        }
        return {
          ...s,
          currentStage: nextStageNum,
          stages: existingStages,
        };
      }
      return s;
    });

    onUpdateSkills(updatedSkills);
    setForgeSuccessMsg(
      `[FORGER EVOLUTION] — Infused ${cost} Mana Crystals into "${skill.name}"! Successfully evolved to Stage ${nextStageNum}: ${stageObj.name}!`
    );
    setTimeout(() => setForgeSuccessMsg(null), 6000);
  };

  // Evolve skill using Two Related Skills (Dual Synthesis)
  const handleEvolveWithRelatedSkills = (targetSkill: ForgedSkill) => {
    if (selectedDonorSkillIds.length !== 2) {
      alert('Please select exactly TWO related skills to synthesize and force the breakthrough evolution.');
      return;
    }

    if (targetSkill.currentStage >= targetSkill.maxStages) return;

    const donorA = skills.find((s) => s.id === selectedDonorSkillIds[0]);
    const donorB = skills.find((s) => s.id === selectedDonorSkillIds[1]);

    if (!donorA || !donorB) return;

    SoundFX.playSkillForged();

    const nextStageNum = targetSkill.currentStage + 1;
    const shortA = donorA.name.split(' ')[0];
    const shortB = donorB.name.split(' ')[0];
    const stageObj = targetSkill.stages.find((st) => st.stage === nextStageNum) || {
      stage: nextStageNum,
      name: `Dual-Resonance: ${shortA} & ${shortB} Fusion`,
      effect: `Harmonizes dual matrices; boosts skill multiplier by ${(1 + nextStageNum * 0.4).toFixed(1)}x`,
      description: `Synthesized through the harmonic resonance of ${donorA.name} and ${donorB.name}.`,
      manaMultiplier: 1 + nextStageNum * 0.4,
    };

    const updatedSkills = skills.map((s) => {
      if (s.id === targetSkill.id) {
        const existingStages = [...s.stages];
        if (!existingStages.some((st) => st.stage === nextStageNum)) {
          existingStages.push(stageObj);
          existingStages.sort((a, b) => a.stage - b.stage);
        }
        const existingTags = s.synergyTags || [];
        const newTags = Array.from(
          new Set([...existingTags, ...(donorA.synergyTags || []), ...(donorB.synergyTags || [])])
        );
        return {
          ...s,
          currentStage: nextStageNum,
          stages: existingStages,
          synergyTags: newTags,
        };
      }
      return s;
    });

    onUpdateSkills(updatedSkills);
    setSelectedDonorSkillIds([]);
    setForgeSuccessMsg(
      `[MATRIX SYNTHESIS BREAKTHROUGH] — Harmonized "${donorA.name}" and "${donorB.name}" into "${targetSkill.name}"! Forced stage breakthrough to Stage ${nextStageNum} (${stageObj.name}) without consuming Mana Crystals!`
    );
    setTimeout(() => setForgeSuccessMsg(null), 6000);
  };

  const handleToggleDonorSkill = (skillId: string) => {
    SoundFX.playSystemNotification();
    if (selectedDonorSkillIds.includes(skillId)) {
      setSelectedDonorSkillIds(selectedDonorSkillIds.filter((id) => id !== skillId));
    } else {
      if (selectedDonorSkillIds.length >= 2) {
        setSelectedDonorSkillIds([selectedDonorSkillIds[0], skillId]);
      } else {
        setSelectedDonorSkillIds([...selectedDonorSkillIds, skillId]);
      }
    }
  };

  // Dissolve/Unbind a forged skill matrix to reclaim permanent mana into the wellspring
  const handleDissolveSkill = (skill: ForgedSkill) => {
    if (!skill.isForged || skill.id === 'forger-core') return;

    SoundFX.playSkillForged();
    const updated = skills.map((s) =>
      s.id === skill.id ? { ...s, isForged: false, currentStage: 1 } : s
    );
    onUpdateSkills(updated);

    setForgeSuccessMsg(
      `[SOUL DECONSTRUCTION] — Dissolved "${skill.name}". Reclaimed ${skill.permanentManaCost} Permanent Mana capacity back to your Innate Wellspring!`
    );
    setTimeout(() => setForgeSuccessMsg(null), 5000);
  };

  // Forge an existing known skill (e.g. Glacial Spike, Night Vision, etc.)
  const handleForgeSkill = (skill: ForgedSkill) => {
    if (skill.isForged) return;

    const availableCapacity = stats.usablePermanentManaCap ?? (stats.maxPermanentMana - (stats.boundPermanentMana || 0));
    if (availableCapacity < skill.permanentManaCost) {
      alert(
        `INSUFFICIENT PERMANENT MANA CAPACITY!\n\nThis skill requires ${skill.permanentManaCost} MP, but your soul only has ${availableCapacity} MP unreserved capacity remaining.\n\nDissolve an existing skill or level up to expand your soul capacity.`
      );
      return;
    }

    if (skill.isCorrupted) {
      SoundFX.playDemonicAnomaly();
      const confirmForge = window.confirm(
        'WARNING: This skill has a CORRUPTED FOREIGN MANA SIGNATURE. Forging without purification will permanently bind 18 MP and may damage your Mana Core Integrity by 20%. Proceed anyway?'
      );
      if (!confirmForge) return;

      const newIntegrity = Math.max(10, stats.manaCoreIntegrity - 20);
      onUpdateStats({
        ...stats,
        manaCoreIntegrity: newIntegrity,
        statusEffects: [...stats.statusEffects, 'Demonic Mana Infiltration (Warning)'],
      });
    } else {
      SoundFX.playSkillForged();
    }

    const updated = skills.map((s) => (s.id === skill.id ? { ...s, isForged: true } : s));
    onUpdateSkills(updated);

    setForgeSuccessMsg(
      `[UNIQUE SKILL: FORGER] — "${skill.name}" successfully engraved! Bound ${skill.permanentManaCost} Permanent MP into your soul matrix.`
    );
    setTimeout(() => setForgeSuccessMsg(null), 5000);
  };

  // Run AI Skill Deconstruction via Gemini with Anti-One-Shot Gatekeeper & Daily Limit Check
  const handleAnalyzeWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkillName.trim()) return;

    // Check Daily Quota (3 skills/day limit)
    const quota = getDailySkillQuota();
    if (quota.remainingToday <= 0) {
      setAnalysisError(
        `[DAILY SOUL LIMIT REACHED] — You have forged ${quota.usedToday}/${quota.maxPerDay} skills today. The Aetherian Cosmic Matrix allows a maximum of 3 custom skill manifestations per solar day to prevent soul collapse. Quota resets at midnight UTC.`
      );
      SoundFX.playDemonicAnomaly();
      return;
    }

    // Client-side Safety Check against One-Shot / Instant-Kill skills
    const safetyCheck = validateSkillSafety(customSkillName, customSkillDesc);
    if (!safetyCheck.isPermitted) {
      setAnalysisError(
        `⛔ [PROHIBITED FATALITY MECHANIC] — ${safetyCheck.violationReason}. Skills that instantly kill or one-shot opponents are strictly prohibited by the Laws of Aetheria.`
      );
      SoundFX.playDemonicAnomaly();
      return;
    }

    try {
      setIsAnalyzingAI(true);
      setAnalyzedSkillResult(null);
      setAnalysisError(null);

      const res = await fetch('/api/gemini/forge-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: customSkillName,
          description: customSkillDesc,
          userMana: stats.permanentMana,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'AI analysis request failed');
      }

      const data = await res.json();
      if (data.prohibited) {
        setAnalysisError(`⛔ [FATALITY VIOLATION] — ${data.violationReason || 'One-shot skills prohibited'}`);
        SoundFX.playDemonicAnomaly();
        return;
      }
      setAnalyzedSkillResult(data);
      SoundFX.playSystemNotification();
    } catch (err: any) {
      console.warn('Forge analysis warning:', err);
      setAnalysisError(err.message || 'System analysis encountered interference. Please try again.');
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Forge the custom AI skill
  const handleForgeAICustomSkill = () => {
    if (!analyzedSkillResult) return;

    // Check Daily Quota again
    const quota = getDailySkillQuota();
    if (quota.remainingToday <= 0) {
      setForgeSuccessMsg(`[LIMIT EXCEEDED] — Daily forging quota (3/3) exhausted today.`);
      setTimeout(() => setForgeSuccessMsg(null), 4000);
      return;
    }

    const cost = analyzedSkillResult.manaCostPermanent || 10;
    const availableCapacity = stats.usablePermanentManaCap ?? (stats.maxPermanentMana - (stats.boundPermanentMana || 0));

    if (availableCapacity < cost) {
      setForgeSuccessMsg(`[SYSTEM ERROR] — Insufficient Permanent Mana Capacity! Need ${cost} MP unreserved (Have ${availableCapacity} MP).`);
      setTimeout(() => setForgeSuccessMsg(null), 4000);
      return;
    }

    const newSkill: ForgedSkill = {
      id: `custom-${Date.now()}`,
      name: analyzedSkillResult.skillName || customSkillName,
      publicRank: analyzedSkillResult.publicRank || 'F',
      trueRank: analyzedSkillResult.trueRank || 'Unknown',
      category: analyzedSkillResult.corruptionDetected ? 'Corrupted' : 'Unique',
      permanentManaCost: cost,
      activeManaCost: analyzedSkillResult.activeManaCost || 5,
      description: analyzedSkillResult.description || customSkillDesc || 'Forged through the Scholar\'s Comprehension.',
      magicalStructure: analyzedSkillResult.magicalStructure || 'Custom Elemental Matrix',
      manaFlow: analyzedSkillResult.manaFlow || 'Direct Soul Channeling',
      ignitionPhase: analyzedSkillResult.ignitionPhase,
      compressionRatio: analyzedSkillResult.compressionRatio,
      currentStage: 1,
      maxStages: 15,
      isForged: true,
      isCorrupted: analyzedSkillResult.corruptionDetected || false,
      stages: (analyzedSkillResult.stages || []).map((st: any) => ({
        stage: st.stage,
        name: st.name,
        description: st.effect,
        manaMultiplier: st.stage * 0.5 + 1,
        effect: st.effect,
      })),
    };

    // Deduct from daily quota
    recordSkillCreation(newSkill.name);

    SoundFX.playSkillForged();
    onUpdateSkills([...skills, newSkill]);
    setSelectedSkillId(newSkill.id);
    setAnalyzedSkillResult(null);
    setCustomSkillName('');
    setCustomSkillDesc('');

    const updatedQuota = getDailySkillQuota();
    setForgeSuccessMsg(`[FORGER SYSTEM] — Successfully synthesized "${newSkill.name}"! (${updatedQuota.remainingToday}/${updatedQuota.maxPerDay} daily forges remaining)`);
    setTimeout(() => setForgeSuccessMsg(null), 5000);
  };

  // Read AI analysis with TTS
  const handleSpeakAnalysis = async () => {
    if (!analyzedSkillResult) return;
    try {
      setIsSpeakingResult(true);
      const textToSpeak = `System analysis complete for skill ${analyzedSkillResult.skillName}. Public classification: Rank ${analyzedSkillResult.publicRank}. True Rank: ${analyzedSkillResult.trueRank}. Permanent Mana requirement: ${analyzedSkillResult.manaCostPermanent} points. ${analyzedSkillResult.systemLog || ''}`;
      await narrateText(
        textToSpeak,
        voice,
        () => setIsSpeakingResult(false),
        () => setIsSpeakingResult(false)
      );
    } catch (e) {
      setIsSpeakingResult(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header: System HUD */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1a1a1a] pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded bg-[#0d0d0d] border border-[#222] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-lg font-light tracking-[0.2em] font-cinzel text-white uppercase">
                  FORGER SYSTEM CONSOLE
                </h1>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white text-black font-bold uppercase tracking-wider">
                  TRUE RANK: UNKNOWN
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono tracking-wider mt-0.5">
                HOST: ARYAN | LEVEL {stats.level} | SOUL CREATION ENGINE
              </p>
            </div>
          </div>

          {/* Strategic Mana Capacity & Innate Wellspring HUD */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="text-right">
              <div className="flex items-center justify-end space-x-1.5 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
                <span>SOUL MANA EQUILIBRIUM</span>
              </div>
              
              <div className="flex items-baseline justify-end space-x-2 mt-0.5 font-mono">
                <span className="text-2xl font-bold text-white">
                  {stats.permanentMana}
                </span>
                <span className="text-xs text-slate-400">
                  / {stats.usablePermanentManaCap ?? (stats.maxPermanentMana - (stats.boundPermanentMana || 0))} MP usable cap
                </span>
                <span className="text-[11px] text-purple-400/90 font-medium">
                  ({stats.boundPermanentMana || 0} MP Bound)
                </span>
              </div>

              {/* Multi-segment Soul Mana Bar */}
              <div className="w-64 h-2 bg-[#151515] rounded-full overflow-hidden border border-[#222] mt-1.5 flex">
                {/* Active usable mana */}
                <div
                  className="bg-cyan-400 h-full transition-all duration-300 shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                  style={{ width: `${Math.min(100, (stats.permanentMana / stats.maxPermanentMana) * 100)}%` }}
                />
                {/* Unfilled Wellspring Room */}
                <div
                  className="bg-cyan-950/60 h-full transition-all duration-300"
                  style={{
                    width: `${Math.max(
                      0,
                      (((stats.usablePermanentManaCap ?? (stats.maxPermanentMana - (stats.boundPermanentMana || 0))) - stats.permanentMana) /
                        stats.maxPermanentMana) *
                        100
                    )}%`,
                  }}
                />
                {/* Bound Permanent Mana */}
                <div
                  className="bg-purple-600 h-full transition-all duration-300 shadow-[0_0_6px_rgba(168,85,247,0.4)]"
                  style={{ width: `${Math.min(100, ((stats.boundPermanentMana || 0) / stats.maxPermanentMana) * 100)}%` }}
                  title={`${stats.boundPermanentMana || 0} MP permanently allocated to sustain forged skill matrices`}
                />
              </div>

              {/* Autonomic Replenishment & Strategic Stance status */}
              <div className="mt-2 flex items-center justify-end space-x-2">
                <span className={`inline-flex items-center space-x-1 text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                  stats.strategicStance === 'Pure Wellspring'
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-700/80'
                    : stats.strategicStance === 'Balanced Arsenal'
                    ? 'bg-blue-950/80 text-blue-300 border-blue-700/80'
                    : stats.strategicStance === 'Overcharged Sovereign'
                    ? 'bg-amber-950/80 text-amber-300 border-amber-700/80'
                    : 'bg-rose-950/80 text-rose-300 border-rose-700/80'
                }`}>
                  <span>Stance: {stats.strategicStance || 'Pure Wellspring'}</span>
                </span>

                {stats.permanentMana < (stats.usablePermanentManaCap ?? stats.maxPermanentMana) ? (
                  <span className="inline-flex items-center space-x-1 text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/80 animate-pulse">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>Innate Wellspring Siphoning</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[9px] font-mono px-2 py-0.5 rounded bg-[#111] text-slate-400 border border-[#222]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
                    <span>Cap Reached</span>
                  </span>
                )}
              </div>
            </div>

            {/* Mana Crystals Stockpile */}
            <div className="text-right border-l border-[#1a1a1a] pl-6">
              <div className="flex items-center justify-end space-x-1 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400 font-bold">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>MANA CRYSTALS</span>
              </div>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-0.5 flex items-baseline justify-end space-x-1">
                <span>{stats.manaCrystals || 0}</span>
                <span className="text-xs text-amber-500/80 font-normal">💎</span>
              </div>
              <div className="text-[9px] font-mono text-amber-400/80 mt-1">Harvested from Arena</div>
            </div>

            <div className="text-right border-l border-[#1a1a1a] pl-6">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">CORE INTEGRITY</div>
              <div className="text-2xl font-bold font-mono text-white mt-0.5">
                {stats.manaCoreIntegrity}%
              </div>
              <div className="text-[10px] font-mono text-emerald-400 mt-1">SOUL STABLE</div>
            </div>
          </div>
        </div>

        {/* Permanent Mana Strategic Choice & Innate Passive Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
          <div className="flex items-start space-x-2.5 bg-[#0d0d0d] p-3.5 rounded border border-[#222] text-slate-300">
            <Info className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <p>
                <span className="text-white font-bold tracking-wide">Strategic Forging Choice:</span> Forging skills permanently binds soul mana into active matrices, lowering your Innate Wellspring's maximum replenishment ceiling.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Preserving unreserved Mana accelerates autonomic recovery and grants deeper spellcasting reserves.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#071318] p-3.5 rounded border border-cyan-900/60 text-cyan-200">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="font-bold text-[11px] uppercase tracking-wider text-white">
                  Innate Skill: Primordial Wellspring
                </div>
                <div className="text-[10px] text-cyan-300/90">
                  Autonomously restores mana up to <span className="font-bold text-white">{stats.usablePermanentManaCap ?? (stats.maxPermanentMana - (stats.boundPermanentMana || 0))} MP</span> (Current: {stats.permanentMana} MP).
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (stats.permanentMana > 15) {
                  SoundFX.playFireballIgnition();
                  onUpdateStats({
                    ...stats,
                    permanentMana: Math.max(0, stats.permanentMana - 15),
                  });
                }
              }}
              title="Test Mana Replenishment: Expends 15 MP to watch Aryan's innate skill automatically restore it over time."
              className="px-2.5 py-1.5 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700/60 text-[10px] uppercase font-bold tracking-wider transition shrink-0 ml-2"
            >
              Test Drain (-15 MP)
            </button>
          </div>
        </div>

        {/* Active Synergy Resonance Multipliers Banner */}
        <div className="mt-4 p-4 rounded-lg bg-[#070b12] border border-cyan-900/50 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-950 pb-2.5">
            <div className="flex items-center space-x-2">
              <Link className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-200">
                Active Skill Synergy Multiplier Matrix
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {activeSynergies.length} Active Multipliers
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="text-slate-400">
                Resonance Boost: <span className="text-emerald-400 font-bold">+{Math.round((totalPowerMultiplier - 1) * 100)}% Power</span>
              </span>
              <span className="text-slate-400">
                Combat Rating: <span className="text-amber-400 font-bold">{combatPower} CP</span>
              </span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Equipping two or more related skills weaves a synergistic mana resonance across your soul matrix, granting massive passive combat multipliers to all interconnected abilities.
          </p>

          {/* Active / Pending Synergy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {activeSynergies.map((syn) => (
              <div
                key={syn.synergy.id}
                className="p-2.5 rounded bg-[#04111d] border border-cyan-500/40 text-xs font-mono space-y-1.5 shadow-[0_0_10px_rgba(6,182,212,0.1)]"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-300 truncate">{syn.synergy.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                    +{Math.round((syn.multiplier - 1) * 100)}% Boost
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 font-sans line-clamp-1">{syn.synergy.description}</div>
                <div className="flex flex-wrap gap-1 pt-1 border-t border-cyan-950/80">
                  {syn.matchingSkills.map((sk) => (
                    <span
                      key={sk.id}
                      className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-200 border border-cyan-800/60"
                    >
                      {sk.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {activeSynergies.length === 0 && (
              <div className="col-span-full p-3 rounded bg-[#0a0a0a] border border-[#222] text-xs font-mono text-slate-400 flex items-center justify-between">
                <span>⚡ No multi-skill synergies active yet. Forge related skills (e.g. Fireball + Glacial Spike or Mana Shield + Titan Aegis) to unlock multiplier resonance!</span>
              </div>
            )}
          </div>
        </div>

        {/* Success Alert */}
        {forgeSuccessMsg && (
          <div className="mt-4 p-3 rounded bg-white/10 border border-white/30 text-white font-mono text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{forgeSuccessMsg}</span>
          </div>
        )}

        {/* Forge Console View Tabs */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#1a1a1a]">
          <div className="flex items-center space-x-1.5 bg-[#050505] p-1 rounded-md border border-[#1a1a1a]">
            <button
              onClick={() => {
                SoundFX.playSystemNotification();
                setForgeTab('split');
              }}
              className={`px-3 py-1.5 rounded font-mono text-xs uppercase tracking-wider flex items-center space-x-1.5 transition ${
                forgeTab === 'split'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Integrated Console</span>
            </button>

            <button
              onClick={() => {
                SoundFX.playSystemNotification();
                setForgeTab('tree');
              }}
              className={`px-3 py-1.5 rounded font-mono text-xs uppercase tracking-wider flex items-center space-x-1.5 transition ${
                forgeTab === 'tree'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Soul Evolution Tree (D3)</span>
            </button>

            <button
              onClick={() => {
                SoundFX.playSystemNotification();
                setForgeTab('catalog');
              }}
              className={`px-3 py-1.5 rounded font-mono text-xs uppercase tracking-wider flex items-center space-x-1.5 transition ${
                forgeTab === 'catalog'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Blueprints & Deconstruction</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
            ACTIVE MATRIX: <span className="text-slate-300 font-bold">{selectedSkill.name}</span>
          </div>
        </div>
      </div>

      {/* D3 Evolution Tree View (if in tree or split view) */}
      {(forgeTab === 'tree' || forgeTab === 'split') && (
        <div className="space-y-2">
          {forgeTab === 'split' && (
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-400 font-bold flex items-center space-x-2">
                <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
                <span>Aryan's Skill Evolution Matrix</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-500">
                Drag nodes to reposition • Click to inspect & evolve
              </span>
            </div>
          )}

          <SkillEvolutionGraph
            skills={skills}
            selectedSkillId={selectedSkillId}
            onSelectSkill={(id) => setSelectedSkillId(id)}
            onEvolveSkill={(id) => {
              const target = skills.find((s) => s.id === id);
              if (target) handleEvolveWithCrystals(target);
            }}
            onForgeSkill={(skill) => handleForgeSkill(skill)}
            permanentMana={stats.permanentMana}
          />
        </div>
      )}

      {/* Main Grid: Skills Catalog & Detail View (if in catalog or split view) */}
      {(forgeTab === 'catalog' || forgeTab === 'split') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Available Skills List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-500 font-semibold flex items-center space-x-2">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Memories & Blueprints ({skills.length})</span>
            </h2>
          </div>

          <div className="space-y-2">
            {skills.map((skill) => {
              const isSelected = skill.id === selectedSkillId;
              const { totalMultiplier: skillMult } = getSkillSynergyMultiplier(skill, allSynergies);
              const hasSynergyBoost = skill.isForged && skillMult > 1.0;

              return (
                <button
                  key={skill.id}
                  onClick={() => {
                    SoundFX.playSystemNotification();
                    setSelectedSkillId(skill.id);
                  }}
                  className={`w-full text-left p-3.5 rounded border transition flex flex-col space-y-1.5 ${
                    isSelected
                      ? skill.isCorrupted
                        ? 'corrupted-window border-rose-500/60'
                        : 'bg-[#0d0d0d] border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                      : 'bg-[#0a0a0a] border-[#1a1a1a] text-slate-400 hover:border-[#333] hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {skill.isCorrupted ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      ) : skill.name.includes('Fireball') ? (
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      <span className="font-mono text-xs font-bold truncate max-w-[130px] text-white">
                        {skill.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {hasSynergyBoost && (
                        <span className="font-mono text-[9px] px-1 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold flex items-center space-x-0.5">
                          <span>+{Math.round((skillMult - 1) * 100)}%</span>
                        </span>
                      )}
                      <span
                        className={`font-mono text-[9px] px-1.5 py-0.5 rounded ${
                          skill.isForged
                            ? 'bg-white text-black font-bold'
                            : 'bg-[#151515] text-slate-500 border border-[#222]'
                        }`}
                      >
                        {skill.isForged ? `Stage ${skill.currentStage}` : 'Unforged'}
                      </span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#111] text-slate-300 border border-[#222]">
                        {skill.publicRank}-Rank
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-1 font-sans">
                    {skill.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1.5 border-t border-[#1a1a1a]">
                    <span>Cost: {skill.permanentManaCost} Perm MP</span>
                    <span className="text-slate-400 font-semibold">True: {skill.trueRank}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* AI Custom Forge Box Trigger */}
          <div className="p-4 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-white font-mono text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Deconstruct Concept with AI</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                {getDailySkillQuota().remainingToday}/3 Daily Forges
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Input any spell concept. Gemini AI decomposes its matrix structure, mana flow, and 15-stage evolution path.
            </p>

            <div className="p-2 rounded bg-[#0f0709] border border-rose-950 text-[10px] font-mono text-rose-400/90 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>Anti-One-Shot Law Active: Instant death & 100% kill mechanics are forbidden.</span>
            </div>

            <form onSubmit={handleAnalyzeWithAI} className="space-y-2.5">
              <input
                type="text"
                value={customSkillName}
                onChange={(e) => setCustomSkillName(e.target.value)}
                placeholder="e.g. Shadow Step, Dimensional Slash..."
                className="w-full px-3 py-2 rounded bg-[#050505] border border-[#222] text-xs text-white placeholder-slate-600 focus:border-white/40 focus:outline-none font-mono"
              />
              <textarea
                value={customSkillDesc}
                onChange={(e) => setCustomSkillDesc(e.target.value)}
                placeholder="Brief description or intended mechanics..."
                rows={2}
                className="w-full px-3 py-1.5 rounded bg-[#050505] border border-[#222] text-xs text-white placeholder-slate-600 focus:border-white/40 focus:outline-none font-sans"
              />
              <button
                type="submit"
                disabled={isAnalyzingAI || !customSkillName.trim()}
                className="w-full py-2.5 rounded bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition disabled:opacity-40 flex items-center justify-center space-x-2"
              >
                {isAnalyzingAI ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Soul Blueprint...</span>
                  </>
                ) : (
                  <>
                    <Hammer className="w-3.5 h-3.5" />
                    <span>Run Forger Deconstruction</span>
                  </>
                )}
              </button>

              {analysisError && (
                <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800/60 text-rose-300 font-mono text-[11px] flex items-start space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <p>{analysisError}</p>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Column: Skill Detail & Evolution Inspector */}
        <div className="lg:col-span-8 space-y-6">
          {/* AI Analysis Modal Card if available */}
          {analyzedSkillResult && (
            <div className="p-5 rounded-lg bg-[#0a0a0a] border border-white/30 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#222] pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-white animate-spin" />
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                    GEMINI ANALYSIS: [{analyzedSkillResult.skillName}]
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSpeakAnalysis}
                    className="px-2.5 py-1 rounded bg-[#0d0d0d] text-slate-300 hover:text-white border border-[#222] text-[10px] flex items-center space-x-1.5 font-mono uppercase tracking-wider"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{isSpeakingResult ? 'Speaking...' : 'Voice'}</span>
                  </button>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white text-black font-bold uppercase">
                    Cost: {analyzedSkillResult.manaCostPermanent} Perm MP
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-[#0d0d0d] p-3 rounded border border-[#222]">
                  <div className="text-slate-500 uppercase text-[10px] tracking-wider">Magical Structure:</div>
                  <div className="text-white mt-1 font-semibold">{analyzedSkillResult.magicalStructure}</div>
                </div>
                <div className="bg-[#0d0d0d] p-3 rounded border border-[#222]">
                  <div className="text-slate-500 uppercase text-[10px] tracking-wider">Mana Flow Dynamics:</div>
                  <div className="text-white mt-1 font-semibold">{analyzedSkillResult.manaFlow}</div>
                </div>
              </div>

              {/* Evolution Roadmap Preview */}
              {analyzedSkillResult.stages && (
                <div className="space-y-2 font-mono text-xs">
                  <div className="text-slate-500 uppercase text-[10px] tracking-wider">Projected Evolution Stages:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analyzedSkillResult.stages.map((st: any) => (
                      <div key={st.stage} className="bg-[#0d0d0d] p-2.5 rounded border border-[#222]">
                        <div className="text-white font-bold">Stage {st.stage}: {st.name}</div>
                        <div className="text-slate-400 text-[11px] font-sans mt-0.5">{st.effect}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Forge Confirmation Button */}
              <div className="pt-3 border-t border-[#1a1a1a] flex items-center justify-between">
                <button
                  onClick={() => setAnalyzedSkillResult(null)}
                  className="text-xs font-mono text-slate-500 hover:text-slate-300 uppercase tracking-wider"
                >
                  Discard Analysis
                </button>

                <button
                  onClick={handleForgeAICustomSkill}
                  className="px-5 py-2 rounded bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-slate-200 flex items-center space-x-2 transition"
                >
                  <Hammer className="w-4 h-4" />
                  <span>Forge & Bind ({analyzedSkillResult.manaCostPermanent} MP)</span>
                </button>
              </div>
            </div>
          )}

          {/* Selected Skill Deep Dive Card */}
          {selectedSkill && (
            <div
              className={`p-6 rounded-lg transition-all ${
                selectedSkill.isCorrupted ? 'corrupted-window' : 'bg-[#0a0a0a] border border-[#1a1a1a]'
              }`}
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1a1a1a] pb-4 mb-4">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-bold font-mono text-white tracking-wide">
                      {selectedSkill.name}
                    </h3>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0d0d0d] text-slate-300 border border-[#222] uppercase">
                      Public: {selectedSkill.publicRank}-Rank
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-wider">
                    TRUE CLASSIFICATION: <span className="text-white font-bold">{selectedSkill.trueRank}</span> | Category: {selectedSkill.category}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedSkill.isForged ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (selectedSkill.name.includes('Fireball')) {
                            SoundFX.playFireballIgnition();
                          } else {
                            SoundFX.playSkillForged();
                          }
                        }}
                        className="px-3 py-1.5 rounded bg-[#0d0d0d] text-slate-200 border border-[#222] text-xs font-mono flex items-center space-x-1.5 hover:border-slate-500 transition"
                      >
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span className="uppercase text-[10px] tracking-wider">Channel Spell</span>
                      </button>

                      {selectedSkill.id !== 'forger-core' && (
                        <button
                          onClick={() => handleDissolveSkill(selectedSkill)}
                          title={`Dissolve matrix to unbind ${selectedSkill.permanentManaCost} MP and return capacity to your Innate Wellspring`}
                          className="px-3 py-1.5 rounded bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/60 text-xs font-mono flex items-center space-x-1.5 transition"
                        >
                          <RefreshCw className="w-3 h-3 text-purple-400" />
                          <span className="uppercase text-[10px] tracking-wider font-semibold">
                            Dissolve Matrix (+{selectedSkill.permanentManaCost} MP Cap)
                          </span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleForgeSkill(selectedSkill)}
                        className="px-5 py-2 rounded bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-slate-200 shadow-lg flex items-center space-x-2 transition"
                      >
                        <Hammer className="w-4 h-4" />
                        <span>Forge & Bind ({selectedSkill.permanentManaCost} Perm MP)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Strategic Choice Notice & Synergy Multiplier Boost */}
              <div className="mb-4 space-y-2">
                <div className="px-3.5 py-2 rounded bg-[#0d0d0d] border border-[#222] text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-400">
                    {selectedSkill.isForged ? (
                      <span className="text-purple-300 font-medium">
                        ★ Active Soul Matrix: Permanently reserving {selectedSkill.permanentManaCost} MP of Aryan's total mana wellspring.
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        ★ Unforged Blueprint: Forging will reserve {selectedSkill.permanentManaCost} MP from Aryan's regenerating wellspring cap.
                      </span>
                    )}
                  </span>

                  <span className="text-[10px] uppercase font-bold text-slate-500">
                    Active Spell Cost: {selectedSkill.activeManaCost} MP
                  </span>
                </div>

                {/* Skill Synergy Multiplier Status */}
                <div className="px-3.5 py-2.5 rounded bg-[#07131b] border border-cyan-900/60 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-slate-300">
                      Synergy Resonance Multiplier:
                    </span>
                    <span className={`font-bold ${selectedSkillMultiplier > 1 ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {selectedSkillMultiplier.toFixed(2)}x ({selectedSkillMultiplier > 1 ? `+${Math.round((selectedSkillMultiplier - 1) * 100)}% Boost` : '1.0x Base'})
                    </span>
                  </div>

                  <div className="flex items-center space-x-1">
                    {selectedSkill.synergyTags?.map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Related Skills & Multiplier Pairing Suggestions */}
              {selectedSkill.relatedSkillIds && selectedSkill.relatedSkillIds.length > 0 && (
                <div className="mb-4 p-3.5 rounded bg-[#090909] border border-[#1f1f1f] space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    <div className="flex items-center space-x-1.5">
                      <Link className="w-3.5 h-3.5 text-amber-400" />
                      <span>Related Skills & Synergy Pairs (Equip 2+ for Bonus Multiplier)</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal">
                      Click skill to inspect
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedSkill.relatedSkillIds.map((relId) => {
                      const relSkill = skills.find((s) => s.id === relId);
                      if (!relSkill) return null;

                      const isPairForged = relSkill.isForged;
                      return (
                        <button
                          key={relSkill.id}
                          onClick={() => {
                            SoundFX.playSystemNotification();
                            setSelectedSkillId(relSkill.id);
                          }}
                          className={`p-2 rounded border text-left flex items-center justify-between transition ${
                            isPairForged
                              ? 'bg-cyan-950/30 border-cyan-700/60 text-cyan-200 hover:border-cyan-500'
                              : 'bg-[#0f0f0f] border-[#222] text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          <div className="truncate pr-2 font-mono text-xs">
                            <div className="font-semibold text-white truncate">{relSkill.name}</div>
                            <div className="text-[9px] text-slate-400">{relSkill.publicRank}-Rank</div>
                          </div>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase shrink-0 ${
                              isPairForged
                                ? 'bg-cyan-900 text-cyan-200 font-bold'
                                : 'bg-[#1a1a1a] text-slate-500 border border-[#2a2a2a]'
                            }`}
                          >
                            {isPairForged ? 'Equipped' : 'Not Forged'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Description */}
              <p className="text-slate-300 text-sm font-sans leading-relaxed mb-6">
                {selectedSkill.description}
              </p>

              {/* Corrupted Demonic Anomaly Warning if corrupted */}
              {selectedSkill.isCorrupted && selectedSkill.corruptedDetails && (
                <div className="mb-6 p-4 rounded bg-[#0f0406] border border-rose-600/40 text-rose-200 font-mono text-xs space-y-2">
                  <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4" />
                    <span>ANCIENT DEMONIC CORRUPTION DETECTED</span>
                  </div>
                  <div><span className="text-slate-500 uppercase">Signature:</span> {selectedSkill.corruptedDetails.signature}</div>
                  <div><span className="text-slate-500 uppercase">Origin:</span> {selectedSkill.corruptedDetails.origin}</div>
                  <div className="text-rose-300 font-sans italic">{selectedSkill.corruptedDetails.warning}</div>
                  <div className="p-2.5 rounded bg-[#160508] border border-rose-800/60 text-[11px] text-amber-200">
                    <span className="font-bold uppercase tracking-wider">Unlocked Lore:</span> {selectedSkill.corruptedDetails.unlockedSecret}
                  </div>
                </div>
              )}

              {/* Technical Deconstruction Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="bg-[#0d0d0d] p-3.5 rounded border border-[#222] font-mono text-xs">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">Magical Matrix Structure:</span>
                  <div className="text-white mt-1 font-semibold">{selectedSkill.magicalStructure}</div>
                </div>
                <div className="bg-[#0d0d0d] p-3.5 rounded border border-[#222] font-mono text-xs">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">Mana Flow Dynamics:</span>
                  <div className="text-white mt-1 font-semibold">{selectedSkill.manaFlow}</div>
                </div>
                {selectedSkill.ignitionPhase && (
                  <div className="bg-[#0d0d0d] p-3.5 rounded border border-[#222] font-mono text-xs">
                    <span className="text-slate-500 uppercase text-[10px] tracking-wider">Ignition Conduit:</span>
                    <div className="text-amber-300 mt-1 font-semibold">{selectedSkill.ignitionPhase}</div>
                  </div>
                )}
                {selectedSkill.compressionRatio && (
                  <div className="bg-[#0d0d0d] p-3.5 rounded border border-[#222] font-mono text-xs">
                    <span className="text-slate-500 uppercase text-[10px] tracking-wider">Compression Density Lock:</span>
                    <div className="text-white mt-1 font-semibold">{selectedSkill.compressionRatio}</div>
                  </div>
                )}
              </div>

              {/* DEDICATED EVOLUTION BREAKTHROUGH CHAMBER */}
              {selectedSkill.isForged && (
                <div className="mb-6 p-5 rounded-lg bg-[#0b0c10] border border-cyan-800/50 shadow-[0_0_20px_rgba(34,211,238,0.06)] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                      <div>
                        <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                          Evolution Breakthrough Chamber
                        </h4>
                        <span className="text-[11px] font-mono text-cyan-300">
                          Target: <span className="text-white font-bold">{selectedSkill.name}</span> (Current: Stage {selectedSkill.currentStage} / {selectedSkill.maxStages})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 bg-black/60 px-3 py-1.5 rounded border border-amber-500/40">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-mono text-amber-300 font-bold">
                        {stats.manaCrystals || 0} 💎 Crystals Available
                      </span>
                    </div>
                  </div>

                  {/* Dual Evolution Pathway Switcher */}
                  <div className="flex rounded bg-black/60 p-1 border border-white/10">
                    <button
                      onClick={() => {
                        SoundFX.playSystemNotification();
                        setEvolutionTab('crystals');
                      }}
                      className={`flex-1 py-2 px-3 rounded font-mono text-xs font-bold transition flex items-center justify-center space-x-2 ${
                        evolutionTab === 'crystals'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pathway A: Mana Crystal Infusion</span>
                    </button>

                    <button
                      onClick={() => {
                        SoundFX.playSystemNotification();
                        setEvolutionTab('synthesis');
                      }}
                      className={`flex-1 py-2 px-3 rounded font-mono text-xs font-bold transition flex items-center justify-center space-x-2 ${
                        evolutionTab === 'synthesis'
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Link className="w-3.5 h-3.5 text-purple-400" />
                      <span>Pathway B: Dual-Skill Matrix Synthesis (2 Related Skills)</span>
                    </button>
                  </div>

                  {/* PATHWAY A: MANA CRYSTALS */}
                  {evolutionTab === 'crystals' && (
                    <div className="space-y-4 font-mono text-xs">
                      {selectedSkill.currentStage >= selectedSkill.maxStages ? (
                        <div className="p-4 rounded bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-center font-bold">
                          ✨ MAXIMUM SOVEREIGN STAGE ACHIEVED ({selectedSkill.maxStages}/{selectedSkill.maxStages})
                        </div>
                      ) : (
                        <>
                          {(() => {
                            const cost = getSkillEvolutionCrystalCost(selectedSkill);
                            const hasEnough = (stats.manaCrystals || 0) >= cost;
                            const nextStage = selectedSkill.stages.find((s) => s.stage === selectedSkill.currentStage + 1);

                            return (
                              <div className="space-y-3">
                                <div className="p-3.5 rounded bg-black/40 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                                  <div>
                                    <div className="text-slate-400 text-[11px]">Upcoming Stage {selectedSkill.currentStage + 1}:</div>
                                    <div className="text-white font-bold text-sm mt-0.5">
                                      {nextStage ? nextStage.name : `Enhanced Resonance Tier ${selectedSkill.currentStage + 1}`}
                                    </div>
                                    <div className="text-cyan-300 text-xs font-sans mt-1">
                                      Effect: {nextStage ? nextStage.effect : `Multiplies skill power by ${(1 + (selectedSkill.currentStage + 1) * 0.35).toFixed(1)}x`}
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-[10px] uppercase text-slate-400 block">Required Infusion:</span>
                                    <span className="text-base font-bold text-amber-300">
                                      {cost} 💎 Crystals
                                    </span>
                                    <span className={`block text-[10px] font-semibold mt-0.5 ${hasEnough ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {hasEnough ? '✓ Crystals Ready' : `✗ Need ${cost - (stats.manaCrystals || 0)} More`}
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleEvolveWithCrystals(selectedSkill)}
                                  disabled={!hasEnough}
                                  className={`w-full py-3 rounded font-mono text-xs uppercase font-bold tracking-wider transition flex items-center justify-center space-x-2 ${
                                    hasEnough
                                      ? 'bg-amber-400 text-black hover:bg-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)] cursor-pointer'
                                      : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                                  }`}
                                >
                                  <Sparkles className="w-4 h-4" />
                                  <span>
                                    Infuse {cost} Mana Crystals & Evolve to Stage {selectedSkill.currentStage + 1}
                                  </span>
                                </button>

                                {!hasEnough && (
                                  <p className="text-[11px] font-sans text-amber-400/90 text-center">
                                    Harvest additional Mana Crystals from defeated monster corpses in the <strong>Encounter Arena</strong>.
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </>
                      )}
                    </div>
                  )}

                  {/* PATHWAY B: DUAL-SKILL SYNTHESIS */}
                  {evolutionTab === 'synthesis' && (
                    <div className="space-y-4 font-mono text-xs">
                      {selectedSkill.currentStage >= selectedSkill.maxStages ? (
                        <div className="p-4 rounded bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-center font-bold">
                          ✨ MAXIMUM SOVEREIGN STAGE ACHIEVED ({selectedSkill.maxStages}/{selectedSkill.maxStages})
                        </div>
                      ) : (
                        <>
                          <div className="p-3 rounded bg-purple-950/30 border border-purple-800/50 text-purple-200 text-xs">
                            <p className="font-sans">
                              Select <strong>TWO related skills</strong> from your inventory below. Aryan will harness their harmonic matrix resonance to force a breakthrough evolution on <strong>{selectedSkill.name}</strong> to <strong>Stage {selectedSkill.currentStage + 1}</strong> without spending Mana Crystals!
                            </p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>Select 2 Donor / Related Skills:</span>
                              <span className="font-bold text-purple-300">
                                {selectedDonorSkillIds.length}/2 Selected
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-black/40 rounded border border-white/10">
                              {skills
                                .filter((s) => s.id !== selectedSkill.id)
                                .map((s) => {
                                  const isSelected = selectedDonorSkillIds.includes(s.id);
                                  const isRelated = s.synergyTags?.some((tag) => selectedSkill.synergyTags?.includes(tag));

                                  return (
                                    <div
                                      key={s.id}
                                      onClick={() => handleToggleDonorSkill(s.id)}
                                      className={`p-2 rounded border cursor-pointer transition flex items-center justify-between ${
                                        isSelected
                                          ? 'bg-purple-950/80 border-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.3)]'
                                          : isRelated
                                          ? 'bg-[#120d18] border-purple-900/50 text-slate-300 hover:border-purple-600/70'
                                          : 'bg-[#0a0a0a] border-[#222] text-slate-400 hover:border-slate-600'
                                      }`}
                                    >
                                      <div className="flex items-center space-x-2 truncate">
                                        <div
                                          className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                                            isSelected ? 'border-purple-400 bg-purple-600 text-white' : 'border-slate-600'
                                          }`}
                                        >
                                          {isSelected && <span className="text-[10px] leading-none">✓</span>}
                                        </div>
                                        <div className="truncate">
                                          <div className="font-bold text-xs truncate">{s.name}</div>
                                          <div className="text-[10px] text-slate-500 truncate">
                                            Stage {s.currentStage} • {s.tier}
                                          </div>
                                        </div>
                                      </div>

                                      {isRelated && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700 shrink-0 ml-1">
                                          Related
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>

                          <button
                            onClick={() => handleEvolveWithRelatedSkills(selectedSkill)}
                            disabled={selectedDonorSkillIds.length !== 2}
                            className={`w-full py-3 rounded font-mono text-xs uppercase font-bold tracking-wider transition flex items-center justify-center space-x-2 ${
                              selectedDonorSkillIds.length === 2
                                ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer'
                                : 'bg-slate-800/80 text-slate-500 border border-slate-700/50 cursor-not-allowed'
                            }`}
                          >
                            <Link className="w-4 h-4" />
                            <span>
                              {selectedDonorSkillIds.length === 2
                                ? `Synthesize 2 Related Skills -> Breakthrough to Stage ${selectedSkill.currentStage + 1}`
                                : `Select 2 Skills to Synthesize (${selectedDonorSkillIds.length}/2 Selected)`}
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 15-Stage Evolution Progression Tree */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400 font-bold flex items-center space-x-2">
                    <TrendingUp className="w-3.5 h-3.5 text-white" />
                    <span>Evolution Matrix (Max 15 Stages)</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-400">
                    Active: Stage {selectedSkill.currentStage} / {selectedSkill.maxStages}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedSkill.stages.map((stage) => {
                    const isUnlocked = stage.stage <= selectedSkill.currentStage && selectedSkill.isForged;
                    return (
                      <div
                        key={stage.stage}
                        className={`p-3.5 rounded border transition-all ${
                          isUnlocked
                            ? 'bg-[#0d0d0d] border-white/20 text-white shadow-[0_0_10px_rgba(255,255,255,0.03)]'
                            : 'bg-[#070707] border-[#1a1a1a] text-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-xs mb-1">
                          <span className={isUnlocked ? 'text-white font-bold' : 'text-slate-600'}>
                            Stage {stage.stage}: {stage.name}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase ${
                              isUnlocked
                                ? 'bg-white text-black font-bold'
                                : 'bg-[#121212] text-slate-600 border border-[#1a1a1a]'
                            }`}
                          >
                            {isUnlocked ? 'Unlocked' : `Lvl ${stage.stage}`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-sans mb-1.5">
                          {stage.description}
                        </p>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center space-x-1">
                          <span>› Effect:</span>
                          <span className={isUnlocked ? 'text-slate-300' : 'text-slate-700'}>
                            {stage.effect}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
