/**
 * donationStore.ts — Session-scoped Donation State
 *
 * Centralises all sessionStorage reads/writes for the Phase 4 donation
 * lifecycle.  No component should access sessionStorage keys directly —
 * use these helpers so key names and serialisation are defined in one place.
 *
 * Keys managed here:
 *   'activeDonation'   → ActiveDonation | null
 *
 * Keys managed elsewhere (read-only from this module):
 *   'analysisResult'   → FoodAnalysisResult  (written by FoodAnalysisPage)
 *   'donationForm'     → DonationFormData     (written by DonateFoodPage)
 */

import type { ActiveDonation, DonationStatus, ImpactMetrics } from '../types'
import { demoImpactMetrics } from '../data/demoData'

const KEY = 'activeDonation'
const COMPLETED_KEY = 'completedDonations'

// ─── Read ─────────────────────────────────────────────────────────────────────

export function getActiveDonation(): ActiveDonation | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ActiveDonation) : null
  } catch {
    return null
  }
}

export function getCompletedDonations(): ActiveDonation[] {
  try {
    const raw = sessionStorage.getItem(COMPLETED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

export function recordCompletedDonation(donation: ActiveDonation): void {
  if (donation.status !== 'Completed') return
  try {
    const list = getCompletedDonations()
    const idx = list.findIndex((d) => d.id === donation.id)
    if (idx >= 0) {
      list[idx] = donation
    } else {
      list.push(donation)
    }
    sessionStorage.setItem(COMPLETED_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('impactMetricsChange'))
  } catch {
    // sessionStorage write failure is non-fatal in a prototype
  }
}

export function saveActiveDonation(donation: ActiveDonation): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(donation))
    if (donation.status === 'Completed') {
      recordCompletedDonation(donation)
    }
    // Notify same-tab listeners
    window.dispatchEvent(new CustomEvent('activeDonationChange'))
    window.dispatchEvent(new CustomEvent('impactMetricsChange'))
  } catch {
    // sessionStorage write failure is non-fatal in a prototype
  }
}

// ─── Update status ────────────────────────────────────────────────────────────

/**
 * Advance the donation to the next status and persist the change.
 * Returns the updated donation, or null if no active donation exists.
 */
export function advanceDonationStatus(next: DonationStatus): ActiveDonation | null {
  const current = getActiveDonation()
  if (!current) return null
  const updated: ActiveDonation = { ...current, status: next }
  saveActiveDonation(updated)
  if (next === 'Completed') {
    recordCompletedDonation(updated)
  }
  return updated
}

// ─── Clear ────────────────────────────────────────────────────────────────────

export function clearActiveDonation(): void {
  try {
    sessionStorage.removeItem(KEY)
    window.dispatchEvent(new CustomEvent('activeDonationChange'))
    window.dispatchEvent(new CustomEvent('impactMetricsChange'))
  } catch {
    // ignore
  }
}

export function resetDonationStore(): void {
  try {
    sessionStorage.removeItem(KEY)
    sessionStorage.removeItem(COMPLETED_KEY)
    window.dispatchEvent(new CustomEvent('activeDonationChange'))
    window.dispatchEvent(new CustomEvent('impactMetricsChange'))
  } catch {
    // ignore
  }
}

// ─── Metrics Calculation ──────────────────────────────────────────────────────

/**
 * Convert donation quantity or servings to approximate kilograms.
 * Uses realistic food rescue standards (approx. 0.4 kg per meal/serving).
 */
export function parseKgFromDonation(quantity: string, servings: number): number {
  const qLower = (quantity || '').toLowerCase().trim()

  // 1. Explicit kg: e.g. "8 kg", "8.5 kg"
  const kgMatch = qLower.match(/([\d.]+)\s*kg/)
  if (kgMatch) {
    const val = parseFloat(kgMatch[1])
    if (!isNaN(val) && val > 0) return Math.round(val)
  }

  // 2. Explicit lbs: e.g. "20 lbs"
  const lbsMatch = qLower.match(/([\d.]+)\s*(?:lbs|lb)/)
  if (lbsMatch) {
    const val = parseFloat(lbsMatch[1])
    if (!isNaN(val) && val > 0) return Math.round(val * 0.453592)
  }

  // 3. Litres: 1 litre ≈ 1 kg
  const litresMatch = qLower.match(/([\d.]+)\s*(?:litres|liters|litre|liter|l)\b/)
  if (litresMatch) {
    const val = parseFloat(litresMatch[1])
    if (!isNaN(val) && val > 0) return Math.round(val)
  }

  // 4. Servings conversion: approx 0.4 kg per serving
  if (servings > 0) {
    return Math.max(1, Math.round(servings * 0.4))
  }

  // 5. Fallback numeric match from quantity string
  const numMatch = qLower.match(/([\d.]+)/)
  if (numMatch) {
    const val = parseFloat(numMatch[1])
    if (!isNaN(val) && val > 0) {
      if (qLower.includes('portion') || qLower.includes('item') || qLower.includes('serving') || qLower.includes('box')) {
        return Math.max(1, Math.round(val * 0.4))
      }
      return Math.round(val)
    }
  }

  return 1
}

/**
 * Returns dynamic impact metrics:
 * Baseline demo values + aggregate contributions from all completed donations.
 */
export function getImpactMetrics(): ImpactMetrics {
  const completed = getCompletedDonations()
  const active = getActiveDonation()

  // Deduplicate completed donations by ID
  const map = new Map<string, ActiveDonation>()
  for (const d of completed) {
    if (d && d.id && d.status === 'Completed') {
      map.set(d.id, d)
    }
  }
  if (active && active.status === 'Completed' && active.id) {
    map.set(active.id, active)
  }

  const allCompleted = Array.from(map.values())

  if (allCompleted.length === 0) {
    return { ...demoImpactMetrics }
  }

  const addedMeals = allCompleted.reduce((sum, d) => {
    return sum + (d.estimatedServings > 0 ? d.estimatedServings : 0)
  }, 0)

  const addedKg = allCompleted.reduce((sum, d) => {
    return sum + parseKgFromDonation(d.quantity, d.estimatedServings)
  }, 0)

  const addedDonations = allCompleted.length
  const addedMatches = allCompleted.length

  const successfulDemoMatches = demoImpactMetrics.successfulDemoMatches + addedMatches
  const communityRequests = Math.max(demoImpactMetrics.communityRequests, successfulDemoMatches)

  return {
    mealsPotentiallySupported: demoImpactMetrics.mealsPotentiallySupported + addedMeals,
    foodPotentiallyRedirectedKg: demoImpactMetrics.foodPotentiallyRedirectedKg + addedKg,
    donationEvents: demoImpactMetrics.donationEvents + addedDonations,
    communityRequests,
    successfulDemoMatches,
  }
}

// ─── Lifecycle helpers ────────────────────────────────────────────────────────

/**
 * Valid transitions from each status.
 * Used to validate a requested status advance before applying it.
 */
const ALLOWED_TRANSITIONS: Partial<Record<DonationStatus, DonationStatus[]>> = {
  Matched: ['Accepted', 'Cancelled'],
  Accepted: ['In Transit', 'Cancelled'],
  'In Transit': ['Completed'],
}

export function canTransitionTo(
  current: DonationStatus,
  next: DonationStatus,
): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false
}

/**
 * Ordered steps for the status stepper UI.
 * Cancelled is handled separately and not part of the forward path.
 */
export const STATUS_STEPS: DonationStatus[] = [
  'Matched',
  'Accepted',
  'In Transit',
  'Completed',
]
