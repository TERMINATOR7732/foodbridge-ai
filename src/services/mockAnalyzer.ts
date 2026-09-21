/**
 * mockAnalyzer.ts
 *
 * Deterministic mock implementation of the AI food analyser for Phase 2A.
 *
 * ─── PHASE 2B CONNECTION POINT ────────────────────────────────────────────────
 * When connecting a real AI provider (e.g. OpenAI, Anthropic, a local model,
 * or an IBM watsonx endpoint), replace this entire file with a real
 * implementation that conforms to the same function signature:
 *
 *   runAnalysis(input: AnalysisInput): Promise<FoodAnalysisResult>
 *
 * The aiService.ts entry point calls only that function, so the UI and service
 * abstraction layer require zero changes when the provider is swapped in.
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Design rules for this mock:
 *   - Inspect all submitted fields; do not ignore input.
 *   - Return deterministic, sensible output (same input → same output).
 *   - Never claim medical or certified food-safety conclusions.
 *   - Handle missing/empty fields gracefully without throwing.
 *   - confidence reflects input completeness AND food age, not random values.
 *   - Food age (now − preparationDate) is a primary safety signal.
 *     The "available until" date NEVER overrides an old preparation date.
 */

import type {
  FoodAnalysisResult,
  FoodCategory,
  Priority,
  DonationSuitability,
  RecommendedStorage,
} from '../types'

// ─── Input contract ────────────────────────────────────────────────────────────

/**
 * The analyser's view of a donation submission.
 * Intentionally accepts loose strings so validation lives in the service layer.
 */
export interface AnalysisInput {
  foodName: string
  category: string
  quantity: string
  unit: string
  estimatedServings: string
  preparationDate: string
  availabilityUntil: string
  storageCondition: string
  location: string
  additionalInfo: string
}

// ─── Validation error ─────────────────────────────────────────────────────────

export class AnalysisInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AnalysisInputError'
  }
}

// ─── Date validation result ───────────────────────────────────────────────────

/**
 * Result of date-relationship validation.
 * `valid: false` means the analyser must produce a safe/error result
 * rather than a normal analysis.
 */
type DateValidationResult =
  | { valid: true; prepTime: number; untilTime: number; nowTime: number }
  | { valid: false; reason: string }

function parseFlexibleDate(str: string): number {
  if (!str || str.trim() === '') return NaN
  const d = new Date(str)
  if (!isNaN(d.getTime())) return d.getTime()
  // Support DD/MM/YYYY, HH:MM AM/PM formats
  const m = str.match(
    /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i,
  )
  if (m) {
    const [, day, month, year, hours, mins, secs, ampm] = m
    let h = parseInt(hours, 10)
    if (ampm) {
      if (ampm.toUpperCase() === 'PM' && h < 12) h += 12
      if (ampm.toUpperCase() === 'AM' && h === 12) h = 0
    }
    const parsed = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      h,
      parseInt(mins, 10),
      secs ? parseInt(secs, 10) : 0,
    )
    if (!isNaN(parsed.getTime())) return parsed.getTime()
  }
  return NaN
}

function validateDates(
  preparationDate: string,
  availabilityUntil: string,
  nowTime: number = Date.now(),
): DateValidationResult {
  // ── Parse prep date ────────────────────────────────────────────────────────
  if (!preparationDate || preparationDate.trim() === '') {
    return { valid: false, reason: 'Preparation date was not provided.' }
  }
  const prepTime = parseFlexibleDate(preparationDate)
  if (isNaN(prepTime)) {
    return { valid: false, reason: 'Preparation date could not be parsed — please check the format.' }
  }
  if (prepTime > nowTime + 60 * 60 * 1000) {
    // Allow up to 1 hour tolerance for timezone/clock skew; anything beyond is invalid
    return {
      valid: false,
      reason: `The preparation date (${new Date(prepTime).toLocaleDateString()}) is in the future. Food cannot have been prepared at a future time.`,
    }
  }

  // ── Parse available-until date ─────────────────────────────────────────────
  if (!availabilityUntil || availabilityUntil.trim() === '') {
    // Missing until-date is allowed; we will work without it
    return { valid: true, prepTime, untilTime: 0, nowTime }
  }
  const untilTime = parseFlexibleDate(availabilityUntil)
  if (isNaN(untilTime)) {
    return { valid: false, reason: 'Available-until date could not be parsed — please check the format.' }
  }
  if (untilTime < prepTime) {
    return {
      valid: false,
      reason: `The available-until date (${new Date(untilTime).toLocaleDateString()}) is earlier than the preparation date (${new Date(prepTime).toLocaleDateString()}). Please verify the dates.`,
    }
  }

  return { valid: true, prepTime, untilTime, nowTime }
}

// ─── Food age calculation ─────────────────────────────────────────────────────

/** Returns the age of the food in hours from preparation until now. */
function computeFoodAgeHours(prepTime: number, nowTime: number): number {
  return Math.max(0, (nowTime - prepTime) / (1000 * 60 * 60))
}

/** Returns hours remaining until expiry, or 0 if no until-date or already expired. */
function computeRemainingHoursFromTimes(untilTime: number, nowTime: number): number {
  if (!untilTime) return 0
  return Math.max(0, (untilTime - nowTime) / (1000 * 60 * 60))
}

/** Returns total window in hours from prep to expiry. */
function computeWindowHoursFromTimes(prepTime: number, untilTime: number): number {
  if (!untilTime) return 0
  return Math.max(0, (untilTime - prepTime) / (1000 * 60 * 60))
}

/**
 * Formats an elapsed duration in hours into a clear, human-readable string.
 * Examples: "less than 1 hour", "4 hours", "13 hours", "2 days and 14 hours".
 */
export function formatDuration(hours: number): string {
  if (hours < 1) {
    return 'less than 1 hour'
  }
  const rounded = Math.round(hours)
  if (rounded < 24) {
    return `${rounded} hour${rounded !== 1 ? 's' : ''}`
  }
  const days = Math.floor(hours / 24)
  const remainHours = Math.round(hours % 24)
  if (remainHours === 0) {
    return `${days} day${days !== 1 ? 's' : ''}`
  }
  return `${days} day${days !== 1 ? 's' : ''} and ${remainHours} hour${remainHours !== 1 ? 's' : ''}`
}

// ─── Category-aware age thresholds ────────────────────────────────────────────
//
// These are CONSERVATIVE DEMO thresholds used for advisory purposes only.
// They are NOT official food-safety standards or regulatory guidelines.
// Human verification is always required before any redistribution decision.
//
// Age bands per category (in hours):
//   fresh:    food is within its typical same-day/short-term use window
//   caution:  food is older; suitability is reduced, verification required
//   stale:    food should not be automatically marked suitable
//   spoiled:  food is not recommended for redistribution

interface AgeThresholds {
  /** Upper bound in hours for "fresh" (Suitable or Suitable with Conditions) */
  freshHours: number
  /** Upper bound in hours for "caution" (Requires Review) */
  cautionHours: number
  /** Upper bound in hours for "stale" (Not Recommended — coordinator must assess) */
  staleHours: number
  // Beyond staleHours → Not Recommended without question
}

