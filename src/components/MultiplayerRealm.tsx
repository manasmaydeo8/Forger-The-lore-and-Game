import React, { useState, useEffect, useRef } from 'react';
import {
  CharacterStats,
  ForgedSkill,
  ArtifactItem,
  OnlinePlayer,
  ChatMessage,
  WorldBossRaidState,
  PvPDuelState,
  TTSVoice,
} from '../types';
import { SoundFX } from '../utils/soundEffects';
import {
  Globe,
  Users,
  Swords,
  ShieldAlert,
  MessageSquare,
  Trophy,
  Send,
  Sparkles,
  Zap,
  Flame,
  Radio,
  Clock,
  Crown,
  Activity,
  Award,
  RefreshCw,
  Skull,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

interface MultiplayerRealmProps {
  stats: CharacterStats;
  onUpdateStats: (newStats: CharacterStats) => void;
  skills: ForgedSkill[];
  voice: TTSVoice;
}

export const MultiplayerRealm: React.FC<MultiplayerRealmProps> = ({
  stats,
  onUpdateStats,
  skills,
  voice,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'lobby' | 'chat' | 'pvp' | 'boss_raid' | 'leaderboard'>('boss_raid');
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // World Boss State
  const [worldBoss, setWorldBoss] = useState<WorldBossRaidState>({
    bossId: 'calamity-void-dragon',
    name: 'Void-Calamity Leviathan',
    title: 'Cataclysmic Dragon Sovereign of the 9th Abyss',
    currentHp: 80000,
    maxHp: 80000,
    phase: 1,
    enragedTimerSeconds: 600,
    isAlive: true,
    participants: [],
    recentAttacks: [],
  });

  const [selectedAttackSkillId, setSelectedAttackSkillId] = useState<string>(skills[0]?.id || '');
  const [bossIncomingAttack, setBossIncomingAttack] = useState<{ name: string; damage: number; desc: string } | null>(null);
  const [raidLootNotification, setRaidLootNotification] = useState<string | null>(null);

  // PvP State
  const [inPvPQueue, setInPvPQueue] = useState(false);
  const [activePvPDuel, setActivePvPDuel] = useState<any | null>(null);
  const [pvpCombatLog, setPvPCombatLog] = useState<any[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Connect to WebSocket Server
  const connectWebSocket = () => {
    try {
      setIsConnecting(true);
      setConnectionError(null);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionError(null);

        // Sync initial player profile
        const forgedOnly = skills.filter((s) => s.isForged);
        const equippedArts = (stats.artifactInventory || []).filter((a) =>
          (stats.equippedArtifactIds || []).includes(a.id)
        );

        ws.send(
          JSON.stringify({
            type: 'sync_player_profile',
            data: {
              stats,
              equippedSkills: forgedOnly.map((s) => ({
                id: s.id,
                name: s.name,
                publicRank: s.publicRank,
                manaCost: s.activeManaCost || 5,
                effectSnippet: s.stages?.[0]?.effect || s.description,
              })),
              equippedArtifacts: equippedArts.map((a) => ({
                id: a.id,
                name: a.name,
                rarity: a.rarity,
                passiveName: a.uniquePassiveName,
              })),
            },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case 'init_realm': {
              const { yourId, onlinePlayers: players, worldBoss: boss } = msg.data;
              setMyPlayerId(yourId);
              setOnlinePlayers(players || []);
              if (boss) {
                setWorldBoss((prev) => ({
                  ...prev,
                  ...boss,
                }));
              }
              break;
            }

            case 'player_joined': {
              const { player } = msg.data;
              setOnlinePlayers((prev) => {
                const filtered = prev.filter((p) => p.id !== player.id);
                return [...filtered, player];
              });
              break;
            }

            case 'player_left': {
              const { playerId } = msg.data;
              setOnlinePlayers((prev) => prev.filter((p) => p.id !== playerId));
              break;
            }

            case 'player_updated': {
              const { player } = msg.data;
              setOnlinePlayers((prev) =>
                prev.map((p) => (p.id === player.id ? { ...p, ...player } : p))
              );
              break;
            }

            case 'new_chat': {
              const chatMsg: ChatMessage = msg.data;
              setChatMessages((prev) => [...prev.slice(-99), chatMsg]);
              if (chatMsg.type === 'mythical_drop') {
                SoundFX.playDemonicAnomaly();
              }
              break;
            }

            case 'raid_sync': {
              const { currentHp, maxHp, phase, isAlive, recentAttack, participants } = msg.data;
              setWorldBoss((prev) => ({
                ...prev,
                currentHp,
                maxHp,
                phase,
                isAlive,
                participants: participants || prev.participants,
                recentAttacks: recentAttack ? [recentAttack, ...prev.recentAttacks.slice(0, 15)] : prev.recentAttacks,
              }));
              break;
            }

            case 'boss_attack': {
              const { attackName, damage, description, bossHp, bossMaxHp, phase } = msg.data;
              setBossIncomingAttack({ name: attackName, damage, desc: description });
              setWorldBoss((prev) => ({ ...prev, currentHp: bossHp, maxHp: bossMaxHp, phase }));
              setTimeout(() => setBossIncomingAttack(null), 4000);
              break;
            }

            case 'boss_phase_change': {
              SoundFX.playDemonicAnomaly();
              break;
            }

            case 'boss_defeated': {
              const { mvpPlayer, rewards } = msg.data;
              SoundFX.playSkillForged();
              setRaidLootNotification(`🎉 Boss Defeated! MVP: ${mvpPlayer}. You earned +${rewards.manaCrystals} 💎 crystals!`);
              onUpdateStats({
                ...stats,
                manaCrystals: stats.manaCrystals + rewards.manaCrystals,
                voidManaCrystals: (stats.voidManaCrystals || 0) + (rewards.voidManaCrystals || 0),
              });
              setTimeout(() => setRaidLootNotification(null), 8000);
              break;
            }

            case 'boss_respawned': {
              const { worldBoss: newBoss } = msg.data;
              setWorldBoss(newBoss);
              break;
            }

            case 'pvp_queue_status': {
              setInPvPQueue(msg.data.inQueue);
              break;
            }

            case 'pvp_matched': {
              setActivePvPDuel(msg.data);
              setActiveSubTab('pvp');
              SoundFX.playSkillForged();
              break;
            }

            case 'pvp_round_result': {
              const { attackerName, skillName, damage, defenderHpRemaining, isDefenderDefeated } = msg.data;
              setPvPCombatLog((prev) => [
                ...prev,
                `${attackerName} unleashed [${skillName}] dealing ${damage} DMG! Opponent HP: ${defenderHpRemaining}`,
              ]);
              if (isDefenderDefeated) {
                setTimeout(() => {
                  setActivePvPDuel(null);
                  setInPvPQueue(false);
                }, 4000);
              }
              break;
            }
          }
        } catch (err) {
          console.warn('WS parsing error:', err);
        }
      };

      ws.onerror = (err) => {
        console.warn('WS connection error:', err);
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionError('Connection to Multiplayer Realm failed. Retrying...');
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        // Attempt reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
    } catch (e: any) {
      setIsConnecting(false);
      setConnectionError(e.message);
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Send Chat Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(
      JSON.stringify({
        type: 'send_chat',
        data: { content: chatInput.trim() },
      })
    );
    setChatInput('');
  };

  // Attack World Boss
  const handleAttackWorldBoss = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !worldBoss.isAlive) return;

    const chosenSkill = skills.find((s) => s.id === selectedAttackSkillId) || skills[0];
    const baseDamage = 60 + stats.level * 15 + (stats.strength || 10) * 2;
    const isCrit = Math.random() < 0.25;
    const finalDamage = Math.round(isCrit ? baseDamage * 1.8 : baseDamage);

    SoundFX.playSkillForged();

    wsRef.current.send(
      JSON.stringify({
        type: 'raid_attack',
        data: {
          skillName: chosenSkill ? chosenSkill.name : 'Primordial Mana Blade',
          damage: finalDamage,
          isCrit,
        },
      })
    );
  };

  // Toggle PvP Matchmaking Queue
  const handleTogglePvPQueue = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    SoundFX.playSkillForged();
    wsRef.current.send(
      JSON.stringify({
        type: 'pvp_queue_toggle',
      })
    );
  };

  // Cast skill in PvP duel
  const handlePvPCastSkill = (skill: ForgedSkill) => {
    if (!wsRef.current || !activePvPDuel) return;
    const opponentId = activePvPDuel.playerA.id === myPlayerId ? activePvPDuel.playerB.id : activePvPDuel.playerA.id;
    const damage = 50 + stats.level * 10;

    SoundFX.playSkillForged();
    wsRef.current.send(
      JSON.stringify({
        type: 'pvp_action_cast',
        data: {
          targetId: opponentId,
          skillName: skill.name,
          damage,
          isCrit: Math.random() < 0.2,
        },
      })
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Real-time Status Banner */}
      <div className="bg-[#121218] border border-cyan-900/40 rounded-xl p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-blue-700 rounded-xl shadow-lg text-white">
              <Globe className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-wider">
                  MULTIPLAYER REALM OF AETHERIA
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                    isConnected
                      ? 'bg-emerald-950 border border-emerald-600 text-emerald-400'
                      : 'bg-rose-950 border border-rose-600 text-rose-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                    }`}
                  />
                  {isConnected ? 'ONLINE & SYNCED' : isConnecting ? 'CONNECTING...' : 'DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Real-Time WebSockets • Live Player Lobby • Co-op World Boss Raids • Ranked PvP Arena
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="bg-[#0b0c10] border border-cyan-800/40 rounded-lg px-3 py-2 text-right">
              <span className="text-[10px] text-slate-400 block uppercase">Connected Players</span>
              <span className="text-sm font-bold text-cyan-300 flex items-center justify-end gap-1">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                {onlinePlayers.length || 1} Active
              </span>
            </div>
            <div className="bg-[#0b0c10] border border-amber-800/40 rounded-lg px-3 py-2 text-right">
              <span className="text-[10px] text-slate-400 block uppercase">PvP Rating</span>
              <span className="text-sm font-bold text-amber-300 flex items-center justify-end gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                1,000 MMR
              </span>
            </div>
          </div>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap gap-2 mt-5 border-t border-slate-800 pt-4 font-mono text-xs">
          <button
            onClick={() => setActiveSubTab('boss_raid')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'boss_raid'
                ? 'bg-gradient-to-r from-rose-600 to-red-700 text-white font-bold shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Skull className="w-4 h-4 text-rose-300" />
            Co-op World Boss Raid
          </button>
          <button
            onClick={() => setActiveSubTab('pvp')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'pvp'
                ? 'bg-gradient-to-r from-amber-600 to-orange-700 text-white font-bold shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-4 h-4 text-amber-300" />
            Ranked 1v1 PvP Arena
          </button>
          <button
            onClick={() => setActiveSubTab('lobby')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'lobby'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white font-bold shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4 text-cyan-300" />
            Player Lobby ({onlinePlayers.length})
          </button>
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'chat'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-purple-300" />
            Realm Chat ({chatMessages.length})
          </button>
          <button
            onClick={() => setActiveSubTab('leaderboard')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              activeSubTab === 'leaderboard'
                ? 'bg-gradient-to-r from-yellow-600 to-amber-700 text-white font-bold shadow-lg'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4 text-yellow-300" />
            Realm Leaderboards
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB: CO-OP WORLD BOSS RAID
          ========================================================================= */}
      {activeSubTab === 'boss_raid' && (
        <div className="space-y-6">
          {/* Boss HUD Card */}
          <div className="bg-[#121218] border border-rose-900/50 rounded-xl p-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-rose-600/10 blur-3xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 bg-rose-950/80 px-2.5 py-1 rounded border border-rose-700/50">
                    Calamity Level Raid Event • Phase {worldBoss.phase}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {worldBoss.name}
                  </h2>
                  <p className="text-xs text-rose-300/80 font-serif italic">
                    "{worldBoss.title}"
                  </p>
                </div>

                <div className="bg-[#0b0c10] border border-rose-800/40 rounded-lg px-4 py-2 text-right font-mono">
                  <span className="text-[10px] text-slate-400 block uppercase">Dragon HP Remaining</span>
                  <span className="text-lg font-black text-rose-400">
                    {worldBoss.currentHp.toLocaleString()} / {worldBoss.maxHp.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Boss HP Bar */}
              <div className="space-y-1">
                <div className="w-full h-5 bg-[#0b0c10] rounded-full overflow-hidden border border-rose-900/60 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-500 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                    style={{ width: `${Math.max(0, (worldBoss.currentHp / worldBoss.maxHp) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Phase 1 (100%)</span>
                  <span>Phase 2 (65%)</span>
                  <span className="text-rose-400 font-bold">Phase 3: APEX ENRAGE (30%)</span>
                </div>
              </div>

              {/* Incoming Boss Telegraph */}
              {bossIncomingAttack && (
                <div className="bg-rose-950/90 border border-rose-600 text-rose-200 p-3 rounded-lg flex items-center gap-3 animate-bounce">
                  <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                  <div>
                    <span className="font-bold font-mono text-xs">{bossIncomingAttack.name}!</span>
                    <p className="text-[11px] opacity-90">{bossIncomingAttack.desc} (Dealt {bossIncomingAttack.damage} AoE Damage to all raiders)</p>
                  </div>
                </div>
              )}

              {/* Raid Loot Banner */}
              {raidLootNotification && (
                <div className="bg-gradient-to-r from-amber-950 via-purple-950 to-pink-950 border border-amber-500 text-amber-200 p-4 rounded-xl shadow-2xl font-mono text-xs animate-pulse">
                  {raidLootNotification}
                </div>
              )}

              {/* Attack Controls */}
              <div className="bg-[#0b0c10] p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <span className="text-xs font-mono text-slate-400">Select Forged Attack:</span>
                  <select
                    value={selectedAttackSkillId}
                    onChange={(e) => setSelectedAttackSkillId(e.target.value)}
                    className="bg-[#121218] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-cyan-500 flex-1"
                  >
                    {skills
                      .filter((s) => s.isForged)
                      .map((skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name} (Rank {skill.publicRank} - Stage {skill.currentStage || 1})
                        </option>
                      ))}
                  </select>
                </div>

                <button
                  disabled={!worldBoss.isAlive || !isConnected}
                  onClick={handleAttackWorldBoss}
                  className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white font-bold font-mono text-sm rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 border border-rose-400/40"
                >
                  <Flame className="w-5 h-5" />
                  Unleash Raid Strike!
                </button>
              </div>
            </div>
          </div>

          {/* Raid DPS Meter & Real-time Combat Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Live DPS Meter */}
            <div className="bg-[#121218] border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                LIVE RAID DPS METER
              </h3>

              <div className="space-y-2">
                {worldBoss.participants.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono py-4 text-center">No damage dealt yet this cycle.</p>
                ) : (
                  worldBoss.participants.map((p, idx) => (
                    <div
                      key={p.playerId}
                      className="bg-[#0b0c10] p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-500 font-bold w-4">#{idx + 1}</span>
                        <span className="font-bold text-white">{p.playerName}</span>
                        <span className="text-[10px] text-cyan-400">[{p.playerRank}]</span>
                      </div>
                      <span className="font-bold text-rose-400">{p.totalDamage.toLocaleString()} DMG</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Combat Feed */}
            <div className="bg-[#121218] border border-slate-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                SYNCHRONIZED ATTACK FEED
              </h3>

              <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px]">
                {worldBoss.recentAttacks.map((atk, idx) => (
                  <div key={idx} className="text-slate-300 flex items-center justify-between py-1 border-b border-slate-900">
                    <span>
                      <span className="text-cyan-400 font-bold">{atk.playerName}</span> struck with [{atk.skillName}]
                    </span>
                    <span className={`font-bold ${atk.isCrit ? 'text-amber-400' : 'text-rose-400'}`}>
                      {atk.damage} DMG {atk.isCrit ? '💥 CRIT!' : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: RANKED 1v1 PvP ARENA
          ========================================================================= */}
      {activeSubTab === 'pvp' && (
        <div className="space-y-6">
          <div className="bg-[#121218] border border-amber-900/40 rounded-xl p-6 relative overflow-hidden shadow-2xl">
            <div className="max-w-xl mx-auto text-center space-y-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-950/80 px-2.5 py-1 rounded border border-amber-700/50">
                Aetherian Gladiator Circuit
              </span>
              <h2 className="text-2xl font-black text-white">Live 1v1 Ranked Matchmaking</h2>
              <p className="text-xs text-slate-400 font-sans">
                Duel other real online Vessels across the realm. Test your custom forged skill builds and artifact loadouts in real-time.
              </p>

              {!activePvPDuel ? (
                <button
                  disabled={!isConnected}
                  onClick={handleTogglePvPQueue}
                  className={`px-8 py-3 rounded-xl font-bold font-mono text-sm shadow-xl transition-all flex items-center justify-center gap-2 mx-auto ${
                    inPvPQueue
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:scale-105'
                  }`}
                >
                  <Swords className="w-4 h-4" />
                  {inPvPQueue ? 'Searching for Opponent (In Queue...)' : 'Find Ranked Match (Queue Up)'}
                </button>
              ) : (
                <div className="bg-[#0b0c10] border border-amber-500/60 p-4 rounded-xl text-left space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono border-b border-slate-800 pb-2">
                    <span className="text-amber-400 font-bold">MATCH ACTIVE: {activePvPDuel.duelId}</span>
                    <span className="text-slate-400">Turn #{activePvPDuel.turnNumber || 1}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-[#121218] p-3 rounded-lg border border-cyan-800">
                      <span className="text-xs font-bold text-cyan-300 block">{activePvPDuel.playerA.username}</span>
                      <span className="text-[10px] text-slate-400 font-mono">HP: {activePvPDuel.playerA.hp} / {activePvPDuel.playerA.maxHp}</span>
                    </div>
                    <div className="bg-[#121218] p-3 rounded-lg border border-rose-800">
                      <span className="text-xs font-bold text-rose-300 block">{activePvPDuel.playerB.username}</span>
                      <span className="text-[10px] text-slate-400 font-mono">HP: {activePvPDuel.playerB.hp} / {activePvPDuel.playerB.maxHp}</span>
                    </div>
                  </div>

                  {/* Player Actions */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-[11px] font-mono text-slate-400 block">Choose Skill to Strike:</span>
                    <div className="grid grid-cols-2 gap-2">
                      {skills.filter((s) => s.isForged).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => handlePvPCastSkill(s)}
                          className="p-2 rounded bg-slate-900 border border-slate-700 text-left text-xs font-mono hover:border-amber-500 text-white"
                        >
                          <span className="font-bold block">{s.name}</span>
                          <span className="text-[10px] text-slate-400">Rank {s.publicRank}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Duel Log */}
                  <div className="bg-[#121218] p-2 rounded text-[10px] font-mono max-h-28 overflow-y-auto text-slate-300 space-y-1">
                    {pvpCombatLog.map((log, idx) => (
                      <p key={idx}>{log}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: PLAYER LOBBY
          ========================================================================= */}
      {activeSubTab === 'lobby' && (
        <div className="bg-[#121218] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              ONLINE REALM VESSELS ({onlinePlayers.length} CONNECTED)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {onlinePlayers.map((player) => (
              <div
                key={player.id}
                className="bg-[#0b0c10] border border-slate-800 rounded-lg p-4 space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">{player.username}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 rounded text-cyan-300">
                    Lv. {player.level}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 font-serif italic">"{player.title}"</p>

                <div className="border-t border-slate-800/80 pt-2 grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div>
                    <span className="text-slate-500 block">Status:</span>
                    <span className="text-emerald-400 uppercase font-bold">{player.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">PvP Rating:</span>
                    <span className="text-amber-300 font-bold">{player.pvpRating} MMR</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB: REALM CHAT
          ========================================================================= */}
      {activeSubTab === 'chat' && (
        <div className="bg-[#121218] border border-purple-900/40 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              GLOBAL REALM BROADCAST FEED
            </h3>
          </div>

          <div className="h-80 bg-[#0b0c10] rounded-xl p-4 border border-slate-800 overflow-y-auto space-y-2.5 font-mono text-xs">
            {chatMessages.length === 0 ? (
              <p className="text-slate-500 text-center py-12">No messages broadcast yet. Send the first message below!</p>
            ) : (
              chatMessages.map((msg) => {
                if (msg.type === 'mythical_drop') {
                  return (
                    <div
                      key={msg.id}
                      className="bg-gradient-to-r from-amber-950/80 via-pink-950/80 to-purple-950/80 border border-pink-500/80 p-3 rounded-lg text-pink-200 shadow-[0_0_15px_rgba(244,63,94,0.3)] animate-pulse"
                    >
                      <span className="font-black text-amber-300">👑 [DIVINE REALM ANNOUNCEMENT] </span>
                      <span>{msg.content}</span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex items-start space-x-2 py-1">
                    <span className="text-[10px] text-slate-500">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                    <span className="text-cyan-400 font-bold">{msg.senderName}:</span>
                    <span className="text-slate-200 flex-1">{msg.content}</span>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Send message to all online players..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="bg-[#0b0c10] border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 flex-1 font-mono"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg hover:bg-purple-500 disabled:opacity-50 flex items-center gap-2 text-xs font-mono"
            >
              <Send className="w-4 h-4" />
              Broadcast
            </button>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB: REALM LEADERBOARDS
          ========================================================================= */}
      {activeSubTab === 'leaderboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#121218] border border-amber-900/40 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              TOP GLADIATOR RANKINGS (PVP MMR)
            </h3>

            <div className="space-y-2 font-mono text-xs">
              {onlinePlayers
                .sort((a, b) => b.pvpRating - a.pvpRating)
                .slice(0, 10)
                .map((p, idx) => (
                  <div key={p.id} className="bg-[#0b0c10] p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-amber-400 font-bold">#{idx + 1}</span>
                      <span className="font-bold text-white">{p.username}</span>
                    </div>
                    <span className="font-bold text-amber-300">{p.pvpRating} MMR</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-[#121218] border border-rose-900/40 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              <Skull className="w-4 h-4 text-rose-400" />
              TOP CALAMITY RAID SLAYERS
            </h3>

            <div className="space-y-2 font-mono text-xs">
              {worldBoss.participants
                .sort((a, b) => b.totalDamage - a.totalDamage)
                .slice(0, 10)
                .map((p, idx) => (
                  <div key={p.playerId} className="bg-[#0b0c10] p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-rose-400 font-bold">#{idx + 1}</span>
                      <span className="font-bold text-white">{p.playerName}</span>
                    </div>
                    <span className="font-bold text-rose-300">{p.totalDamage.toLocaleString()} DMG</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
