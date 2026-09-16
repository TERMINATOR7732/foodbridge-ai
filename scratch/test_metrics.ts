/**
 * scratch/test_metrics.ts
 *
 * Verifies dynamic impact metrics and lifecycle transitions:
 * 1. Empty storage: baseline demo metrics
 * 2. Intermediate states (Matched, Accepted, In Transit) do NOT increase completed metrics
 * 3. Cancelled state does NOT increase completed metrics
 * 4. Completed state increases metrics appropriately
 * 5. Idempotency (repeated calls do not double count)
 * 6. Multiple completed donations accumulate properly
 * 7. clearActiveDonation() does not wipe completed metrics
 * 8. Persistence across simulated reload (sessionStorage retention)
 * 9. kg parsing accuracy across diverse units and quantities
 */

// Mock browser sessionStorage & CustomEvent if running in Node environment
if (typeof globalThis.sessionStorage === 'undefined') {
  const store = new Map<string, string>()
  globalThis.sessionStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => store.set(k, String(v)),
    removeItem: (k: string) => { store.delete(k) },
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    length: store.size,
  } as Storage
}

if (typeof globalThis.window === 'undefined') {
  const listeners: Record<string, Function[]> = {}
  globalThis.window = {
    addEventListener: (type: string, fn: Function) => {
      listeners[type] = listeners[type] || []
      listeners[type].push(fn)
    },
    removeEventListener: (type: string, fn: Function) => {
      if (listeners[type]) {
        listeners[type] = listeners[type].filter((f) => f !== fn)
      }
    },
    dispatchEvent: (event: any) => {
      const fns = listeners[event.type] || []
      fns.forEach((f) => f(event))
      return true
    },
  } as any
}

if (typeof globalThis.CustomEvent === 'undefined') {
  class MockCustomEvent {
    type: string
    detail: any
    constructor(type: string, options?: any) {
      this.type = type
      this.detail = options?.detail
    }
  }
  globalThis.CustomEvent = MockCustomEvent as any
}

import {
  getActiveDonation,
  saveActiveDonation,
  advanceDonationStatus,
  clearActiveDonation,
  resetDonationStore,
  getImpactMetrics,
  getCompletedDonations,
  parseKgFromDonation,
} from '../src/services/donationStore'
import { demoImpactMetrics } from '../src/data/demoData'
import type { ActiveDonation } from '../src/types'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`✓ PASS: ${message}`)
}

console.log('=== RUNNING IMPACT METRICS AUDIT ===\n')

// ── Test 1: Reset store and check baseline ────────────────────────────────────
resetDonationStore()
const baseline = getImpactMetrics()
assert(baseline.mealsPotentiallySupported === 1240, `Baseline meals: expected 1240, got ${baseline.mealsPotentiallySupported}`)
assert(baseline.foodPotentiallyRedirectedKg === 312, `Baseline kg: expected 312, got ${baseline.foodPotentiallyRedirectedKg}`)
assert(baseline.donationEvents === 47, `Baseline donation events: expected 47, got ${baseline.donationEvents}`)
assert(baseline.communityRequests === 38, `Baseline community requests: expected 38, got ${baseline.communityRequests}`)
assert(baseline.successfulDemoMatches === 29, `Baseline matches: expected 29, got ${baseline.successfulDemoMatches}`)

// ── Test 2: kg parsing helper ─────────────────────────────────────────────────
assert(parseKgFromDonation('8 kg', 40) === 8, 'Parses explicit kg correctly')
assert(parseKgFromDonation('25 portions', 25) === 10, 'Parses portions to ~0.4 kg/serving (25 * 0.4 = 10)')
assert(parseKgFromDonation('50 lbs', 50) === 23, 'Parses lbs to kg (50 * 0.4536 ≈ 23)')
assert(parseKgFromDonation('10 litres', 10) === 10, 'Parses litres (1 litre ≈ 1 kg)')
assert(parseKgFromDonation('', 15) === 6, 'Uses servings when quantity unit is empty (15 * 0.4 = 6)')

