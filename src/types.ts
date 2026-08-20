export type StorySectionId = 
  | 'prologue-world'
  | 'prologue-boy'
  | 'chapter-1-ceremony'
  | 'chapter-1-secret'
  | 'chapter-1-beginning'
  | 'chapter-1-final';

export interface SystemPromptMessage {
  type: 'system' | 'error' | 'status' | 'evolution' | 'crystal';
  header?: string;
  title: string;
  lines: string[];
  rank?: string;
  trueRank?: string;
  glowColor?: 'blue' | 'white' | 'red' | 'gold';
}

export interface StoryParagraph {
  id: string;
  text: string;
  type?: 'narrative' | 'dialogue' | 'internal' | 'system' | 'lore';
  speaker?: string;
  systemData?: SystemPromptMessage;
  ambientMood?: 'mystery' | 'temple' | 'silence' | 'explosion' | 'room' | 'forest' | 'demonic';
}

export interface StorySection {
  id: StorySectionId;
  part: string;
  title: string;
  subtitle: string;
  paragraphs: StoryParagraph[];
  bannerImage?: string;
  accentColor: string;
  estimatedReadTime: string;
}

export interface SkillEvolutionStage {
  stage: number;
  name: string;
  description: string;
  manaMultiplier: number;
  effect: string;
}

export interface ForgedSkill {
  id: string;
  name: string;
  publicRank: 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'EX';
  trueRank: string;
  category: 'Elemental' | 'Perception' | 'Body' | 'Unique' | 'Corrupted' | 'Forbidden';
  permanentManaCost: number;
  activeManaCost: number;
  description: string;
  magicalStructure: string;
  manaFlow: string;
  ignitionPhase?: string;
  compressionRatio?: string;
  currentStage: number;
  maxStages: number;
  stages: SkillEvolutionStage[];
  isForged: boolean;
  isCorrupted: boolean;
  synergyTags?: string[];
  relatedSkillIds?: string[];
  corruptedDetails?: {
    signature: string;
    origin: string;
    warning: string;
    unlockedSecret: string;
  };
}

export interface SkillSynergy {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  requiredCategoryOrTags: string[];
  minSkillsRequired: number;
  multiplier: number; // e.g. 1.30 = +30% boost
  effectBonus: string;
  synergyType: 'elemental' | 'body' | 'spacetime' | 'abyssal' | 'perception' | 'sovereign';
  badgeColor: string;
}

export interface ActiveSynergyBonus {
  synergy: SkillSynergy;
  matchingSkills: ForgedSkill[];
  isActive: boolean;
  multiplier: number;
  displayMultiplier: string;
}

export interface InnateSkill {
  id: string;
  name: string;
  tier: string;
  type: 'Innate Passive' | 'Soul Sovereign' | 'Primordial Core';
  description: string;
  replenishRate: number; // Mana replenished per tick
  replenishInterval: number; // Seconds per tick
  isActive: boolean;
  loreSnippet: string;
}

export interface UniqueLootItem {
  id: string;
  name: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'Void Primordial';
  type: 'relic' | 'core' | 'essence' | 'tome' | 'catalyst' | 'weapon' | 'armor';
  description: string;
  loreSnippet: string;
  icon: string;
  statsBonus?: {
    permanentManaBonus?: number;
    maxHpBonus?: number;
    defenseBonus?: number;
    strengthBonus?: number;
    agilityBonus?: number;
    intelligenceBonus?: number;
    synergyMultiplierBonus?: number;
    crystalHarvestBonus?: number;
    voidDropRateBonus?: number;
  };
  specialEffect?: string;
  isEquipped?: boolean;
}

export interface CharacterStats {
  name: string;
  title: string;
  age: number;
  level: number;
  experience: number;
  nextLevelExp: number;
  hp: number;
  maxHp: number;
  strength: number;
  agility: number;
  defense: number;
  intelligence: number;
  permanentMana: number; // Current unspent / usable mana
  maxPermanentMana: number; // Total soul capacity (e.g. 100 MP)
  boundPermanentMana?: number; // Mana locked into forged skill matrices
  usablePermanentManaCap?: number; // (maxPermanentMana - boundPermanentMana)
  strategicStance?: 'Pure Wellspring' | 'Balanced Arsenal' | 'Overcharged Sovereign' | 'Soul Strain Hazard';
  activeMana: number;
  maxActiveMana: number;
  manaCrystals: number; // Standard Monster Mana Crystals
  voidManaCrystals?: number; // Higher-tier Pure Void Mana Crystals (🔮)
  totalCrystalsHarvested?: number;
  totalVoidCrystalsHarvested?: number;
  relicInventory?: UniqueLootItem[];
  equippedRelicIds?: string[];
  manaCoreIntegrity: number; // percentage
  statusEffects: string[];
  innateSkill: InnateSkill;
  isReplenishing?: boolean;
}

