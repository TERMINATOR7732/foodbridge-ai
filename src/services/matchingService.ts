/**
 * matchingService.ts — Deterministic Community Matching Service
 *
 * Phase 3: connects the real FoodAnalysisResult to community requests and
 * returns ranked MatchRecommendation[] with structured MatchFactors and
 * transparent human-readable reasoning.
 *
 * ─── ARCHITECTURE ────────────────────────────────────────────────────────────
 *
 *   FoodAnalysisPage → sessionStorage('analysisResult')
 *                                  │
 *                                  ▼
 *   CommunityMatchingPage → matchFromAnalysis(FoodAnalysisResult, CommunityRequest[])
 *                                  │
 *                                  ▼
 *                         MatchingResult
 *                         ├── { blocked: false, matches: MatchRecommendation[] }
 *                         └── SafetyBlockedMatchResult  (food not suitable)
 *
 * ─── MATCHING FACTORS ────────────────────────────────────────────────────────
 *
 *   Safety     (hard gate) — 'Not Recommended' → blocked immediately
 *   Category   (25 pts)   — food category compatible with recipient's requestedType
 *   Quantity   (20 pts)   — available servings vs. recipient's quantityNeeded
 *   Availability (20 pts) — recipient status is Open or Partially Matched
 *   Location   (20 pts)   — area strings share a keyword (same district/suburb)
 *   Urgency    (15 pts)   — high-urgency requests score higher
 *
 * ─── SAFETY RULES ────────────────────────────────────────────────────────────
 *
 *   donationSuitability === 'Not Recommended'  → SafetyBlockedMatchResult
 *   All other suitability values               → proceed (noted in MatchFactors)
 *   'Requires Review'                          → safetyMatch=true but match
 *                                                 scores are capped and reasoning
 *                                                 warns coordinator
 *
 * ─── PHASE 4 CONNECTION POINT ────────────────────────────────────────────────
 * Replace the body of matchFromAnalysis() with a call to a real matching
 * model or RAG-based recommender. The public signature must remain:
 *   matchFromAnalysis(analysis, requests): Promise<MatchingResult>
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type {
  FoodAnalysisResult,
  FoodCategory,
  CommunityRequest,
  MatchRecommendation,
  MatchFactors,
  MatchingResult,
  Priority,
} from '../types'
import { demoCommunityRequests } from '../data/demoData'

// ─── Category compatibility ───────────────────────────────────────────────────

/**
 * Keywords that indicate a recipient accepts a given food category.
 * Each entry maps a FoodCategory to a list of lowercase substrings that,
 * if found in CommunityRequest.requestedType, indicate acceptance.
 */
const CATEGORY_KEYWORDS: Record<FoodCategory, string[]> = {
  'Prepared Meals': ['prepared', 'meal', 'cooked', 'hot', 'food', 'any'],
  'Fresh Produce': ['produce', 'fruit', 'vegetable', 'fresh', 'salad', 'any'],
  'Bakery & Bread': ['bread', 'bak', 'pastry', 'staple', 'any'],
  'Dairy & Eggs': ['dairy', 'egg', 'milk', 'cheese', 'any'],
  'Canned & Packaged': ['canned', 'packaged', 'tin', 'shelf', 'staple', 'any'],
  Beverages: ['beverage', 'drink', 'juice', 'water', 'any'],
  Frozen: ['frozen', 'freeze', 'any'],
  Other: ['any'],
}

function isCategoryCompatible(
  donationCategory: FoodCategory,
  requestedType: string,
): boolean {
  const lower = requestedType.toLowerCase()
  return CATEGORY_KEYWORDS[donationCategory].some((kw) => lower.includes(kw))
}

// ─── Quantity parsing ─────────────────────────────────────────────────────────

/**
 * Extract a numeric lower-bound from a quantity string like "20–30 portions",
 * "10–15 kg", "50", or "Flexible".
 * Returns null if no number can be parsed (treated as flexible/unlimited).
 */