const AGE_THRESHOLDS: Record<FoodCategory, AgeThresholds> = {
  // Prepared Meals default (refrigerated cooked meals):
  //   0–24 h    → fresh (Suitable)
  //   24–48 h   → caution (Suitable with Conditions - verify cold chain & reheating)
  //   48–72 h   → review required (Requires Review - coordinator direct assessment)
  //   >72 h     → not recommended for community redistribution
  'Prepared Meals': { freshHours: 24, cautionHours: 48, staleHours: 72 },

  // Fresh Produce: typically lasts 2–5 days refrigerated
  //   0–48 h    → fresh
  //   48–96 h   → caution
  //   96–168 h  → stale (4–7 days)
  //   >168 h    → not recommended
  'Fresh Produce': { freshHours: 48, cautionHours: 96, staleHours: 168 },

  // Bakery & Bread: best same-day; tolerable for a few days; stale after ~1 week
  //   0–24 h    → fresh (same day)
  //   24–72 h   → caution (1–3 days)
  //   72–168 h  → stale (3–7 days)  — requires verification
  //   >168 h    → not recommended   (>7 days)
  'Bakery & Bread': { freshHours: 24, cautionHours: 72, staleHours: 168 },

  // Dairy & Eggs: refrigerated shelf life typically 3–7 days after opening;
  //   0–24 h    → fresh
  //   24–72 h   → caution
  //   72–168 h  → stale
  //   >168 h    → not recommended
  'Dairy & Eggs': { freshHours: 24, cautionHours: 72, staleHours: 168 },

  // Canned & Packaged: shelf-stable; age of submission is less relevant
  // unless the can was opened or the packaging was removed.
  // Using a wide window but still flagging very old open packaging.
  //   0–72 h    → fresh
  //   72–168 h  → caution
  //   168–720 h → stale (1 week – 1 month)
  //   >720 h    → not recommended (>30 days since tracking began)
  'Canned & Packaged': { freshHours: 72, cautionHours: 168, staleHours: 720 },

  // Beverages: opened beverages spoil quickly; sealed ones are shelf-stable.
  // Treating conservatively as opened/chilled unless noted otherwise.
  //   0–24 h    → fresh
  //   24–72 h   → caution
  //   72–168 h  → stale
  //   >168 h    → not recommended
  Beverages: { freshHours: 24, cautionHours: 72, staleHours: 168 },

  // Frozen: age since freezing is less critical if properly stored,
  // but very long-frozen items may have quality concerns.
  //   0–720 h   → fresh  (0–30 days)
  //   720–1440h → caution (30–60 days)
  //   1440–2160h→ stale  (60–90 days)
  //   >2160 h   → not recommended (>90 days)
  Frozen: { freshHours: 720, cautionHours: 1440, staleHours: 2160 },

  // Other: use conservative default
  Other: { freshHours: 24, cautionHours: 48, staleHours: 96 },
}

/**
 * Returns storage-sensitive age thresholds.
 * Evaluates storage conditions as increasing risk factors rather than rigid binary cutoffs.
 * Refrigerated prepared meals remain viable across multiple days under continuous cold chain,
 * while room-temperature cooked food accumulates microbiological risk and uncertainty with time.
 */
function getCategoryThresholds(
  category: FoodCategory,
  storageCondition: string = '',
): AgeThresholds {
  const normStorage = storageCondition.trim().toLowerCase()
  if (category === 'Prepared Meals') {
    if (normStorage === 'room temperature') {
      // Room-temperature storage is evaluated as an increasing risk factor:
      // 0–2h fresh, 2–4h caution (Suitable with Conditions), 4–18h extended room temp (Requires Review), >18h prolonged uncontrolled (Not Recommended)
      return { freshHours: 2, cautionHours: 4, staleHours: 18 }
    }
    if (normStorage === 'frozen') {
      return { freshHours: 720, cautionHours: 1440, staleHours: 2160 }
    }
    if (!normStorage || normStorage === 'unspecified') {
      // Unknown storage history represents uncertainty: conservative boundaries
      return { freshHours: 4, cautionHours: 12, staleHours: 24 }
    }
    // Refrigerated (or keep cool/default) cooked meals:
    // 0-24h fresh (Suitable), 24-48h caution (Suitable with Conditions),
    // 48-72h review (Requires Review), >72h not recommended
    return { freshHours: 24, cautionHours: 48, staleHours: 72 }
  }

  if (category === 'Dairy & Eggs') {
    if (normStorage === 'room temperature') {
      return { freshHours: 2, cautionHours: 4, staleHours: 12 }
    }
    if (!normStorage || normStorage === 'unspecified') {
      return { freshHours: 4, cautionHours: 12, staleHours: 24 }
    }
    return { freshHours: 24, cautionHours: 72, staleHours: 168 }
  }

  return AGE_THRESHOLDS[category]
}

// ─── Age evaluation result ────────────────────────────────────────────────────

/**
 * Describes how food age affects the analysis outputs.
 * The main analysis functions consume this struct rather than computing
 * age independently, ensuring all outputs are consistent.
 */
interface AgeEvaluation {
  foodAgeHours: number
  ageBand: 'fresh' | 'caution' | 'stale' | 'spoiled'
  /** Penalty applied to confidence (0 = no penalty, 0.3 = −30 pp) */
  confidencePenalty: number
  /** Age-driven suitability cap: analysis cannot return better than this */
  suitabilityCap: DonationSuitability
  /** Age-driven priority adjustment */
  agePriority: Priority | null
  /** Concise age description for reasoning text */
  ageDescription: string
  /** Safety consideration text about food age, if any */
  ageSafetyNote: string | null
}

