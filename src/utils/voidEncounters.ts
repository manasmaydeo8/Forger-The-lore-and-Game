import { Enemy, EnemyAbility, UniqueLootItem } from '../types';
import { AETHERIA_ENEMIES } from '../data/enemyData';
import { UNIQUE_VOID_LOOT_TABLE } from '../data/voidLootData';

const VOID_PREFIXES = [
  'Void-Corrupted',
  'Abyssal Rift-Tainted',
  'Null-Energy',
  'Dimensional Horror',
  'Shadow-Entropy',
  'Eclipse-Bound',
  'Astral Void',
  'Chaos-Mutated',
];

const VOID_AFFIXES = [
  {
    name: 'Null-Phase Shield',
    desc: 'Bypasses 30% of incoming physical damage through dimensional micro-rifts.',
  },
  {
    name: 'Abyssal Soul Leech',
    desc: 'Restores HP on critical strikes by siphoning soul matrix mana.',
  },
  {
    name: 'Void Distortion Aura',
    desc: 'Distorts ambient space, increasing attack speed and critical strike probability.',
  },
  {
    name: 'Entropy Collapse',
    desc: 'Emits pulses of decaying void radiation that degrade enemy barrier defenses.',
  },
  {
    name: 'Dimensional Phase Shift',
    desc: 'Teleports through sub-space to evade incoming attacks.',
  },
];

export interface VoidEncounterResult {
  enemy: Enemy;
  corruptionTier: 'Tainted' | 'Abyssal' | 'Dimensional' | 'Apex Void Horror';
  distortionLevel: number; // 1 - 100%
  guaranteedLoot?: UniqueLootItem;
  bonusVoidCrystals: number;
}

export function generateRandomVoidEncounter(playerLevel: number = 1): VoidEncounterResult {
  // Pick random base monster from bestiary
  const baseMonster = AETHERIA_ENEMIES[Math.floor(Math.random() * AETHERIA_ENEMIES.length)];

  // Determine corruption tier based on roll and level
  const roll = Math.random();
  let corruptionTier: 'Tainted' | 'Abyssal' | 'Dimensional' | 'Apex Void Horror' = 'Tainted';
  let tierMult = 1.35;
  let voidCrystalMin = 15;
  let voidCrystalMax = 35;
  let dangerLevel: Enemy['dangerLevel'] = 'Dangerous';
  let dangerColor = 'text-purple-400 border-purple-800 bg-purple-950/40';

  if (roll > 0.85 || playerLevel >= 15) {
    corruptionTier = 'Apex Void Horror';
    tierMult = 2.4;
    voidCrystalMin = 180;
    voidCrystalMax = 420;
    dangerLevel = 'Fatal Catastrophe';
    dangerColor = 'text-rose-400 border-purple-500 bg-[#190424] animate-pulse';
  } else if (roll > 0.55 || playerLevel >= 8) {
    corruptionTier = 'Dimensional';
    tierMult = 1.9;
    voidCrystalMin = 75;
    voidCrystalMax = 180;
    dangerLevel = 'Extreme';
    dangerColor = 'text-purple-300 border-purple-600 bg-purple-950/70';
  } else if (roll > 0.25 || playerLevel >= 3) {
    corruptionTier = 'Abyssal';
    tierMult = 1.6;
    voidCrystalMin = 35;
    voidCrystalMax = 80;
    dangerLevel = 'Severe';
    dangerColor = 'text-indigo-300 border-indigo-700 bg-indigo-950/60';
  }

  const prefix = VOID_PREFIXES[Math.floor(Math.random() * VOID_PREFIXES.length)];
  const affix = VOID_AFFIXES[Math.floor(Math.random() * VOID_AFFIXES.length)];
  const affix2 = VOID_AFFIXES[(Math.floor(Math.random() * VOID_AFFIXES.length) + 1) % VOID_AFFIXES.length];

  const mutatedHp = Math.round(baseMonster.hp * tierMult);
  const mutatedAtk = Math.round(baseMonster.attack * (tierMult * 0.9));
  const mutatedDef = Math.round(baseMonster.defense * (tierMult * 0.85));
  const mutatedLevel = Math.max(baseMonster.level, Math.min(25, baseMonster.level + Math.floor(tierMult * 2)));

  const voidCrystals = voidCrystalMin + Math.floor(Math.random() * (voidCrystalMax - voidCrystalMin + 1));
  const standardCrystals = Math.round((baseMonster.rewards.maxCrystals || 40) * tierMult * 1.5);

  // Pick unique loot drop
  const availableLoot = UNIQUE_VOID_LOOT_TABLE;
  const pickedLoot = availableLoot[Math.floor(Math.random() * availableLoot.length)];

  // Corrupted void ability
  const voidAbility: EnemyAbility = {
    name: `${corruptionTier} Void Singularity`,
    description: `Tears open a local rift dealing crushing dimensional void damage and disrupting barriers.`,
    damage: Math.round(mutatedAtk * 1.5),
    manaCost: 20,
    type: 'abyssal',
  };

  const corruptedEnemy: Enemy = {
    ...baseMonster,
    id: `void-mutant-${Date.now()}-${baseMonster.id}`,
    name: `${prefix} ${baseMonster.name}`,
    title: `[${corruptionTier.toUpperCase()} ANOMALY] • ${baseMonster.title}`,
    level: mutatedLevel,
    hp: mutatedHp,
    maxHp: mutatedHp,
    attack: mutatedAtk,
    defense: mutatedDef,
    dangerLevel,
    dangerColor,
    isVoidCorrupted: true,
    corruptionTier,
    corruptionAffixes: [affix.name, affix2.name],
    lore: `This entity was dragged through a catastrophic void fissure. Its anatomical core has mutated into unstable spatial crystals, making it vastly more lethal than standard worldly monsters.`,
    threatAssessment: `Extreme Void Threat. Carries active affixes: [${affix.name}: ${affix.desc}] and [${affix2.name}: ${affix2.desc}]. Defeating it yields rare Void Relics and High-Tier Pure Void Crystals.`,
    abilities: [voidAbility, ...baseMonster.abilities],
    rewards: {
      exp: Math.round(baseMonster.rewards.exp * tierMult * 1.6),
      permanentManaBonus: (baseMonster.rewards.permanentManaBonus || 4) + (corruptionTier === 'Apex Void Horror' ? 12 : 5),
      manaCrystals: standardCrystals,
      minCrystals: Math.round(standardCrystals * 0.8),
      maxCrystals: Math.round(standardCrystals * 1.2),
      voidManaCrystals: voidCrystals,
      minVoidCrystals: voidCrystalMin,
      maxVoidCrystals: voidCrystalMax,
      unlockedBlueprintName: `${corruptionTier} Soul Matrix Blueprint`,
      description: `Victory awards +${voidCrystals} High-Tier Void Mana Crystals (🔮), +${standardCrystals} Standard Crystals, unique artifact drop: [${pickedLoot.name}], and permanent soul capacity!`,
    },
    voidLootTable: [pickedLoot],
  };

  return {
    enemy: corruptedEnemy,
    corruptionTier,
    distortionLevel: Math.min(100, Math.round(tierMult * 38)),
    guaranteedLoot: pickedLoot,
    bonusVoidCrystals: voidCrystals,
  };
}