export interface EnemyAbility {
  name: string;
  description: string;
  damage: number;
  manaCost: number;
  type: 'physical' | 'magical' | 'abyssal' | 'aoe' | 'lethal';
}

export interface Enemy {
  id: string;
  name: string;
  title: string;
  rank: 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'CALAMITY';
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  attack: number;
  defense: number;
  agility: number;
  elementalWeakness?: string;
  elementalResistance?: string;
  abilities: EnemyAbility[];
  lore: string;
  threatAssessment: string;
  isDefeated?: boolean;
  isVoidCorrupted?: boolean;
  corruptionTier?: 'Tainted' | 'Abyssal' | 'Dimensional' | 'Apex Void Horror';
  corruptionAffixes?: string[];
  voidLootTable?: UniqueLootItem[];
  rewards: {
    exp: number;
    permanentManaBonus?: number;
    manaCrystals?: number; // Crystals harvested from corpse upon victory
    minCrystals?: number;
    maxCrystals?: number;
    voidManaCrystals?: number; // Higher-tier crystals
    minVoidCrystals?: number;
    maxVoidCrystals?: number;
    unlockedBlueprintName?: string;
    description: string;
  };
  iconType: 'goblin' | 'wolf' | 'shaman' | 'orc' | 'wyrm' | 'monarch' | 'imp' | 'bandit' | 'void';
  category?: 'all' | 'goblin' | 'demon' | 'bandit' | 'beast' | 'void' | 'monarch';
  dangerLevel: 'Low' | 'Moderate' | 'Dangerous' | 'Severe' | 'Extreme' | 'Fatal Catastrophe';
  dangerColor: string;
}

export interface CombatRoundLog {
  round: number;
  attacker: string;
  action: string;
  damageDealt: number;
  isCritical?: boolean;
  isSynergyBoosted?: boolean;
  synergyName?: string;
  description: string;
  playerHpRemaining: number;
  playerMpRemaining: number;
  enemyHpRemaining: number;
  enemyMpRemaining: number;
}

export interface CombatResult {
  winner: 'player' | 'enemy';
  rounds: CombatRoundLog[];
  turnsTaken: number;
  expGained?: number;
  leveledUp?: boolean;
  permanentManaGained?: number;
  manaCrystalsGained?: number;
  voidManaCrystalsGained?: number;
  lootDropped?: UniqueLootItem[];
  defeatReason?: string;
  tacticalAdvice?: string;
}

export type TTSVoice = 'Fenrir' | 'Zephyr' | 'Charon' | 'Kore' | 'Puck';

export interface SaveSlotData {
  id: string; // 'autosave' | 'quicksave' | 'slot-1' | 'slot-2' | 'slot-3' | custom
  label: string;
  savedAt: number; // Unix timestamp
  stats: CharacterStats;
  skills: ForgedSkill[];
  currentSectionId: StorySectionId;
  activeTab: 'cinematic' | 'reader' | 'forge' | 'arena' | 'codex';
  selectedVoice: TTSVoice;
  summary: {
    level: number;
    title: string;
    permanentMana: number;
    maxPermanentMana: number;
    manaCrystals: number;
    voidManaCrystals: number;
    forgedSkillsCount: number;
    highestSkillTier?: string;
    chapterName: string;
    chapterPart: string;
  };
}

export interface SaveArchiveExport {
  app: 'FORGER_RPG_CHRONICLES';
  exportVersion: number;
  exportedAt: number;
  slots: Record<string, SaveSlotData>;
  currentAutoSave?: SaveSlotData;
}

export interface TTSState {
  isPlaying: boolean;
  isLoading: boolean;
  currentText: string;
  currentSectionId?: string;
  currentParagraphId?: string;
  voice: TTSVoice;
  speed: number;
  audioUrl?: string;
  error?: string | null;
}

export function getSkillEvolutionCrystalCost(skill: ForgedSkill): number {
  const currentStage = skill.currentStage || 1;
  // Base cost scaled by stage
  const baseCostTable: Record<number, number> = {
    1: 40,
    2: 75,
    3: 120,
    4: 180,
    5: 250,
    6: 340,
    7: 450,
    8: 580,
    9: 720,
    10: 900,
    11: 1100,
    12: 1350,
    13: 1650,
    14: 2000,
  };
  const base = baseCostTable[currentStage] || Math.round(currentStage * 150);
  return base;
}
