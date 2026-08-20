import React, { useState, useEffect, useRef } from 'react';
import {
  CharacterStats,
  ForgedSkill,
  Enemy,
  CombatResult,
  CombatRoundLog,
  TTSVoice,
  UniqueLootItem,
} from '../types';
import { AETHERIA_ENEMIES, calculateEnemyHarvestCrystals } from '../data/enemyData';
import { calculateActiveSynergies, getSkillSynergyMultiplier, calculateCombatPower } from '../utils/synergy';
import { SoundFX } from '../utils/soundEffects';
import { narrateText, stopAllAudio } from '../services/ttsService';
import { generateRandomVoidEncounter, VoidEncounterResult } from '../utils/voidEncounters';
import { UNIQUE_VOID_LOOT_TABLE } from '../data/voidLootData';
import {
  Sword,
  Shield,
  Zap,
  Heart,
  Skull,
  Flame,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Volume2,
  Activity,
  Award,
  Crosshair,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Landmark,
  Radio,
  Filter,
  Package,
  Layers,
  HelpCircle,
  Clock,
  Compass,
} from 'lucide-react';

interface ArenaCombatProps {
  stats: CharacterStats;
  onUpdateStats: (newStats: CharacterStats) => void;
  skills: ForgedSkill[];
  onUpdateSkills?: (newSkills: ForgedSkill[]) => void;
  onLevelUp: () => void;
  voice: TTSVoice;
}

interface ShrineLog {
  id: string;
  timestamp: string;
  ritualName: string;
  success: boolean;
  crystalsGained: number;
  voidAttracted: boolean;
  enemyAttractedName?: string;
  description: string;
}

