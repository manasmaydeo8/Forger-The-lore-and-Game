import { CharacterStats, ForgedSkill, SaveSlotData, SaveArchiveExport, StorySectionId, TTSVoice } from '../types';
import { STORY_SECTIONS } from '../data/storyData';
import { INITIAL_ARYAN_STATS, INITIAL_SKILLS } from '../data/skillsData';

const AUTOSAVE_KEY = 'forger_save_autosave';
const QUICKSAVE_KEY = 'forger_save_quicksave';
const SLOT_KEY_PREFIX = 'forger_save_slot_';
const SLOTS_LIST_KEY = 'forger_save_slots_manifest';

export interface SaveStateParams {
  id: string;
  label?: string;
  stats: CharacterStats;
  skills: ForgedSkill[];
  currentSectionId: StorySectionId;
  activeTab: 'cinematic' | 'reader' | 'forge' | 'arena' | 'codex';
  selectedVoice: TTSVoice;
}

export function buildSavePayload(params: SaveStateParams): SaveSlotData {
  const section = STORY_SECTIONS.find((s) => s.id === params.currentSectionId) || STORY_SECTIONS[0];
  const forgedSkills = params.skills.filter((s) => s.isForged);
  
  // Determine highest rank skill
  const ranks = ['EX', 'S', 'A', 'B', 'C', 'D', 'E', 'F'];
  let highestSkillTier = 'F-Rank';
  for (const r of ranks) {
    if (forgedSkills.some((s) => s.publicRank === r)) {
      highestSkillTier = `${r}-Rank`;
      break;
    }
  }

  return {
    id: params.id,
    label: params.label || getDefaultSlotLabel(params.id),
    savedAt: Date.now(),
    stats: { ...params.stats },
    skills: JSON.parse(JSON.stringify(params.skills)),
    currentSectionId: params.currentSectionId,
    activeTab: params.activeTab,
    selectedVoice: params.selectedVoice,
    summary: {
      level: params.stats.level,
      title: params.stats.title,
      permanentMana: params.stats.permanentMana,
      maxPermanentMana: params.stats.maxPermanentMana,
      manaCrystals: params.stats.manaCrystals || 0,
      voidManaCrystals: params.stats.voidManaCrystals || 0,
      forgedSkillsCount: forgedSkills.length,
      highestSkillTier,
      chapterName: section.title,
      chapterPart: section.part,
    },
  };
}

function getDefaultSlotLabel(slotId: string): string {
  switch (slotId) {
    case 'autosave':
      return 'Chronicle Auto-Save';
    case 'quicksave':
      return 'Quick Save Matrix';
    case 'slot-1':
      return 'Archive Slot I';
    case 'slot-2':
      return 'Archive Slot II';
    case 'slot-3':
      return 'Archive Slot III';
    default:
      return `Custom Archive (${slotId})`;
  }
}

export function saveSlot(params: SaveStateParams): SaveSlotData | null {
  try {
    const payload = buildSavePayload(params);
    const key = getStorageKeyForSlot(params.id);
    localStorage.setItem(key, JSON.stringify(payload));
    
    // Update manifest if needed
    updateManifest(params.id);
    return payload;
  } catch (err) {
    console.error('Failed to save slot to localStorage:', err);
    return null;
  }
}

