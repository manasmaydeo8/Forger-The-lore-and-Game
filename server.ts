import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Modality } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Convert 24kHz 16-bit mono PCM/L16 into standard WAV base64
function pcmToWavBase64(pcmBase64: string, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): string {
  try {
    const pcmBuffer = Buffer.from(pcmBase64, 'base64');
    // If it already has a valid RIFF/WAVE header, don't double wrap
    if (
      pcmBuffer.length >= 12 &&
      pcmBuffer.slice(0, 4).toString('ascii') === 'RIFF' &&
      pcmBuffer.slice(8, 12).toString('ascii') === 'WAVE'
    ) {
      return pcmBase64;
    }

    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataSize = pcmBuffer.length;
    const header = Buffer.alloc(44);

    // RIFF chunk descriptor
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);

    // fmt sub-chunk
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // Subchunk1Size
    header.writeUInt16LE(1, 20);  // AudioFormat 1 = PCM
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);

    // data sub-chunk
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    const wavBuffer = Buffer.concat([header, pcmBuffer]);
    return wavBuffer.toString('base64');
  } catch (err) {
    console.error('Error converting PCM to WAV:', err);
    return pcmBase64;
  }
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Fallback procedural skill analyzer with rich archetypal engine for distinct, diverse skills
function generateProceduralForgeAnalysis(skillName: string, description: string, userMana: number) {
  const cleanName = skillName.trim() || 'Void Resonance';
  const nameLower = cleanName.toLowerCase();
  const descLower = (description || '').toLowerCase();
  const text = `${nameLower} ${descLower}`;

  // Determine Archetype
  let archetype = 'mystic';
  if (text.includes('fire') || text.includes('flame') || text.includes('pyro') || text.includes('burn') || text.includes('sun') || text.includes('inferno')) {
    archetype = 'fire';
  } else if (text.includes('ice') || text.includes('frost') || text.includes('freeze') || text.includes('cryo') || text.includes('glacial') || text.includes('snow')) {
    archetype = 'ice';
  } else if (text.includes('lightn') || text.includes('thunder') || text.includes('volt') || text.includes('shock') || text.includes('elec') || text.includes('storm')) {
    archetype = 'lightning';
  } else if (text.includes('abyss') || text.includes('demon') || text.includes('blood') || text.includes('dark') || text.includes('shadow') || text.includes('corrupt') || text.includes('curse')) {
    archetype = 'abyssal';
  } else if (text.includes('space') || text.includes('void') || text.includes('teleport') || text.includes('blink') || text.includes('rift') || text.includes('dimens')) {
    archetype = 'spatial';
  } else if (text.includes('time') || text.includes('chrono') || text.includes('rewind') || text.includes('haste') || text.includes('slow')) {
    archetype = 'temporal';
  } else if (text.includes('shield') || text.includes('barrier') || text.includes('aegis') || text.includes('guard') || text.includes('armor') || text.includes('defen')) {
    archetype = 'barrier';
  } else if (text.includes('heal') || text.includes('regen') || text.includes('vital') || text.includes('cure') || text.includes('life')) {
    archetype = 'biomancy';
  } else if (text.includes('gravit') || text.includes('singul') || text.includes('crush') || text.includes('pull') || text.includes('force')) {
    archetype = 'gravity';
  } else if (text.includes('sword') || text.includes('blade') || text.includes('slash') || text.includes('edge') || text.includes('pierce')) {
    archetype = 'weapon';
  } else if (text.includes('mind') || text.includes('illu') || text.includes('psychic') || text.includes('telepath') || text.includes('hypno')) {
    archetype = 'mental';
  } else if (text.includes('wind') || text.includes('gale') || text.includes('aero') || text.includes('cyclone') || text.includes('air')) {
    archetype = 'wind';
  }

  const isCorrupt = archetype === 'abyssal' || text.includes('corrupt') || text.includes('forbidden');

  const archetypesData: Record<string, {
    magicalStructure: string;
    manaFlow: string;
    ignitionPhase: string;
    compressionRatio: string;
    trueRank: string;
    manaCost: number;
    description: string;
    stages: { stage: number; name: string; effect: string }[];
  }> = {
    fire: {
      magicalStructure: 'Thermal Combustion Matrix with Concentric Igniter Rings',
      manaFlow: 'Centrifugal Flame Vortex (8.4 LPS)',
      ignitionPhase: '0.018 ms Superheated Plasma Spark',
      compressionRatio: '4.8:1 Pyrometric Density Lock',
      trueRank: 'D+ (High Destructive Output)',
      manaCost: 10,
      description: `Concentrates superheated thermal energy into a condensed payload, incinerating organic materials and melting low-grade metallic armor upon impact.`,
      stages: [
        { stage: 1, name: `${cleanName}: Ignition`, effect: 'Deals 70 Fire damage and inflicts a 3-second Burn status (12 dmg/s).' },
        { stage: 5, name: `${cleanName}: Thermal Wave`, effect: 'Expands explosion radius to 8 meters; leaves behind molten magma hazards.' },
        { stage: 10, name: `${cleanName}: Whitefire Lance`, effect: 'Compresses flames into a piercing beam that ignores 50% magical resistance.' },
        { stage: 15, name: `${cleanName}: Solar Calamity`, effect: 'Summons a miniature supernova causing 850 AoE fire devastation.' },
      ],
    },
    ice: {
      magicalStructure: 'Hexagonal Cryo-Lattice with Endothermic Absorption Runes',
      manaFlow: 'Sub-Zero Circulation Wave (6.2 LPS)',
      ignitionPhase: 'Flash Entropy Freezing Conduit',
      compressionRatio: '7.5:1 Cryogenic Crystalline Lock',
      trueRank: 'C+ (Crowd Control Apex)',
      manaCost: 12,
      description: `Rapidly extracts thermal kinetic energy from the target atmosphere, creating razor-sharp sub-zero frost structures that slow arterial bloodflow.`,
      stages: [
        { stage: 1, name: `${cleanName}: Frost Spike`, effect: 'Deals 65 Cryo damage and reduces enemy movement and attack speed by 30% for 4s.' },
        { stage: 5, name: `${cleanName}: Permafrost Cascade`, effect: 'Shatters upon impact, sending freezing shrapnel to afflict surrounding foes with Frostbite.' },
        { stage: 10, name: `${cleanName}: Glacial Tomb`, effect: 'Encases target in pure crystalline rime for 3.5s; frozen targets take 30% increased physical damage.' },
        { stage: 15, name: `${cleanName}: Absolute Zero Dominion`, effect: 'Instantly flash-freezes the entire room; shatters all non-boss targets below 30% HP.' },
      ],
    },
    lightning: {
      magicalStructure: 'High-Frequency Electromagnetic Plasma Grid',
      manaFlow: 'Alternating High-Voltage Arc Discharge (12.4 LPS)',
      ignitionPhase: '0.003 ms Ionization Spark Gap',
      compressionRatio: '18:1 Relativistic Plasma Compression',
      trueRank: 'B (High Velocity Armor Penetration)',
      manaCost: 14,
      description: `Excites atmospheric atoms into high-voltage ionized plasma, unleashing a supersonic bolt that penetrates defenses and chains across metallic armor.`,
      stages: [
        { stage: 1, name: `${cleanName}: Arc Bolt`, effect: 'Deals 85 Lightning damage with instant projectile travel time and electro-shock.' },
        { stage: 5, name: `${cleanName}: Overload Discharge`, effect: 'Chains to up to 4 additional nearby targets, interrupting their active spellcasting.' },
        { stage: 10, name: `${cleanName}: Railgun Impaler`, effect: 'Hyper-accelerated discharge penetrates through physical barricades and deals 300% critical damage.' },
        { stage: 15, name: `${cleanName}: Celestial Tempest`, effect: 'Channels continuous 100,000-volt lightning strikes across a 25-meter radius for 6 seconds.' },
      ],
    },
    abyssal: {
      magicalStructure: 'Inverted Void Hexahedron with Non-Euclidean Abyssal Runes',
      manaFlow: 'Retrograde Demonic Siphon Feedback (14.0 LPS)',
      ignitionPhase: 'Ancient Abyssal Blood Spark',
      compressionRatio: '36:1 Singularity Curse Compression',
      trueRank: 'A+ (Forbidden Ancient Origin)',
      manaCost: 18,
      description: `Harnesses ancient demonic frequencies sealed deep beneath Aetheria, siphoning life force and crushing the mental fortitude of lesser beings.`,
      stages: [
        { stage: 1, name: `${cleanName}: Abyssal Mark`, effect: 'Applies Demonic Rot (40 damage over 4s) and drains 5% of target mana pool.' },
        { stage: 5, name: `${cleanName}: Blood Feast`, effect: 'Heals Aryan for 60% of all dark damage dealt and grants +20% movement speed on kill.' },
        { stage: 10, name: `${cleanName}: Demon Lord Gaze`, effect: 'Intimidates and paralyzes all enemies in line of sight for 2.5 seconds.' },
        { stage: 15, name: `${cleanName}: Sovereign Abyssal Eclipse`, effect: 'Unleashes true demonic manifestation; triples all physical & magical combat parameters.' },
      ],
    },
    spatial: {
      magicalStructure: 'Folded Dimensional Sub-Plane Tensor Matrix',
      manaFlow: 'Quantum Wave-Phase Inversion (10.5 LPS)',
      ignitionPhase: 'Sub-Space Rupture Conduit',
      compressionRatio: '15:1 Non-Euclidean Spatial Fold',
      trueRank: 'B+ (High Mobility Sovereign)',
      manaCost: 16,
      description: `Bypasses physical three-dimensional boundaries by shifting mass through the interstitial void, enabling instantaneous displacement and phase dodging.`,
      stages: [
        { stage: 1, name: `${cleanName}: Void Blink`, effect: 'Instantly teleports up to 10 meters; grants 0.5s invulnerability frames.' },
        { stage: 5, name: `${cleanName}: Spatial Fracture`, effect: 'Leaves a razor spatial rift at departure point that shreds pursuing enemies for 120 damage.' },
        { stage: 10, name: `${cleanName}: Dimensional Anchor`, effect: 'Allows swapping positions with marked allies or enemies within 25 meters.' },
        { stage: 15, name: `${cleanName}: Infinite Void Transcendence`, effect: 'Perform up to 6 chain blinks in rapid succession while completely immune to targeting.' },
      ],
    },
    temporal: {
      magicalStructure: 'Ouroboros Retrocausal Temporal Ring',
      manaFlow: 'Closed Timelike Mana Curve (16.8 LPS)',
      ignitionPhase: 'Chrono-Anchor Pulse',
      compressionRatio: '50:1 Temporal Flux Density',
      trueRank: 'S (Lost Chronomancy Discipline)',
      manaCost: 22,
      description: `Manipulates local temporal streams to record physical coordinate vectors, reversing physical damage and altering the perception of time.`,
      stages: [
        { stage: 1, name: `${cleanName}: Micro Rewind`, effect: 'Rewinds bodily health and positioning by 1.5 seconds, erasing recent damage.' },
        { stage: 5, name: `${cleanName}: Chrono-Surge`, effect: 'Accelerates Aryan\'s personal action speed by 150% for 5 seconds.' },
        { stage: 10, name: `${cleanName}: Time-Dilation Zone`, effect: 'Slows down incoming projectiles and enemy actions by 75% within a 12m sphere.' },
        { stage: 15, name: `${cleanName}: Absolute Chronostasis`, effect: 'Freezes universal world time for 3.0 seconds; Aryan moves and casts freely.' },
      ],
    },
    barrier: {
      magicalStructure: 'Hexagonal Orthogonal Prismatic Deflection Array',
      manaFlow: 'Continuous Kinetic Dissipation Feedback (7.0 LPS)',
      ignitionPhase: 'Resonant Hard-Light Emitter',
      compressionRatio: '6.4:1 Forcefield Cohesion',
      trueRank: 'B (Absolute Abjuration)',
      manaCost: 11,
      description: `Constructs interlocking hexagonal forceplates that distribute kinetic, elemental, and curse impacts evenly across the caster's mana mantle.`,
      stages: [
        { stage: 1, name: `${cleanName}: Kinetic Ward`, effect: 'Absorbs up to 180 points of physical and elemental damage for 12 seconds.' },
        { stage: 5, name: `${cleanName}: Mirror Deflector`, effect: 'Reflects 35% of all blocked projectile and spell damage directly back to attackers.' },
        { stage: 10, name: `${cleanName}: Mana Conversion Aegis`, effect: 'Converts 30% of all absorbed impact energy into active mana recovery for Aryan.' },
        { stage: 15, name: `${cleanName}: Indomitable Bastion`, effect: 'Grants total invulnerability to all damage and status ailments for 4.5 seconds.' },
      ],
    },
    biomancy: {
      magicalStructure: 'Cellular Mitosis & Organic Weaver Matrix',
      manaFlow: 'Cardiovascular Circulatory Infusion (5.2 LPS)',
      ignitionPhase: 'Biochemical Vitality Spark',
      compressionRatio: '3.0:1 Organic Cellular Lock',
      trueRank: 'C+ (Vitality Restoration)',
      manaCost: 12,
      description: `Channels high-density restorative mana directly into biological tissue, accelerating natural cellular repair, clotting arteries, and purifying toxins.`,
      stages: [
        { stage: 1, name: `${cleanName}: Vital Stitch`, effect: 'Heals 20 HP per second for 8 seconds; cleanses light bleeding.' },
        { stage: 5, name: `${cleanName}: Arterial Restoration`, effect: 'Instantly knits fractured bones and cures Crippled or Bleeding debuffs.' },
        { stage: 10, name: `${cleanName}: Organ Genesis`, effect: 'Reconstructs damaged internal organs and grants temporary immunity to lethal poisons.' },
        { stage: 15, name: `${cleanName}: Immortal Phoenix Renewal`, effect: 'Automatically revives Aryan upon receiving lethal damage with 60% HP and 100% mana.' },
      ],
    },
    gravity: {
      magicalStructure: 'Curved Spacetime Tensor Matrix with Graviton Loops',
      manaFlow: 'Centripetal Singular Gravitational Spiral (13.5 LPS)',
      ignitionPhase: 'Micro-Singularity Catalyst',
      compressionRatio: '42:1 Relativistic Graviton Lock',
      trueRank: 'A (Kinetic Domain)',
      manaCost: 18,
      description: `Artificially amplifies or reverses gravitational constants in target zones, creating crushing downward pressure or pulling vortex singularities.`,
      stages: [
        { stage: 1, name: `${cleanName}: Graviton Anchor`, effect: 'Increases gravitational pull on target by 300%, slowing them by 60%.' },
        { stage: 5, name: `${cleanName}: Event Horizon Vortex`, effect: 'Creates a black vortex pulling all enemies within 10 meters into the epicenter.' },
        { stage: 10, name: `${cleanName}: Repulsion Shockwave`, effect: 'Reverses gravity in an explosive burst, launching surrounding foes 15 meters away.' },
        { stage: 15, name: `${cleanName}: Planetary Collapse Singularity`, effect: 'Crushes all targets in the vortex for 750 kinetic damage and strips 100% of armor.' },
      ],
    },
    weapon: {
      magicalStructure: 'Crystalline Edge Projection & Blade-Aura Lattice',
      manaFlow: 'Linear Razor-Aura Channel (8.0 LPS)',
      ignitionPhase: 'Sonic Edge Resonator',
      compressionRatio: '9.0:1 Hardened Edge Matrix',
      trueRank: 'C+ (Direct Martial Enhancement)',
      manaCost: 9,
      description: `Coats weapons and physical limbs in a micro-vibrating edge of condensed mana, cleaving through steel armor and extending weapon reach.`,
      stages: [
        { stage: 1, name: `${cleanName}: Mana Edge`, effect: '+25% Physical attack damage; weapon attacks bypass 20% target physical defense.' },
        { stage: 5, name: `${cleanName}: Sonic Crescent Wave`, effect: 'Swinging releases a flying mana blade traveling 15 meters, dealing 110 slashing damage.' },
        { stage: 10, name: `${cleanName}: Armor-Rend Sever`, effect: 'Critical strikes permanently reduce target armor rating by 40% for 10 seconds.' },
        { stage: 15, name: `${cleanName}: Sword Saint Spatial Cleave`, effect: 'Unleashes a spatial cut that severs physical space, striking all targets on screen.' },
      ],
    },
    mental: {
      magicalStructure: 'Psionic Synapse Resonance & Neural Intercept Net',
      manaFlow: 'High-Frequency Neural Pulse (6.8 LPS)',
      ignitionPhase: 'Cerebral Resonance Emitter',
      compressionRatio: '8.0:1 Psionic Lattice',
      trueRank: 'B (Psychic Warfare)',
      manaCost: 13,
      description: `Transmits intrusive psionic mana pulses into enemy brainwaves, inducing visual illusions, paralyzing synapses, or hijacking physical motor control.`,
      stages: [
        { stage: 1, name: `${cleanName}: Mind Spike`, effect: 'Deals 60 Psychic damage and causes 1.5s mental confusion to the target.' },
        { stage: 5, name: `${cleanName}: Sensory Mirage`, effect: 'Creates 3 illusory decoys that distract enemies and draw threat away from Aryan.' },
        { stage: 10, name: `${cleanName}: Synapse Sever`, effect: 'Completely disables enemy spellcasting and skill usage for 4.0 seconds.' },
        { stage: 15, name: `${cleanName}: Sovereign Telepathic Command`, effect: 'Mind-controls the strongest non-boss enemy on field to fight for Aryan for 10 seconds.' },
      ],
    },
    wind: {
      magicalStructure: 'Aerodynamic Cyclone Conduit with Laminar Vanes',
      manaFlow: 'High-Velocity Cyclonic Gale (9.2 LPS)',
      ignitionPhase: 'Sonic Pressure Wave Exciter',
      compressionRatio: '7.0:1 Barometric Compression',
      trueRank: 'C+ (Acrobatic Velocity)',
      manaCost: 10,
      description: `Manipulates localized barometric pressure differentials, generating cutting wind blades, accelerating body agility, or deflecting arrows.`,
      stages: [
        { stage: 1, name: `${cleanName}: Gale Gust`, effect: 'Knocks back approaching enemies by 6 meters and deflects light projectile arrows.' },
        { stage: 5, name: `${cleanName}: Zephyr Stride`, effect: 'Grants +45% movement speed and the ability to double-jump / glide for 8 seconds.' },
        { stage: 10, name: `${cleanName}: Razor Hurricane`, effect: 'Spawns a localized tornado that lifts enemies into the air for 3s while dealing continuous damage.' },
        { stage: 15, name: `${cleanName}: God of the South Wind`, effect: 'Summons a raging sky calamity that sweeps all enemies off their feet and decimates structures.' },
      ],
    },
    mystic: {
      magicalStructure: 'Octahedral Crystalline Core with Concentric Prismatic Rings',
      manaFlow: 'Bipolar Laminar Circulation along Primary Meridians (7.8 LPS)',
      ignitionPhase: 'Harmonic Soul Resonance Pulse',
      compressionRatio: '10:1 Omni-Resonance Lock',
      trueRank: 'B (Ancient Sovereign Origin)',
      manaCost: 12,
      description: `Channels raw, unaligned primordial mana into flexible geometric matrices, adapting dynamically to counter hostile spell signatures.`,
      stages: [
        { stage: 1, name: `${cleanName}: Mystic Surge`, effect: 'Releases a pulse of pure mana dealing 70 damage and dispelling minor curses.' },
        { stage: 5, name: `${cleanName}: Harmonic Attunement`, effect: 'Reduces active mana costs of all other spells by 25% for 10 seconds.' },
        { stage: 10, name: `${cleanName}: Spell-Breaker Hex`, effect: 'Instantly shatters active enemy shields and absorbs 40% of their mana value.' },
        { stage: 15, name: `${cleanName}: Primordial Sovereign Domain`, effect: 'Overwrites worldly mana rules; Aryan casts all skills without cooldowns for 6s.' },
      ],
    },
  };

  const selectedData = archetypesData[archetype] || archetypesData.mystic;
  const publicRank = isCorrupt ? 'F' : (['F', 'E', 'D', 'C'][Math.floor(Math.random() * 3)] as any);
  const cost = Math.min(Math.max(selectedData.manaCost, 5), Math.max(5, Math.floor(userMana * 0.25)));

  return {
    skillName: cleanName,
    publicRank,
    trueRank: selectedData.trueRank,
    manaCostPermanent: cost,
    activeManaCost: Math.floor(cost * 0.6) + 2,
    description: selectedData.description,
    magicalStructure: selectedData.magicalStructure,
    manaFlow: selectedData.manaFlow,
    ignitionPhase: selectedData.ignitionPhase,
    compressionRatio: selectedData.compressionRatio,
    stages: selectedData.stages,
    corruptionDetected: isCorrupt,
    corruptionWarning: isCorrupt
      ? 'CRITICAL WARNING: Demonic corruption signature detected. Forging this unpurified matrix risks foreign mana infiltrating Aryan\'s core.'
      : null,
    systemLog: `[FORGER PROTOCOL] — Formula deconstructed into 4 fundamental mana circuits. Public appraisal disguised as [Rank ${publicRank}]. True potency verified at [${selectedData.trueRank}].`,
  };
}

