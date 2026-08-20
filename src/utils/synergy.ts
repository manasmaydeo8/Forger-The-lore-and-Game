import { ForgedSkill, SkillSynergy, ActiveSynergyBonus } from '../types';

export const SKILL_SYNERGIES: SkillSynergy[] = [
  {
    id: 'prismatic-elements',
    name: 'Prismatic Elemental Resonance',
    subtitle: 'Dual & Tri-Elemental Synthesis',
    description: 'Harmonizes opposing elemental frequencies into a devastating unstable composite matrix.',
    requiredCategoryOrTags: ['Elemental', 'fire', 'ice', 'lightning'],
    minSkillsRequired: 2,
    multiplier: 1.35, // +35% power
    effectBonus: '+35% Elemental Damage, spells trigger Thermal-Static Overload inflicting 20% bonus burst damage.',
    synergyType: 'elemental',
    badgeColor: 'border-amber-500/60 bg-amber-950/40 text-amber-300',
  },
  {
    id: 'titan-fortitude',
    name: 'Titan\'s Flesh & Aegis Resonance',
    subtitle: 'Cellular Mitosis & Kinetic Barrier Fusion',
    description: 'Interlocks organic regeneration with prismatic mana barrier shielding to form an impenetrable bastion.',
    requiredCategoryOrTags: ['Body', 'vitality', 'barrier', 'defense'],
    minSkillsRequired: 2,
    multiplier: 1.40, // +40% boost
    effectBonus: '+40% Healing & Shield Absorption, Aryan gains +30 Flat Defense against physical & magical blows.',
    synergyType: 'body',
    badgeColor: 'border-emerald-500/60 bg-emerald-950/40 text-emerald-300',
  },
  {
    id: 'spacetime-singularity',
    name: 'Non-Euclidean Spacetime Fracture',
    subtitle: 'Void Blink & Gravitational Tensor Distortion',
    description: 'Bends the fabric of Aetheria\'s dimensional sub-plane, warping trajectory lines and kinetic forces.',
    requiredCategoryOrTags: ['Unique', 'Forbidden', 'spatial', 'gravity', 'time'],
    minSkillsRequired: 2,
    multiplier: 1.50, // +50% boost
    effectBonus: '+50% Spacetime spell potency, +35% Evasion, and slows enemy combat actions by 25%.',
    synergyType: 'spacetime',
    badgeColor: 'border-purple-500/60 bg-purple-950/40 text-purple-300',
  },
  {
    id: 'abyssal-blood-pact',
    name: 'Abyssal Blood Sovereign Pact',
    subtitle: 'Monarch Sanguine & Demonic Instinct Unification',
    description: 'Awakens dormant abyssal bloodlines to siphon life force directly from enemy soul matrices.',
    requiredCategoryOrTags: ['Corrupted', 'abyssal', 'blood', 'demon'],
    minSkillsRequired: 2,
    multiplier: 1.55, // +55% boost
    effectBonus: '+55% Critical Strike & Bleed potency, siphons 30% of all combat damage dealt back as HP.',
    synergyType: 'abyssal',
    badgeColor: 'border-rose-500/60 bg-rose-950/40 text-rose-300',
  },
  {
    id: 'omni-perception-tactics',
    name: 'Apex Hunter\'s Omni-Perception',
    subtitle: 'Optical Tapetum & High-Speed Reflex Coupling',
    description: 'Synchronizes ocular mana flow with kinetic muscle reflexes to anticipate enemy strikes before impact.',
    requiredCategoryOrTags: ['Perception', 'vision', 'reflex', 'stealth'],
    minSkillsRequired: 2,
    multiplier: 1.30, // +30% boost
    effectBonus: '+30% Critical Hit Chance, grants total immunity to ambushes and reveals enemy elemental vulnerabilities.',
    synergyType: 'perception',
    badgeColor: 'border-cyan-500/60 bg-cyan-950/40 text-cyan-300',
  },
  {
    id: 'grand-forger-continuum',
    name: 'Grand Sovereign Matrix Continuum',
    subtitle: 'Master Soul Orchestration (4+ Active Skills)',
    description: 'Orchestrates four or more forged soul matrices into an omni-directional celestial harmonic resonance.',
    requiredCategoryOrTags: ['*universal*'],
    minSkillsRequired: 4,
    multiplier: 1.25, // +25% universal boost
    effectBonus: '+25% Universal Power Boost applied multiplicatively to all active spells, reducing spell active MP cost by 20%.',
    synergyType: 'sovereign',
    badgeColor: 'border-indigo-500/60 bg-indigo-950/40 text-indigo-200',
  },
];

