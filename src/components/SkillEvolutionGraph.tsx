import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { ForgedSkill, SkillEvolutionStage } from '../types';
import { SoundFX } from '../utils/soundEffects';
import {
  Flame,
  Zap,
  Eye,
  Activity,
  AlertTriangle,
  Sparkles,
  Shield,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  TrendingUp,
  Hammer,
  Layers,
  Info,
  ChevronRight,
  Filter,
} from 'lucide-react';

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'core' | 'skill' | 'stage';
  name: string;
  category: 'Unique' | 'Elemental' | 'Perception' | 'Body' | 'Corrupted' | 'Forbidden' | 'Core';
  skillId?: string;
  stageNumber?: number;
  isForged: boolean;
  isUnlocked: boolean;
  isCorrupted: boolean;
  publicRank?: string;
  trueRank?: string;
  description: string;
  effect?: string;
  manaMultiplier?: number;
  permanentManaCost?: number;
  activeManaCost?: number;
  currentStage?: number;
  maxStages?: number;
  radius: number;
  color: string;
  glowColor: string;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'core-skill' | 'skill-stage' | 'stage-stage' | 'synergy';
  isUnlocked: boolean;
  isCorrupted: boolean;
  value?: number;
  label?: string;
}

interface SkillEvolutionGraphProps {
  skills: ForgedSkill[];
  selectedSkillId: string;
  onSelectSkill: (skillId: string) => void;
  onEvolveSkill: (skillId: string) => void;
  onForgeSkill?: (skill: ForgedSkill) => void;
  permanentMana: number;
}

const CATEGORY_COLORS: Record<string, { base: string; glow: string; border: string; bg: string }> = {
  Core: { base: '#ffffff', glow: '#ffffff', border: '#e2e8f0', bg: '#18181b' },
  Unique: { base: '#a855f7', glow: '#c084fc', border: '#9333ea', bg: '#2e1065' },
  Elemental: { base: '#f97316', glow: '#fb923c', border: '#ea580c', bg: '#431407' },
  Perception: { base: '#06b6d4', glow: '#22d3ee', border: '#0891b2', bg: '#083344' },
  Body: { base: '#10b981', glow: '#34d399', border: '#059669', bg: '#022c22' },
  Corrupted: { base: '#ef4444', glow: '#f87171', border: '#dc2626', bg: '#450a0a' },
  Forbidden: { base: '#e11d48', glow: '#fb7185', border: '#be123c', bg: '#4c0519' },
};