// Helper to run generateContent with timeout, model fallback, and procedural backup
async function generateWithRetry(prompt: string, systemInstruction: string, timeoutMs = 6000): Promise<string> {
  const ai = getAI();
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.5-flash-lite'];

  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const generatePromise = ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
        },
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Model ${model} request timed out after ${timeoutMs}ms`)), timeoutMs)
      );

      const response: any = await Promise.race([generatePromise, timeoutPromise]);

      if (response?.text) {
        return response.text;
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini API] Call with model ${model} failed/timed out:`, err?.message || err);
    }
  }

  throw lastError || new Error('All model attempts failed');
}

// TTS Endpoint using gemini-3.1-flash-tts-preview with retry
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'Fenrir' } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'Text parameter is required.' });
      return;
    }

    const ai = getAI();
    const allowedVoices = ['Fenrir', 'Zephyr', 'Charon', 'Kore', 'Puck'];
    const chosenVoice = allowedVoices.includes(voice) ? voice : 'Fenrir';

    // Optimize prompt for immersive fantasy storytelling narration
    const prompt = `Narrate with dramatic, cinematic intensity and solemn pacing suitable for a dark fantasy light novel:\n\n${text}`;

    let response: any = null;
    let lastErr: any = null;

    // Retry up to 2 times on transient failures
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-tts-preview',
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: chosenVoice },
              },
            },
          },
        });
        if (response) break;
      } catch (err: any) {
        lastErr = err;
        console.warn(`TTS attempt ${attempt} failed:`, err?.message || err);
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }

    if (!response) {
      throw lastErr || new Error('Failed to generate TTS audio');
    }

    const parts = response.candidates?.[0]?.content?.parts || [];
    const audioPart = parts.find((p: any) => p.inlineData?.data) || parts[0];
    const base64Audio = audioPart?.inlineData?.data;
    const mimeType = audioPart?.inlineData?.mimeType || 'audio/l16; rate=24000; channels=1';

    if (!base64Audio) {
      res.status(500).json({ error: 'No audio returned from TTS model.' });
      return;
    }

    // Extract sample rate if specified in mimeType (e.g. rate=24000)
    let sampleRate = 24000;
    const rateMatch = mimeType.match(/rate=(\d+)/i);
    if (rateMatch) {
      sampleRate = parseInt(rateMatch[1], 10);
    }

    // Extract channels if specified in mimeType (e.g. channels=1)
    let numChannels = 1;
    const channelMatch = mimeType.match(/channels=(\d+)/i);
    if (channelMatch) {
      numChannels = parseInt(channelMatch[1], 10);
    }

    // Convert raw PCM/L16 to playable WAV base64
    const wavBase64 = pcmToWavBase64(base64Audio, sampleRate, numChannels, 16);
    const dataUrl = `data:audio/wav;base64,${wavBase64}`;

    res.json({
      audioUrl: dataUrl,
      voice: chosenVoice,
      format: 'audio/wav',
      sampleRate,
    });
  } catch (error: any) {
    console.error('TTS generation failed:', error);
    res.status(500).json({ error: error.message || 'TTS generation failed.' });
  }
});