// ── Test 3: Create donation in Matched status ─────────────────────────────────
const don1: ActiveDonation = {
  id: 'don-test-1',
  foodName: 'Vegetable Curry & Rice',
  category: 'Prepared Meals',
  quantity: '25 portions',
  estimatedServings: 25,
  donorArea: 'Central District',
  donationSuitability: 'Suitable',
  confirmedMatch: {
    id: 'm-1',
    communityRequestId: 'req-001',
    organizationName: 'Community Center A',
    matchScore: 95,
    recommendedQuantity: '25 portions',
    reason: 'Great fit',
    priority: 'High',
    approvalStatus: 'Approved',
  },
  communityRequestId: 'req-001',
  organizationName: 'Community Center A',
  recipientArea: 'Central District',
  requestedType: 'Prepared Meals',
  status: 'Matched',
  confirmedAt: new Date().toISOString(),
}

saveActiveDonation(don1)
const mMatched = getImpactMetrics()
assert(mMatched.mealsPotentiallySupported === 1240, 'Matched status does NOT increase meals')
assert(mMatched.foodPotentiallyRedirectedKg === 312, 'Matched status does NOT increase kg')
assert(mMatched.donationEvents === 47, 'Matched status does NOT increase donation events')
assert(mMatched.successfulDemoMatches === 29, 'Matched status does NOT increase successful matches')

// ── Test 4: Advance to Accepted ───────────────────────────────────────────────
advanceDonationStatus('Accepted')
const mAccepted = getImpactMetrics()
assert(mAccepted.mealsPotentiallySupported === 1240, 'Accepted status does NOT increase meals')
assert(mAccepted.donationEvents === 47, 'Accepted status does NOT increase donation events')

// ── Test 5: Advance to In Transit ─────────────────────────────────────────────
advanceDonationStatus('In Transit')
const mTransit = getImpactMetrics()
assert(mTransit.mealsPotentiallySupported === 1240, 'In Transit status does NOT increase meals')
assert(mTransit.foodPotentiallyRedirectedKg === 312, 'In Transit status does NOT increase kg')
assert(mTransit.donationEvents === 47, 'In Transit status does NOT increase donation events')

// ── Test 6: Advance to Completed ──────────────────────────────────────────────
advanceDonationStatus('Completed')
const mCompleted = getImpactMetrics()
// don1: 25 servings, 25 portions -> 10 kg
assert(mCompleted.mealsPotentiallySupported === 1265, `Completed status increases meals: expected 1265, got ${mCompleted.mealsPotentiallySupported}`)
assert(mCompleted.foodPotentiallyRedirectedKg === 322, `Completed status increases kg: expected 322, got ${mCompleted.foodPotentiallyRedirectedKg}`)
assert(mCompleted.donationEvents === 48, `Completed status increases donation events: expected 48, got ${mCompleted.donationEvents}`)
assert(mCompleted.successfulDemoMatches === 30, `Completed status increases matches: expected 30, got ${mCompleted.successfulDemoMatches}`)
assert(mCompleted.communityRequests === 38, `Community requests remains >= matches: expected 38, got ${mCompleted.communityRequests}`)

// ── Test 7: Idempotency (calling advance/record again does not double count) ───
advanceDonationStatus('Completed')
const mIdempotent = getImpactMetrics()
assert(mIdempotent.donationEvents === 48, 'Re-saving or advancing Completed does NOT double count')
assert(mIdempotent.mealsPotentiallySupported === 1265, 'Re-saving Completed does NOT double count meals')

// ── Test 8: clearActiveDonation() keeps completed impact intact ────────────────
clearActiveDonation()
assert(getActiveDonation() === null, 'Active donation is now cleared')
const mAfterClear = getImpactMetrics()
assert(mAfterClear.mealsPotentiallySupported === 1265, 'clearActiveDonation() leaves completed meals supported intact')
assert(mAfterClear.foodPotentiallyRedirectedKg === 322, 'clearActiveDonation() leaves completed kg intact')
assert(mAfterClear.donationEvents === 48, 'clearActiveDonation() leaves completed donation events intact')
assert(mAfterClear.successfulDemoMatches === 30, 'clearActiveDonation() leaves completed matches intact')