function parseQuantityLower(quantityStr: string): number | null {
  if (!quantityStr) return null
  const lower = quantityStr.toLowerCase().trim()
  if (lower === 'flexible' || lower === 'any') return null
  // Match first number in string
  const match = quantityStr.match(/(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : null
}

/**
 * Unit families for quantity comparison.
 * Quantities can only be meaningfully compared when both sides belong to the
 * same unit family.  'servings' is the unit the donation side always expresses.
 */
type UnitFamily = 'serving' | 'weight' | 'volume' | 'count' | 'unknown'

const SERVING_UNIT_FAMILY: UnitFamily = 'serving'

/** Map lowercase unit keywords found in a request string to a UnitFamily. */
function detectUnitFamily(quantityStr: string): UnitFamily {
  const lower = quantityStr.toLowerCase()
  // Serving-compatible units
  if (/\b(serving|servings|portion|portions|meal|meals)\b/.test(lower)) return 'serving'
  // Weight units
  if (/\b(kg|kilogram|kilograms|lb|lbs|pound|pounds|gram|grams|g)\b/.test(lower)) return 'weight'
  // Volume units
  if (/\b(litre|litres|liter|liters|ml|millilitre|milliliters|l)\b/.test(lower)) return 'volume'
  // Count units
  if (/\b(item|items|box|boxes|pack|packs|tin|tins|can|cans|bottle|bottles|unit|units)\b/.test(lower))
    return 'count'
  // No recognisable unit — numeric only strings are treated as serving-compatible
  // (historically the requests used "portions" language; bare numbers are assumed comparable)
  if (/^\d/.test(lower.trim())) return 'serving'
  // 'flexible' / 'any' / empty → caller already returns null from parseQuantityLower
  return 'unknown'
}

/**
 * Assess whether the donation quantity (servings) meets the recipient's need.
 *
 * Returns 'full', 'partial', 'insufficient', or 'unknown'.
 * 'unknown' is returned when the request uses a unit that is not comparable
 * with servings (e.g. kg, litres, items) and no reliable conversion exists.
 * Incompatible quantities must never produce a false full/partial match.
 */
function assessQuantity(
  donationServings: number,
  requestedQty: string,
): 'full' | 'partial' | 'insufficient' | 'unknown' {
  const needed = parseQuantityLower(requestedQty)
  if (needed === null) return 'full'  // flexible — any amount is welcome

  // Guard: only compare when unit families are compatible
  const reqFamily = detectUnitFamily(requestedQty)
  if (reqFamily !== SERVING_UNIT_FAMILY && reqFamily !== 'unknown') {
    // Incompatible units — do not compare; return neutral
    return 'unknown'
  }

  if (donationServings >= needed) return 'full'
  if (donationServings >= needed * 0.5) return 'partial'
  return 'insufficient'
}

// ─── Availability check ───────────────────────────────────────────────────────

function isRecipientAvailable(status: CommunityRequest['status']): boolean {
  return status === 'Open' || status === 'Partially Matched'
}

// ─── Location compatibility ───────────────────────────────────────────────────

/**
 * Deterministic location check — no external API.
 * Splits area strings on common delimiters and checks for shared tokens.
 * e.g. "Central District" vs "Central District" → match
 *      "Central District" vs "East Side"        → no match
 *      "North Quarter"    vs "North End"         → match (shared "north")
 */
function isLocationCompatible(donorArea: string, recipientArea: string): boolean {
  if (!donorArea || !recipientArea) return false
  const tokenise = (s: string) =>
    s.toLowerCase()
     .split(/[\s,\-–/]+/)
     .filter((t) => t.length > 2)  // drop short words like "of", "a"
  const donorTokens = new Set(tokenise(donorArea))
  return tokenise(recipientArea).some((t) => donorTokens.has(t))
}

// ─── Score calculation ────────────────────────────────────────────────────────

interface ScoredMatch {
  request: CommunityRequest
  factors: MatchFactors
  score: number
  quantityAssessment: 'full' | 'partial' | 'insufficient' | 'unknown'
}

/**
 * Compute a deterministic score 0–100 for one (analysis, request) pair.
 * All scores are derived from the input data; no randomness.
 *
 * Weights:
 *   Category     25
 *   Quantity     20  (full=20, partial=10, insufficient=0)
 *   Availability 20
 *   Location     20
 *   Urgency      15  (Critical=15, High=10, Medium=5, Low=0)
 */
function scoreMatch(
  analysis: FoodAnalysisResult,
  request: CommunityRequest,
  donorArea: string,
): ScoredMatch {
  const categoryMatch = isCategoryCompatible(analysis.category, request.requestedType)
  const qtyAssessment = assessQuantity(analysis.estimatedServings, request.quantityNeeded)
  // 'unknown' means units are incompatible — treat as neither matched nor unmatched (neutral/false)
  const quantityMatch = qtyAssessment === 'full' || qtyAssessment === 'partial'
  const quantityFullyMet = qtyAssessment === 'full'
  const availabilityMatch = isRecipientAvailable(request.status)
  const locationMatch = isLocationCompatible(donorArea, request.area)
  // Safety: already enforced above — any analysis reaching here is not 'Not Recommended'
  const safetyMatch = analysis.donationSuitability !== 'Not Recommended'

  const factors: MatchFactors = {
    categoryMatch,
    quantityMatch,
    quantityFullyMet,
    availabilityMatch,
    locationMatch,
    safetyMatch,
  }

  const urgencyScore: Record<CommunityRequest['urgency'], number> = {
    Critical: 15,
    High: 10,
    Medium: 5,
    Low: 0,
  }

  const score =
    (categoryMatch ? 25 : 0) +
    // 'unknown' units → 0 quantity score; no points awarded for an incomparable quantity
    (qtyAssessment === 'full' ? 20 : qtyAssessment === 'partial' ? 10 : 0) +
    (availabilityMatch ? 20 : 0) +
    (locationMatch ? 20 : 0) +
    urgencyScore[request.urgency]

  return { request, factors, score, quantityAssessment: qtyAssessment }
}

// ─── Reasoning builder ────────────────────────────────────────────────────────

function buildMatchReason(
  factors: MatchFactors,
  request: CommunityRequest,
  quantityAssessment: 'full' | 'partial' | 'insufficient' | 'unknown',
  analysis: FoodAnalysisResult,
): string {
  const parts: string[] = []

  if (factors.categoryMatch) {
    parts.push(`Category matches — ${request.requestedType} is compatible with ${analysis.category}.`)
  } else {
    parts.push(`Category is not an exact match — ${analysis.category} may partially suit "${request.requestedType}".`)
  }

  if (quantityAssessment === 'full') {
    parts.push(`Quantity is sufficient — ${analysis.estimatedServings} serving${analysis.estimatedServings !== 1 ? 's' : ''} available meets the requested ${request.quantityNeeded}.`)
  } else if (quantityAssessment === 'partial') {
    parts.push(`Quantity partially meets need — ${analysis.estimatedServings} serving${analysis.estimatedServings !== 1 ? 's' : ''} available is less than the requested ${request.quantityNeeded}; a partial allocation may still be useful.`)
  } else if (quantityAssessment === 'unknown') {
    parts.push(`Quantity compatibility is unknown — the donation is expressed in servings (${analysis.estimatedServings}) but the recipient's need is stated in a different unit (${request.quantityNeeded}). A coordinator must assess quantity suitability directly.`)
  } else {
    parts.push(`Quantity is below the requested amount (${analysis.estimatedServings} available vs ${request.quantityNeeded} needed).`)
  }

  if (factors.availabilityMatch) {
    parts.push(`Recipient is currently accepting donations (status: ${request.status}).`)
  } else {
    parts.push(`Recipient is not currently accepting donations (status: ${request.status}).`)
  }

  if (factors.locationMatch) {
    parts.push(`Location is compatible — both are in or near ${request.area}.`)
  } else {
    parts.push(`Location differs — additional coordination may be needed for transport.`)
  }

  if (analysis.donationSuitability === 'Requires Review') {
    parts.push(`Note: Food analysis indicates this donation requires coordinator review before redistribution.`)
  }

  if (request.urgency === 'Critical' || request.urgency === 'High') {
    parts.push(`Urgency is ${request.urgency} — prioritise this match accordingly.`)
  }

  return parts.join(' ')
}

// ─── Recommended quantity string ─────────────────────────────────────────────

function buildRecommendedQuantity(
  analysis: FoodAnalysisResult,
  quantityAssessment: 'full' | 'partial' | 'insufficient' | 'unknown',
): string {
  const qty = analysis.quantity || `${analysis.estimatedServings} serving${analysis.estimatedServings !== 1 ? 's' : ''}`
  if (quantityAssessment === 'full' || quantityAssessment === 'partial') {
    return qty
  }
  if (quantityAssessment === 'unknown') {
    return `${qty} (quantity unit mismatch — coordinator must verify against recipient's need)`
  }
  return `${qty} (partial — below recipient's stated need)`
}

// ─── Match priority from score ────────────────────────────────────────────────

function scoreToPriority(score: number): Priority {
  if (score >= 70) return 'High'
  if (score >= 45) return 'Medium'
  return 'Low'
}

// ─── Main public API ──────────────────────────────────────────────────────────

/**
 * Match a FoodAnalysisResult against the available community requests.
 *
 * @param analysis  - The result from analyseFood() — must be the live result.
 * @param requests  - List of CommunityRequest to match against.
 *                    Defaults to demoCommunityRequests if not provided.
 * @param donorArea - Location of the donor; read from DonationFormData.location
 *                    stored in sessionStorage, or falls back to analysis.foodName area.
 * @returns MatchingResult — either a ranked list of matches or a safety block.
 */
export async function matchFromAnalysis(
  analysis: FoodAnalysisResult,
  requests: CommunityRequest[] = demoCommunityRequests,
  donorArea = '',
): Promise<MatchingResult> {
  // ── Safety hard gate ───────────────────────────────────────────────────────
  if (analysis.donationSuitability === 'Not Recommended') {
    return {
      blocked: true,
      reason:
        `The food was not considered suitable for matching because Food Analysis marked it as "${analysis.donationSuitability}". ` +
        `Reason: ${analysis.recommendation} ` +
        `Human verification is required before any redistribution action.`,
      donationSuitability: analysis.donationSuitability,
      foodName: analysis.foodName,
    }
  }

  // ── Simulate async latency ─────────────────────────────────────────────────
  await new Promise((resolve) => setTimeout(resolve, 250))

  // ── Score every candidate ──────────────────────────────────────────────────
  const scored: ScoredMatch[] = requests.map((req) =>
    scoreMatch(analysis, req, donorArea),
  )

  // ── Filter: must have availability AND either category or partial quantity ──
  // A recommendation with score=0 (no factor matched) is not useful.
  const viable = scored.filter(
    (s) => s.score > 0 && s.factors.availabilityMatch,
  )

  // ── Sort descending by score ───────────────────────────────────────────────
  viable.sort((a, b) => b.score - a.score)

  // ── Build MatchRecommendation[] ────────────────────────────────────────────
  const matches: MatchRecommendation[] = viable.map((s, idx) => ({
    id: `live-match-${idx + 1}`,
    communityRequestId: s.request.id,
    organizationName: s.request.organizationName,
    matchScore: s.score,
    recommendedQuantity: buildRecommendedQuantity(analysis, s.quantityAssessment),
    reason: buildMatchReason(s.factors, s.request, s.quantityAssessment, analysis),
    priority: scoreToPriority(s.score),
    approvalStatus: 'Pending Human Approval',
    matchFactors: s.factors,
  }))

  return { blocked: false, matches }
}