// Interactive Skill Forge Analysis Endpoint with multi-model fallback & resilience
app.post('/api/gemini/forge-analysis', async (req, res) => {
  const { skillName = 'Mystic Surge', description = '', userMana = 87 } = req.body;

  const systemInstruction = `You are the mysterious Forger System Interface from the dark fantasy world of Aetheria.
Aryan holds the Unique Skill [FORGER] (Public Rank F, True Rank Unknown).
When analyzing a skill to forge:
IMPORTANT: Every skill must have a totally unique, detailed lore description and bespoke evolutionary powers/effects with concrete numbers, damage types, status conditions, or utility mechanics. Never output generic template phrasing.

Provide structured analysis in JSON:
{
  "skillName": string,
  "publicRank": "F" | "E" | "D" | "C" | "B" | "A" | "S" | "EX",
  "trueRank": string,
  "manaCostPermanent": number (4 to 24),
  "activeManaCost": number,
  "description": string (2-3 sentences explaining its unique magical physics, visual manifestation, and tactical function),
  "magicalStructure": string,
  "manaFlow": string,
  "ignitionPhase": string,
  "compressionRatio": string,
  "stages": [
    { "stage": 1, "name": string, "effect": string },
    { "stage": 5, "name": string, "effect": string },
    { "stage": 10, "name": string, "effect": string },
    { "stage": 15, "name": string, "effect": string }
  ],
  "corruptionDetected": boolean,
  "corruptionWarning": string | null,
  "systemLog": string
}`;

  const prompt = `Analyze and deconstruct this skill for the Forger system: Name: "${skillName}", Concept/Idea: "${description || 'Combat skill with unique progression'}". Aryan currently has ${userMana} Permanent Mana capacity. Provide completely unique mechanics and stage powers.`;

  try {
    const rawJson = await generateWithRetry(prompt, systemInstruction);
    const parsed = JSON.parse(rawJson);
    if (!parsed.description && description) {
      parsed.description = description;
    }
    res.json(parsed);
  } catch (error: any) {
    console.warn('Gemini live generation unavailable, activating Forger procedural matrix fallback:', error?.message);
    const proceduralFallback = generateProceduralForgeAnalysis(skillName, description, userMana);
    res.json(proceduralFallback);
  }
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FORGER server running at http://localhost:${PORT}`);
  });
}

start().catch(console.error);