/**
 * Evaluates all active skill synergies based on currently forged/equipped skills.
 */
export function calculateActiveSynergies(skills: ForgedSkill[]): ActiveSynergyBonus[] {
  const forgedSkills = skills.filter((s) => s.isForged);

  return SKILL_SYNERGIES.map((synergy) => {
    let matchingSkills: ForgedSkill[] = [];

    if (synergy.id === 'grand-forger-continuum') {
      // Counts all forged skills except core if count >= 4
      if (forgedSkills.length >= synergy.minSkillsRequired) {
        matchingSkills = forgedSkills;
      }
    } else {
      matchingSkills = forgedSkills.filter((skill) => {
        // Match category
        if (synergy.requiredCategoryOrTags.includes(skill.category)) {
          return true;
        }
        // Match tags
        if (skill.synergyTags && skill.synergyTags.some((tag) => synergy.requiredCategoryOrTags.includes(tag))) {
          return true;
        }
        return false;
      });
    }

    const isActive = matchingSkills.length >= synergy.minSkillsRequired;
    
    // Scale multiplier slightly higher if 3+ skills match in elemental/spacetime
    let dynamicMultiplier = synergy.multiplier;
    if (isActive && matchingSkills.length >= 3 && synergy.id === 'prismatic-elements') {
      dynamicMultiplier = 1.60; // Tri-elemental boost
    }

    const boostPercent = Math.round((dynamicMultiplier - 1) * 100);

    return {
      synergy,
      matchingSkills,
      isActive,
      multiplier: dynamicMultiplier,
      displayMultiplier: `+${boostPercent}%`,
    };
  });
}

/**
 * Calculates the total composite synergy multiplier for a specific skill.
 */
export function getSkillSynergyMultiplier(skill: ForgedSkill, activeSynergies: ActiveSynergyBonus[]): {
  totalMultiplier: number;
  activeSynergyNames: string[];
} {
  if (!skill.isForged) {
    return { totalMultiplier: 1.0, activeSynergyNames: [] };
  }

  let totalMultiplier = 1.0;
  const activeSynergyNames: string[] = [];

  for (const bonus of activeSynergies) {
    if (!bonus.isActive) continue;

    const isMatch = bonus.matchingSkills.some((s) => s.id === skill.id) || bonus.synergy.id === 'grand-forger-continuum';
    if (isMatch) {
      totalMultiplier *= bonus.multiplier;
      activeSynergyNames.push(bonus.synergy.name);
    }
  }

  return {
    totalMultiplier: parseFloat(totalMultiplier.toFixed(2)),
    activeSynergyNames,
  };
}

/**
 * Calculates Aryan's total effective combat power rating.
 */
export function calculateCombatPower(
  stats: { level: number; hp: number; strength: number; agility: number; defense: number; intelligence: number },
  skills: ForgedSkill[],
  activeSynergies: ActiveSynergyBonus[]
): number {
  const baseStatPower = stats.level * 50 + stats.strength * 12 + stats.agility * 10 + stats.defense * 10 + stats.intelligence * 18 + stats.hp * 0.5;

  let skillPower = 0;
  for (const skill of skills) {
    if (!skill.isForged) continue;
    const stageMultiplier = skill.stages.find((s) => s.stage === skill.currentStage)?.manaMultiplier || 1.0;
    const { totalMultiplier } = getSkillSynergyMultiplier(skill, activeSynergies);
    skillPower += (skill.permanentManaCost * 15 + skill.activeManaCost * 8) * stageMultiplier * totalMultiplier;
  }

  return Math.round(baseStatPower + skillPower);
}