function evaluateFoodAge(
  category: FoodCategory,
  foodAgeHours: number,
  storageCondition: string = '',
): AgeEvaluation {
  const thresholds = getCategoryThresholds(category, storageCondition)

  // Format age for human-readable reasoning
  const durationStr = formatDuration(foodAgeHours)
  const ageDescription = foodAgeHours < 24 && foodAgeHours >= 1
    ? `approximately ${durationStr} old at assessment`
    : `${durationStr} old at assessment`

  if (foodAgeHours <= thresholds.freshHours) {
    return {
      foodAgeHours,
      ageBand: 'fresh',
      confidencePenalty: 0,
      suitabilityCap: 'Suitable',
      agePriority: null,
      ageDescription,
      ageSafetyNote: null,
    }
  }

  if (foodAgeHours <= thresholds.cautionHours) {
    const normStorage = storageCondition.trim().toLowerCase()
    const isRefrigMeal =
      category === 'Prepared Meals' && normStorage.includes('refrig')
    const isRoomTempMeal =
      category === 'Prepared Meals' && normStorage === 'room temperature'

    let cautionNote: string
    if (isRefrigMeal) {
      cautionNote = `Food is ${ageDescription} (refrigerated) — suitable with conditions. Verify continuous refrigeration at or below 5 °C and prompt reheat before distribution.`
    } else if (isRoomTempMeal) {
      cautionNote = `Food is ${ageDescription} (room temperature) — storage conditions indicate elevated risk and unknown temperature exposure. Verify condition and prioritize prompt redistribution.`
    } else {
      cautionNote = `Food is ${ageDescription} — suitability is reduced compared with a same-day donation. Coordinator should verify condition before redistribution.`
    }

    return {
      foodAgeHours,
      ageBand: 'caution',
      confidencePenalty: 0.05,
      suitabilityCap: 'Suitable with Conditions',
      agePriority: null,
      ageDescription,
      ageSafetyNote: cautionNote,
    }
  }

  if (foodAgeHours <= thresholds.staleHours) {
    const normStorage = storageCondition.trim().toLowerCase()
    const isRefrigMeal =
      category === 'Prepared Meals' && normStorage.includes('refrig')
    const isRoomTempMeal =
      category === 'Prepared Meals' && normStorage === 'room temperature'

    let staleNote: string
    if (isRefrigMeal) {
      staleNote = `Prepared meal is ${ageDescription} (refrigerated) — reaches the upper advisory limit for cooked food redistribution. Coordinator review is required to verify appearance, odor, and continuous cold chain (<5 °C).`
    } else if (isRoomTempMeal) {
      staleNote = `Prepared meal is ${ageDescription} (room temperature) — extended room-temperature storage presents elevated microbiological risk and unknown temperature exposure. Coordinator review and physical assessment are required prior to any redistribution decision.`
    } else {
      staleNote = `Food is ${ageDescription} — this exceeds the typical redistribution window for ${category}. Coordinator review is required; do not redistribute without direct assessment.`
    }

    return {
      foodAgeHours,
      ageBand: 'stale',
      confidencePenalty: 0.12,
      suitabilityCap: 'Requires Review',
      agePriority: 'Low',
      ageDescription,
      ageSafetyNote: staleNote,
    }
  }

  // Beyond stale threshold → not recommended
  const normStorage = storageCondition.trim().toLowerCase()
  const isRoomTempMeal =
    category === 'Prepared Meals' && normStorage === 'room temperature'
  const spoiledNote = isRoomTempMeal
    ? `The reported preparation and storage details indicate prolonged uncontrolled room-temperature storage (${ageDescription}). This presents significant microbiological risk and uncertainty that cannot be verified from submission data alone. Redistribution is not recommended based on reported storage history. Human verification is required before any action.`
    : `The reported preparation date indicates that this food has been stored for an extended period (${ageDescription}). This exceeds the advisory shelf-life threshold for ${category} and the donation is not recommended for redistribution based on reported age. Human verification is required before any action.`

  return {
    foodAgeHours,
    ageBand: 'spoiled',
    confidencePenalty: 0.04,
    suitabilityCap: 'Not Recommended',
    agePriority: 'Low',
    ageDescription,
    ageSafetyNote: spoiledNote,
  }
}

// ─── Storage condition check ──────────────────────────────────────────────────
//
// Risk & uncertainty assessment: flags storage mismatches, unverified handling,
// and prolonged uncontrolled ambient exposure.
// These are NOT laboratory certifications. They are advisory decision-support prompts.

interface StorageEvaluation {
  suitabilityCap: DonationSuitability | null
  storageNote: string | null
  isMissingStorage: boolean
}

/**
 * Check whether the reported storage condition presents risk or uncertainty.
 * Evaluates room-temperature storage as an increasing risk factor whose severity
 * depends on category, elapsed time, and absence of verified cold chain.
 */