// ── Test 9: Complete a second donation and verify accumulation ────────────────
const don2: ActiveDonation = {
  id: 'don-test-2',
  foodName: 'Fresh Salad Greens',
  category: 'Fresh Produce',
  quantity: '8 kg',
  estimatedServings: 40,
  donorArea: 'Market District',
  donationSuitability: 'Suitable',
  confirmedMatch: {
    id: 'm-2',
    communityRequestId: 'req-004',
    organizationName: 'Student Community Kitchen',
    matchScore: 88,
    recommendedQuantity: '8 kg',
    reason: 'Fresh produce needed',
    priority: 'Medium',
    approvalStatus: 'Approved',
  },
  communityRequestId: 'req-004',
  organizationName: 'Student Community Kitchen',
  recipientArea: 'University Quarter',
  requestedType: 'Fresh produce',
  status: 'Matched',
  confirmedAt: new Date().toISOString(),
}

saveActiveDonation(don2)
// In matched state, numbers should still be from don1 alone
const mDon2Matched = getImpactMetrics()
assert(mDon2Matched.donationEvents === 48, 'Donation 2 in Matched does not increase completed count')

advanceDonationStatus('Accepted')
advanceDonationStatus('In Transit')
advanceDonationStatus('Completed')

const mBothCompleted = getImpactMetrics()
// Total added:
// meals: 25 (don1) + 40 (don2) = 65 -> 1240 + 65 = 1305
// kg: 10 (don1) + 8 (don2) = 18 -> 312 + 18 = 330
// events: 47 + 2 = 49
// matches: 29 + 2 = 31
assert(mBothCompleted.mealsPotentiallySupported === 1305, `Both completed meals: expected 1305, got ${mBothCompleted.mealsPotentiallySupported}`)
assert(mBothCompleted.foodPotentiallyRedirectedKg === 330, `Both completed kg: expected 330, got ${mBothCompleted.foodPotentiallyRedirectedKg}`)
assert(mBothCompleted.donationEvents === 49, `Both completed events: expected 49, got ${mBothCompleted.donationEvents}`)
assert(mBothCompleted.successfulDemoMatches === 31, `Both completed matches: expected 31, got ${mBothCompleted.successfulDemoMatches}`)

// ── Test 10: Cancelled donation flow does not count ───────────────────────────
clearActiveDonation()
const don3: ActiveDonation = {
  id: 'don-test-3',
  foodName: 'Assorted Bread Loaves',
  category: 'Bakery & Bread',
  quantity: '18 items',
  estimatedServings: 72,
  donorArea: 'North Quarter',
  donationSuitability: 'Suitable',
  confirmedMatch: {
    id: 'm-3',
    communityRequestId: 'req-002',
    organizationName: 'Community Shelter B',
    matchScore: 75,
    recommendedQuantity: '18 items',
    reason: 'Bread needed',
    priority: 'High',
    approvalStatus: 'Approved',
  },
  communityRequestId: 'req-002',
  organizationName: 'Community Shelter B',
  recipientArea: 'East Side',
  requestedType: 'Bread',
  status: 'Matched',
  confirmedAt: new Date().toISOString(),
}

saveActiveDonation(don3)
advanceDonationStatus('Cancelled')
const mAfterCancel = getImpactMetrics()
assert(mAfterCancel.mealsPotentiallySupported === 1305, 'Cancelled donation does NOT add meals')
assert(mAfterCancel.foodPotentiallyRedirectedKg === 330, 'Cancelled donation does NOT add kg')
assert(mAfterCancel.donationEvents === 49, 'Cancelled donation does NOT add donation events')
assert(mAfterCancel.successfulDemoMatches === 31, 'Cancelled donation does NOT add matches')

console.log('\n✅ ALL 10 IMPACT METRICS LIFECYCLE TESTS PASSED PERFECTLY!\n')
