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
  corruptedDetails?: {
    signature: string;
    origin: string;
    warning: string;
    unlockedSecret: string;
  };
}

export interface CharacterStats {
  name: string;
  title: string;
  age: number;
  level: number;
  experience: number;
  nextLevelExp: number;
  strength: number;
  agility: number;
  defense: number;
  intelligence: number;
  permanentMana: number;
  maxPermanentMana: number;
  activeMana: number;
  maxActiveMana: number;
  manaCoreIntegrity: number; // percentage
  statusEffects: string[];
}

export type TTSVoice = 'Fenrir' | 'Zephyr' | 'Charon' | 'Kore' | 'Puck';

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
