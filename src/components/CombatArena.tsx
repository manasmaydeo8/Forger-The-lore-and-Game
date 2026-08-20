import React from 'react';
import { ArenaCombat } from './ArenaCombat';
import { CharacterStats, ForgedSkill, TTSVoice } from '../types';

interface CombatArenaProps {
  stats: CharacterStats;
  onUpdateStats: (newStats: CharacterStats) => void;
  skills: ForgedSkill[];
  onUpdateSkills?: (newSkills: ForgedSkill[]) => void;
  onLevelUp: () => void;
  voice: TTSVoice;
}

export const CombatArena: React.FC<CombatArenaProps> = (props) => {
  return <ArenaCombat {...props} />;
};

export default CombatArena;