export function loadSlot(slotId: string): SaveSlotData | null {
  try {
    const key = getStorageKeyForSlot(slotId);
    const item = localStorage.getItem(key);
    if (!item) return null;
    const parsed = JSON.parse(item) as SaveSlotData;
    
    // Validate integrity
    if (!parsed.stats || !parsed.skills || !parsed.currentSectionId) {
      console.warn('Corrupt save file detected in slot:', slotId);
      return null;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load slot from localStorage:', err);
    return null;
  }
}

export function deleteSlot(slotId: string): boolean {
  try {
    const key = getStorageKeyForSlot(slotId);
    localStorage.removeItem(key);
    removeFromManifest(slotId);
    return true;
  } catch (err) {
    console.error('Failed to delete slot:', err);
    return false;
  }
}

export function getAvailableSlots(): { slotId: string; label: string; isBuiltIn: boolean; data: SaveSlotData | null }[] {
  const builtInSlots = [
    { slotId: 'autosave', label: 'Chronicle Auto-Save', isBuiltIn: true },
    { slotId: 'quicksave', label: 'Quick Save Matrix', isBuiltIn: true },
    { slotId: 'slot-1', label: 'Archive Slot I', isBuiltIn: true },
    { slotId: 'slot-2', label: 'Archive Slot II', isBuiltIn: true },
    { slotId: 'slot-3', label: 'Archive Slot III', isBuiltIn: true },
  ];

  return builtInSlots.map((slot) => {
    const data = loadSlot(slot.slotId);
    return {
      ...slot,
      data,
    };
  });
}

export function getLatestSave(): SaveSlotData | null {
  const slots = getAvailableSlots();
  let latest: SaveSlotData | null = null;

  for (const s of slots) {
    if (s.data && (!latest || s.data.savedAt > latest.savedAt)) {
      latest = s.data;
    }
  }
  return latest;
}

export function exportAllSaves(): string {
  const slots = getAvailableSlots();
  const slotMap: Record<string, SaveSlotData> = {};
  
  slots.forEach((s) => {
    if (s.data) {
      slotMap[s.slotId] = s.data;
    }
  });

  const exportData: SaveArchiveExport = {
    app: 'FORGER_RPG_CHRONICLES',
    exportVersion: 1,
    exportedAt: Date.now(),
    slots: slotMap,
    currentAutoSave: slotMap['autosave'],
  };

  return JSON.stringify(exportData, null, 2);
}

export function importSaves(jsonString: string): { success: boolean; importedCount: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed || parsed.app !== 'FORGER_RPG_CHRONICLES' || !parsed.slots) {
      // Check if it's a single slot export
      if (parsed.stats && parsed.skills && parsed.currentSectionId) {
        const slotId = parsed.id || 'slot-1';
        localStorage.setItem(getStorageKeyForSlot(slotId), JSON.stringify(parsed));
        updateManifest(slotId);
        return { success: true, importedCount: 1 };
      }
      return { success: false, importedCount: 0, error: 'Invalid save format. Expected FORGER_RPG_CHRONICLES schema.' };
    }

    let count = 0;
    const slots = parsed.slots as Record<string, SaveSlotData>;
    for (const [slotId, slotData] of Object.entries(slots)) {
      if (slotData && slotData.stats && slotData.skills) {
        localStorage.setItem(getStorageKeyForSlot(slotId), JSON.stringify(slotData));
        updateManifest(slotId);
        count++;
      }
    }

    return { success: true, importedCount: count };
  } catch (err) {
    return { success: false, importedCount: 0, error: (err as Error).message || 'Failed to parse JSON file' };
  }
}

export function resetAllDataToDefault(): { stats: CharacterStats; skills: ForgedSkill[]; currentSectionId: StorySectionId } {
  try {
    const slots = getAvailableSlots();
    slots.forEach((s) => {
      deleteSlot(s.slotId);
    });
    localStorage.removeItem(SLOTS_LIST_KEY);
  } catch (e) {
    console.warn('Failed clearing storage during reset', e);
  }

  return {
    stats: INITIAL_ARYAN_STATS,
    skills: INITIAL_SKILLS,
    currentSectionId: 'prologue-world',
  };
}

function getStorageKeyForSlot(slotId: string): string {
  if (slotId === 'autosave') return AUTOSAVE_KEY;
  if (slotId === 'quicksave') return QUICKSAVE_KEY;
  return `${SLOT_KEY_PREFIX}${slotId}`;
}

function updateManifest(slotId: string) {
  try {
    const raw = localStorage.getItem(SLOTS_LIST_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(slotId)) {
      list.push(slotId);
      localStorage.setItem(SLOTS_LIST_KEY, JSON.stringify(list));
    }
  } catch (e) {
    console.warn('Manifest update error', e);
  }
}

function removeFromManifest(slotId: string) {
  try {
    const raw = localStorage.getItem(SLOTS_LIST_KEY);
    if (!raw) return;
    const list: string[] = JSON.parse(raw);
    const filtered = list.filter((id) => id !== slotId);
    localStorage.setItem(SLOTS_LIST_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.warn('Manifest removal error', e);
  }
}