export const SkillEvolutionGraph: React.FC<SkillEvolutionGraphProps> = ({
  skills,
  selectedSkillId,
  onSelectSkill,
  onEvolveSkill,
  onForgeSkill,
  permanentMana,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'full' | 'skills-only'>('full');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [inspectedNode, setInspectedNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  // Transform skills into graph nodes & links
  const { nodes, links } = useMemo(() => {
    const nodeList: GraphNode[] = [];
    const linkList: GraphLink[] = [];

    // 1. Root Origin Core Node: The Forger
    const coreNode: GraphNode = {
      id: 'root-forger-core',
      type: 'core',
      name: '[FORGER] Soul Core',
      category: 'Core',
      isForged: true,
      isUnlocked: true,
      isCorrupted: false,
      publicRank: 'F',
      trueRank: 'UNKNOWN / INFINITE',
      description: 'Aryan\'s awakened Primordial Soul Core. The conduit through which all magical matrices are synthesized, analyzed, and evolved.',
      radius: 34,
      color: CATEGORY_COLORS.Core.base,
      glowColor: CATEGORY_COLORS.Core.glow,
    };
    nodeList.push(coreNode);

    // 2. Process each skill
    skills.forEach((skill) => {
      // Category filter check
      if (activeCategoryFilter !== 'ALL' && skill.category !== activeCategoryFilter) {
        return;
      }

      const catColor = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.Unique;
      const skillNodeId = `skill-${skill.id}`;

      const skillNode: GraphNode = {
        id: skillNodeId,
        type: 'skill',
        name: skill.name,
        category: skill.category,
        skillId: skill.id,
        isForged: skill.isForged,
        isUnlocked: skill.isForged,
        isCorrupted: skill.isCorrupted,
        publicRank: skill.publicRank,
        trueRank: skill.trueRank,
        description: skill.description,
        permanentManaCost: skill.permanentManaCost,
        activeManaCost: skill.activeManaCost,
        currentStage: skill.currentStage,
        maxStages: skill.maxStages,
        radius: skill.isForged ? 24 : 19,
        color: skill.isCorrupted ? CATEGORY_COLORS.Corrupted.base : catColor.base,
        glowColor: skill.isCorrupted ? CATEGORY_COLORS.Corrupted.glow : catColor.glow,
      };
      nodeList.push(skillNode);

      // Link from Root Core to Skill
      linkList.push({
        id: `link-core-${skill.id}`,
        source: 'root-forger-core',
        target: skillNodeId,
        type: 'core-skill',
        isUnlocked: skill.isForged,
        isCorrupted: skill.isCorrupted,
        value: skill.isForged ? 3 : 1,
      });

      // 3. Process Stages if in 'full' viewMode
      if (viewMode === 'full' && skill.stages && skill.stages.length > 0) {
        let prevStageNodeId = skillNodeId;

        skill.stages.forEach((stage, idx) => {
          const stageNodeId = `stage-${skill.id}-${stage.stage}`;
          const isUnlocked = skill.isForged && stage.stage <= skill.currentStage;

          const stageNode: GraphNode = {
            id: stageNodeId,
            type: 'stage',
            name: stage.name,
            category: skill.category,
            skillId: skill.id,
            stageNumber: stage.stage,
            isForged: skill.isForged,
            isUnlocked: isUnlocked,
            isCorrupted: skill.isCorrupted,
            description: stage.description,
            effect: stage.effect,
            manaMultiplier: stage.manaMultiplier,
            currentStage: skill.currentStage,
            radius: isUnlocked ? 14 : 10,
            color: isUnlocked
              ? skill.isCorrupted
                ? CATEGORY_COLORS.Corrupted.base
                : catColor.base
              : '#52525b',
            glowColor: isUnlocked
              ? skill.isCorrupted
                ? CATEGORY_COLORS.Corrupted.glow
                : catColor.glow
              : '#3f3f46',
          };
          nodeList.push(stageNode);

          // Connect from previous stage / skill node
          linkList.push({
            id: `link-${prevStageNodeId}-${stageNodeId}`,
            source: prevStageNodeId,
            target: stageNodeId,
            type: idx === 0 ? 'skill-stage' : 'stage-stage',
            isUnlocked: isUnlocked,
            isCorrupted: skill.isCorrupted,
            value: isUnlocked ? 2 : 1,
          });

          prevStageNodeId = stageNodeId;
        });
      }
    });

    // 4. Cross-discipline synergy links if both skills are forged
    const forgedIds = new Set(skills.filter((s) => s.isForged).map((s) => s.id));
    if (forgedIds.has('fireball-spell') && forgedIds.has('night-vision')) {
      linkList.push({
        id: 'synergy-fire-vision',
        source: 'skill-fireball-spell',
        target: 'skill-night-vision',
        type: 'synergy',
        isUnlocked: true,
        isCorrupted: false,
        label: 'Thermal Resonance Synergy',
        value: 1.5,
      });
    }

    if (forgedIds.has('predator-instinct') && forgedIds.has('basic-regeneration')) {
      linkList.push({
        id: 'synergy-predator-regen',
        source: 'skill-predator-instinct',
        target: 'skill-basic-regeneration',
        type: 'synergy',
        isUnlocked: true,
        isCorrupted: true,
        label: 'Abyssal Flesh Surge',
        value: 1.5,
      });
    }

    return { nodes: nodeList, links: linkList };
  }, [skills, activeCategoryFilter, viewMode]);

  // Handle D3 Rendering & Simulation
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    svg.selectAll('*').remove();

    // Defs: Gradients & Glow Filters
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'd3-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Demonic red pulse filter
    const demonicFilter = defs.append('filter').attr('id', 'd3-demonic-glow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    demonicFilter.append('feGaussianBlur').attr('stdDeviation', '7').attr('result', 'demonicBlur');
    const demonicMerge = demonicFilter.append('feMerge');
    demonicMerge.append('feMergeNode').attr('in', 'demonicBlur');
    demonicMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Core Radial Gradient
    const coreGrad = defs.append('radialGradient').attr('id', 'core-gradient');
    coreGrad.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff');
    coreGrad.append('stop').attr('offset', '60%').attr('stop-color', '#93c5fd');
    coreGrad.append('stop').attr('offset', '100%').attr('stop-color', '#1e1b4b');

    // Root Group with Zoom
    const g = svg.append('g').attr('class', 'main-graph-group');

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Background Grid Pattern
    const pattern = defs
      .append('pattern')
      .attr('id', 'd3-graph-grid')
      .attr('width', 40)
      .attr('height', 40)
      .attr('patternUnits', 'userSpaceOnUse');

    pattern.append('circle').attr('cx', 20).attr('cy', 20).attr('r', 1).attr('fill', '#27272a').attr('opacity', 0.6);

    svg.insert('rect', ':first-child')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#d3-graph-grid)')
      .attr('pointer-events', 'none');

    // D3 Force Simulation setup
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((d) => {
            if (d.type === 'core-skill') return 140;
            if (d.type === 'skill-stage') return 75;
            if (d.type === 'stage-stage') return 55;
            if (d.type === 'synergy') return 180;
            return 80;
          })
          .strength((d) => (d.type === 'synergy' ? 0.2 : 0.7))
      )
      .force('charge', d3.forceManyBody().strength((d: any) => (d.type === 'core' ? -800 : d.type === 'skill' ? -350 : -140)))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collide',
        d3.forceCollide<GraphNode>().radius((d) => d.radius + 18)
      )
      .alphaDecay(0.028);

    simulationRef.current = simulation;

    // Pin core to center
    const centerNode = nodes.find((n) => n.id === 'root-forger-core');
    if (centerNode) {
      centerNode.fx = width / 2;
      centerNode.fy = height / 2;
    }

    // Draw Links
    const linkGroup = g.append('g').attr('class', 'links-group');
    const linkElements = linkGroup
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', (d: GraphLink) => {
        if (d.type === 'synergy') return '#eab308';
        if (d.isCorrupted) return '#f43f5e';
        if (d.isUnlocked) return '#94a3b8';
        return '#27272a';
      })
      .attr('stroke-width', (d: GraphLink) => {
        if (d.type === 'synergy') return 2;
        if (d.type === 'core-skill') return d.isUnlocked ? 2.5 : 1.2;
        return d.isUnlocked ? 1.8 : 1;
      })
      .attr('stroke-dasharray', (d: GraphLink) => (d.type === 'synergy' ? '4 3' : d.isUnlocked ? 'none' : '3 3'))
      .attr('stroke-opacity', (d: GraphLink) => (d.isUnlocked ? 0.8 : 0.35));

    // Draw Nodes Group
    const nodeGroup = g.append('g').attr('class', 'nodes-group');

    const nodeElements = nodeGroup
      .selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node-item')
      .attr('cursor', 'pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d: GraphNode) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d: GraphNode) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d: GraphNode) => {
            if (!event.active) simulation.alphaTarget(0);
            if (d.id !== 'root-forger-core') {
              d.fx = null;
              d.fy = null;
            }
          })
      );

    // Node outer pulsing aura for core & selected/corrupted nodes
    nodeElements
      .append('circle')
      .attr('class', 'aura-ring')
      .attr('r', (d: GraphNode) => d.radius + 6)
      .attr('fill', 'none')
      .attr('stroke', (d: GraphNode) => (d.isCorrupted ? '#f43f5e' : d.glowColor))
      .attr('stroke-width', (d: GraphNode) => (d.type === 'core' || d.skillId === selectedSkillId ? 2 : 1))
      .attr('stroke-opacity', (d: GraphNode) => (d.isUnlocked ? (d.type === 'core' ? 0.6 : 0.4) : 0))
      .attr('filter', (d: GraphNode) => (d.isCorrupted ? 'url(#d3-demonic-glow)' : 'url(#d3-glow)'));

    // Main Node Circle
    nodeElements
      .append('circle')
      .attr('r', (d: GraphNode) => d.radius)
      .attr('fill', (d: GraphNode) => {
        if (d.type === 'core') return 'url(#core-gradient)';
        if (!d.isUnlocked) return '#121215';
        if (d.isCorrupted) return '#2a080c';
        return CATEGORY_COLORS[d.category]?.bg || '#18181b';
      })
      .attr('stroke', (d: GraphNode) => {
        if (d.skillId === selectedSkillId) return '#ffffff';
        if (d.isCorrupted) return '#ef4444';
        if (d.isUnlocked) return d.color;
        return '#3f3f46';
      })
      .attr('stroke-width', (d: GraphNode) => (d.skillId === selectedSkillId ? 2.5 : d.isUnlocked ? 2 : 1))
      .attr('stroke-dasharray', (d: GraphNode) => (d.isUnlocked ? 'none' : '2 2'));

    // Inner Glyph / Symbol
    nodeElements
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('font-size', (d: GraphNode) => (d.type === 'core' ? '14px' : d.type === 'skill' ? '11px' : '9px'))
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .attr('fill', (d: GraphNode) => (d.isUnlocked ? '#ffffff' : '#71717a'))
      .text((d: GraphNode) => {
        if (d.type === 'core') return 'Ω';
        if (d.type === 'stage') return `S${d.stageNumber}`;
        if (d.isCorrupted) return '☠';
        if (d.category === 'Elemental') return '🔥';
        if (d.category === 'Perception') return '👁';
        if (d.category === 'Body') return '✦';
        return '⚡';
      });

    // Node Label
    nodeElements
      .append('text')
      .attr('y', (d: GraphNode) => d.radius + 13)
      .attr('text-anchor', 'middle')
      .attr('font-size', (d: GraphNode) => (d.type === 'core' ? '11px' : d.type === 'skill' ? '10px' : '8.5px'))
      .attr('font-family', 'monospace')
      .attr('font-weight', (d: GraphNode) => (d.isUnlocked ? '600' : 'normal'))
      .attr('fill', (d: GraphNode) => {
        if (d.skillId === selectedSkillId) return '#ffffff';
        if (d.isCorrupted) return '#fca5a5';
        if (d.isUnlocked) return '#e2e8f0';
        return '#71717a';
      })
      .text((d: GraphNode) => {
        if (d.type === 'core') return 'FORGER CORE';
        if (d.type === 'stage') return `${d.name.split('—')[1] || d.name}`.trim().slice(0, 16);
        return d.name.slice(0, 16);
      });

    // Event Listeners: Hover, Click
    nodeElements
      .on('mouseenter', (event, d: GraphNode) => {
        setHoveredNode(d);
        const rect = container.getBoundingClientRect();
        setTooltipPos({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });

        // Highlight connected links
        linkElements
          .attr('stroke-opacity', (l: any) => {
            const isConnected = l.source.id === d.id || l.target.id === d.id;
            return isConnected ? 1 : 0.15;
          })
          .attr('stroke-width', (l: any) => {
            const isConnected = l.source.id === d.id || l.target.id === d.id;
            return isConnected ? 3 : 1;
          });
      })
      .on('mousemove', (event) => {
        const rect = container.getBoundingClientRect();
        setTooltipPos({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
        setTooltipPos(null);
        linkElements
          .attr('stroke-opacity', (d: GraphLink) => (d.isUnlocked ? 0.8 : 0.35))
          .attr('stroke-width', (d: GraphLink) => {
            if (d.type === 'synergy') return 2;
            if (d.type === 'core-skill') return d.isUnlocked ? 2.5 : 1.2;
            return d.isUnlocked ? 1.8 : 1;
          });
      })
      .on('click', (event, d: GraphNode) => {
        event.stopPropagation();
        SoundFX.playSystemNotification();
        setInspectedNode(d);
        if (d.skillId) {
          onSelectSkill(d.skillId);
        }
      });

    // Simulation Tick handler
    simulation.on('tick', () => {
      linkElements
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      nodeElements.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, selectedSkillId, onSelectSkill]);

  // Center / Reset View
  const handleResetZoom = useCallback(() => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(600).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
  }, []);

  // Zoom In / Out
  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, factor);
  };

  // Calculate soul stats summary
  const statsSummary = useMemo(() => {
    const totalSkills = skills.length;
    const forgedSkills = skills.filter((s) => s.isForged).length;
    const totalUnlockedStages = skills
      .filter((s) => s.isForged)
      .reduce((sum, s) => sum + s.currentStage, 0);
    const corruptedCount = skills.filter((s) => s.isCorrupted && s.isForged).length;

    return { totalSkills, forgedSkills, totalUnlockedStages, corruptedCount };
  }, [skills]);

  return (
    <div
      id="evolution-tree-container"
      className={`relative bg-[#070709] border border-[#1e1e24] rounded-lg overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl flex flex-col' : 'w-full h-[580px]'
      }`}
    >
      {/* Top Controls & Filter HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-[#0a0a0e]/85 backdrop-blur-md border-b border-[#1f1f28] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title & Summary */}
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 rounded bg-[#13131a] border border-[#2a2a38] flex items-center justify-center text-white">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Soul Matrix & Evolution Network
              </h3>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                D3 Force Graph
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[10px] font-mono text-slate-400">
              <span>Forged: {statsSummary.forgedSkills}/{statsSummary.totalSkills}</span>
              <span>•</span>
              <span>Total Stages Active: {statsSummary.totalUnlockedStages}</span>
              {statsSummary.corruptedCount > 0 && (
                <>
                  <span>•</span>
                  <span className="text-rose-400 font-bold">Corrupted: {statsSummary.corruptedCount}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Middle: Category Filter Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto py-1">
          {['ALL', 'Elemental', 'Perception', 'Body', 'Corrupted', 'Unique'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                SoundFX.playSystemNotification();
                setActiveCategoryFilter(cat);
              }}
              className={`px-2.5 py-1 rounded text-[10px] font-mono transition uppercase ${
                activeCategoryFilter === cat
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-[#121218] text-slate-400 hover:text-white border border-[#22222e]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Right: View Mode & Zoom Actions */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setViewMode(viewMode === 'full' ? 'skills-only' : 'full')}
            className="px-2.5 py-1 rounded bg-[#121218] text-slate-300 hover:text-white border border-[#22222e] text-[10px] font-mono flex items-center space-x-1"
            title="Toggle between full evolution stage nodes and skills overview"
          >
            <Layers className="w-3 h-3 text-slate-400" />
            <span>{viewMode === 'full' ? '15-Stage View' : 'Macro Only'}</span>
          </button>

          <div className="h-4 w-[1px] bg-[#22222e] mx-1" />

          <button
            onClick={() => handleZoom(1.25)}
            className="p-1.5 rounded bg-[#121218] text-slate-300 hover:text-white border border-[#22222e]"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(0.8)}
            className="p-1.5 rounded bg-[#121218] text-slate-300 hover:text-white border border-[#22222e]"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 rounded bg-[#121218] text-slate-300 hover:text-white border border-[#22222e]"
            title="Center & Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded bg-[#121218] text-slate-300 hover:text-white border border-[#22222e]"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div ref={containerRef} className="w-full h-full pt-14 pb-2">
        <svg ref={svgRef} className="w-full h-full select-none" />
      </div>

      {/* Dynamic Hover Tooltip */}
      {hoveredNode && tooltipPos && (
        <div
          className="absolute z-20 pointer-events-none p-3 rounded bg-[#0b0b10]/95 border border-white/20 shadow-2xl backdrop-blur-md max-w-xs font-mono text-xs text-white"
          style={{
            left: `${Math.min(tooltipPos.x + 15, (containerRef.current?.clientWidth || 800) - 260)}px`,
            top: `${Math.min(tooltipPos.y + 15, (containerRef.current?.clientHeight || 550) - 160)}px`,
          }}
        >
          <div className="flex items-center justify-between space-x-2 border-b border-white/10 pb-1.5 mb-1.5">
            <span className="font-bold text-white truncate">{hoveredNode.name}</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded uppercase ${
                hoveredNode.isUnlocked ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {hoveredNode.isUnlocked ? 'Unlocked' : 'Locked'}
            </span>
          </div>

          <div className="text-[11px] text-slate-300 font-sans leading-relaxed mb-2">
            {hoveredNode.description}
          </div>

          {hoveredNode.effect && (
            <div className="text-[10px] text-amber-300 bg-amber-950/40 p-1.5 rounded border border-amber-800/50 mb-1.5">
              <span className="font-bold">Effect:</span> {hoveredNode.effect}
            </div>
          )}

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/10">
            <span>Category: {hoveredNode.category}</span>
            {hoveredNode.manaMultiplier && <span>Multiplier: {hoveredNode.manaMultiplier}x</span>}
            {hoveredNode.currentStage && <span>Stage: {hoveredNode.currentStage}</span>}
          </div>
        </div>
      )}

      {/* Node Inspector Drawer when a Node is clicked */}
      {inspectedNode && (
        <div className="absolute bottom-4 right-4 z-30 w-80 sm:w-96 p-4 rounded-lg bg-[#0c0c12]/95 border border-white/30 backdrop-blur-xl shadow-2xl space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center space-x-2">
              {inspectedNode.isCorrupted ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
              ) : inspectedNode.category === 'Elemental' ? (
                <Flame className="w-4 h-4 text-amber-400" />
              ) : (
                <Zap className="w-4 h-4 text-cyan-400" />
              )}
              <span className="font-bold text-white text-sm tracking-wide">{inspectedNode.name}</span>
            </div>
            <button
              onClick={() => setInspectedNode(null)}
              className="text-slate-400 hover:text-white text-base px-1 leading-none"
            >
              ✕
            </button>
          </div>

          <p className="text-slate-300 text-xs font-sans leading-relaxed">
            {inspectedNode.description}
          </p>

          {inspectedNode.effect && (
            <div className="p-2.5 rounded bg-[#151520] border border-[#2a2a3e] text-amber-200">
              <div className="text-[10px] uppercase text-amber-400 font-bold tracking-wider mb-0.5">Stage Combat Effect</div>
              <div>{inspectedNode.effect}</div>
            </div>
          )}

          {/* Quick Node Actions */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
            {inspectedNode.skillId && (
              <button
                onClick={() => {
                  onSelectSkill(inspectedNode.skillId!);
                  SoundFX.playSystemNotification();
                }}
                className="flex-1 py-1.5 rounded bg-[#161622] hover:bg-[#202030] text-slate-200 border border-[#2e2e42] text-[10px] uppercase font-bold tracking-wider transition text-center"
              >
                Inspect in Forger
              </button>
            )}

            {inspectedNode.skillId && (
              (() => {
                const targetSkill = skills.find((s) => s.id === inspectedNode.skillId);
                if (!targetSkill) return null;

                if (!targetSkill.isForged && onForgeSkill) {
                  return (
                    <button
                      onClick={() => onForgeSkill(targetSkill)}
                      className="flex-1 py-1.5 rounded bg-white text-black hover:bg-slate-200 text-[10px] uppercase font-bold tracking-wider transition flex items-center justify-center space-x-1"
                    >
                      <Hammer className="w-3 h-3" />
                      <span>Forge ({targetSkill.permanentManaCost} MP)</span>
                    </button>
                  );
                }

                if (targetSkill.isForged && targetSkill.currentStage < targetSkill.maxStages) {
                  return (
                    <button
                      onClick={() => {
                        onEvolveSkill(targetSkill.id);
                        SoundFX.playSkillForged();
                      }}
                      className="flex-1 py-1.5 rounded bg-white text-black hover:bg-slate-200 text-[10px] uppercase font-bold tracking-wider transition flex items-center justify-center space-x-1"
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>Evolve (St.{targetSkill.currentStage + 1})</span>
                    </button>
                  );
                }

                return (
                  <span className="text-[10px] text-emerald-400 font-bold uppercase px-2 py-1 bg-emerald-950/40 rounded border border-emerald-800">
                    Max Evolution
                  </span>
                );
              })()
            )}
          </div>
        </div>
      )}

      {/* Legend overlay in bottom left */}
      <div className="absolute bottom-3 left-3 z-10 bg-[#09090e]/80 backdrop-blur-md p-2.5 rounded border border-[#1e1e28] text-[10px] font-mono text-slate-400 space-y-1.5 pointer-events-none hidden sm:block">
        <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">Node Legend</div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white inline-block shadow-[0_0_6px_#fff]" />
            <span>Core</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Elemental</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
            <span>Perception</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
            <span>Body</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse" />
            <span>Corrupted</span>
          </div>
        </div>
      </div>
    </div>
  );
};