function evaluateStorageCondition(
  category: FoodCategory,
  storageCondition: string,
  foodAgeHours: number = 0,
): StorageEvaluation {
  const condition = storageCondition.trim().toLowerCase()

  // Missing / unspecified storage condition
  if (!condition || condition === 'unspecified' || condition === 'unknown') {
    if (category === 'Prepared Meals' || category === 'Dairy & Eggs' || category === 'Frozen') {
      return {
        suitabilityCap: 'Requires Review',
        storageNote:
          'Storage condition and temperature history were not reported — FoodBridge cannot establish whether temperature control was maintained. On-site coordinator verification is required before redistribution.',
        isMissingStorage: true,
      }
    }
    return { suitabilityCap: null, storageNote: null, isMissingStorage: true }
  }

  if (condition === 'room temperature') {
    switch (category) {
      case 'Prepared Meals': {
        if (foodAgeHours <= 2) {
          return {
            suitabilityCap: null,
            storageNote:
              'Storage condition advisory: Prepared meal held at room temperature. FoodBridge recommends prompt consumption or rapid chilling below 5 °C within safe holding windows.',
            isMissingStorage: false,
          }
        }
        if (foodAgeHours <= 18) {
          return {
            suitabilityCap: 'Requires Review',
            storageNote:
              'Storage condition advisory: Cooked food held at room temperature presents elevated microbiological risk and unknown temperature exposure. Because actual handling, ambient temperature, and holding history cannot be verified from submission data alone, coordinator review and physical inspection are required prior to any redistribution decision.',
            isMissingStorage: false,
          }
        }
        return {
          suitabilityCap: 'Not Recommended',
          storageNote:
            'Storage condition advisory: Prepared meal subject to prolonged uncontrolled room-temperature storage presents significant microbiological risk and uncertainty. Redistribution is not recommended based on reported storage history. Note: Refrigerating the food now does not reverse potential risk associated with earlier uncontrolled storage.',
          isMissingStorage: false,
        }
      }

      case 'Dairy & Eggs': {
        if (foodAgeHours <= 2) {
          return {
            suitabilityCap: 'Suitable with Conditions',
            storageNote:
              'Storage condition advisory: Dairy and egg products held at room temperature require prompt refrigeration (<5 °C) or immediate consumption.',
            isMissingStorage: false,
          }
        }
        if (foodAgeHours <= 12) {
          return {
            suitabilityCap: 'Requires Review',
            storageNote:
              'Storage condition advisory: Dairy and egg products stored at room temperature present elevated bacterial risk. Coordinator review and physical inspection of seals and odour are required.',
            isMissingStorage: false,
          }
        }
        return {
          suitabilityCap: 'Not Recommended',
          storageNote:
            'Storage condition advisory: Dairy products subject to prolonged room-temperature exposure present high microbial risk and uncertainty. Redistribution is not recommended based on reported storage history.',
          isMissingStorage: false,
        }
      }

      case 'Frozen': {
        return {
          suitabilityCap: 'Requires Review',
          storageNote:
            'Storage condition check (advisory): Frozen food is expected to remain at −18 °C or below. Reporting room temperature storage suggests the item may have thawed — a coordinator must verify the current state before redistribution.',
          isMissingStorage: false,
        }
      }

      default:
        return { suitabilityCap: null, storageNote: null, isMissingStorage: false }
    }
  }

  return { suitabilityCap: null, storageNote: null, isMissingStorage: false }
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const KNOWN_CATEGORIES: FoodCategory[] = [
  'Prepared Meals',
  'Fresh Produce',
  'Bakery & Bread',
  'Dairy & Eggs',
  'Canned & Packaged',
  'Beverages',
  'Frozen',
  'Other',
]

function resolveCategory(input: string): FoodCategory {
  const trimmed = input.trim()
  if ((KNOWN_CATEGORIES as string[]).includes(trimmed)) {
    return trimmed as FoodCategory
  }
  const lower = trimmed.toLowerCase()
  if (lower.includes('meal') || lower.includes('cook') || lower.includes('prepared')) return 'Prepared Meals'
  if (lower.includes('produce') || lower.includes('vegetable') || lower.includes('fruit') || lower.includes('salad')) return 'Fresh Produce'
  if (lower.includes('bread') || lower.includes('bak') || lower.includes('pastry')) return 'Bakery & Bread'
  if (lower.includes('dairy') || lower.includes('milk') || lower.includes('cheese') || lower.includes('egg')) return 'Dairy & Eggs'
  if (lower.includes('can') || lower.includes('tin') || lower.includes('packag')) return 'Canned & Packaged'
  if (lower.includes('drink') || lower.includes('juice') || lower.includes('beverage') || lower.includes('water')) return 'Beverages'
  if (lower.includes('frozen') || lower.includes('freeze')) return 'Frozen'
  return 'Other'
}

function computeConfidence(
  input: AnalysisInput,
  category: FoodCategory,
  ageEval: AgeEvaluation,
  remainingHours: number,
  storageEval: StorageEvaluation,
  hasAvailabilityUntil: boolean,
): number {
  const fields: string[] = [
    input.foodName,
    input.category,
    input.quantity,
    input.unit,
    input.estimatedServings,
    input.preparationDate,
    input.availabilityUntil,
    input.storageCondition,
    input.location,
  ]
  const filled = fields.filter((f) => f && f.trim().length > 0).length
  // Base confidence from field completeness (0.70 to 0.88)
  let score = 0.70 + (filled / fields.length) * 0.18

  // Bonus for clear allergen/handling context
  const hasNotes = input.additionalInfo && input.additionalInfo.trim().length > 10
  if (hasNotes) {
    score += 0.04
  } else if (category === 'Prepared Meals') {
    // Missing ingredient context on prepared meals carries minor certainty deduction
    score -= 0.04
  }

  // Deduction for missing storage/temperature history on perishable items
  if (
    storageEval.isMissingStorage &&
    (category === 'Prepared Meals' || category === 'Dairy & Eggs' || category === 'Frozen')
  ) {
    score -= 0.10
  }

  // Deductions for safety uncertainty in the classification:
  if (ageEval.ageBand === 'caution') {
    score -= 0.05
  } else if (ageEval.ageBand === 'stale') {
    // Aging food near limits or extended room temp has higher microbiological variance
    score -= 0.10
  } else if (ageEval.ageBand === 'spoiled') {
    score -= 0.04
  }

  // Elapsed availability window adds coordinator uncertainty
  if (hasAvailabilityUntil && remainingHours <= 0) {
    score -= 0.08
  }

  // Storage condition mismatch or room-temp perishable uncertainty
  if (storageEval.suitabilityCap !== null && !storageEval.isMissingStorage) {
    score -= 0.08
  }

  return parseFloat(Math.max(0.40, Math.min(0.92, score)).toFixed(2))
}

// ─── Per-category rules ────────────────────────────────────────────────────────

interface CategoryProfile {
  storageRecommendation: RecommendedStorage
  /** Typical maximum redistribution window in hours (used for remaining-time checks) */
  maxSafeHours: number
  baseGuidance: string[]
}

const CATEGORY_PROFILES: Record<FoodCategory, CategoryProfile> = {
  'Prepared Meals': {
    storageRecommendation: 'Keep Refrigerated',
    maxSafeHours: 4,
    baseGuidance: [
      'Prepared meals should be kept refrigerated at or below 5 °C at all times.',
      'Redistribute within the same day of preparation wherever possible.',
      'Confirm ingredients and allergen information before handover.',
      'Recipient organisation should have adequate refrigerated storage on arrival.',
      'Maintain cold chain during any transport period.',
    ],
  },
  'Fresh Produce': {
    storageRecommendation: 'Keep Refrigerated',
    maxSafeHours: 48,
    baseGuidance: [
      'Fresh produce should be kept cool and away from direct sunlight.',
      'Inspect for signs of spoilage or damage before redistribution.',
      'Wash and re-package if produce is loose and unpackaged.',
      'Advise recipients of approximate freshness date.',
    ],
  },
  'Bakery & Bread': {
    storageRecommendation: 'Room Temperature',
    maxSafeHours: 24,
    baseGuidance: [
      'Bread and bakery items are best redistributed on the day of baking.',
      'Store in sealed packaging to maintain freshness.',
      'Check for allergen declarations (nuts, sesame, gluten) and communicate to recipients.',
      'Avoid storing near strong-smelling foods.',
    ],
  },
  'Dairy & Eggs': {
    storageRecommendation: 'Keep Refrigerated',
    maxSafeHours: 24,
    baseGuidance: [
      'Dairy and eggs must remain refrigerated throughout the redistribution process.',
      'Check use-by dates carefully — only redistribute within the stated date.',
      'Eggs should be transported carefully to avoid breakage.',
      'Inform recipients of any open packaging or partially used containers.',
    ],
  },
  'Canned & Packaged': {
    storageRecommendation: 'Room Temperature',
    maxSafeHours: 8760,
    baseGuidance: [
      'Verify cans and packages are undamaged, unsealed, and within best-before dates.',
      'Do not redistribute damaged, dented, or swollen cans.',
      'Clearly label boxes with contents if outer packaging has been removed.',
    ],
  },
  Beverages: {
    storageRecommendation: 'Keep Cool (below 15 °C)',
    maxSafeHours: 72,
    baseGuidance: [
      'Check that bottles and cartons are sealed and undamaged.',
      'Verify best-before or use-by dates before redistribution.',
      'Chilled beverages should remain refrigerated until collection.',
    ],
  },
  Frozen: {
    storageRecommendation: 'Keep Frozen',
    maxSafeHours: 720,
    baseGuidance: [
      'Frozen food must remain at −18 °C or below throughout handling.',
      'Do not refreeze food that has been fully thawed.',
      'Use insulated transport and communicate freezing requirements to recipients.',
      'Check that packaging is intact and undamaged.',
    ],
  },
  Other: {
    storageRecommendation: 'Room Temperature',
    maxSafeHours: 24,
    baseGuidance: [
      'Verify food is within its use-by or best-before date.',
      'Inspect packaging for damage or contamination.',
      'Seek coordinator guidance if food type or storage needs are unclear.',
    ],
  },
}

// ─── Suitability / priority derivation ───────────────────────────────────────

/**
 * Cap suitability at `cap` — never return better than the cap allows.
 * Suitability ordering (best → worst):
 *   Suitable > Suitable with Conditions > Requires Review > Not Recommended
 */
function applySuitabilityCap(
  derived: DonationSuitability,
  cap: DonationSuitability,
): DonationSuitability {
  const order: DonationSuitability[] = [
    'Suitable',
    'Suitable with Conditions',
    'Requires Review',
    'Not Recommended',
  ]
  const derivedIdx = order.indexOf(derived)
  const capIdx = order.indexOf(cap)
  return order[Math.max(derivedIdx, capIdx)]
}

function deriveSuitabilityFromTime(
  category: FoodCategory,
  remainingHours: number,
  hasAvailabilityUntil: boolean,
): DonationSuitability {
  const profile = CATEGORY_PROFILES[category]

  // If the stated availability deadline has elapsed:
  // This is a coordination / availability concern requiring coordinator verification.
  // It does NOT automatically mean the food is biologically toxic, so cap at 'Requires Review'.
  if (hasAvailabilityUntil && remainingHours <= 0) {
    return 'Requires Review'
  }

  if (remainingHours < profile.maxSafeHours * 0.25) return 'Requires Review'
  if (remainingHours < profile.maxSafeHours * 0.6) return 'Suitable with Conditions'
  return 'Suitable'
}

function derivePriority(
  category: FoodCategory,
  remainingHours: number,
  availabilityWindowHours: number,
  ageEval: AgeEvaluation,
  suitability: DonationSuitability,
): Priority {
  if (suitability === 'Not Recommended') return 'Low'
  if (ageEval.agePriority !== null) return ageEval.agePriority
  if (remainingHours <= 0) return 'Low'

  const profile = CATEGORY_PROFILES[category]
  if (remainingHours <= profile.maxSafeHours * 0.5 && remainingHours < 12) return 'High'
  if (availabilityWindowHours <= 6) return 'High'
  if (availabilityWindowHours <= 24) return 'Medium'
  return 'Low'
}

// ─── Output builders ──────────────────────────────────────────────────────────

function deriveShelfLife(
  category: FoodCategory,
  remainingHours: number,
  ageEval: AgeEvaluation,
  hasAvailabilityUntil: boolean,
  storageCondition: string = '',
  availabilityWindowHours: number = 0,
  elapsedSinceExpiryHours: number = 0,
): string {
  const normStorage = (storageCondition || '').trim().toLowerCase()
  const isWindowElapsed = hasAvailabilityUntil && remainingHours <= 0

  if (ageEval.ageBand === 'spoiled') {
    if (category === 'Prepared Meals' && normStorage === 'room temperature') {
      return `Prolonged uncontrolled room-temperature storage (${ageEval.ageDescription}) — redistribution not recommended`
    }
    return `Exceeds advisory redistribution age for ${category} (${ageEval.ageDescription}) — not recommended`
  }

  if (ageEval.ageBand === 'stale') {
    if (isWindowElapsed) {
      const windowStr = availabilityWindowHours > 0 ? `Original ${Math.round(availabilityWindowHours)}h availability window expired; ` : 'Stated availability window expired; '
      return `${windowStr}${category.toLowerCase()} is ${ageEval.ageDescription} — coordinator review required`
    }
    if (category === 'Prepared Meals' && normStorage === 'room temperature') {
      return `Stored at room temperature for ${ageEval.ageDescription} — elevated risk; coordinator review required`
    }
    return `Approaching ${category.toLowerCase()} shelf-life limit — food is ${ageEval.ageDescription}; physical assessment required`
  }

  if (isWindowElapsed) {
    const elapsedDesc = elapsedSinceExpiryHours > 0 ? ` (${formatDuration(elapsedSinceExpiryHours)} past deadline)` : ''
    const windowStr = availabilityWindowHours > 0 ? `Stated ${Math.round(availabilityWindowHours)}h availability window expired` : 'Stated availability window expired'
    return `${windowStr}${elapsedDesc} — coordinator must verify with donor if food remains available`
  }

  if (remainingHours < 2) return 'Less than 2 hours remaining — immediate action required'
  if (remainingHours < 6) return `Approximately ${Math.round(remainingHours)} hours remaining — same-day redistribution required`
  if (remainingHours < 24) return `Approximately ${Math.round(remainingHours)} hours remaining — redistribute today`
  const days = Math.round(remainingHours / 24)
  return `Approximately ${days} day${days !== 1 ? 's' : ''} remaining`
}

function deriveStorageRecommendation(
  category: FoodCategory,
  storageCondition: string,
  foodAgeHours: number,
  suitability: DonationSuitability,
): RecommendedStorage {
  const normStorage = (storageCondition || '').trim().toLowerCase()
  const isPerishable =
    category === 'Prepared Meals' ||
    category === 'Dairy & Eggs' ||
    category === 'Frozen'

  if (isPerishable && normStorage === 'room temperature') {
    if (suitability === 'Not Recommended' || foodAgeHours > 18) {
      return 'Not Applicable — prolonged room-temperature exposure cannot be reversed by subsequent refrigeration'
    }
    if (foodAgeHours > 2) {
      return 'Prompt consumption or rapid temperature control; refrigerating now does not reverse prior room-temperature exposure'
    }
    return 'Consume promptly or chill rapidly below 5 °C'
  }

  if (normStorage.includes('refrig')) {
    return 'Maintain refrigerated storage (at or below 5 °C)'
  }

  if (normStorage.includes('frozen')) {
    return 'Maintain frozen storage (at or below −18 °C)'
  }

  if (isPerishable && (!normStorage || normStorage === 'unspecified')) {
    return 'Verify temperature history; maintain refrigeration (≤ 5 °C) if safety verified'
  }

  return CATEGORY_PROFILES[category].storageRecommendation
}

function addContextualGuidance(base: string[], input: AnalysisInput): string[] {
  const extra: string[] = []
  const notes = input.additionalInfo.toLowerCase()

  if (notes.includes('gluten') || notes.includes('wheat')) {
    extra.push('Contains gluten — communicate clearly to recipient organisations for allergy management.')
  }
  if (notes.includes('nut') || notes.includes('peanut')) {
    extra.push('Nut allergen present — must be clearly labelled and handled separately from nut-free food.')
  }
  if (notes.includes('dairy') || notes.includes('milk') || notes.includes('lactose')) {
    extra.push('Contains dairy — inform recipients for lactose intolerance or dairy allergy management.')
  }
  if (notes.includes('vegetarian') || notes.includes('vegan')) {
    extra.push('Dietary suitability (vegetarian/vegan) noted — communicate to recipient organisations.')
  }
  if (notes.includes('halal')) {
    extra.push('Halal-suitable noted — communicate to recipient organisations.')
  }

  return [...base, ...extra]
}

function buildRecommendation(
  suitability: DonationSuitability,
  priority: Priority,
  category: FoodCategory,
  remainingHours: number,
  ageEval: AgeEvaluation,
  hasAvailabilityUntil: boolean,
  foodName: string,
  storageCondition: string = '',
  availabilityWindowHours: number = 0,
  elapsedSinceExpiryHours: number = 0,
): string {
  const normStorage = (storageCondition || '').trim().toLowerCase()
  const isWindowElapsed = hasAvailabilityUntil && remainingHours <= 0
  const nameLabel = foodName ? foodName.trim() : category.toLowerCase()

  if (suitability === 'Not Recommended') {
    if (category === 'Prepared Meals' && normStorage === 'room temperature') {
      return (
        `Redistribution is not recommended for this ${nameLabel} donation based on reported storage history. ` +
        `The food has been held at room temperature for an extended period (${ageEval.ageDescription}), creating significant microbiological risk and uncertainty. ` +
        `Refrigerating the food now does not reverse potential risk. Human verification is required before any action.`
      )
    }
    return (
      `Do not recommend this item for redistribution based on reported parameters. ` +
      `The food is ${ageEval.ageDescription}, which exceeds advisory redistribution boundaries for ${category}. ` +
      `Human verification is required before any action.`
    )
  }

  if (suitability === 'Requires Review') {
    if (isWindowElapsed && ageEval.ageBand === 'stale') {
      const windowStr = availabilityWindowHours > 0 ? `The original ${Math.round(availabilityWindowHours)}h availability window has expired` : 'The stated availability window has expired'
      return `This ${nameLabel} donation requires coordinator review. ${windowStr} and the food is ${ageEval.ageDescription}. Confirm continuous storage integrity and donor status before proceeding.`
    }
    if (isWindowElapsed) {
      const elapsedDesc = elapsedSinceExpiryHours > 0 ? ` (${formatDuration(elapsedSinceExpiryHours)} ago)` : ''
      const windowStr = availabilityWindowHours > 0 ? `The original ${Math.round(availabilityWindowHours)}h availability window` : 'The stated availability window'
      return `${windowStr} for this ${nameLabel} donation has expired${elapsedDesc}. Coordinator must verify with the donor whether the food is still available and properly stored.`
    }
    if (category === 'Prepared Meals' && normStorage === 'room temperature') {
      return `This ${nameLabel} donation requires coordinator review before redistribution can proceed. The food was held at room temperature (${ageEval.ageDescription}) — verify handling history, continuous hot-holding or cooling, and sensory condition.`
    }
    if (!normStorage || normStorage === 'unspecified') {
      return `This ${nameLabel} donation requires coordinator review because storage and temperature history were not specified. Verify cold-chain maintenance with the donor before proceeding.`
    }
    return `This ${nameLabel} donation requires coordinator review before redistribution can proceed. The food is ${ageEval.ageDescription} — physical inspection is required.`
  }

  if (priority === 'High') {
    return `Prioritise immediate redistribution of this ${category.toLowerCase()} donation — approximately ${Math.round(remainingHours)} hour${Math.round(remainingHours) !== 1 ? 's' : ''} remaining.`
  }

  if (suitability === 'Suitable with Conditions') {
    return `This donation is suitable with conditions. Confirm storage requirements and allergen information with the recipient before redistribution.`
  }

  return `This donation is suitable for redistribution. Coordinate collection within the availability window.`
}

function buildSafetyConsiderations(
  input: AnalysisInput,
  category: FoodCategory,
  remainingHours: number,
  ageEval: AgeEvaluation,
  hasAvailabilityUntil: boolean,
  foodAgeHours: number,
  availabilityWindowHours: number = 0,
  elapsedSinceExpiryHours: number = 0,
): string[] {
  const considerations: string[] = []

  // Always-present advisory
  considerations.push(
    'This analysis is advisory only and does not constitute a certified food-safety assessment.',
  )

  // Age-specific safety note — most important; place early
  if (ageEval.ageSafetyNote) {
    considerations.push(ageEval.ageSafetyNote)
  }

  if (!input.preparationDate) {
    considerations.push('Preparation date was not provided — food age cannot be assessed.')
  }
  if (!input.availabilityUntil) {
    considerations.push('Availability end time was not provided — expiry cannot be determined.')
  }
  if (hasAvailabilityUntil && remainingHours <= 0) {
    const elapsedDesc = elapsedSinceExpiryHours > 0 ? ` (${formatDuration(elapsedSinceExpiryHours)} ago)` : ''
    const windowStr = availabilityWindowHours > 0 ? `The original ${Math.round(availabilityWindowHours)}h availability window` : 'The stated availability window'
    considerations.push(
      `${windowStr} has expired${elapsedDesc} — coordinator must verify with the donor whether the food is still properly stored and eligible for collection.`,
    )
  }

  if (category === 'Prepared Meals') {
    const foodLower = input.foodName.toLowerCase()
    const isStarchOrRice =
      foodLower.includes('rice') ||
      foodLower.includes('pasta') ||
      foodLower.includes('potato') ||
      foodLower.includes('noodle')

    if (isStarchOrRice) {
      const normStorage = (input.storageCondition || '').trim().toLowerCase()
      if (normStorage === 'room temperature' && foodAgeHours > 2) {
        considerations.push(
          'Cooked rice/starchy foods can support microbial growth (such as Bacillus cereus) when temperature control is inadequate. The actual temperature and handling history could not be verified. Refrigerating the food now does not reverse potential risk associated with earlier uncontrolled storage.',
        )
      } else if (normStorage.includes('refrig')) {
        considerations.push(
          'Cooked rice/starchy foods carry Bacillus cereus risk if temperature abused — confirm strict continuous refrigeration (<5 °C) and ensure food will be thoroughly reheated to ≥74 °C before serving.',
        )
      } else {
        considerations.push(
          'Cooked rice/starchy foods can support microbial growth when temperature control is inadequate. The actual temperature and handling history could not be verified.',
        )
      }
    }

    if (!input.additionalInfo || input.additionalInfo.trim().length === 0) {
      considerations.push(
        'No allergen or ingredient declaration was provided — coordinator must verify ingredients with the donor before distributing to recipients with food allergies.',
      )
    }
  }

  if (category === 'Dairy & Eggs') {
    considerations.push(
      'Dairy and egg products are high-risk categories — cold chain must be maintained throughout.',
    )
  }
  if (category === 'Frozen') {
    considerations.push(
      'Frozen items must not be partially or fully thawed during transport unless cooking will occur immediately.',
    )
  }

  return considerations
}

function buildReasoning(
  input: AnalysisInput,
  category: FoodCategory,
  priority: Priority,
  suitability: DonationSuitability,
  availabilityWindowHours: number,
  remainingHours: number,
  confidence: number,
  ageEval: AgeEvaluation,
  hasAvailabilityUntil: boolean,
  elapsedSinceExpiryHours: number = 0,
): string {
  const qty = `${input.quantity} ${input.unit}`.trim()
  const servings = input.estimatedServings ? ` (approximately ${input.estimatedServings} servings)` : ''
  const isWindowElapsed = hasAvailabilityUntil && remainingHours <= 0

  const windowDesc = availabilityWindowHours > 0
    ? `an availability window of ${Math.round(availabilityWindowHours)} hour${Math.round(availabilityWindowHours) !== 1 ? 's' : ''}`
    : 'an unspecified availability window'

  let remainDesc: string
  if (isWindowElapsed) {
    const elapsedDesc = elapsedSinceExpiryHours > 0 ? ` (${formatDuration(elapsedSinceExpiryHours)} past deadline)` : ''
    remainDesc = `the original availability window has expired${elapsedDesc}`
  } else if (remainingHours > 0) {
    remainDesc = `approximately ${Math.round(remainingHours)} hour${Math.round(remainingHours) !== 1 ? 's' : ''} remaining before the stated expiry`
  } else {
    remainDesc = 'the availability window could not be determined'
  }

  const confidencePct = Math.round(confidence * 100)
  const confidenceDesc = confidence >= 0.85
    ? `High confidence (${confidencePct}%) in this assessment based on complete and consistent submission data.`
    : confidence >= 0.65
    ? `Moderate confidence (${confidencePct}%) reflecting advisory uncertainty due to elapsed time, storage history, or verification requirements.`
    : `Lower confidence (${confidencePct}%) — significant data gaps, missing temperature history, or timing uncertainties require on-site coordinator verification.`

  let ageNote: string
  const normStorage = (input.storageCondition || '').trim().toLowerCase()
  if (suitability === 'Not Recommended') {
    ageNote = `The reported preparation and storage details indicate extended storage (${ageEval.ageDescription}) with elevated risk and uncertainty, which is a primary factor in this assessment.`
  } else if (ageEval.ageBand === 'stale' || (category === 'Prepared Meals' && normStorage === 'room temperature')) {
    ageNote = `The food is ${ageEval.ageDescription} under ${input.storageCondition || 'unspecified'} conditions, which presents elevated risk and requires physical condition verification.`
  } else {
    ageNote = `The food is ${ageEval.ageDescription}, which is within the expected advisory range for ${category}.`
  }

  const allergenNote = (category === 'Prepared Meals' && (!input.additionalInfo || input.additionalInfo.trim().length === 0))
    ? ' Note: Ingredient and allergen information was not provided in the submission and must be verified prior to service.'
    : ''

  return (
    `${input.foodName || 'This donation'} is classified as ${category} with ${windowDesc} (${remainDesc}). ` +
    `The submitted quantity is ${qty}${servings}. ` +
    `${ageNote} ` +
    `Based on the food category, age, storage condition (${input.storageCondition || 'unspecified'}), and timeline, ` +
    `the assessed priority is ${priority} and donation suitability is "${suitability}". ` +
    `${confidenceDesc}${allergenNote} ` +
    `This analysis is advisory decision-support — all redistribution decisions must be confirmed by a responsible coordinator.`
  )
}

// ─── Date-invalid fallback result ─────────────────────────────────────────────

/**
 * Returns a safe, clearly-labelled result when date validation fails.
 * The suitability is "Requires Review" and the error reason is surfaced
 * in safety considerations and reasoning — never silently treated as fresh food.
 */
function buildDateErrorResult(
  input: AnalysisInput,
  category: FoodCategory,
  reason: string,
): FoodAnalysisResult {
  const profile = CATEGORY_PROFILES[category]
  const qty =
    input.quantity && input.unit
      ? `${input.quantity} ${input.unit}`
      : input.quantity || 'Quantity not specified'

  return {
    foodName: input.foodName.trim(),
    category,
    quantity: qty,
    estimatedShelfLife: 'Cannot be determined — date information is invalid or missing',
    storageRecommendation: profile.storageRecommendation,
    availabilityWindowHours: 0,
    availabilityStatus: 'Active',
    availabilityWindowDisplay: '0h total — Active',
    foodAgeHours: 0,
    foodAgeAtAssessment: 'Unknown',
    remainingAvailabilityHours: 0,
    elapsedSinceExpiryHours: 0,
    safetyConsiderations: [
      'This analysis is advisory only and does not constitute a certified food-safety assessment.',
      `Date validation failed: ${reason}`,
      'Food age and shelf life cannot be assessed without valid date information.',
      'Do not redistribute this donation until a coordinator has verified the dates.',
    ],
    donationSuitability: 'Requires Review',
    priority: 'Low',
    confidence: 0.4,
    recommendation:
      'This donation cannot be assessed due to invalid or inconsistent date information. A coordinator must verify the preparation and availability dates before any redistribution decision.',
    reasoning:
      `${input.foodName || 'This donation'} could not be fully analysed because the submitted dates are invalid or inconsistent. Reason: ${reason} ` +
      `Food age is a critical input for redistribution safety. Without valid dates, the analysis cannot determine whether this food is suitable for redistribution. ` +
      `Human verification is mandatory before any action is taken.`,
    relevantGuidance: profile.baseGuidance,
    requiresHumanVerification: true,
    analysedAt: new Date().toISOString(),
    estimatedServings: parseInt(input.estimatedServings, 10) || 0,
  }
}

// ─── Internal test cases (compile-time documentation) ─────────────────────────
//
// These represent the expected outputs for key test scenarios.
// They are not executed at runtime — they document the expected behaviour
// of evaluateFoodAge() for Bakery & Bread to confirm the fix is correct.
//
// TEST 1: Bread prepared today (0 h old)
//   evaluateFoodAge('Bakery & Bread', 0)
//   Expected: ageBand='fresh', suitabilityCap='Suitable', confidencePenalty=0
//
// TEST 2: Bread prepared 3 days ago (72 h old — exactly at caution boundary)
//   evaluateFoodAge('Bakery & Bread', 72)
//   Expected: ageBand='caution', suitabilityCap='Suitable with Conditions', confidencePenalty=0.10
//
// TEST 3: Bread prepared 10 days ago (240 h old — stale: 168 h < 240 h)
//   evaluateFoodAge('Bakery & Bread', 240)
//   Expected: ageBand='stale', suitabilityCap='Requires Review', confidencePenalty=0.20
//
// TEST 4: Bread prepared 1 month ago (720 h old — spoiled: >168 h)
//   evaluateFoodAge('Bakery & Bread', 720)
//   Expected: ageBand='spoiled', suitabilityCap='Not Recommended', confidencePenalty=0.05
//
// TEST 5: Bread prepared 6 months ago (4320 h old — spoiled)
//   evaluateFoodAge('Bakery & Bread', 4320)
//   Expected: ageBand='spoiled', suitabilityCap='Not Recommended', confidencePenalty=0.05
//
// TEST 6: Prepared date in the future
//   validateDates('<future date>', '<any>')
//   Expected: { valid: false, reason: '...future...' }
//   → buildDateErrorResult returned, donationSuitability='Requires Review'
//
// TEST 7: Available-until earlier than prepared
//   validateDates('2026-08-09', '2026-08-03')
//   Expected: { valid: false, reason: '...earlier than preparation date...' }
//   → buildDateErrorResult returned, donationSuitability='Requires Review'

// ─── Main analyser function ────────────────────────────────────────────────────

/**
 * Run the deterministic mock food analysis.
 *
 * ─── PHASE 2B CONNECTION POINT ─────────────────────────────────────────────
 * Replace the body of this function with a call to your chosen AI provider,
 * e.g.:
 *   const rawResult = await openai.chat.completions.create({ ... })
 *   return parseProviderResponse(rawResult)
 *
 * The function signature must remain:
 *   runAnalysis(input: AnalysisInput): Promise<FoodAnalysisResult>
 * ────────────────────────────────────────────────────────────────────────────
 */
export async function runAnalysis(
  input: AnalysisInput,
  nowTimeOverride?: number,
): Promise<FoodAnalysisResult> {
  // ── Input validation ───────────────────────────────────────────────────────
  if (!input.foodName || input.foodName.trim().length === 0) {
    throw new AnalysisInputError('Food name is required for analysis.')
  }

  // ── Simulate realistic async latency (200–600 ms) ─────────────────────────
  // Phase 2B: remove this delay; real API latency will replace it.
  await new Promise((resolve) =>
    setTimeout(resolve, 200 + Math.floor(input.foodName.length * 8)),
  )

  // ── Resolve category ───────────────────────────────────────────────────────
  const category = resolveCategory(input.category)

  // ── Date validation — MUST happen before any age/time calculations ─────────
  const dateResult = validateDates(input.preparationDate, input.availabilityUntil, nowTimeOverride)
  if (!dateResult.valid) {
    return buildDateErrorResult(input, category, dateResult.reason)
  }

  // ── Compute time values from validated timestamps ─────────────────────────
  const { prepTime, untilTime, nowTime } = dateResult
  const foodAgeHours = computeFoodAgeHours(prepTime, nowTime)
  const hasAvailabilityUntil = untilTime > 0
  const remainingHours = computeRemainingHoursFromTimes(untilTime, nowTime)
  const availabilityWindowHours = computeWindowHoursFromTimes(prepTime, untilTime)
  const isExpired = hasAvailabilityUntil && nowTime >= untilTime
  const availabilityStatus: 'Active' | 'Expired' = isExpired ? 'Expired' : 'Active'
  const elapsedSinceExpiryHours = isExpired ? Math.max(0, (nowTime - untilTime) / (1000 * 60 * 60)) : 0
  const remainingAvailabilityHours = isExpired ? 0 : remainingHours
  const availabilityWindowDisplay = availabilityWindowHours > 0
    ? `${Math.round(availabilityWindowHours)}h total — ${availabilityStatus}`
    : `Unspecified — ${availabilityStatus}`
  const foodAgeAtAssessment = formatDuration(foodAgeHours)

  // ── Storage condition check — secondary safety signal ────────────────────
  const storageEval = evaluateStorageCondition(category, input.storageCondition, foodAgeHours)

  // ── Food age evaluation — storage-aware primary safety signal ─────────────
  const ageEval = evaluateFoodAge(category, foodAgeHours, input.storageCondition)

  // ── Suitability: derive from time window, then cap by age, then cap by storage ─
  const timeSuitability = deriveSuitabilityFromTime(category, remainingHours, hasAvailabilityUntil)
  const afterAgeCap = applySuitabilityCap(timeSuitability, ageEval.suitabilityCap)
  let suitability = storageEval.suitabilityCap !== null
    ? applySuitabilityCap(afterAgeCap, storageEval.suitabilityCap)
    : afterAgeCap

  // ── Allergen / ingredient declaration check for Prepared Meals ────────────
  // Missing allergen declaration does not make food inherently unsafe,
  // but requires verification conditions before distribution.
  const hasAllergenNotes = Boolean(input.additionalInfo && input.additionalInfo.trim().length > 0)
  if (category === 'Prepared Meals' && !hasAllergenNotes && suitability === 'Suitable') {
    suitability = 'Suitable with Conditions'
  }

  // ── Confidence ────────────────────────────────────────────────────────────
  const confidence = computeConfidence(
    input,
    category,
    ageEval,
    remainingHours,
    storageEval,
    hasAvailabilityUntil,
  )

  // ── Priority ──────────────────────────────────────────────────────────────
  const priority = derivePriority(
    category,
    remainingHours,
    availabilityWindowHours,
    ageEval,
    suitability,
  )

  // ── Build output ──────────────────────────────────────────────────────────
  const profile = CATEGORY_PROFILES[category]
  const baseGuidance = addContextualGuidance(profile.baseGuidance, input)
  const baseConsiderations = buildSafetyConsiderations(
    input,
    category,
    remainingHours,
    ageEval,
    hasAvailabilityUntil,
    foodAgeHours,
    availabilityWindowHours,
    elapsedSinceExpiryHours,
  )
  // Append storage mismatch note if present
  const safetyConsiderations = storageEval.storageNote !== null
    ? [...baseConsiderations, storageEval.storageNote]
    : baseConsiderations

  const estimatedServings = parseInt(input.estimatedServings, 10) || 0
  const quantity =
    input.quantity && input.unit
      ? `${input.quantity} ${input.unit}`
      : input.quantity || 'Quantity not specified'

  return {
    // Input echo
    foodName: input.foodName.trim(),
    category,
    quantity,

    // Time & storage
    estimatedShelfLife: deriveShelfLife(
      category,
      remainingHours,
      ageEval,
      hasAvailabilityUntil,
      input.storageCondition,
      availabilityWindowHours,
      elapsedSinceExpiryHours,
    ),
    storageRecommendation: deriveStorageRecommendation(
      category,
      input.storageCondition,
      foodAgeHours,
      suitability,
    ),
    availabilityWindowHours: Math.round(availabilityWindowHours),
    availabilityStatus,
    availabilityWindowDisplay,
    foodAgeHours: parseFloat(foodAgeHours.toFixed(2)),
    foodAgeAtAssessment,
    remainingAvailabilityHours: parseFloat(remainingAvailabilityHours.toFixed(2)),
    elapsedSinceExpiryHours: parseFloat(elapsedSinceExpiryHours.toFixed(2)),

    // Safety & suitability
    safetyConsiderations,
    donationSuitability: suitability,

    // Prioritisation
    priority,
    confidence,

    // Recommendation & reasoning
    recommendation: buildRecommendation(
      suitability,
      priority,
      category,
      remainingHours,
      ageEval,
      hasAvailabilityUntil,
      input.foodName,
      input.storageCondition,
      availabilityWindowHours,
      elapsedSinceExpiryHours,
    ),
    reasoning: buildReasoning(
      input,
      category,
      priority,
      suitability,
      availabilityWindowHours,
      remainingHours,
      confidence,
      ageEval,
      hasAvailabilityUntil,
      elapsedSinceExpiryHours,
    ),
    relevantGuidance: baseGuidance,

    // Verification flag
    requiresHumanVerification: true,

    // Metadata
    analysedAt: new Date(nowTime).toISOString(),
    estimatedServings,
  }
}
