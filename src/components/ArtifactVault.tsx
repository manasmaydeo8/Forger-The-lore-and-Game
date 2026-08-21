import React, { useState } from 'react';
import { CharacterStats, ArtifactItem, ArtifactRarity, TTSVoice } from '../types';
import { MASTER_ARTIFACTS_DATABASE, ARTIFACT_RARITY_CONFIG, rollArtifactDrop } from '../data/artifactsData';
import { SoundFX } from '../utils/soundEffects';
import {
  Sparkles,
  Shield,
  Zap,
  Flame,
  Snowflake,
  Shirt,
  BookOpen,
  Compass,
  Eye,
  Feather,
  Activity,
  Crown,
  Skull,
  Sun,
  SunMedium,
  Award,
  Dice5,
  Layers,
  Search,
  Check,
  Radio,
  Dices,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface ArtifactVaultProps {
  stats: CharacterStats;
  onUpdateStats: (newStats: CharacterStats) => void;
  voice: TTSVoice;
  onBroadcastDrop?: (artifact: ArtifactItem) => void;
}

export const ArtifactVault: React.FC<ArtifactVaultProps> = ({
  stats,
  onUpdateStats,
  voice,
  onBroadcastDrop,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'codex' | 'summon' | 'simulator'>('summon');
  const [selectedRarityFilter, setSelectedRarityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [summonResults, setSummonResults] = useState<{ artifact: ArtifactItem; rollValue: number; isMythicalDivine: boolean }[]>([]);
  const [isSummoning, setIsSummoning] = useState(false);
  const [lastApexDrop, setLastApexDrop] = useState<ArtifactItem | null>(null);

  // High-Speed Simulation states
  const [simRollCount, setSimRollCount] = useState<number>(1000);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStats, setSimStats] = useState<{
    totalRolls: number;
    breakdown: Record<ArtifactRarity, number>;
    mythicalDivineFound: number;
    mythicalDivineNames: string[];
    simTimeMs: number;
  } | null>(null);

  const inventory = stats.artifactInventory || [];
  const equippedIds = stats.equippedArtifactIds || [];

  const getRarityBadge = (rarity: ArtifactRarity) => {
    const conf = ARTIFACT_RARITY_CONFIG[rarity] || ARTIFACT_RARITY_CONFIG.Common;
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${conf.badgeBg} ${conf.badgeText} border ${conf.borderColor}`}>
        {conf.name} ({conf.dropRatePercentage}%)
      </span>
    );
  };

  const getArtifactIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Shield':
        return <Shield className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'Snowflake':
        return <Snowflake className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Shirt':
        return <Shirt className={className} />;
      case 'BookOpen':
        return <BookOpen className={className} />;
      case 'Compass':
        return <Compass className={className} />;
      case 'Eye':
        return <Eye className={className} />;
      case 'Feather':
        return <Feather className={className} />;
      case 'Activity':
        return <Activity className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'Skull':
        return <Skull className={className} />;
      case 'Sun':
        return <Sun className={className} />;
      case 'SunMedium':
        return <SunMedium className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  // Equip / Unequip Artifact
  const handleToggleEquip = (artifact: ArtifactItem) => {
    const isEquipped = equippedIds.includes(artifact.id);
    let newEquipped: string[];

    if (isEquipped) {
      newEquipped = equippedIds.filter((id) => id !== artifact.id);
      SoundFX.playDissolve();
    } else {
      if (equippedIds.length >= 4) {
        alert('Artifact Slot Limit Reached!\nYou can equip a maximum of 4 active Artifacts at once. Unequip an existing artifact first.');
        return;
      }
      newEquipped = [...equippedIds, artifact.id];
      SoundFX.playSkillForged();
    }

    onUpdateStats({
      ...stats,
      equippedArtifactIds: newEquipped,
    });
  };

  // Perform Gacha Summon (Single or 10x)
  const handleSummon = (count: number) => {
    const crystalCost = count === 1 ? 100 : 900;
    if (stats.manaCrystals < crystalCost) {
      alert(`Insufficient Monster Mana Crystals! Need ${crystalCost} Crystals to manifest ${count} Artifact(s). Defeat monsters in the Arena or World Boss to gather crystals.`);
      return;
    }

    setIsSummoning(true);
    SoundFX.playSkillForged();

    setTimeout(() => {
      const results: { artifact: ArtifactItem; rollValue: number; isMythicalDivine: boolean }[] = [];
      const newItems: ArtifactItem[] = [...inventory];

      let foundApex = false;
      let apexItem: ArtifactItem | null = null;

      for (let i = 0; i < count; i++) {
        const drop = rollArtifactDrop();
        results.push(drop);
        newItems.push(drop.artifact);

        if (drop.isMythicalDivine || drop.artifact.rarity === 'Divine' || drop.artifact.rarity === 'Demonic') {
          foundApex = true;
          apexItem = drop.artifact;
        }
      }

      // Deduct crystals & update inventory
      onUpdateStats({
        ...stats,
        manaCrystals: stats.manaCrystals - crystalCost,
        artifactInventory: newItems,
      });

      setSummonResults(results);
      setIsSummoning(false);

      if (foundApex && apexItem) {
        setLastApexDrop(apexItem);
        SoundFX.playDemonicAnomaly();
        if (onBroadcastDrop) {
          onBroadcastDrop(apexItem);
        }
      }
    }, 600);
  };

  // High-Speed Math Simulator for 0.0001% Drop Verification
  const handleRunSimulation = () => {
    setIsSimulating(true);
    const startTime = performance.now();

    const breakdown: Record<ArtifactRarity, number> = {
      Common: 0,
      Rare: 0,
      Epic: 0,
      Mysterious: 0,
      Mythical: 0,
      Legendary: 0,
      Demonic: 0,
      Divine: 0,
      'Mythical Divine': 0,
    };

    let mythicalDivineFound = 0;
    const names: string[] = [];

    for (let i = 0; i < simRollCount; i++) {
      const drop = rollArtifactDrop();
      breakdown[drop.artifact.rarity] += 1;
      if (drop.isMythicalDivine) {
        mythicalDivineFound += 1;
        if (!names.includes(drop.artifact.name)) {
          names.push(drop.artifact.name);
        }
      }
    }

    const endTime = performance.now();

    setSimStats({
      totalRolls: simRollCount,
      breakdown,
      mythicalDivineFound,
      mythicalDivineNames: names,
      simTimeMs: Math.round(endTime - startTime),
    });
    setIsSimulating(false);
  };

  const filteredCodex = MASTER_ARTIFACTS_DATABASE.filter((art) => {
    const matchesRarity = selectedRarityFilter === 'all' || art.rarity === selectedRarityFilter;
    const matchesSearch = art.name.toLowerCase().includes(searchQuery.toLowerCase()) || art.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRarity && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-[#121218] border border-cyan-900/40 rounded-xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-pink-600/10 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-pink-600 to-amber-600 rounded-lg shadow-lg">
                <Crown className="w-6 h-6 text-white animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider flex items-center gap-2">
                  ARTIFACT VAULT & DIVINE RELIQUARY
                </h1>
                <p className="text-xs text-slate-400 font-mono">
                  9-Tier Ancient Relics • Drop Rate from Common (40%) to Mythical Divine (0.0001%)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-[#0b0c10] border border-cyan-800/40 rounded-lg px-3 py-2 text-right font-mono">
              <span className="text-[10px] text-slate-400 block uppercase">Mana Crystals</span>
              <span className="text-sm font-bold text-cyan-300 flex items-center justify-end gap-1">
                💎 {stats.manaCrystals.toLocaleString()}
              </span>
            </div>
            <div className="bg-[#0b0c10] border border-purple-800/40 rounded-lg px-3 py-2 text-right font-mono">
              <span className="text-[10px] text-slate-400 block uppercase">Equipped Artifacts</span>
              <span className="text-sm font-bold text-purple-300">
                {equippedIds.length} / 4 Slots
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-800 pt-4 font-mono text-xs">
          <button
            onClick={() => setActiveTab('summon')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'summon'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Summon Reliquary
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            My Equipment & Inventory ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('codex')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'codex'
                ? 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Artifact Codex ({MASTER_ARTIFACTS_DATABASE.length})
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Dices className="w-4 h-4" />
            0.0001% Drop Rate Simulator
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB: SUMMON RELIQUARY (GACHA)
          ========================================================================= */}
      {activeTab === 'summon' && (
        <div className="space-y-6">
          <div className="bg-[#121218] border border-pink-900/40 rounded-xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.08)_0,transparent_70%)] pointer-events-none" />

            <div className="text-center max-w-2xl mx-auto space-y-3 relative z-10">
              <span className="text-[11px] font-mono uppercase tracking-widest text-pink-400 bg-pink-950/80 px-3 py-1 rounded-full border border-pink-700/50">
                Aetherian Void Altar
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Manifest Ancient Artifacts
              </h2>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Channel Monster Mana Crystals into the Primordial Altar. Tap into the world’s forgotten leylines to extract gear ranging from Common to the apex <span className="text-pink-400 font-bold">Mythical Divine (0.0001%)</span>.
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <button
                  disabled={isSummoning || stats.manaCrystals < 100}
                  onClick={() => handleSummon(1)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-700 to-blue-700 text-white font-bold font-mono text-sm hover:from-cyan-600 hover:to-blue-600 shadow-xl disabled:opacity-50 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Single Manifest (100 💎)
                </button>
                <button
                  disabled={isSummoning || stats.manaCrystals < 900}
                  onClick={() => handleSummon(10)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-bold font-mono text-sm hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50 flex items-center gap-2 border border-pink-400/30 animate-pulse"
                >
                  <Crown className="w-4 h-4" />
                  10x Altar Resonance (900 💎)
                </button>
              </div>
            </div>
          </div>

          {/* Summon Results Display */}
          {summonResults.length > 0 && (
            <div className="bg-[#121218] border border-cyan-900/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  MANIFESTATION RESULTS ({summonResults.length} ITEMS)
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Added to your artifact inventory
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {summonResults.map((res, idx) => {
                  const art = res.artifact;
                  const isApex = art.rarity === 'Mythical Divine';
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border bg-[#0b0c10] flex flex-col justify-between space-y-2 relative overflow-hidden transition-all ${
                        isApex
                          ? 'border-pink-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] ring-2 ring-pink-500'
                          : 'border-slate-800'
                      }`}
                    >
                      {isApex && (
                        <div className="absolute -top-1 -right-1 bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600 text-[9px] font-black text-white px-2 py-0.5 rounded-bl shadow">
                          0.0001% APEX!
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="p-1.5 bg-slate-900 rounded text-cyan-400">
                            {getArtifactIcon(art.icon, 'w-4 h-4')}
                          </div>
                          {getRarityBadge(art.rarity)}
                        </div>
                        <h4 className="text-xs font-bold text-white leading-snug line-clamp-1">
                          {art.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {art.description}
                        </p>
                      </div>

                      <div className="border-t border-slate-800/80 pt-2 text-[10px] font-mono text-purple-300">
                        <span className="text-slate-400 block text-[9px]">Passive:</span>
                        <span className="font-bold text-amber-300">{art.uniquePassiveName}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB: INVENTORY & EQUIPMENT
          ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          {/* Active Equipped Slots */}
          <div className="bg-[#121218] border border-purple-900/40 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              ACTIVE EQUIPPED SLOTS ({equippedIds.length} / 4 SLOTS)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((slotIdx) => {
                const equippedId = equippedIds[slotIdx];
                const art = inventory.find((i) => i.id === equippedId);

                if (!art) {
                  return (
                    <div
                      key={slotIdx}
                      className="border border-dashed border-slate-800 rounded-lg p-4 bg-[#0b0c10]/50 flex flex-col items-center justify-center text-center space-y-1 min-h-[140px]"
                    >
                      <Layers className="w-6 h-6 text-slate-700" />
                      <span className="text-xs font-mono text-slate-500">Empty Artifact Slot #{slotIdx + 1}</span>
                      <span className="text-[10px] text-slate-600">Select an artifact from below to equip</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={slotIdx}
                    className="border border-purple-500/60 bg-gradient-to-b from-[#181328] to-[#0d0a17] rounded-lg p-3 space-y-2 relative shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-1.5 bg-purple-950/80 rounded text-purple-300">
                        {getArtifactIcon(art.icon, 'w-4 h-4')}
                      </div>
                      {getRarityBadge(art.rarity)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{art.name}</h4>
                      <p className="text-[10px] text-slate-300 line-clamp-2 mt-1">{art.description}</p>
                    </div>
                    <div className="bg-[#0b0c10]/80 p-2 rounded text-[10px] font-mono space-y-0.5 text-amber-300">
                      <span className="text-[9px] text-slate-400 block uppercase">Equipped Perk:</span>
                      <p className="text-[10px] text-amber-200">{art.uniquePassiveEffect}</p>
                    </div>
                    <button
                      onClick={() => handleToggleEquip(art)}
                      className="w-full py-1 rounded bg-rose-950/80 border border-rose-700 text-rose-300 text-[10px] font-mono hover:bg-rose-900 transition-colors"
                    >
                      Unequip
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Full Inventory List */}
          <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                BAG INVENTORY ({inventory.length} TOTAL)
              </h3>
            </div>

            {inventory.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <Sparkles className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="text-xs text-slate-500 font-mono">No artifacts in your bag yet.</p>
                <p className="text-[11px] text-slate-600">Use the Summon Reliquary tab or defeat World Bosses to collect artifacts.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inventory.map((art, idx) => {
                  const isEquipped = equippedIds.includes(art.id);
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border bg-[#0b0c10] flex flex-col justify-between space-y-2 ${
                        isEquipped ? 'border-purple-500 ring-1 ring-purple-500/50' : 'border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="p-1.5 bg-slate-900 rounded text-cyan-400">
                            {getArtifactIcon(art.icon, 'w-4 h-4')}
                          </div>
                          {getRarityBadge(art.rarity)}
                        </div>
                        <h4 className="text-xs font-bold text-white">{art.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1">{art.description}</p>
                      </div>

                      <div className="border-t border-slate-800 pt-2 space-y-2">
                        <div className="text-[10px] font-mono text-amber-300">
                          <span className="text-slate-400 text-[9px] block">Passive: {art.uniquePassiveName}</span>
                          <p className="text-[10px] text-slate-300">{art.uniquePassiveEffect}</p>
                        </div>
                        <button
                          onClick={() => handleToggleEquip(art)}
                          className={`w-full py-1.5 rounded text-xs font-mono font-bold transition-all ${
                            isEquipped
                              ? 'bg-rose-950 border border-rose-700 text-rose-300 hover:bg-rose-900'
                              : 'bg-cyan-950 border border-cyan-700 text-cyan-300 hover:bg-cyan-900'
                          }`}
                        >
                          {isEquipped ? 'Unequip' : 'Equip to Slot'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: ARTIFACT CODEX
          ========================================================================= */}
      {activeTab === 'codex' && (
        <div className="space-y-4">
          <div className="bg-[#121218] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 w-full md:w-auto">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search artifacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#0b0c10] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full md:w-64 font-mono"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
              <button
                onClick={() => setSelectedRarityFilter('all')}
                className={`px-2.5 py-1 rounded ${
                  selectedRarityFilter === 'all' ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                All
              </button>
              {Object.keys(ARTIFACT_RARITY_CONFIG).map((rarity) => (
                <button
                  key={rarity}
                  onClick={() => setSelectedRarityFilter(rarity)}
                  className={`px-2 py-1 rounded ${
                    selectedRarityFilter === rarity ? 'bg-pink-600 text-white font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {rarity}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCodex.map((art) => (
              <div
                key={art.id}
                className={`p-4 rounded-xl border bg-[#121218] space-y-3 relative overflow-hidden ${
                  art.rarity === 'Mythical Divine'
                    ? 'border-pink-500/80 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-slate-900 rounded-lg text-cyan-400">
                    {getArtifactIcon(art.icon, 'w-5 h-5')}
                  </div>
                  {getRarityBadge(art.rarity)}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{art.name}</h4>
                  <p className="text-xs text-slate-300 mt-1">{art.description}</p>
                </div>

                <div className="bg-[#0b0c10] p-3 rounded-lg border border-slate-800/80 space-y-1 text-xs font-mono">
                  <div className="text-amber-300 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {art.uniquePassiveName}
                  </div>
                  <p className="text-[11px] text-slate-400">{art.uniquePassiveEffect}</p>
                </div>

                <p className="text-[10px] text-slate-500 italic border-t border-slate-800/80 pt-2 font-serif">
                  "{art.lore}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: 0.0001% DROP RATE SIMULATOR (VERIFICATION)
          ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="bg-[#121218] border border-emerald-900/40 rounded-xl p-6 space-y-6">
          <div className="max-w-2xl space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-700/50">
              Statistical Verification Chamber
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Mythical Divine (0.0001%) Probability Engine
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              Test and verify the true mathematical drop distributions across thousands of rolls in real-time. The Mythical Divine tier sits at an exact 0.0001% chance (1 in 1,000,000).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-[#0b0c10] p-4 rounded-xl border border-slate-800 font-mono text-xs">
            <span className="text-slate-400">Simulation Batch:</span>
            {[1000, 10000, 50000, 100000].map((count) => (
              <button
                key={count}
                onClick={() => setSimRollCount(count)}
                className={`px-3 py-1.5 rounded ${
                  simRollCount === count ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count.toLocaleString()} Rolls
              </button>
            ))}

            <button
              disabled={isSimulating}
              onClick={handleRunSimulation}
              className="ml-auto px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin' : ''}`} />
              Run Probability Batch
            </button>
          </div>

          {simStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="bg-[#0b0c10] p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Total Simulated</span>
                  <span className="text-lg font-bold text-white">{simStats.totalRolls.toLocaleString()} Rolls</span>
                </div>
                <div className="bg-[#0b0c10] p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Execution Speed</span>
                  <span className="text-lg font-bold text-emerald-400">{simStats.simTimeMs} ms</span>
                </div>
                <div className="bg-[#0b0c10] p-3 rounded-lg border border-pink-900/60">
                  <span className="text-[10px] text-pink-400 block uppercase">0.0001% Mythical Divine Found</span>
                  <span className="text-lg font-bold text-pink-400">{simStats.mythicalDivineFound} item(s)</span>
                </div>
                <div className="bg-[#0b0c10] p-3 rounded-lg border border-yellow-900/60">
                  <span className="text-[10px] text-yellow-400 block uppercase">Divine (0.4999%) Found</span>
                  <span className="text-lg font-bold text-yellow-300">{simStats.breakdown['Divine'] || 0} item(s)</span>
                </div>
              </div>

              {/* Rarity Breakdown Table */}
              <div className="bg-[#0b0c10] rounded-xl border border-slate-800 overflow-hidden font-mono text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-900/80 text-slate-400 text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Rarity Tier</th>
                      <th className="p-3">Expected Rate</th>
                      <th className="p-3">Actual Dropped</th>
                      <th className="p-3">Observed %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {Object.entries(simStats.breakdown).map(([rarity, count]) => {
                      const conf = ARTIFACT_RARITY_CONFIG[rarity as ArtifactRarity];
                      const numericCount = Number(count) || 0;
                      const observedPercent = simStats.totalRolls > 0 ? ((numericCount / simStats.totalRolls) * 100).toFixed(4) : '0.0000';
                      return (
                        <tr key={rarity} className="hover:bg-slate-900/40">
                          <td className="p-3 font-bold text-white flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: conf.color }} />
                            {conf.name}
                          </td>
                          <td className="p-3 text-slate-400">{conf.dropRatePercentage}%</td>
                          <td className="p-3 font-bold text-cyan-300">{numericCount.toLocaleString()}</td>
                          <td className="p-3 text-amber-300">{observedPercent}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
