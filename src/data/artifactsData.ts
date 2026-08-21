import { ArtifactItem, ArtifactRarity } from '../types';

export const ARTIFACT_RARITY_CONFIG: Record<
  ArtifactRarity,
  {
    name: string;
    dropRatePercentage: number;
    color: string;
    borderColor: string;
    bgGlow: string;
    badgeBg: string;
    badgeText: string;
    rankTier: number;
  }
> = {
  Common: {
    name: 'Common',
    dropRatePercentage: 40.0,
    color: '#94a3b8',
    borderColor: 'border-slate-600',
    bgGlow: 'shadow-slate-500/10',
    badgeBg: 'bg-slate-800',
    badgeText: 'text-slate-300',
    rankTier: 1,
  },
  Rare: {
    name: 'Rare',
    dropRatePercentage: 25.0,
    color: '#38bdf8',
    borderColor: 'border-sky-500',
    bgGlow: 'shadow-sky-500/20',
    badgeBg: 'bg-sky-950',
    badgeText: 'text-sky-300',
    rankTier: 2,
  },
  Epic: {
    name: 'Epic',
    dropRatePercentage: 15.0,
    color: '#a855f7',
    borderColor: 'border-purple-500',
    bgGlow: 'shadow-purple-500/20',
    badgeBg: 'bg-purple-950',
    badgeText: 'text-purple-300',
    rankTier: 3,
  },
  Mysterious: {
    name: 'Mysterious',
    dropRatePercentage: 10.0,
    color: '#2dd4bf',
    borderColor: 'border-teal-500',
    bgGlow: 'shadow-teal-500/25',
    badgeBg: 'bg-teal-950',
    badgeText: 'text-teal-300',
    rankTier: 4,
  },
  Mythical: {
    name: 'Mythical',
    dropRatePercentage: 5.0,
    color: '#f59e0b',
    borderColor: 'border-amber-500',
    bgGlow: 'shadow-amber-500/30',
    badgeBg: 'bg-amber-950',
    badgeText: 'text-amber-300',
    rankTier: 5,
  },
  Legendary: {
    name: 'Legendary',
    dropRatePercentage: 3.0,
    color: '#f97316',
    borderColor: 'border-orange-500',
    bgGlow: 'shadow-orange-500/30',
    badgeBg: 'bg-orange-950',
    badgeText: 'text-orange-300',
    rankTier: 6,
  },
  Demonic: {
    name: 'Demonic',
    dropRatePercentage: 1.5,
    color: '#ef4444',
    borderColor: 'border-rose-600',
    bgGlow: 'shadow-rose-600/35',
    badgeBg: 'bg-rose-950',
    badgeText: 'text-rose-300',
    rankTier: 7,
  },
  Divine: {
    name: 'Divine',
    dropRatePercentage: 0.4999,
    color: '#eab308',
    borderColor: 'border-yellow-400',
    bgGlow: 'shadow-yellow-400/40',
    badgeBg: 'bg-yellow-950',
    badgeText: 'text-yellow-200',
    rankTier: 8,
  },
  'Mythical Divine': {
    name: 'Mythical Divine',
    dropRatePercentage: 0.0001, // 0.0001% -> 1 in 1,000,000
    color: '#f43f5e',
    borderColor: 'border-pink-500 shadow-[0_0_25px_rgba(244,63,94,0.7)]',
    bgGlow: 'shadow-pink-500/60',
    badgeBg: 'bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600',
    badgeText: 'text-white font-black animate-pulse',
    rankTier: 9,
  },
};