export const ArenaCombat: React.FC<ArenaCombatProps> = ({
  stats,
  onUpdateStats,
  skills,
  onUpdateSkills,
  onLevelUp,
  voice,
}) => {
  // Arena Mode: 'encounters' | 'bestiary' | 'shrine' | 'vault'
  const [arenaTab, setArenaTab] = useState<'encounters' | 'bestiary' | 'shrine' | 'vault'>('encounters');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'goblin' | 'demon' | 'bandit' | 'beast' | 'void' | 'monarch'>('all');

  const [activeEnemy, setActiveEnemy] = useState<Enemy>(AETHERIA_ENEMIES[0]);
  const [inBattle, setInBattle] = useState(false);
  const [playerHp, setPlayerHp] = useState<number>(stats.hp || 120);
  const [playerMaxHp, setPlayerMaxHp] = useState<number>(stats.maxHp || 120);
  const [enemyHp, setEnemyHp] = useState<number>(100);
  const [enemyMaxHp, setEnemyMaxHp] = useState<number>(100);
  const [enemyMp, setEnemyMp] = useState<number>(30);
  const [playerShield, setPlayerShield] = useState<number>(0);
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [combatLogs, setCombatLogs] = useState<CombatRoundLog[]>([]);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);
  const [selectedSkillToCastId, setSelectedSkillToCastId] = useState<string>(
    skills.find((s) => s.isForged)?.id || skills[0]?.id || ''
  );
  const [isNarratingBattle, setIsNarratingBattle] = useState(false);

  // Void Encounter Scanner State
  const [isScanningVoid, setIsScanningVoid] = useState(false);
  const [scoutedEncounter, setScoutedEncounter] = useState<VoidEncounterResult | null>(null);
  const [voidDistortionLevel, setVoidDistortionLevel] = useState(45);

  // Victory Loot Modal State
  const [showLootModal, setShowLootModal] = useState(false);
  const [inspectedLoot, setInspectedLoot] = useState<UniqueLootItem | null>(null);

  // Shrine State
  const [isChannelingRitual, setIsChannelingRitual] = useState(false);
  const [activeRitualType, setActiveRitualType] = useState<string | null>(null);
  const [shrineLogs, setShrineLogs] = useState<ShrineLog[]>([]);
  const [activeVoidBreach, setActiveVoidBreach] = useState<{
    enemy: Enemy;
    message: string;
    crystalsFound: number;
  } | null>(null);

  const combatLogEndRef = useRef<HTMLDivElement>(null);

  // Active Synergies and Calculated Power
  const activeSynergies = calculateActiveSynergies(skills);
  const combatPower = calculateCombatPower(stats, skills, activeSynergies);
  const forgedSkills = skills.filter((s) => s.isForged);

  // Relic Bonuses calculation
  const inventory = stats.relicInventory || [];
  const equippedRelicIds = new Set(stats.equippedRelicIds || inventory.filter((r) => r.isEquipped).map((r) => r.id));
  const equippedRelics = inventory.filter((r) => equippedRelicIds.has(r.id));

  const relicBonusHp = equippedRelics.reduce((acc, r) => acc + (r.statsBonus?.maxHpBonus || 0), 0);
  const relicBonusDef = equippedRelics.reduce((acc, r) => acc + (r.statsBonus?.defenseBonus || 0), 0);
  const relicBonusInt = equippedRelics.reduce((acc, r) => acc + (r.statsBonus?.intelligenceBonus || 0), 0);
  const relicBonusStr = equippedRelics.reduce((acc, r) => acc + (r.statsBonus?.strengthBonus || 0), 0);
  const relicBonusAgi = equippedRelics.reduce((acc, r) => acc + (r.statsBonus?.agilityBonus || 0), 0);
  const relicBonusHarvestPercent = equippedRelics.reduce((acc, r) => acc + (r.statsBonus?.crystalHarvestBonus || 0), 0);
  const relicHarvestMultiplier = 1 + relicBonusHarvestPercent / 100;

  // Filtered Enemies
  const filteredEnemies = AETHERIA_ENEMIES.filter((enemy) => {
    if (categoryFilter === 'all') return true;
    return enemy.category === categoryFilter;
  });

  // Keep player max HP updated based on defense, strength, and equipped relics
  useEffect(() => {
    if (!inBattle) {
      const calculatedMaxHp = 100 + (stats.defense + relicBonusDef) * 8 + (stats.strength + relicBonusStr) * 4 + relicBonusHp;
      setPlayerMaxHp(calculatedMaxHp);
      setPlayerHp(stats.hp ? Math.min(stats.hp, calculatedMaxHp) : calculatedMaxHp);
    }
  }, [stats.hp, stats.maxHp, stats.defense, stats.strength, relicBonusHp, relicBonusDef, relicBonusStr, inBattle]);

  // Scroll combat log to bottom
  useEffect(() => {
    if (combatLogEndRef.current) {
      combatLogEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [combatLogs]);

  // Generate an initial void scout encounter on mount
  useEffect(() => {
    if (!scoutedEncounter) {
      const initial = generateRandomVoidEncounter(stats.level);
      setScoutedEncounter(initial);
      setVoidDistortionLevel(initial.distortionLevel);
    }
  }, []);

  // Scout / Scan for a new Random Void Encounter
  const handleTriggerRandomVoidScout = () => {
    setIsScanningVoid(true);
    SoundFX.playVoidRadarPulse();
    const newDistortion = Math.floor(Math.random() * 60) + 40;
    setVoidDistortionLevel(newDistortion);

    setTimeout(() => {
      const result = generateRandomVoidEncounter(stats.level);
      setScoutedEncounter(result);
      setIsScanningVoid(false);
      SoundFX.playVoidBreach();
    }, 650);
  };

  // Start battle against selected or scouted enemy
  const handleStartBattle = (enemy: Enemy) => {
    setActiveEnemy(enemy);
    SoundFX.playFireballIgnition();
    const calculatedMaxHp = 100 + (stats.defense + relicBonusDef) * 8 + (stats.strength + relicBonusStr) * 4 + relicBonusHp;
    setPlayerMaxHp(calculatedMaxHp);
    setPlayerHp(calculatedMaxHp);
    setEnemyHp(enemy.hp);
    setEnemyMaxHp(enemy.maxHp);
    setEnemyMp(enemy.mp);
    setPlayerShield(0);
    setRoundNumber(1);
    setCombatResult(null);
    setShowLootModal(false);
    setIsProcessingTurn(false);
    setActiveVoidBreach(null);

    const initialLog: CombatRoundLog = {
      round: 1,
      attacker: 'Aryan',
      action: `Encounter initiated against [${enemy.name}]!`,
      damageDealt: 0,
      isCritical: false,
      description: enemy.isVoidCorrupted
        ? `Aryan detects severe spatial distortion! [${enemy.name}] surges from the rift carrying affixes: ${enemy.corruptionAffixes?.join(', ')}.`
        : `Aryan activates Forger mana matrices against ${enemy.title} [${enemy.name}] (${enemy.dangerLevel} Threat).`,
      playerHpRemaining: calculatedMaxHp,
      playerMpRemaining: stats.activeMana,
      enemyHpRemaining: enemy.hp,
      enemyMpRemaining: enemy.mp,
    };

    setCombatLogs([initialLog]);
    setInBattle(true);
  };

  // Aryan Basic Strike
  const handlePlayerBasicAttack = () => {
    if (isProcessingTurn || !inBattle || enemyHp <= 0 || playerHp <= 0) return;
    executeTurn('strike');
  };

  // Aryan Channel Forged Spell
  const handlePlayerCastSkill = () => {
    if (isProcessingTurn || !inBattle || enemyHp <= 0 || playerHp <= 0) return;
    const skill = skills.find((s) => s.id === selectedSkillToCastId);
    if (!skill) return;

    if (stats.activeMana < skill.activeManaCost) {
      SoundFX.playDissolve();
      const failLog: CombatRoundLog = {
        round: roundNumber,
        attacker: 'Aryan',
        action: `Insufficient Active Mana!`,
        damageDealt: 0,
        description: `Failed to cast [${skill.name}]. Requires ${skill.activeManaCost} Active MP, but only ${stats.activeMana} MP is available.`,
        playerHpRemaining: playerHp,
        playerMpRemaining: stats.activeMana,
        enemyHpRemaining: enemyHp,
        enemyMpRemaining: enemyMp,
      };
      setCombatLogs((prev) => [...prev, failLog]);
      return;
    }

    executeTurn('spell', skill);
  };

  // Aryan Aegis Barrier
  const handlePlayerBarrier = () => {
    if (isProcessingTurn || !inBattle || enemyHp <= 0 || playerHp <= 0) return;
    executeTurn('barrier');
  };

  // Aryan Autonomic Wellspring Siphon
  const handlePlayerSiphon = () => {
    if (isProcessingTurn || !inBattle || enemyHp <= 0 || playerHp <= 0) return;
    executeTurn('siphon');
  };

  // Core Combat Loop
  const executeTurn = (
    actionType: 'strike' | 'spell' | 'barrier' | 'siphon',
    skillToCast?: ForgedSkill
  ) => {
    setIsProcessingTurn(true);
    const newLogs: CombatRoundLog[] = [];
    let curPlayerHp = playerHp;
    let curPlayerMp = stats.activeMana;
    let curPlayerShield = playerShield;
    let curEnemyHp = enemyHp;
    let curEnemyMp = enemyMp;

    // 1. Aryan's Action
    let playerDamage = 0;
    let isCrit = false;
    let isSynergyBoosted = false;
    let actionTitle = '';
    let actionDesc = '';

    const effectiveStr = stats.strength + relicBonusStr;
    const effectiveAgi = stats.agility + relicBonusAgi;
    const effectiveInt = stats.intelligence + relicBonusInt;

    if (actionType === 'strike') {
      SoundFX.playPunch();
      const critRoll = Math.random();
      isCrit = critRoll > 0.8;
      const baseDmg = Math.round(effectiveStr * 3.5 + effectiveAgi * 1.5 + Math.random() * 8);
      playerDamage = isCrit ? Math.round(baseDmg * 1.8) : baseDmg;

      // Null phase shield affix check
      if (activeEnemy.corruptionAffixes?.includes('Null-Phase Shield')) {
        playerDamage = Math.round(playerDamage * 0.75);
      }

      curEnemyHp = Math.max(0, curEnemyHp - playerDamage);
      actionTitle = isCrit ? `Critical Kinetic Strike!` : `Physical Blade Strike`;
      actionDesc = `Aryan strikes [${activeEnemy.name}] for ${playerDamage} damage${isCrit ? ' (CRITICAL HIT!)' : ''}.`;
    } else if (actionType === 'spell' && skillToCast) {
      SoundFX.playSpellChime();
      curPlayerMp = Math.max(0, curPlayerMp - skillToCast.activeManaCost);

      const { totalMultiplier: synMultiplier } = getSkillSynergyMultiplier(skillToCast, activeSynergies);
      isSynergyBoosted = synMultiplier > 1.0;

      const stageInfo = skillToCast.stages.find((s) => s.stage === skillToCast.currentStage) || skillToCast.stages[0];
      const stageMultiplier = stageInfo?.manaMultiplier || 1.0;

      const baseSpellDmg = Math.round((28 + effectiveInt * 4.5 + skillToCast.permanentManaCost * 2) * stageMultiplier);
      const isWeakness =
        activeEnemy.elementalWeakness &&
        skillToCast.synergyTags?.some((tag) =>
          activeEnemy.elementalWeakness?.toLowerCase().includes(tag.toLowerCase())
        );

      let totalDmg = Math.round(baseSpellDmg * synMultiplier);
      if (isWeakness) {
        totalDmg = Math.round(totalDmg * 1.5);
      }

      playerDamage = totalDmg;
      curEnemyHp = Math.max(0, curEnemyHp - playerDamage);

      actionTitle = `Cast: ${skillToCast.name} (Stage ${skillToCast.currentStage})`;
      actionDesc = `Aryan unleashes [${skillToCast.name}] dealing ${playerDamage} magical damage! ${
        isSynergyBoosted ? `[Synergy Amplified: ${(synMultiplier * 100).toFixed(0)}%]` : ''
      } ${isWeakness ? `[ELEMENTAL WEAKNESS EXPLOITED! +50%]` : ''}`;
    } else if (actionType === 'barrier') {
      SoundFX.playMatrixPulse();
      const shieldAmount = Math.round(35 + (stats.defense + relicBonusDef) * 3 + effectiveInt * 1.5);
      curPlayerShield += shieldAmount;
      actionTitle = `Aegis Barrier Matrix Engaged`;
      actionDesc = `Aryan deploys a protective mana barrier absorbing up to ${shieldAmount} incoming damage (Current Shield: ${curPlayerShield}).`;
    } else if (actionType === 'siphon') {
      SoundFX.playCrystalPulse();
      const recoveredMp = Math.min(stats.maxActiveMana - curPlayerMp, 25 + stats.innateSkill.replenishRate * 4);
      curPlayerMp += recoveredMp;
      actionTitle = `Primordial Wellspring Siphon`;
      actionDesc = `Aryan forces ambient atmospheric mana into his active channels, rapidly recovering +${recoveredMp} Active MP.`;
    }

    newLogs.push({
      round: roundNumber,
      attacker: 'Aryan',
      action: actionTitle,
      damageDealt: playerDamage,
      isCritical: isCrit,
      isSynergyBoosted,
      description: actionDesc,
      playerHpRemaining: curPlayerHp,
      playerMpRemaining: curPlayerMp,
      enemyHpRemaining: curEnemyHp,
      enemyMpRemaining: curEnemyMp,
    });

    // 2. Check if Enemy Defeated
    if (curEnemyHp <= 0) {
      handleCombatVictory(newLogs, roundNumber, curPlayerHp, curPlayerMp);
      return;
    }

    // 3. Enemy Counter-Attack
    setTimeout(() => {
      const enemyAbility =
        activeEnemy.abilities.length > 0 && Math.random() > 0.4
          ? activeEnemy.abilities[Math.floor(Math.random() * activeEnemy.abilities.length)]
          : null;

      let enemyDamage = 0;
      let enemyActionTitle = '';
      let enemyActionDesc = '';

      if (enemyAbility && curEnemyMp >= enemyAbility.manaCost) {
        curEnemyMp = Math.max(0, curEnemyMp - enemyAbility.manaCost);
        enemyDamage = Math.max(1, Math.round(enemyAbility.damage - (stats.defense + relicBonusDef) * 0.7));
        enemyActionTitle = `Special: ${enemyAbility.name}`;
        enemyActionDesc = `[${activeEnemy.name}] unleashes [${enemyAbility.name}]! ${enemyAbility.description} (Dealt ${enemyDamage} damage).`;
      } else {
        enemyDamage = Math.max(1, Math.round(activeEnemy.attack - (stats.defense + relicBonusDef) * 0.5 + Math.random() * 4));
        enemyActionTitle = `Physical Attack`;
        enemyActionDesc = `[${activeEnemy.name}] strikes Aryan with physical ferocity for ${enemyDamage} damage.`;
      }

      // Absorb with shield first
      if (curPlayerShield > 0) {
        if (curPlayerShield >= enemyDamage) {
          curPlayerShield -= enemyDamage;
          enemyActionDesc += ` (Entirely absorbed by Aryan's Aegis Barrier! ${curPlayerShield} shield remaining).`;
          enemyDamage = 0;
        } else {
          const absorbed = curPlayerShield;
          enemyDamage -= absorbed;
          curPlayerShield = 0;
          enemyActionDesc += ` (${absorbed} absorbed by barrier, remaining ${enemyDamage} penetrates flesh!).`;
        }
      }

      curPlayerHp = Math.max(0, curPlayerHp - enemyDamage);

      newLogs.push({
        round: roundNumber,
        attacker: activeEnemy.name,
        action: enemyActionTitle,
        damageDealt: enemyDamage,
        isCritical: false,
        description: enemyActionDesc,
        playerHpRemaining: curPlayerHp,
        playerMpRemaining: curPlayerMp,
        enemyHpRemaining: curEnemyHp,
        enemyMpRemaining: curEnemyMp,
      });

      setPlayerHp(curPlayerHp);
      setPlayerShield(curPlayerShield);
      setEnemyHp(curEnemyHp);
      setEnemyMp(curEnemyMp);
      setCombatLogs((prev) => [...prev, ...newLogs]);
      setRoundNumber((prev) => prev + 1);
      setIsProcessingTurn(false);

      // Sync active mana in stats
      onUpdateStats({
        ...stats,
        activeMana: curPlayerMp,
        hp: curPlayerHp,
      });

      // 4. Check if Player Defeated
      if (curPlayerHp <= 0) {
        handleCombatDefeat(newLogs, roundNumber);
      }
    }, 450);
  };

  // Handle Player Victory
  const handleCombatVictory = (
    finalRoundLogs: CombatRoundLog[],
    turns: number,
    finalPlayerHp: number,
    finalPlayerMp: number
  ) => {
    SoundFX.playLevelUp();
    SoundFX.playLootDrop();

    // Calculate harvested crystals with relic multipliers
    const baseStandardCrystals = calculateEnemyHarvestCrystals(activeEnemy);
    const standardCrystalsGained = Math.round(baseStandardCrystals * relicHarvestMultiplier);

    // Calculate higher-tier void crystals
    let voidCrystalsGained = 0;
    if (activeEnemy.isVoidCorrupted || activeEnemy.category === 'void' || activeEnemy.category === 'monarch') {
      const baseVoid = activeEnemy.rewards.voidManaCrystals || (activeEnemy.rank === 'S' ? 50 : 20);
      voidCrystalsGained = Math.round(baseVoid * relicHarvestMultiplier);
    }

    // Determine Unique Loot Drop
    let droppedLoot: UniqueLootItem[] = [];
    if (activeEnemy.voidLootTable && activeEnemy.voidLootTable.length > 0) {
      droppedLoot = [...activeEnemy.voidLootTable];
    } else if (activeEnemy.isVoidCorrupted || Math.random() < 0.35) {
      const randomLoot = UNIQUE_VOID_LOOT_TABLE[Math.floor(Math.random() * UNIQUE_VOID_LOOT_TABLE.length)];
      droppedLoot = [randomLoot];
    }

    const expGained = activeEnemy.rewards.exp;
    const permManaGained = activeEnemy.rewards.permanentManaBonus || 3;

    // Check level up
    const newExp = stats.experience + expGained;
    let leveledUp = false;
    let newLevel = stats.level;
    let newNextExp = stats.nextLevelExp;
    let newMaxHp = playerMaxHp;
    let newStr = stats.strength;
    let newAgi = stats.agility;
    let newDef = stats.defense;
    let newInt = stats.intelligence;
    let newMaxPermMana = stats.maxPermanentMana + permManaGained;

    if (newExp >= stats.nextLevelExp) {
      leveledUp = true;
      newLevel += 1;
      newNextExp = Math.round(stats.nextLevelExp * 1.5);
      newStr += 2;
      newAgi += 2;
      newDef += 2;
      newInt += 4;
      newMaxPermMana += 10;
      newMaxHp += 20;
    }

    // Update Relic Inventory
    const updatedInventory = [...(stats.relicInventory || [])];
    droppedLoot.forEach((item) => {
      if (!updatedInventory.some((r) => r.id === item.id)) {
        updatedInventory.push(item);
      }
    });

    const newStats: CharacterStats = {
      ...stats,
      level: newLevel,
      experience: newExp,
      nextLevelExp: newNextExp,
      strength: newStr,
      agility: newAgi,
      defense: newDef,
      intelligence: newInt,
      maxPermanentMana: newMaxPermMana,
      permanentMana: Math.min(newMaxPermMana, stats.permanentMana + permManaGained),
      manaCrystals: (stats.manaCrystals || 0) + standardCrystalsGained,
      voidManaCrystals: (stats.voidManaCrystals || 0) + voidCrystalsGained,
      totalCrystalsHarvested: (stats.totalCrystalsHarvested || 0) + standardCrystalsGained,
      totalVoidCrystalsHarvested: (stats.totalVoidCrystalsHarvested || 0) + voidCrystalsGained,
      relicInventory: updatedInventory,
      activeMana: finalPlayerMp,
      hp: finalPlayerHp,
    };

    onUpdateStats(newStats);

    const result: CombatResult = {
      winner: 'player',
      rounds: finalRoundLogs,
      turnsTaken: turns,
      expGained,
      leveledUp,
      permanentManaGained: permManaGained,
      manaCrystalsGained: standardCrystalsGained,
      voidManaCrystalsGained: voidCrystalsGained,
      lootDropped: droppedLoot,
    };

    setCombatResult(result);
    setEnemyHp(0);
    setIsProcessingTurn(false);
    setShowLootModal(true);
  };

  // Handle Player Defeat
  const handleCombatDefeat = (finalRoundLogs: CombatRoundLog[], turns: number) => {
    SoundFX.playDissolve();

    const result: CombatResult = {
      winner: 'enemy',
      rounds: finalRoundLogs,
      turnsTaken: turns,
      defeatReason: `Aryan was overpowered by ${activeEnemy.name}'s ferocious onslaught.`,
      tacticalAdvice: `Forge additional high-rank elemental spells in the Forge Lab, harmonize skill synergies, or harvest mana crystals to evolve your current stages before re-engaging.`,
    };

    setCombatResult(result);
    setIsProcessingTurn(false);
  };

  // Reset Arena Combat
  const handleResetCombat = () => {
    setInBattle(false);
    setCombatResult(null);
    setShowLootModal(false);
    setCombatLogs([]);
    const calculatedMaxHp = 100 + (stats.defense + relicBonusDef) * 8 + (stats.strength + relicBonusStr) * 4 + relicBonusHp;
    setPlayerHp(calculatedMaxHp);
    onUpdateStats({
      ...stats,
      hp: calculatedMaxHp,
      activeMana: stats.maxActiveMana,
    });
  };

  // Equip / Unequip Relic Toggle
  const handleToggleEquipRelic = (relicId: string) => {
    SoundFX.playRelicEquip();
    const currentEquipped = new Set(stats.equippedRelicIds || []);
    if (currentEquipped.has(relicId)) {
      currentEquipped.delete(relicId);
    } else {
      currentEquipped.add(relicId);
    }
    const updatedEquippedIds = Array.from(currentEquipped);
    const updatedInventory = (stats.relicInventory || []).map((r) => ({
      ...r,
      isEquipped: updatedEquippedIds.includes(r.id),
    }));

    onUpdateStats({
      ...stats,
      equippedRelicIds: updatedEquippedIds,
      relicInventory: updatedInventory,
    });
  };

  // Channel Ancient Mana Shrine Ritual
  const handleChannelShrine = (ritualType: 'whispering' | 'abyssal' | 'primordial') => {
    if (isChannelingRitual) return;
    setIsChannelingRitual(true);
    setActiveRitualType(ritualType);
    SoundFX.playShrineChime();

    setTimeout(() => {
      let crystalsGained = 0;
      let voidTriggerChance = 0.2;
      let ritualTitle = '';
      let desc = '';

      if (ritualType === 'whispering') {
        crystalsGained = Math.floor(Math.random() * 30) + 20;
        voidTriggerChance = 0.15;
        ritualTitle = 'Whispering Ley-Line Inscription';
        desc = `Extracted +${crystalsGained} Pure Mana Shards from atmospheric crystal strata.`;
      } else if (ritualType === 'abyssal') {
        crystalsGained = Math.floor(Math.random() * 75) + 50;
        voidTriggerChance = 0.45;
        ritualTitle = 'Abyssal Core Resonance Tap';
        desc = `High-intensity subterranean surge yielded +${crystalsGained} High-Density Mana Crystals!`;
      } else {
        crystalsGained = Math.floor(Math.random() * 160) + 120;
        voidTriggerChance = 0.75;
        ritualTitle = 'Primordial Rift Overload';
        desc = `Massive cosmic rupture tapped! Harvested +${crystalsGained} Pure Concentrated Crystals!`;
      }

      // Check void breach trigger
      const roll = Math.random();
      const didAttractVoid = roll < voidTriggerChance;

      // Update crystals
      onUpdateStats({
        ...stats,
        manaCrystals: (stats.manaCrystals || 0) + crystalsGained,
        totalCrystalsHarvested: (stats.totalCrystalsHarvested || 0) + crystalsGained,
      });

      if (didAttractVoid) {
        SoundFX.playVoidBreach();
        // Generate a random void encounter
        const voidEncounter = generateRandomVoidEncounter(stats.level);
        setActiveVoidBreach({
          enemy: voidEncounter.enemy,
          message: `DANGER! The ${ritualTitle} tore open a localized dimensional breach! An enraged [${voidEncounter.enemy.name}] (${voidEncounter.corruptionTier} Anomaly) has materialized to defend the ley-line!`,
          crystalsFound: crystalsGained,
        });
      } else {
        SoundFX.playCrystalPulse();
      }

      const newLog: ShrineLog = {
        id: `shrine-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        ritualName: ritualTitle,
        success: true,
        crystalsGained,
        voidAttracted: didAttractVoid,
        enemyAttractedName: didAttractedVoidMonsterName(didAttractVoid),
        description: desc,
      };

      setShrineLogs((prev) => [newLog, ...prev]);
      setIsChannelingRitual(false);
      setActiveRitualType(null);
    }, 1200);
  };

  const didAttractedVoidMonsterName = (didAttract: boolean) => {
    if (!didAttract) return undefined;
    return 'Dimensional Void Entity';
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* ================= Header with Live Stats & Crystal Indicators ================= */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] shadow-xl">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/60 text-red-400">
              <Sword className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide font-mono flex items-center gap-2">
                <span>ARENA COMBAT & VOID ENCOUNTERS</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-200 border border-purple-700 font-mono uppercase tracking-wider">
                  Void Resonance
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Hunt void-corrupted monstrosities, conquer perilous ley-line anomalies, and harvest unique relics & higher-tier mana crystals.
              </p>
            </div>
          </div>
        </div>

        {/* Currency & Relic Indicators */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          {/* Standard Crystals */}
          <div
            title="Standard Monster Mana Crystals - Used for skill stage evolutions in Forge Lab"
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#0d0d0d] border border-amber-900/50 shadow-[0_0_12px_rgba(245,158,11,0.08)]"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Standard Crystals</div>
              <div className="font-bold text-amber-300 text-sm">{stats.manaCrystals || 0} 💎</div>
            </div>
          </div>

          {/* Higher-Tier Pure Void Crystals */}
          <div
            title="High-Tier Void Mana Crystals (🔮) - Concentrated dimensional crystals dropped by Void-Corrupted monsters"
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#0e0817] border border-purple-800/60 shadow-[0_0_12px_rgba(168,85,247,0.12)]"
          >
            <div className="w-4 h-4 text-purple-400 flex items-center justify-center font-bold">🔮</div>
            <div>
              <div className="text-[10px] uppercase text-purple-400 font-semibold">Void Crystals</div>
              <div className="font-bold text-purple-200 text-sm">{stats.voidManaCrystals || 0} 🔮</div>
            </div>
          </div>

          {/* Relic Vault Status */}
          <div
            onClick={() => setArenaTab('vault')}
            title="Equipped Artifacts & Void Relics"
            className="cursor-pointer hover:border-cyan-500/60 transition flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#0d0d0d] border border-[#222]"
          >
            <Package className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Equipped Relics</div>
              <div className="font-bold text-cyan-300 text-sm">
                {equippedRelics.length}/{inventory.length} 🛡️
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= Navigation Tabs ================= */}
      <div className="flex items-center space-x-2 border-b border-[#1a1a1a] pb-3">
        <button
          id="arena-tab-encounters"
          onClick={() => {
            SoundFX.playSystemNotification();
            setArenaTab('encounters');
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition ${
            arenaTab === 'encounters'
              ? 'bg-purple-950/80 text-purple-200 border border-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
              : 'bg-[#0d0d0d] text-slate-400 hover:text-slate-200 border border-[#222]'
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span>Random Void Encounters</span>
        </button>

        <button
          id="arena-tab-bestiary"
          onClick={() => {
            SoundFX.playSystemNotification();
            setArenaTab('bestiary');
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition ${
            arenaTab === 'bestiary'
              ? 'bg-white/10 text-white border border-white/20'
              : 'bg-[#0d0d0d] text-slate-400 hover:text-slate-200 border border-[#222]'
          }`}
        >
          <Skull className="w-3.5 h-3.5 text-red-400" />
          <span>Adversary Bestiary</span>
        </button>

        <button
          id="arena-tab-shrine"
          onClick={() => {
            SoundFX.playShrineChime();
            setArenaTab('shrine');
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition ${
            arenaTab === 'shrine'
              ? 'bg-amber-950/60 text-amber-200 border border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              : 'bg-[#0d0d0d] text-slate-400 hover:text-slate-200 border border-[#222]'
          }`}
        >
          <Landmark className="w-3.5 h-3.5 text-amber-400" />
          <span>Ancient Mana Shrine</span>
        </button>

        <button
          id="arena-tab-vault"
          onClick={() => {
            SoundFX.playSystemNotification();
            setArenaTab('vault');
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition ${
            arenaTab === 'vault'
              ? 'bg-cyan-950/60 text-cyan-200 border border-cyan-600 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
              : 'bg-[#0d0d0d] text-slate-400 hover:text-slate-200 border border-[#222]'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-cyan-400" />
          <span>Relic & Loot Vault</span>
        </button>
      </div>

      {/* ================= ACTIVE BATTLE VIEW ================= */}
      {inBattle ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Combat Stage, Status, Actions */}
          <div className="lg:col-span-8 space-y-6">
            {/* Duel Stage Header */}
            <div className="p-6 rounded-xl bg-[#0a0a0a] border border-[#1f1f1f] relative overflow-hidden shadow-2xl">
              {/* Background Glow */}
              <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none ${
                activeEnemy.isVoidCorrupted ? 'bg-purple-600/10' : 'bg-red-600/10'
              }`} />

              <div className="flex items-center justify-between pb-4 border-b border-[#1a1a1a] mb-6">
                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className="text-slate-500 uppercase">Encounter Round:</span>
                  <span className="font-bold text-white px-2 py-0.5 rounded bg-[#1a1a1a]">#{roundNumber}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {activeEnemy.isVoidCorrupted && (
                    <span className="px-2.5 py-1 rounded bg-purple-950 text-purple-300 border border-purple-700 text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-purple-400" />
                      <span>{activeEnemy.corruptionTier} Void Anomaly</span>
                    </span>
                  )}
                  <button
                    onClick={handleResetCombat}
                    className="px-3 py-1 rounded bg-[#141414] hover:bg-[#222] text-slate-400 hover:text-white text-xs font-mono transition flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Flee Encounter</span>
                  </button>
                </div>
              </div>

              {/* Combatants Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* Player Card (Aryan) */}
                <div className="p-4 rounded-xl bg-[#0f0f0f] border border-[#222] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase text-slate-500 font-mono tracking-wider">The Forger</div>
                      <div className="text-base font-bold text-white font-mono">Aryan (Lvl {stats.level})</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-[10px] text-slate-500 uppercase">Combat Power</div>
                      <div className="text-xs font-bold text-cyan-400">{combatPower} CP</div>
                    </div>
                  </div>

                  {/* HP Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500" /> Health
                      </span>
                      <span className="font-bold text-white">
                        {playerHp} / {playerMaxHp} HP
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 transition-all duration-300 shadow-[0_0_8px_#f43f5e]"
                        style={{ width: `${Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Active MP Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Zap className="w-3 h-3 text-cyan-400" /> Active Mana
                      </span>
                      <span className="font-bold text-cyan-300">
                        {stats.activeMana} / {stats.maxActiveMana} MP
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_8px_#22d3ee]"
                        style={{ width: `${Math.max(0, Math.min(100, (stats.activeMana / stats.maxActiveMana) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Shield Status */}
                  {playerShield > 0 && (
                    <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-cyan-950/50 border border-cyan-800/80 text-cyan-300 font-mono text-xs animate-pulse">
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" /> Aegis Barrier Active
                      </span>
                      <span className="font-bold">+{playerShield} Absorbed</span>
                    </div>
                  )}
                </div>

                {/* Enemy Card */}
                <div className={`p-4 rounded-xl bg-[#0f0f0f] border space-y-3 ${
                  activeEnemy.isVoidCorrupted ? 'border-purple-800/80 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-[#222]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase text-slate-500 font-mono tracking-wider flex items-center gap-1">
                        <span>{activeEnemy.rank}-Rank</span>
                        <span>•</span>
                        <span>{activeEnemy.title}</span>
                      </div>
                      <div className="text-base font-bold text-white font-mono flex items-center gap-2">
                        <span>{activeEnemy.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                          Lvl {activeEnemy.level}
                        </span>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-[10px] text-slate-500 uppercase">Threat Level</div>
                      <div className="text-xs font-bold text-red-400">{activeEnemy.dangerLevel}</div>
                    </div>
                  </div>

                  {/* Enemy HP Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Heart className="w-3 h-3 text-rose-500" /> Hostile Health
                      </span>
                      <span className="font-bold text-rose-300">
                        {enemyHp} / {enemyMaxHp} HP
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          activeEnemy.isVoidCorrupted ? 'bg-purple-500 shadow-[0_0_8px_#a855f7]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                        }`}
                        style={{ width: `${Math.max(0, Math.min(100, (enemyHp / enemyMaxHp) * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Enemy Affixes */}
                  {activeEnemy.corruptionAffixes && activeEnemy.corruptionAffixes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeEnemy.corruptionAffixes.map((affix, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800 text-[10px] font-mono"
                        >
                          ⚡ {affix}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Player Command Console */}
              <div className="mt-6 pt-5 border-t border-[#1a1a1a] space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Tactical Directives:</span>
                  <span>Select an action to execute turn</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Action 1: Basic Kinetic Strike */}
                  <button
                    disabled={isProcessingTurn}
                    onClick={handlePlayerBasicAttack}
                    className="p-3 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] border border-[#2a2a2a] hover:border-slate-400 text-left transition space-y-1 group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
                        <Sword className="w-3.5 h-3.5 text-amber-400" /> Kinetic Strike
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">0 MP</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Standard melee attack scaled by Aryan's STR & AGI.
                    </p>
                  </button>

                  {/* Action 2: Cast Forged Skill Spell */}
                  <div className="p-3 rounded-lg bg-[#141414] border border-[#2a2a2a] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-cyan-400" /> Channel Spell
                      </span>
                      <button
                        disabled={isProcessingTurn}
                        onClick={handlePlayerCastSkill}
                        className="px-2 py-0.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-[10px] font-mono font-bold uppercase transition disabled:opacity-50"
                      >
                        Cast
                      </button>
                    </div>
                    <select
                      value={selectedSkillToCastId}
                      onChange={(e) => setSelectedSkillToCastId(e.target.value)}
                      className="w-full bg-[#0d0d0d] border border-[#333] rounded px-2 py-1 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                    >
                      {forgedSkills.map((sk) => (
                        <option key={sk.id} value={sk.id}>
                          {sk.name} (Stg {sk.currentStage}) • {sk.activeManaCost} MP
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action 3: Aegis Barrier Matrix */}
                  <button
                    disabled={isProcessingTurn}
                    onClick={handlePlayerBarrier}
                    className="p-3 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] border border-[#2a2a2a] hover:border-cyan-500/60 text-left transition space-y-1 group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white group-hover:text-cyan-300 transition flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-cyan-400" /> Aegis Barrier
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">DEF Scale</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Constructs a solid mana shield absorbing next incoming attacks.
                    </p>
                  </button>

                  {/* Action 4: Wellspring Siphon */}
                  <button
                    disabled={isProcessingTurn}
                    onClick={handlePlayerSiphon}
                    className="p-3 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] border border-[#2a2a2a] hover:border-purple-500/60 text-left transition space-y-1 group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white group-hover:text-purple-300 transition flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-purple-400" /> Siphon Mana
                      </span>
                      <span className="text-[10px] font-mono text-purple-400 font-bold">+25 MP</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Forces innate atmospheric intake to rapidly restore Active MP.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Combat Feed Logs */}
            <div className="p-5 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] space-y-3">
              <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-2">
                <span className="text-xs font-mono font-bold uppercase text-slate-400 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" /> Live Matrix Telemetry & Log
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {combatLogs.length} events recorded
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {combatLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2.5 rounded-lg text-xs font-mono border ${
                      log.attacker === 'Aryan'
                        ? 'bg-[#0f172a]/50 border-cyan-900/40 text-cyan-100'
                        : 'bg-[#1e1010]/50 border-red-900/40 text-red-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold flex items-center gap-1.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#000]/60 text-slate-400">
                          R{log.round}
                        </span>
                        <span>{log.attacker}</span>
                        <span className="text-slate-400 font-normal">→ {log.action}</span>
                      </span>
                      {log.damageDealt > 0 && (
                        <span className="font-bold text-rose-400">
                          -{log.damageDealt} DMG
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {log.description}
                    </p>
                  </div>
                ))}
                <div ref={combatLogEndRef} />
              </div>
            </div>
          </div>

          {/* Right Column: Enemy Intel & Rewards Preview */}
          <div className="lg:col-span-4 space-y-6">
            {/* Enemy Intel Dossier */}
            <div className="p-5 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] space-y-4">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" /> Hostile Anatomy & Intel
              </h2>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-[#141414]">
                  <span className="text-slate-500">Classification:</span>
                  <span className="text-slate-200 capitalize">{activeEnemy.category || 'Monster'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#141414]">
                  <span className="text-slate-500">Elemental Weakness:</span>
                  <span className="text-amber-400 font-bold">{activeEnemy.elementalWeakness || 'None Detected'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#141414]">
                  <span className="text-slate-500">Armor / Defense:</span>
                  <span className="text-slate-200">{activeEnemy.defense} Armor</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#141414]">
                  <span className="text-slate-500">Attack Velocity:</span>
                  <span className="text-slate-200">{activeEnemy.attack} Attack</span>
                </div>
              </div>

              <div className="p-3 rounded bg-[#0d0d0d] border border-[#1a1a1a] text-slate-400 text-xs leading-relaxed">
                {activeEnemy.lore}
              </div>

              {/* Guaranteed & Drop Forecast */}
              <div className="p-3 rounded-lg bg-[#0e0a14] border border-purple-900/50 space-y-2">
                <div className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Victory Yield Forecast
                </div>
                <div className="text-xs font-mono text-slate-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Exp Reward:</span>
                    <span className="text-white font-bold">+{activeEnemy.rewards.exp} EXP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Perm Mana Expansion:</span>
                    <span className="text-cyan-400 font-bold">+{activeEnemy.rewards.permanentManaBonus || 3} MP</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Standard Crystals:</span>
                    <span className="text-amber-300 font-bold">
                      ~{Math.round((activeEnemy.rewards.maxCrystals || 40) * relicHarvestMultiplier)} 💎
                    </span>
                  </div>
                  {(activeEnemy.isVoidCorrupted || activeEnemy.rewards.voidManaCrystals) && (
                    <div className="flex justify-between">
                      <span>Pure Void Crystals:</span>
                      <span className="text-purple-300 font-bold">
                        +{Math.round((activeEnemy.rewards.voidManaCrystals || 25) * relicHarvestMultiplier)} 🔮
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= NON-BATTLE TABS ================= */
        <div className="space-y-6">
          {/* TAB 1: RANDOM VOID ENCOUNTERS */}
          {arenaTab === 'encounters' && (
            <div className="space-y-6">
              {/* Void Resonance Radar Banner */}
              <div className="p-6 rounded-xl bg-gradient-to-r from-[#0d0718] via-[#090412] to-[#0d0718] border border-purple-900/60 shadow-[0_0_30px_rgba(168,85,247,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-600 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
                        <span>Sub-Space Ley-Line Distortion Radar</span>
                      </span>
                      <span className="text-slate-500 text-xs font-mono">
                        Distortion Level: {voidDistortionLevel}%
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-white tracking-wide font-mono">
                      Void-Corrupted Anomaly Generator
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Scanning the boundary between dimensions reveals mutated creatures infected with abyssal void particles.
                      These monstrosities possess enhanced combat parameters and unique void affixes. Defeating them is the primary method to acquire <strong className="text-purple-300 font-mono">Unique Forger Relics</strong> and <strong className="text-purple-300 font-mono">Higher-Tier Pure Void Mana Crystals (🔮)</strong>.
                    </p>
                  </div>

                  <button
                    id="btn-scan-void-encounter"
                    disabled={isScanningVoid}
                    onClick={handleTriggerRandomVoidScout}
                    className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition flex items-center justify-center space-x-2.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isScanningVoid ? 'animate-spin' : ''}`} />
                    <span>{isScanningVoid ? 'Calibrating Void Rift...' : 'Scan For Void Encounter'}</span>
                  </button>
                </div>
              </div>

              {/* Scouted Void Encounter Display */}
              {scoutedEncounter && (
                <div className="p-6 rounded-xl bg-[#0a0a0a] border border-purple-800/80 shadow-2xl space-y-6 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#1f1f1f]">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-xl bg-purple-950/80 border border-purple-700 text-purple-300 text-xl font-bold">
                        🔮
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 border border-purple-600 font-bold uppercase tracking-wider">
                            {scoutedEncounter.corruptionTier} Corruption
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Distortion: {scoutedEncounter.distortionLevel}%
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-white font-mono mt-0.5">
                          {scoutedEncounter.enemy.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          {scoutedEncounter.enemy.title} • {scoutedEncounter.enemy.rank}-Rank (Lvl {scoutedEncounter.enemy.level})
                        </p>
                      </div>
                    </div>

                    <button
                      id="btn-engage-void-encounter"
                      onClick={() => handleStartBattle(scoutedEncounter.enemy)}
                      className="w-full md:w-auto px-6 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(239,68,68,0.4)] transition flex items-center justify-center space-x-2"
                    >
                      <Sword className="w-4 h-4" />
                      <span>Engage In Mortal Combat</span>
                    </button>
                  </div>

                  {/* Enemy Attributes & Affixes */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-[#0f0f0f] border border-[#222] space-y-2">
                      <div className="text-[10px] font-mono uppercase text-slate-500 font-semibold">Corrupted Vital Stats</div>
                      <div className="space-y-1 text-xs font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Max Health:</span>
                          <span className="text-rose-400 font-bold">{scoutedEncounter.enemy.hp} HP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Attack Power:</span>
                          <span className="text-white font-bold">{scoutedEncounter.enemy.attack} ATK</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Physical Defense:</span>
                          <span className="text-white font-bold">{scoutedEncounter.enemy.defense} DEF</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[#0f0f0f] border border-purple-900/50 space-y-2">
                      <div className="text-[10px] font-mono uppercase text-purple-400 font-semibold">Active Void Affixes</div>
                      <div className="space-y-1.5">
                        {scoutedEncounter.enemy.corruptionAffixes?.map((aff, i) => (
                          <div key={i} className="text-xs font-mono text-purple-200 flex items-center gap-1.5">
                            <span className="text-purple-400">⚡</span>
                            <span className="font-bold">{aff}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-[#0f0f0f] border border-amber-900/50 space-y-2">
                      <div className="text-[10px] font-mono uppercase text-amber-400 font-semibold">Unique Loot Drop Forecast</div>
                      {scoutedEncounter.guaranteedLoot ? (
                        <div className="text-xs font-mono space-y-1">
                          <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                            <span>{scoutedEncounter.guaranteedLoot.icon}</span>
                            <span>{scoutedEncounter.guaranteedLoot.name}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2">
                            {scoutedEncounter.guaranteedLoot.specialEffect}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Random high-tier relic roll upon victory.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADVERSARY BESTIARY */}
          {arenaTab === 'bestiary' && (
            <div className="space-y-6">
              {/* Category Filters */}
              <div className="flex items-center flex-wrap gap-2">
                <span className="text-xs font-mono uppercase text-slate-500 flex items-center gap-1.5 mr-2">
                  <Filter className="w-3.5 h-3.5" /> Filter Category:
                </span>
                {(['all', 'goblin', 'demon', 'bandit', 'beast', 'void', 'monarch'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1 rounded text-xs font-mono uppercase transition ${
                      categoryFilter === cat
                        ? 'bg-white text-black font-bold'
                        : 'bg-[#111] text-slate-400 hover:text-white border border-[#222]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Bestiary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEnemies.map((enemy) => (
                  <div
                    key={enemy.id}
                    className="p-5 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] hover:border-slate-600 transition flex flex-col justify-between space-y-4 shadow-lg group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${enemy.dangerColor}`}>
                          {enemy.rank}-Rank • {enemy.dangerLevel}
                        </span>
                        <span className="text-xs font-mono text-slate-500">Lvl {enemy.level}</span>
                      </div>

                      <h3 className="text-base font-bold text-white font-mono group-hover:text-cyan-300 transition">
                        {enemy.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{enemy.title}</p>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-mono bg-[#0f0f0f] p-2 rounded border border-[#222]">
                        <div>
                          <div className="text-[10px] text-slate-500">HP</div>
                          <div className="font-bold text-rose-400">{enemy.hp}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">ATK</div>
                          <div className="font-bold text-white">{enemy.attack}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-500">DEF</div>
                          <div className="font-bold text-white">{enemy.defense}</div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                        {enemy.lore}
                      </p>
                    </div>

                    <button
                      onClick={() => handleStartBattle(enemy)}
                      className="w-full py-2.5 rounded bg-[#141414] hover:bg-red-600 text-slate-300 hover:text-white font-mono text-xs font-bold uppercase tracking-wider transition border border-[#222] hover:border-red-500 flex items-center justify-center space-x-2"
                    >
                      <Sword className="w-3.5 h-3.5" />
                      <span>Challenge Monster</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ANCIENT MANA SHRINE */}
          {arenaTab === 'shrine' && (
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-gradient-to-r from-[#171003] via-[#0d0a04] to-[#171003] border border-amber-900/60 shadow-[0_0_30px_rgba(245,158,11,0.1)] relative overflow-hidden">
                <div className="max-w-2xl space-y-2 relative z-10">
                  <span className="px-2.5 py-0.5 rounded bg-amber-900/80 text-amber-200 border border-amber-600 text-[10px] font-mono font-bold uppercase tracking-wider">
                    Ancient Ley-Line Altar
                  </span>
                  <h2 className="text-2xl font-bold text-white font-mono tracking-wide">
                    The High-Risk Mana Shrine
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Perform high-risk rituals to tap subterranean ley-line crystal reservoirs. Higher-tier rituals yield massive quantities of crystals, but carry a severe risk of triggering a dimensional void breach!
                  </p>
                </div>
              </div>

              {/* Shrine Ritual Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Ritual 1 */}
                <div className="p-5 rounded-xl bg-[#0a0a0a] border border-[#222] space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Low Risk • 15% Breach</div>
                    <h3 className="text-base font-bold text-white font-mono mt-1">Whispering Inscription</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Channel safe surface ley-lines. Harvests +20 to 50 Standard Mana Crystals with minimal disturbance to dimensional barriers.
                    </p>
                  </div>
                  <button
                    disabled={isChannelingRitual}
                    onClick={() => handleChannelShrine('whispering')}
                    className="w-full py-2.5 rounded bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 border border-emerald-700 text-xs font-mono font-bold uppercase tracking-wider transition disabled:opacity-50"
                  >
                    {isChannelingRitual && activeRitualType === 'whispering' ? 'Channeling...' : 'Perform Whispering Inscription'}
                  </button>
                </div>

                {/* Ritual 2 */}
                <div className="p-5 rounded-xl bg-[#0a0a0a] border border-amber-900/50 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">Medium Risk • 45% Breach</div>
                    <h3 className="text-base font-bold text-white font-mono mt-1">Abyssal Core Tap</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Puncture deeper bedrock crystal layers. Harvests +50 to 125 High-Density Mana Crystals. Moderate chance to attract void entities.
                    </p>
                  </div>
                  <button
                    disabled={isChannelingRitual}
                    onClick={() => handleChannelShrine('abyssal')}
                    className="w-full py-2.5 rounded bg-amber-600 hover:bg-amber-500 text-black text-xs font-mono font-bold uppercase tracking-wider transition disabled:opacity-50"
                  >
                    {isChannelingRitual && activeRitualType === 'abyssal' ? 'Tapping Core...' : 'Perform Abyssal Tap'}
                  </button>
                </div>

                {/* Ritual 3 */}
                <div className="p-5 rounded-xl bg-[#0a0a0a] border border-purple-900/60 space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-rose-400 font-bold">Catastrophic Risk • 75% Breach</div>
                    <h3 className="text-base font-bold text-white font-mono mt-1">Primordial Rift Overload</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Siphon cosmic dimensional fractures. Yields +120 to 280 Concentrated Crystals. Extremely likely to spawn high-rank void horrors!
                    </p>
                  </div>
                  <button
                    disabled={isChannelingRitual}
                    onClick={() => handleChannelShrine('primordial')}
                    className="w-full py-2.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold uppercase tracking-wider transition shadow-[0_0_15px_rgba(168,85,247,0.3)] disabled:opacity-50"
                  >
                    {isChannelingRitual && activeRitualType === 'primordial' ? 'Rupturing Rift...' : 'Trigger Primordial Overload'}
                  </button>
                </div>
              </div>

              {/* Active Void Breach Alert Banner */}
              {activeVoidBreach && (
                <div className="p-5 rounded-xl bg-[#190424] border border-purple-600 shadow-[0_0_25px_rgba(168,85,247,0.3)] animate-pulse flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-mono uppercase text-rose-400 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500" /> DIMENSIONAL VOID BREACH ATTRACTED!
                    </div>
                    <p className="text-xs text-purple-200 font-mono">{activeVoidBreach.message}</p>
                  </div>
                  <button
                    onClick={() => handleStartBattle(activeVoidBreach.enemy)}
                    className="px-5 py-2.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold uppercase tracking-wider shadow-lg flex items-center space-x-2"
                  >
                    <Sword className="w-3.5 h-3.5" />
                    <span>Engage Attracted Entity</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RELIC & LOOT VAULT */}
          {arenaTab === 'vault' && (
            <div className="space-y-6">
              {/* Vault Overview & Active Stat Modifiers */}
              <div className="p-6 rounded-xl bg-[#0a0a0a] border border-[#1a1a1a] space-y-4">
                <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-3">
                  <div>
                    <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                      <Package className="w-5 h-5 text-cyan-400" />
                      <span>Aryan's Relic & Unique Artifact Vault</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Equip looted void artifacts to permanently expand combat parameters and harvest yields.
                    </p>
                  </div>
                  <div className="text-xs font-mono text-cyan-300 font-bold">
                    {equippedRelics.length} Relics Synchronized
                  </div>
                </div>

                {/* Aggregated Buffs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  <div className="p-3 rounded-lg bg-[#0f0f0f] border border-[#222] text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Bonus Max HP</div>
                    <div className="text-sm font-bold text-rose-400 font-mono">+{relicBonusHp} HP</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0f0f0f] border border-[#222] text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Bonus Defense</div>
                    <div className="text-sm font-bold text-cyan-400 font-mono">+{relicBonusDef} DEF</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0f0f0f] border border-[#222] text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Bonus Intelligence</div>
                    <div className="text-sm font-bold text-purple-400 font-mono">+{relicBonusInt} INT</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0f0f0f] border border-[#222] text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Bonus Strength</div>
                    <div className="text-sm font-bold text-amber-400 font-mono">+{relicBonusStr} STR</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0f0f0f] border border-[#222] text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-mono">Bonus Agility</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">+{relicBonusAgi} AGI</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#0f0f0f] border border-amber-900/50 text-center">
                    <div className="text-[10px] text-amber-400 uppercase font-mono">Crystal Harvest</div>
                    <div className="text-sm font-bold text-amber-300 font-mono">+{relicBonusHarvestPercent}% 💎</div>
                  </div>
                </div>
              </div>

              {/* Relic Inventory Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {inventory.map((relic) => {
                  const isEquipped = equippedRelicIds.has(relic.id);
                  return (
                    <div
                      key={relic.id}
                      className={`p-5 rounded-xl bg-[#0a0a0a] border transition flex flex-col justify-between space-y-4 shadow-lg ${
                        isEquipped ? 'border-cyan-500/80 bg-cyan-950/10 shadow-[0_0_20px_rgba(34,211,238,0.1)]' : 'border-[#1a1a1a]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                            relic.rarity === 'Mythic' || relic.rarity === 'Void Primordial'
                              ? 'bg-purple-950 text-purple-300 border-purple-600'
                              : relic.rarity === 'Legendary'
                              ? 'bg-amber-950 text-amber-300 border-amber-600'
                              : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                          }`}>
                            {relic.rarity} • {relic.type}
                          </span>
                          <span className="text-lg">{relic.icon}</span>
                        </div>

                        <h3 className="text-base font-bold text-white font-mono">{relic.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{relic.description}</p>

                        {/* Special Effect */}
                        {relic.specialEffect && (
                          <div className="mt-3 p-2.5 rounded bg-[#0d0d0d] border border-[#222] text-xs font-mono text-cyan-300">
                            ✨ {relic.specialEffect}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleEquipRelic(relic.id)}
                        className={`w-full py-2 rounded text-xs font-mono font-bold uppercase tracking-wider transition ${
                          isEquipped
                            ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                            : 'bg-[#141414] hover:bg-[#222] text-slate-300 border border-[#2a2a2a]'
                        }`}
                      >
                        {isEquipped ? '✓ Relic Synchronized (Equipped)' : 'Equip into Soul Conduit'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= VICTORY & LOOT MODAL ================= */}
      {showLootModal && combatResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-xl w-full p-6 rounded-2xl bg-[#0a0a0a] border border-purple-600/80 shadow-[0_0_50px_rgba(168,85,247,0.3)] space-y-6">
            <div className="text-center space-y-1">
              <div className="inline-flex p-3 rounded-full bg-purple-950/80 border border-purple-600 text-2xl animate-bounce">
                👑
              </div>
              <h2 className="text-xl font-bold text-white font-mono uppercase tracking-wide">
                Encounter Victorious!
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Hostile entity disassembled by Aryan's Forger core.
              </p>
            </div>

            {/* Victory Spoils Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#0f0f0f] border border-[#222]">
                <div className="text-[10px] text-slate-500 uppercase">Experience Gained</div>
                <div className="text-base font-bold text-white">+{combatResult.expGained} EXP</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0f0f0f] border border-[#222]">
                <div className="text-[10px] text-slate-500 uppercase">Soul Expansion</div>
                <div className="text-base font-bold text-cyan-400">+{combatResult.permanentManaGained} Permanent MP</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0f0f0f] border border-amber-900/50">
                <div className="text-[10px] text-amber-400 uppercase">Standard Crystals</div>
                <div className="text-base font-bold text-amber-300">+{combatResult.manaCrystalsGained} 💎</div>
              </div>

              <div className="p-3 rounded-lg bg-[#0f0f0f] border border-purple-800/60">
                <div className="text-[10px] text-purple-400 uppercase">High-Tier Void Crystals</div>
                <div className="text-base font-bold text-purple-200">+{combatResult.voidManaCrystalsGained || 0} 🔮</div>
              </div>
            </div>

            {/* Unique Loot Drops */}
            {combatResult.lootDropped && combatResult.lootDropped.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-mono uppercase font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Unique Artifacts & Relics Dropped:
                </div>
                {combatResult.lootDropped.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-purple-950/40 border border-purple-700/80 flex items-start justify-between gap-3 text-xs font-mono"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.icon}</span>
                        <span className="font-bold text-white">{item.name}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900 text-purple-200 border border-purple-600 font-bold uppercase">
                          {item.rarity}
                        </span>
                      </div>
                      <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                        {item.specialEffect}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleResetCombat}
              className="w-full py-3 rounded-xl bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-slate-200 shadow-xl transition"
            >
              Claim Spoils & Return to Arena
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
