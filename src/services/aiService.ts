/**
 * aiService.ts — AI Food Analyser Service
 *
 * This is the single public entry point for all AI food analysis in FoodBridge AI.
 * The UI imports only from this file — it has no knowledge of the underlying
 * implementation (mock, API, or otherwise).
 *
 * ─── ARCHITECTURE ─────────────────────────────────────────────────────────────
 *
 *   UI (FoodAnalysisPage)
 *     │
 *     │  analyseFood(DonationFormData)
 *     ▼
 *   aiService.ts          ← you are here (service abstraction layer)
 *     │
 *     │  runAnalysis(AnalysisInput)
 *     ▼
 *   mockAnalyzer.ts       ← Phase 2A: deterministic mock
 *   [realProvider.ts]     ← Phase 2B: swap in here (see connection point below)
 *
 * ─── PHASE 2B CONNECTION POINT ────────────────────────────────────────────────
 * To connect a real AI provider:
 *   1. Create src/services/realProvider.ts implementing:
 *        export async function runAnalysis(input: AnalysisInput): Promise<FoodAnalysisResult>
 *   2. Change the import below from './mockAnalyzer' to './realProvider'.
 *   3. No other files need to change.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import type { DonationFormData, FoodAnalysisResult } from '../types'
import { runAnalysis, AnalysisInputError } from './mockAnalyzer'
import type { AnalysisInput } from './mockAnalyzer'

// ─── Public error types ───────────────────────────────────────────────────────

/** Thrown when the caller provides invalid or incomplete input. */
export class FoodAnalysisValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FoodAnalysisValidationError'
  }
}

/** Thrown when the analysis service encounters an unexpected failure. */
export class FoodAnalysisServiceError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'FoodAnalysisServiceError'
  }
}

// ─── Input mapping ────────────────────────────────────────────────────────────

/**
 * Map the DonationFormData (UI type) to the AnalysisInput (analyser type).
 * This mapping is the only place aware of both shapes, keeping them decoupled.
 */
function mapToAnalysisInput(donation: DonationFormData): AnalysisInput {
  return {
    foodName: donation.foodName,
    category: donation.category,
    quantity: donation.quantity,
    unit: donation.unit,
    estimatedServings: donation.estimatedServings,
    preparationDate: donation.preparationDate,
    availabilityUntil: donation.availabilityUntil,
    storageCondition: donation.storageCondition,
    location: donation.location,
    additionalInfo: donation.additionalInfo,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Analyse a food donation submission and return a structured advisory result.
 *
 * @param donation - The validated donation form data from the UI.
 * @returns A FoodAnalysisResult with full advisory assessment.
 *
 * @throws {FoodAnalysisValidationError} if required fields are missing or invalid.
 * @throws {FoodAnalysisServiceError}    if the analysis provider encounters an error.
 *
 * The UI should catch both error types and display appropriate messages.
 * Under no circumstances should raw error objects be shown to the user.
 */
export async function analyseFood(
  donation: DonationFormData,
): Promise<FoodAnalysisResult> {
  // ── Pre-flight validation ────────────────────────────────────────────────
  if (!donation.foodName || donation.foodName.trim().length === 0) {
    throw new FoodAnalysisValidationError('Food name is required to run analysis.')
  }
  if (!donation.category) {
    throw new FoodAnalysisValidationError('Food category is required to run analysis.')
  }

  // ── Run analysis ─────────────────────────────────────────────────────────
  try {
    const input = mapToAnalysisInput(donation)
    const result = await runAnalysis(input)
    return result
  } catch (err) {
    // Re-surface validation errors from the analyser unchanged
    if (err instanceof AnalysisInputError) {
      throw new FoodAnalysisValidationError(err.message)
    }
    // Wrap any unexpected errors so the UI never sees raw internals
    throw new FoodAnalysisServiceError(
      'The analysis service encountered an unexpected error. Please try again.',
      err,
    )
  }
}
