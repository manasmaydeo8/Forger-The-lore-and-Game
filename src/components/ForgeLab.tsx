import React, { useState } from 'react';
import { CharacterStats, ForgedSkill, TTSVoice } from '../types';
import { SoundFX } from '../utils/soundEffects';
import { fetchTTSAudio, playAudioUrl, stopAllAudio } from '../services/ttsService';
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
  const [customSkillName, setCustomSkillName] = useState('');
  const [customSkillDesc, setCustomSkillDesc] = useState('');
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [analyzedSkillResult, setAnalyzedSkillResult] = useState<any | null>(null);
  const [forgeSuccessMsg, setForgeSuccessMsg] = useState<string | null>(null);
  const [isSpeakingResult, setIsSpeakingResult] = useState(false);

  const selectedSkill = skills.find((s) => s.id === selectedSkillId) || skills[0];

  // Forge an existing known skill (e.g. Night Vision or Basic Regeneration)
  const handleForgeSkill = (skill: ForgedSkill) => {
    if (skill.isForged) return;

    if (stats.permanentMana < skill.permanentManaCost) {
      alert('INSUFFICIENT PERMANENT MANA. Forging this skill would fracture your Mana Core!');
      return;
    }

    if (skill.isCorrupted) {
      SoundFX.playDemonicAnomaly();
      const confirmForge = window.confirm(
        'WARNING: This skill has a CORRUPTED FOREIGN MANA SIGNATURE. Forging without purification may damage your Mana Core Integrity by 20%. Proceed anyway?'
      );
      if (!confirmForge) return;

      const newIntegrity = Math.max(10, stats.manaCoreIntegrity - 20);
      onUpdateStats({
        ...stats,
        permanentMana: stats.permanentMana - skill.permanentManaCost,
        manaCoreIntegrity: newIntegrity,
        statusEffects: [...stats.statusEffects, 'Demonic Mana Infiltration (Warning)'],
      });
    } else {
      SoundFX.playSkillForged();
      onUpdateStats({
        ...stats,
        permanentMana: stats.permanentMana - skill.permanentManaCost,
      });
    }

    const updated = skills.map((s) => (s.id === skill.id ? { ...s, isForged: true } : s));
    onUpdateSkills(updated);

    setForgeSuccessMsg(`[UNIQUE SKILL: FORGER] — "${skill.name}" successfully bound to your soul!`);
    setTimeout(() => setForgeSuccessMsg(null), 5000);
  };

  // Evolve skill stage
  const handleEvolveSkill = (skillId: string) => {
    const target = skills.find((s) => s.id === skillId);
    if (!target) return;

    const nextStage = Math.min(target.maxStages, target.currentStage + 1);
    SoundFX.playSkillForged();

    const updated = skills.map((s) =>
      s.id === skillId ? { ...s, currentStage: nextStage } : s
    );
    onUpdateSkills(updated);
  };

  // Run AI Skill Deconstruction via Gemini
  const handleAnalyzeWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSkillName.trim()) return;

    try {
      setIsAnalyzingAI(true);
      setAnalyzedSkillResult(null);

      const res = await fetch('/api/gemini/forge-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: customSkillName,
          description: customSkillDesc,
          userMana: stats.permanentMana,
        }),
      });

      if (!res.ok) throw new Error('AI analysis failed');
      const data = await res.json();
      setAnalyzedSkillResult(data);
      SoundFX.playSystemNotification();
    } catch (err: any) {
      console.error(err);
      alert('Failed to analyze skill with Gemini: ' + err.message);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Forge the custom AI skill
  const handleForgeAICustomSkill = () => {
    if (!analyzedSkillResult) return;

    const cost = analyzedSkillResult.manaCostPermanent || 10;
    if (stats.permanentMana < cost) {
      alert('INSUFFICIENT PERMANENT MANA!');
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
      description: customSkillDesc || 'Forged through the Scholar\'s Comprehension.',
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

    SoundFX.playSkillForged();
    onUpdateStats({
      ...stats,
      permanentMana: stats.permanentMana - cost,
    });

    onUpdateSkills([...skills, newSkill]);
    setSelectedSkillId(newSkill.id);
    setAnalyzedSkillResult(null);
    setCustomSkillName('');
    setCustomSkillDesc('');

    setForgeSuccessMsg(`[FORGER SYSTEM] — Successfully synthesized "${newSkill.name}"!`);
    setTimeout(() => setForgeSuccessMsg(null), 5000);
  };

  // Read AI analysis with TTS
  const handleSpeakAnalysis = async () => {
    if (!analyzedSkillResult) return;
    try {
      setIsSpeakingResult(true);
      const textToSpeak = `System analysis complete for skill ${analyzedSkillResult.skillName}. Public classification: Rank ${analyzedSkillResult.publicRank}. True Rank: ${analyzedSkillResult.trueRank}. Permanent Mana requirement: ${analyzedSkillResult.manaCostPermanent} points. ${analyzedSkillResult.systemLog || ''}`;
      const url = await fetchTTSAudio(textToSpeak, voice);
      playAudioUrl(url, () => setIsSpeakingResult(false), () => setIsSpeakingResult(false));
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

          {/* Quick Mana Gauge */}
          <div className="flex items-center space-x-8">
            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">PERMANENT MANA POOL</div>
              <div className="text-2xl font-bold font-mono text-white flex items-center justify-end space-x-1.5 mt-0.5">
                <span>{stats.permanentMana}</span>
                <span className="text-xs text-slate-500 font-normal">/ {stats.maxPermanentMana} MP</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">CORE INTEGRITY</div>
              <div className="text-2xl font-bold font-mono text-white mt-0.5">
                {stats.manaCoreIntegrity}%
              </div>
            </div>
          </div>
        </div>

        {/* Permanent Mana Warning Notice */}
        <div className="flex items-start space-x-2.5 text-xs font-mono bg-[#0d0d0d] p-3 rounded border border-[#222] text-slate-400">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <span className="text-white font-bold tracking-wide">Law of Soul Forging:</span> Every skill forged binds directly to Aryan's soul core, consuming permanent Mana. If Mana drops to zero, the Mana Core collapses.
          </p>
        </div>

        {/* Success Alert */}
        {forgeSuccessMsg && (
          <div className="mt-4 p-3 rounded bg-white/10 border border-white/30 text-white font-mono text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{forgeSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Skills Catalog & Detail View */}
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
                      <span className="font-mono text-xs font-bold truncate max-w-[140px] text-white">
                        {skill.name}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
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
            <div className="flex items-center space-x-2 text-white font-mono text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Deconstruct Concept with AI</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Input any spell concept. Gemini AI decomposes its matrix structure, mana flow, and 15-stage evolution path.
            </p>
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

                <div className="flex items-center space-x-2">
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

                      {selectedSkill.currentStage < selectedSkill.maxStages && (
                        <button
                          onClick={() => handleEvolveSkill(selectedSkill.id)}
                          className="px-3 py-1.5 rounded bg-white text-black text-xs font-mono font-bold flex items-center space-x-1.5 hover:bg-slate-200 transition"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span className="uppercase text-[10px] tracking-wider">Evolve (Stage {selectedSkill.currentStage + 1})</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleForgeSkill(selectedSkill)}
                      className="px-5 py-2 rounded bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-slate-200 shadow-lg flex items-center space-x-2 transition"
                    >
                      <Hammer className="w-4 h-4" />
                      <span>Forge Skill ({selectedSkill.permanentManaCost} MP)</span>
                    </button>
                  )}
                </div>
              </div>

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
    </div>
  );
};