export const MASTER_ARTIFACTS_DATABASE: ArtifactItem[] = [
  // ==========================================
  // COMMON (40.0%)
  // ==========================================
  {
    id: 'art-com-1',
    name: 'Iron Vanguard Band',
    rarity: 'Common',
    slotType: 'ring',
    baseDropRate: 40.0,
    description: 'A sturdy band forged from standard refined iron, lightly engraved with defensive runes.',
    lore: 'Standard issue ring distributed to Aetherian city gate guards.',
    icon: 'Shield',
    statsBonus: {
      maxHpBonus: 35,
      defenseBonus: 6,
    },
    uniquePassiveName: 'Firm Resolve',
    uniquePassiveEffect: 'Reduces incoming physical damage by a flat 4 points.',
  },
  {
    id: 'art-com-2',
    name: 'Apprentice Mana Vial Pendant',
    rarity: 'Common',
    slotType: 'amulet',
    baseDropRate: 40.0,
    description: 'A glass vial containing low-density blue mana mist.',
    lore: 'Worn by acolytes during their early mana-channeling exercises.',
    icon: 'Sparkles',
    statsBonus: {
      activeManaBonus: 25,
      permanentManaBonus: 2,
    },
    uniquePassiveName: 'Mana Trickle',
    uniquePassiveEffect: 'Restores +2 Active Mana every combat turn.',
  },
  {
    id: 'art-com-3',
    name: 'Scout Wolf-Leather Boots',
    rarity: 'Common',
    slotType: 'armor',
    baseDropRate: 40.0,
    description: 'Supple leather boots crafted from forest wolf pelt.',
    lore: 'Allows swift traversal across rocky terrain.',
    icon: 'Zap',
    statsBonus: {
      agilityBonus: 8,
      defenseBonus: 4,
    },
    uniquePassiveName: 'Lightstep',
    uniquePassiveEffect: '+5% dodge chance against basic physical attacks.',
  },

  // ==========================================
  // RARE (25.0%)
  // ==========================================
  {
    id: 'art-rare-1',
    name: 'Frost-Spire Silver Earring',
    rarity: 'Rare',
    slotType: 'relic',
    baseDropRate: 25.0,
    description: 'Cooled in permafrost silver, this earring hums with cryogenic resonance.',
    lore: 'Mined from the subterranean ice fissures of the Northern Peaks.',
    icon: 'Snowflake',
    statsBonus: {
      permanentManaBonus: 6,
      maxHpBonus: 60,
      defenseBonus: 12,
    },
    uniquePassiveName: 'Cryo-Aegis',
    uniquePassiveEffect: 'When taking damage, chills the attacker, reducing their agility by 15% for 2 turns.',
  },
  {
    id: 'art-rare-2',
    name: 'Ember-Hound Fang Blade',
    rarity: 'Rare',
    slotType: 'weapon',
    baseDropRate: 25.0,
    description: 'A serrated dagger forged around the calcified tooth of an Ember Hound.',
    lore: 'Retains latent combustion heat inside its jagged edges.',
    icon: 'Flame',
    statsBonus: {
      attackBonus: 18,
      critChanceBonus: 6,
    },
    uniquePassiveName: 'Searing Edge',
    uniquePassiveEffect: 'Attacks have a 25% chance to inflict Burn (15 thermal damage per turn).',
  },
  {
    id: 'art-rare-3',
    name: 'Spell-Weaver Silk Mantle',
    rarity: 'Rare',
    slotType: 'armor',
    baseDropRate: 25.0,
    description: 'Woven with iridescent mana-conducting threads.',
    lore: 'Reduces strain on the user’s physical mana veins.',
    icon: 'Shirt',
    statsBonus: {
      permanentManaBonus: 8,
      activeManaBonus: 45,
      defenseBonus: 10,
    },
    uniquePassiveName: 'Mana Conduction',
    uniquePassiveEffect: 'Reduces the active mana cost of all forged skills by 2 MP.',
  },

  // ==========================================
  // EPIC (15.0%)
  // ==========================================
  {
    id: 'art-epic-1',
    name: 'Thunder-Core Brooch',
    rarity: 'Epic',
    slotType: 'amulet',
    baseDropRate: 15.0,
    description: 'A stabilized fragment of a high-altitude storm core encapsulated in electrum.',
    lore: 'Sparks intermittently whenever intense magical currents pass through the wearer.',
    icon: 'Zap',
    statsBonus: {
      attackBonus: 28,
      permanentManaBonus: 12,
      critChanceBonus: 10,
      agilityBonus: 15,
    },
    uniquePassiveName: 'Static Overcharge',
    uniquePassiveEffect: 'Every 3rd skill cast releases a chain lightning arc dealing 65 bonus shock damage.',
  },
  {
    id: 'art-epic-2',
    name: 'Abyssal Chitin Pauldron',
    rarity: 'Epic',
    slotType: 'armor',
    baseDropRate: 15.0,
    description: 'Carved from the exoskeleton of a deep-trench void crustacean.',
    lore: 'Absorbs kinetic shock and disperses impact through dark matter channels.',
    icon: 'Shield',
    statsBonus: {
      maxHpBonus: 180,
      defenseBonus: 30,
      damageReductionBonus: 8,
    },
    uniquePassiveName: 'Void Dispersal',
    uniquePassiveEffect: 'Absorbs 8% of all incoming damage and converts it into +10 Active Mana.',
  },
  {
    id: 'art-epic-3',
    name: 'Tome of the Forgotten Arcanist',
    rarity: 'Epic',
    slotType: 'tome',
    baseDropRate: 15.0,
    description: 'Leather-bound manual written in decipherable high-ancient dialect.',
    lore: 'Contains architectural circuit sketches of pre-calamity spells.',
    icon: 'BookOpen',
    statsBonus: {
      permanentManaBonus: 18,
      attackBonus: 22,
      crystalYieldMultiplier: 1.25,
    },
    uniquePassiveName: 'Formula Insight',
    uniquePassiveEffect: '+25% Monster Mana Crystal yield from all Arena and Raid victories.',
  },

  // ==========================================
  // MYSTERIOUS (10.0%)
  // ==========================================
  {
    id: 'art-myst-1',
    name: 'Cipher of the Unnamed Cosmos',
    rarity: 'Mysterious',
    slotType: 'relic',
    baseDropRate: 10.0,
    description: 'A hovering dodecahedron engraved with shifting astral glyphs that cannot be fully read.',
    lore: 'Discovered inside a crater left by a starfall three centuries ago. Emits unpredictable frequency pulses.',
    icon: 'Compass',
    statsBonus: {
      permanentManaBonus: 22,
      activeManaBonus: 70,
      critChanceBonus: 12,
    },
    uniquePassiveName: 'Quantum Enigma',
    uniquePassiveEffect: 'At the start of combat, grants a random powerful blessing (+30% Attack, +30% Defense, or +30% Agility) for 4 turns.',
  },
  {
    id: 'art-myst-2',
    name: 'Astral Warp Monocle',
    rarity: 'Mysterious',
    slotType: 'relic',
    baseDropRate: 10.0,
    description: 'A crystalline lens that perceives dimensional distortion layers.',
    lore: 'Allows Aryan’s Forger system to calculate invisible weak points.',
    icon: 'Eye',
    statsBonus: {
      agilityBonus: 24,
      attackBonus: 30,
      pvpDamageMultiplier: 1.18,
    },
    uniquePassiveName: 'Weak-Point Projection',
    uniquePassiveEffect: 'All attacks ignore 25% of the target’s base defense rating.',
  },

  // ==========================================
  // MYTHICAL (5.0%)
  // ==========================================
  {
    id: 'art-myth-1',
    name: 'Primordial Phoenix Feather',
    rarity: 'Mythical',
    slotType: 'relic',
    baseDropRate: 5.0,
    description: 'A glowing golden-crimson plumage that never turns cold.',
    lore: 'Shed by the Sky-Sovereign Phoenix during the First Age of Dawn.',
    icon: 'Feather',
    statsBonus: {
      maxHpBonus: 280,
      permanentManaBonus: 28,
      attackBonus: 40,
    },
    uniquePassiveName: 'Phoenix Rebirth Ember',
    uniquePassiveEffect: 'Upon receiving fatal damage, instantly revives with 35% HP and full mana (Once per combat).',
  },
  {
    id: 'art-myth-2',
    name: 'World-Tree Root Ring',
    rarity: 'Mythical',
    slotType: 'ring',
    baseDropRate: 5.0,
    description: 'A wooden ring coiled from the petrified roots of Yggdrasil.',
    lore: 'Continuously draws ambient life force from the planetary crust.',
    icon: 'Activity',
    statsBonus: {
      maxHpBonus: 320,
      permanentManaBonus: 35,
      defenseBonus: 40,
    },
    uniquePassiveName: 'Verdant Wellspring',
    uniquePassiveEffect: 'Regenerates 6% of Maximum HP at the start of every combat turn.',
  },

  // ==========================================
  // LEGENDARY (3.0%)
  // ==========================================
  {
    id: 'art-leg-1',
    name: 'Crown of the Eclipse Monarch',
    rarity: 'Legendary',
    slotType: 'crown',
    baseDropRate: 3.0,
    description: 'Forged from dark solar eclipse metals, this circlet crowns one who bends light and shadow.',
    lore: 'Worn by the Eclipse King before the Great Division of Aetheria.',
    icon: 'Crown',
    statsBonus: {
      maxHpBonus: 450,
      permanentManaBonus: 50,
      attackBonus: 65,
      critChanceBonus: 18,
      pvpDamageMultiplier: 1.25,
    },
    uniquePassiveName: 'Umbral Eclipse Dominion',
    uniquePassiveEffect: '+25% PvP damage and summons shadow tendrils that strike for 90 dark damage whenever Aryan crits.',
  },
  {
    id: 'art-leg-2',
    name: 'Star-Forged Aegis of the Titan',
    rarity: 'Legendary',
    slotType: 'armor',
    baseDropRate: 3.0,
    description: 'A massive breastplate hammered in the heart of a dead dying star.',
    lore: 'Completely impervious to non-magical kinetic weaponry.',
    icon: 'Shield',
    statsBonus: {
      maxHpBonus: 600,
      defenseBonus: 85,
      damageReductionBonus: 20,
      bossDamageMultiplier: 1.2,
    },
    uniquePassiveName: 'Stellar Bastion',
    uniquePassiveEffect: 'Reduces all incoming boss AoE damage by 20% and reflects 20% of melee damage back.',
  },

  // ==========================================
  // DEMONIC (1.5%)
  // ==========================================
  {
    id: 'art-dem-1',
    name: 'Scythe of the Abyssal Arch-Fiend',
    rarity: 'Demonic',
    slotType: 'weapon',
    baseDropRate: 1.5,
    description: 'A massive blood-red war scythe leaking corrosive purple miasma.',
    lore: 'Forged in the blood pits of the Ninth Abyss. It hungers for mortal souls and mana cores.',
    icon: 'Skull',
    statsBonus: {
      attackBonus: 95,
      permanentManaBonus: 60,
      critChanceBonus: 25,
    },
    uniquePassiveName: 'Soul Harvester Curse',
    uniquePassiveEffect: 'Attacks siphon 18% of damage dealt as Health and drain 15 MP from the target.',
  },
  {
    id: 'art-dem-2',
    name: 'Infernal Eye of Beelzebub',
    rarity: 'Demonic',
    slotType: 'relic',
    baseDropRate: 1.5,
    description: 'A preserved demonic eye encased in black amber that turns and watches observers.',
    lore: 'Contains a miniature gateway to the demon realm.',
    icon: 'Eye',
    statsBonus: {
      permanentManaBonus: 75,
      attackBonus: 80,
      pvpDamageMultiplier: 1.30,
    },
    uniquePassiveName: 'Abyssal Gaze of Ruin',
    uniquePassiveEffect: 'Debuffs enemies with Demonic Rot, lowering their damage reduction by 25%.',
  },

  // ==========================================
  // DIVINE (0.4999%)
  // ==========================================
  {
    id: 'art-div-1',
    name: 'Seraphim Halo Fragment',
    rarity: 'Divine',
    slotType: 'crown',
    baseDropRate: 0.4999,
    description: 'A ring of pure holy luminescence hovering weightlessly above the head.',
    lore: 'A shard from the crown of the Chief Archangel. Its light purges every impurity.',
    icon: 'Sun',
    statsBonus: {
      maxHpBonus: 850,
      permanentManaBonus: 100,
      defenseBonus: 95,
      damageReductionBonus: 25,
    },
    uniquePassiveName: 'Divine Sanctuary',
    uniquePassiveEffect: 'Completely immune to status debuffs (Stun, Freeze, Burn, Demonic Rot). All healing received is doubled.',
  },
  {
    id: 'art-div-2',
    name: 'Aegis of the Sun Deity - Sol Invictus',
    rarity: 'Divine',
    slotType: 'relic',
    baseDropRate: 0.4999,
    description: 'Emits a blinding corona of solar divinity.',
    lore: 'Said to be the shield carried by the Sun God when sealing the ancient darkness.',
    icon: 'SunMedium',
    statsBonus: {
      maxHpBonus: 1000,
      permanentManaBonus: 120,
      attackBonus: 110,
      defenseBonus: 110,
      bossDamageMultiplier: 1.4,
    },
    uniquePassiveName: 'Solar Wrath',
    uniquePassiveEffect: '+40% damage against World Bosses and Demonic entities. Burns all nearby foes for 100 holy damage each turn.',
  },

  // ==========================================
  // MYTHICAL DIVINE (0.0001% -> 1 in 1,000,000)
  // ==========================================
  {
    id: 'art-myth-div-1',
    name: 'Eye of the Primordial Creator — Omniscience',
    rarity: 'Mythical Divine',
    slotType: 'divine_core',
    baseDropRate: 0.0001, // 0.0001%
    description: 'The supreme eye of the first conceptual entity that forged the laws of magic, space, and time before the dawn of creation.',
    lore: 'Legend holds that only one vessel in an entire epoch can bear this core without their soul dissolving into primordial stardust. Grants mastery over the fundamental matrix of reality.',
    icon: 'Sparkles',
    divineAuraColor: '#f43f5e',
    statsBonus: {
      maxHpBonus: 2500,
      permanentManaBonus: 350,
      activeManaBonus: 500,
      attackBonus: 280,
      defenseBonus: 250,
      agilityBonus: 180,
      critChanceBonus: 40,
      damageReductionBonus: 35,
      crystalYieldMultiplier: 3.0,
      pvpDamageMultiplier: 1.6,
      bossDamageMultiplier: 2.0,
    },
    uniquePassiveName: 'Genesis Domain of the Supreme Forger',
    uniquePassiveEffect: 'Triples all Monster Crystal yields, doubles damage against World Bosses, grants 35% universal damage reduction, and all forged skill cooldowns are reduced by 50%.',
  },
  {
    id: 'art-myth-div-2',
    name: 'Crown of the First God — Genesis Sovereign',
    rarity: 'Mythical Divine',
    slotType: 'crown',
    baseDropRate: 0.0001, // 0.0001%
    description: 'A stellar crown woven from condensed creation sparks and eternal omni-mana.',
    lore: 'The apex crown worn by the primordial ruler of the cosmos. Reality bends slightly around the silhouette of its wearer.',
    icon: 'Crown',
    divineAuraColor: '#ec4899',
    statsBonus: {
      maxHpBonus: 3000,
      permanentManaBonus: 400,
      activeManaBonus: 600,
      attackBonus: 300,
      defenseBonus: 300,
      agilityBonus: 200,
      damageReductionBonus: 40,
      pvpDamageMultiplier: 1.75,
      bossDamageMultiplier: 2.2,
    },
    uniquePassiveName: 'Omnipotent Creation Matrix',
    uniquePassiveEffect: 'Aryan gains +75% PvP damage, +120% Boss damage, and regenerates 10% max HP and 30 Active Mana every single combat turn.',
  },
];

