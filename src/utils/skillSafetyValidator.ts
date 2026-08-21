import { DailySkillQuota, SkillSafetyValidationResult } from '../types';

export const MAX_DAILY_SKILL_FORGES = 3;
const QUOTA_STORAGE_KEY = 'forger_daily_skill_quota';

/**
 * Initializes or refreshes daily skill forging quota
 */
export function getOrCreateDailyQuota(currentQuota?: DailySkillQuota): DailySkillQuota {
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const now = Date.now();

  // If no quota or day has rolled over
  if (!currentQuota || currentQuota.lastResetDate !== todayStr) {
    // Next reset is midnight UTC of next day
    const tomorrow = new Date();
    tomorrow.setUTCHours(24, 0, 0, 0);

    return {
      forgesUsedToday: 0,
      maxDailyForges: MAX_DAILY_SKILL_FORGES,
      lastResetDate: todayStr,
      nextResetTimestamp: tomorrow.getTime(),
    };
  }

  return currentQuota;
}

/**
 * Gets the current daily skill quota from local storage
 */
export function getDailySkillQuota(): { usedToday: number; maxPerDay: number; remainingToday: number; nextResetTimestamp: number } {
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    const parsed: DailySkillQuota | undefined = raw ? JSON.parse(raw) : undefined;
    const quota = getOrCreateDailyQuota(parsed);
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(quota));
    return {
      usedToday: quota.forgesUsedToday,
      maxPerDay: quota.maxDailyForges,
      remainingToday: Math.max(0, quota.maxDailyForges - quota.forgesUsedToday),
      nextResetTimestamp: quota.nextResetTimestamp,
    };
  } catch (e) {
    return {
      usedToday: 0,
      maxPerDay: MAX_DAILY_SKILL_FORGES,
      remainingToday: MAX_DAILY_SKILL_FORGES,
      nextResetTimestamp: Date.now() + 86400000,
    };
  }
}

/**
 * Records a successful skill creation and updates the daily quota
 */
export function recordSkillCreation(skillName: string): boolean {
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    const parsed: DailySkillQuota | undefined = raw ? JSON.parse(raw) : undefined;
    const quota = getOrCreateDailyQuota(parsed);
    quota.forgesUsedToday = Math.min(quota.maxDailyForges, quota.forgesUsedToday + 1);
    localStorage.setItem(QUOTA_STORAGE_KEY, JSON.stringify(quota));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Prohibited Phrases and Patterns that violate the Aetheria Calamity Laws
 */
const FORBIDDEN_ONE_SHOT_PATTERNS = [
  { pattern: /\b(one[\s-]?shot|1[\s-]?shot)\b/i, label: 'One-Shot Mechanics' },
  { pattern: /\b(instant[\s-]?kill|instakill|instantly\s+kill|instant\s+death)\b/i, label: 'Instant Kill Fatality' },
  { pattern: /\b(dies?\s+immediately|instantly\s+dies?|dies?\s+on\s+impact)\b/i, label: 'Immediate Fatality Trigger' },
  { pattern: /\b(guaranteed\s+kill|guaranteed\s+fatality|unavoidable\s+death)\b/i, label: 'Unavoidable Death Mandate' },
  { pattern: /\b(infinite\s+damage|inf\s+damage|999999\s+damage|infinity\s+damage)\b/i, label: 'Infinite Damage Parameter' },
  { pattern: /\b(100%\s+(max\s+)?hp\s+(true\s+)?damage|100%\s+execute)\b/i, label: '100% Max HP Annihilation' },
  { pattern: /\b(erase[s]?\s+from\s+existence|eradicates?\s+soul\s+instantly)\b/i, label: 'Existential Erasure' },
  { pattern: /\b(unblockable\s+lethal|fatal\s+one[\s-]?hit)\b/i, label: 'Unblockable Fatal Hit' },
  { pattern: /\b(kills?\s+(the\s+)?target\s+immediately)\b/i, label: 'Instant Target Elimination' },
  { pattern: /\b(shatters\s+all\s+(non-boss\s+)?targets\s+instantly\s+regardless\s+of\s+hp)\b/i, label: 'Global Execute Without Threshold' },
];

/**
 * Validates a skill name, description, and evolutionary stages
 * against the Anti-One-Shot / Anti-Instant-Kill protocol
 */
export function validateSkillSafety(
  skillName: string,
  description: string,
  stages?: { stage: number; name?: string; effect: string }[]
): SkillSafetyValidationResult {
  const combinedText = [
    skillName,
    description,
    ...(stages || []).map((s) => `${s.name || ''} ${s.effect || ''}`),
  ].join(' ');

  const detectedViolations: string[] = [];

  for (const rule of FORBIDDEN_ONE_SHOT_PATTERNS) {
    if (rule.pattern.test(combinedText)) {
      detectedViolations.push(rule.label);
    }
  }

  // Check for ridiculously high numeric damage (e.g. > 3000)
  const numbers = combinedText.match(/\b\d{4,}\b/g);
  if (numbers) {
    for (const numStr of numbers) {
      const val = parseInt(numStr, 10);
      if (val >= 3000) {
        detectedViolations.push(`Excessive Damage Magnitude (${val} DMG exceeds the 2,500 mortal cap)`);
        break;
      }
    }
  }

  if (detectedViolations.length > 0) {
    return {
      isPermitted: false,
      violationType: 'ONE_SHOT',
      violationReason: `CALAMITY PROTOCOL REJECTION: This skill contains prohibited One-Shot / Instant-Kill mechanics (${detectedViolations.join(', ')}). The Heavenly Barrier of Aetheria strictly forbids fatal causality shortcuts. All forged skills must engage in fair damage scaling, status conditions, or crowd control.`,
      censoredPhrases: detectedViolations,
      sanitizedSuggestion: 'Reframe the skill around high burst damage (e.g., 220–500 DMG), armor penetration, burn/shock status, or execute thresholds capped below 15% HP.',
    };
  }

  return {
    isPermitted: true,
  };
}
