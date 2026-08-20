import React, { useState, useEffect } from 'react';
import {
  Save,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Check,
  Clock,
  Sparkles,
  Shield,
  Zap,
  BookOpen,
  X,
  FileJson,
  Copy,
  AlertTriangle,
  Play,
  Layers,
} from 'lucide-react';
import { CharacterStats, ForgedSkill, SaveSlotData, StorySectionId, TTSVoice } from '../types';
import {
  getAvailableSlots,
  saveSlot,
  loadSlot,
  deleteSlot,
  exportAllSaves,
  importSaves,
  resetAllDataToDefault,
} from '../utils/saveManager';
import { SoundFX } from '../utils/soundEffects';

interface SaveManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CharacterStats;
  skills: ForgedSkill[];
  currentSectionId: StorySectionId;
  activeTab: 'cinematic' | 'reader' | 'forge' | 'arena' | 'codex';
  selectedVoice: TTSVoice;
  onLoadSave: (data: SaveSlotData) => void;
  onResetGame: () => void;
}

export const SaveManagerModal: React.FC<SaveManagerModalProps> = ({
  isOpen,
  onClose,
  stats,
  skills,
  currentSectionId,
  activeTab,
  selectedVoice,
  onLoadSave,
  onResetGame,
}) => {
  const [currentTab, setCurrentTab] = useState<'slots' | 'backup' | 'reset'>('slots');
  const [slotsList, setSlotsList] = useState<ReturnType<typeof getAvailableSlots>>([]);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [copied, setCopied] = useState(false);

  const refreshSlots = () => {
    setSlotsList(getAvailableSlots());
  };

  useEffect(() => {
    if (isOpen) {
      refreshSlots();
      setFeedbackMessage(null);
      setConfirmReset(false);
    }
  }, [isOpen]);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  if (!isOpen) return null;

  const handleSaveToSlot = (slotId: string, customLabel?: string) => {
    SoundFX.playSkillForged();
    const saved = saveSlot({
      id: slotId,
      label: customLabel,
      stats,
      skills,
      currentSectionId,
      activeTab,
      selectedVoice,
    });
    if (saved) {
      refreshSlots();
      showToast(`Progress successfully recorded to ${saved.label}!`, 'success');
    } else {
      showToast('Failed to save to local storage.', 'error');
    }
  };

  const handleQuickSave = () => {
    handleSaveToSlot('quicksave', 'Quick Save Matrix');
  };

  const handleLoadSlot = (slotId: string) => {
    const data = loadSlot(slotId);
    if (data) {
      SoundFX.playCrystalPulse();
      onLoadSave(data);
      showToast(`Restored state from ${data.label}!`, 'success');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      showToast('Failed to load archive slot.', 'error');
    }
  };

  const handleDeleteSlot = (slotId: string) => {
    SoundFX.playDissolve();
    deleteSlot(slotId);
    refreshSlots();
    showToast('Save slot purged.', 'info');
  };

  const handleExportSingleSlot = (data: SaveSlotData) => {
    SoundFX.playSystemNotification();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forger_save_${data.id}_lvl${data.stats.level}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported slot file: ${a.download}`, 'success');
  };

  const handleExportAll = () => {
    SoundFX.playMatrixPulse();
    const json = exportAllSaves();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `forger_full_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Complete chronicle backup downloaded!', 'success');
  };

  const handleCopyBackup = () => {
    SoundFX.playSystemNotification();
    const json = exportAllSaves();
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
    showToast('Save data JSON copied to clipboard!', 'info');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const result = importSaves(content);
        if (result.success) {
          SoundFX.playLevelUp();
          refreshSlots();
          showToast(`Successfully imported ${result.importedCount} archive save(s)!`, 'success');
        } else {
          showToast(`Import failed: ${result.error}`, 'error');
        }
      }
    };
    reader.readAsText(file);
    // Reset file input
    e.target.value = '';
  };

  const handleManualImportText = () => {
    if (!importJsonText.trim()) return;
    const result = importSaves(importJsonText.trim());
    if (result.success) {
      SoundFX.playLevelUp();
      refreshSlots();
      setImportJsonText('');
      showToast(`Imported ${result.importedCount} archive(s) successfully!`, 'success');
    } else {
      showToast(`Import error: ${result.error}`, 'error');
    }
  };

  const handleExecuteReset = () => {
    SoundFX.playDissolve();
    resetAllDataToDefault();
    onResetGame();
    refreshSlots();
    setConfirmReset(false);
    showToast('Chronicle has been reset to Chapter 1 baseline.', 'info');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const formatRelativeTime = (timestamp: number) => {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-3xl bg-[#09090b] border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0d0d12]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide font-mono flex items-center space-x-2">
                <span>SYSTEM CHRONICLE ARCHIVE</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-sans font-medium">
                  State Matrix
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Manage save slots, export backups, and synchronize Aryan's progression
              </p>
            </div>
          </div>

          <button
            id="close-save-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Quick Summary Banner */}
        <div className="px-6 py-2.5 bg-[#0f1117] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">Current Aryan:</span>
            <span className="font-bold text-cyan-300 font-mono">Lv. {stats.level}</span>
            <span className="text-slate-400">•</span>
            <span className="text-white font-medium">{stats.title}</span>
            <span className="text-slate-400">•</span>
            <span className="text-amber-400 font-mono font-semibold flex items-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>{stats.manaCrystals || 0} Crystals</span>
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-cyan-400 font-mono">
              Mana: {stats.permanentMana}/{stats.maxPermanentMana}
            </span>
          </div>

          <button
            id="modal-quick-save-btn"
            onClick={handleQuickSave}
            className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium font-mono text-[11px] flex items-center space-x-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Instant Quick Save</span>
          </button>
        </div>

        {/* Feedback Alert Toast inside modal */}
        {feedbackMessage && (
          <div
            className={`px-6 py-2 text-xs flex items-center space-x-2 font-mono ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/80 text-emerald-300 border-b border-emerald-800'
                : feedbackMessage.type === 'error'
                ? 'bg-rose-950/80 text-rose-300 border-b border-rose-800'
                : 'bg-cyan-950/80 text-cyan-300 border-b border-cyan-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-[#0a0a0d] px-6">
          <button
            id="tab-save-slots"
            onClick={() => setCurrentTab('slots')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              currentTab === 'slots'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Archive Slots (5)</span>
          </button>

          <button
            id="tab-save-backup"
            onClick={() => setCurrentTab('backup')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              currentTab === 'backup'
                ? 'border-cyan-500 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4" />
            <span>Export & Backup Matrix</span>
          </button>

          <button
            id="tab-save-reset"
            onClick={() => setCurrentTab('reset')}
            className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold border-b-2 transition ${
              currentTab === 'reset'
                ? 'border-rose-500 text-rose-300 bg-rose-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-rose-400" />
            <span>Chronicle Reset</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: SLOTS */}
          {currentTab === 'slots' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Select a slot to save your current game state or load an existing timeline:</span>
                <span className="text-[11px] font-mono text-cyan-400">LocalStorage Active</span>
              </div>

              <div className="space-y-3">
                {slotsList.map((slot) => {
                  const data = slot.data;
                  const isAuto = slot.slotId === 'autosave';
                  const isQuick = slot.slotId === 'quicksave';

                  return (
                    <div
                      key={slot.slotId}
                      className={`p-4 rounded-lg border transition ${
                        data
                          ? 'bg-[#121218] border-slate-800 hover:border-slate-700'
                          : 'bg-[#0d0d10]/60 border-dashed border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {data ? (
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Slot Info */}
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-bold text-white text-sm font-mono">{slot.label}</span>
                              {isAuto && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 uppercase font-semibold font-mono">
                                  Auto-Saved
                                </span>
                              )}
                              {isQuick && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase font-semibold font-mono">
                                  Quick Save
                                </span>
                              )}
                              <span className="text-xs text-slate-400 font-mono flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{formatRelativeTime(data.savedAt)}</span>
                                <span className="text-slate-600">({new Date(data.savedAt).toLocaleTimeString()})</span>
                              </span>
                            </div>

                            {/* Summary Metadata Badge Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono pt-1">
                              <div className="bg-[#181822] px-2.5 py-1.5 rounded border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase">Progression</div>
                                <div className="text-cyan-300 font-bold">
                                  Lv. {data.summary.level} • {data.summary.title}
                                </div>
                              </div>

                              <div className="bg-[#181822] px-2.5 py-1.5 rounded border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase">Mana Reserve</div>
                                <div className="text-cyan-400">
                                  {data.summary.permanentMana}/{data.summary.maxPermanentMana} PM
                                </div>
                              </div>

                              <div className="bg-[#181822] px-2.5 py-1.5 rounded border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase">Crystals & Skills</div>
                                <div className="text-amber-400 font-semibold">
                                  💎 {data.summary.manaCrystals} • ⚔️ {data.summary.forgedSkillsCount} Skills
                                </div>
                              </div>

                              <div className="bg-[#181822] px-2.5 py-1.5 rounded border border-slate-800">
                                <div className="text-[10px] text-slate-500 uppercase">Chapter</div>
                                <div className="text-white truncate font-sans text-[11px]">
                                  {data.summary.chapterPart}: {data.summary.chapterName}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Slot Actions */}
                          <div className="flex items-center space-x-2 flex-shrink-0 pt-2 md:pt-0">
                            <button
                              id={`load-slot-${slot.slotId}-btn`}
                              onClick={() => handleLoadSlot(slot.slotId)}
                              className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-[0_0_10px_rgba(6,182,212,0.2)] transition"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Load State</span>
                            </button>

                            <button
                              id={`overwrite-slot-${slot.slotId}-btn`}
                              onClick={() => handleSaveToSlot(slot.slotId)}
                              title="Overwrite with current progress"
                              className="p-2 rounded-lg bg-[#1a1a24] hover:bg-[#252533] border border-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center space-x-1"
                            >
                              <Save className="w-3.5 h-3.5 text-cyan-400" />
                              <span className="hidden sm:inline">Overwrite</span>
                            </button>

                            <button
                              id={`export-slot-${slot.slotId}-btn`}
                              onClick={() => handleExportSingleSlot(data)}
                              title="Export slot as JSON file"
                              className="p-2 rounded-lg bg-[#1a1a24] hover:bg-[#252533] border border-slate-700 text-slate-400 hover:text-cyan-300 transition"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>

                            {!isAuto && (
                              <button
                                id={`delete-slot-${slot.slotId}-btn`}
                                onClick={() => handleDeleteSlot(slot.slotId)}
                                title="Delete this save slot"
                                className="p-2 rounded-lg bg-[#1a1a24] hover:bg-rose-950/80 border border-slate-700 hover:border-rose-800 text-slate-400 hover:text-rose-300 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Empty Slot State */
                        <div className="flex items-center justify-between py-2">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 rounded bg-[#181822] text-slate-600">
                              <Save className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-slate-300 font-mono">{slot.label}</div>
                              <div className="text-xs text-slate-500">Empty Archive — No timeline recorded</div>
                            </div>
                          </div>

                          <button
                            id={`save-empty-slot-${slot.slotId}-btn`}
                            onClick={() => handleSaveToSlot(slot.slotId)}
                            className="px-4 py-1.5 rounded-lg bg-[#181824] hover:bg-cyan-950/80 border border-slate-700 hover:border-cyan-700 text-slate-300 hover:text-cyan-300 text-xs font-medium font-mono flex items-center space-x-1.5 transition"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Current State Here</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: BACKUP & EXPORT */}
          {currentTab === 'backup' && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-[#12121a] border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Download Complete Backup Archive (.json)</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Export all your save slots, forged skills, unlocked blueprints, arena monster drops, and novel progress as a portable JSON file. You can load this backup onto any device or browser anytime.
                </p>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  <button
                    id="export-all-backup-btn"
                    onClick={handleExportAll}
                    className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center space-x-2 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Full Backup File (.json)</span>
                  </button>

                  <button
                    id="copy-backup-btn"
                    onClick={handleCopyBackup}
                    className="px-4 py-2 rounded-lg bg-[#1c1c28] hover:bg-[#28283a] border border-slate-700 text-slate-200 text-xs font-medium flex items-center space-x-2 transition"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Save JSON to Clipboard'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#12121a] border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-white font-bold text-sm">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Restore from Backup File</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload a previously exported <code className="text-cyan-300">.json</code> file to restore your slots:
                </p>

                <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-700 hover:border-cyan-500/80 rounded-lg cursor-pointer bg-[#0d0d12] hover:bg-[#14141d] transition group">
                  <Upload className="w-6 h-6 text-slate-500 group-hover:text-cyan-400 group-hover:scale-110 transition-transform mb-2" />
                  <span className="text-xs text-slate-300 font-medium">Click or Drag & Drop .json save backup here</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Compatible with all FORGER Save Archives</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-4 rounded-lg bg-[#12121a] border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Paste JSON Save String Manually
                </div>
                <textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder="Paste exported save data JSON string here..."
                  className="w-full h-24 bg-[#09090d] border border-slate-800 rounded p-2.5 text-xs text-slate-200 font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
                <button
                  id="import-raw-json-btn"
                  onClick={handleManualImportText}
                  disabled={!importJsonText.trim()}
                  className="px-3.5 py-1.5 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Parse & Import JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: RESET */}
          {currentTab === 'reset' && (
            <div className="p-6 rounded-lg bg-rose-950/20 border border-rose-900/40 space-y-4">
              <div className="flex items-center space-x-3 text-rose-300">
                <AlertTriangle className="w-6 h-6 text-rose-400 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-base">Chronicle Reset & Reincarnation</h3>
                  <p className="text-xs text-rose-200/70">
                    Reset all progression back to Prologue Chapter 1 baseline stats (Level 1, Initial Skills).
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-[#0c0c10] p-4 rounded border border-slate-800">
                Warning: Resetting will clear all local save slots and return Aryan to the beginning of the Awakening Ceremony in the Temple of Aetheria. If you want to keep your current progress, make sure to export a backup file first!
              </p>

              {!confirmReset ? (
                <button
                  id="initiate-reset-btn"
                  onClick={() => setConfirmReset(true)}
                  className="px-4 py-2 rounded-lg bg-rose-900/80 hover:bg-rose-800 border border-rose-700 text-rose-100 text-xs font-bold font-mono flex items-center space-x-2 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Progress & Reincarnate</span>
                </button>
              ) : (
                <div className="p-4 rounded-lg bg-rose-950/80 border border-rose-600 space-y-3 animate-in zoom-in-95 duration-150">
                  <div className="text-xs font-bold text-rose-200 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Are you absolutely certain? This will wipe active session data!</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      id="confirm-reset-btn"
                      onClick={handleExecuteReset}
                      className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono transition"
                    >
                      Yes, Wipe & Start Fresh
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0a0a0d] flex items-center justify-between text-xs text-slate-500">
          <div className="font-mono text-[11px]">
            FORGER Chronicle Engine • Storage format v1.0
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#181822] hover:bg-[#222230] text-slate-300 text-xs font-medium transition"
          >
            Close Archive
          </button>
        </div>
      </div>
    </div>
  );
};