/**
 * Drop calculation engine with exact mathematical weights
 * Common: 40.0%
 * Rare: 25.0%
 * Epic: 15.0%
 * Mysterious: 10.0%
 * Mythical: 5.0%
 * Legendary: 3.0%
 * Demonic: 1.5%
 * Divine: 0.4999%
 * Mythical Divine: 0.0001% (1 in 1,000,000)
 */
export function rollArtifactDrop(luckBonus = 0): { artifact: ArtifactItem; rollValue: number; isMythicalDivine: boolean } {
  // Random number between 0 and 100 (inclusive of high precision floats)
  // Float between 0 and 100.000000
  const roll = Math.random() * 100.0;
  
  let targetRarity: ArtifactRarity = 'Common';
  let isMythicalDivine = false;

  // Exact cumulative boundaries:
  // Mythical Divine: 0.000000 to 0.000100 (0.0001%)
  // Divine: 0.000100 to 0.500000 (0.4999%)
  // Demonic: 0.500000 to 2.000000 (1.5%)
  // Legendary: 2.000000 to 5.000000 (3.0%)
  // Mythical: 5.000000 to 10.000000 (5.0%)
  // Mysterious: 10.000000 to 20.000000 (10.0%)
  // Epic: 20.000000 to 35.000000 (15.0%)
  // Rare: 35.000000 to 60.000000 (25.0%)
  // Common: 60.000000 to 100.000000 (40.0%)

  if (roll < 0.0001) {
    targetRarity = 'Mythical Divine';
    isMythicalDivine = true;
  } else if (roll < 0.5) {
    targetRarity = 'Divine';
  } else if (roll < 2.0) {
    targetRarity = 'Demonic';
  } else if (roll < 5.0) {
    targetRarity = 'Legendary';
  } else if (roll < 10.0) {
    targetRarity = 'Mythical';
  } else if (roll < 20.0) {
    targetRarity = 'Mysterious';
  } else if (roll < 35.0) {
    targetRarity = 'Epic';
  } else if (roll < 60.0) {
    targetRarity = 'Rare';
  } else {
    targetRarity = 'Common';
  }

  const matching = MASTER_ARTIFACTS_DATABASE.filter((a) => a.rarity === targetRarity);
  const picked = matching[Math.floor(Math.random() * matching.length)] || MASTER_ARTIFACTS_DATABASE[0];

  return {
    artifact: {
      ...picked,
      acquiredAt: Date.now(),
    },
    rollValue: roll,
    isMythicalDivine,
  };
}
