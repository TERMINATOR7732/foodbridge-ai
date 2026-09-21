// ─── Food Donation ───────────────────────────────────────────────────────────

export type FoodCategory =
  | 'Prepared Meals'
  | 'Fresh Produce'
  | 'Bakery & Bread'
  | 'Dairy & Eggs'
  | 'Canned & Packaged'
  | 'Beverages'
  | 'Frozen'
  | 'Other'

export type StorageCondition =
  | 'Room Temperature'
  | 'Refrigerated'
  | 'Frozen'
  | 'Keep Cool'

export type Unit = 'kg' | 'lbs' | 'portions' | 'litres' | 'items' | 'boxes'

export interface DonationFormData {
  foodName: string
  category: FoodCategory | ''
  quantity: string
  unit: Unit | ''
  estimatedServings: string
  preparationDate: string
  availabilityUntil: string
  storageCondition: StorageCondition | ''
  location: string
  additionalInfo: string
}

export interface FoodDonation extends DonationFormData {
  id: string
  submittedAt: string
  status: 'pending' | 'analysed' | 'matched' | 'completed'
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

export type Priority = 'High' | 'Medium' | 'Low'

/**
 * How suitable the donated food is for community redistribution.
 * 'Suitable'        — meets all basic criteria; ready to redistribute.
 * 'Suitable with Conditions' — usable but requires extra steps (e.g. short window, allergen labelling).
 * 'Requires Review' — coordinator should assess before proceeding.
 * 'Not Recommended' — likely unsafe or impractical to redistribute.
 */
export type DonationSuitability =
  | 'Suitable'
  | 'Suitable with Conditions'
  | 'Requires Review'
  | 'Not Recommended'

/**
 * Recommended storage condition for redistribution handling.
 * Mirrors StorageCondition but expressed as an AI output, not user input.
 */
export type RecommendedStorage =
  | 'Keep Refrigerated'
  | 'Keep Frozen'
  | 'Room Temperature'
  | 'Keep Cool (below 15 °C)'
  | 'Consume Immediately'
  | string

/**
 * Full structured result returned by the AI food analyser.
 *
 * All fields are advisory only. No field constitutes a certified
 * food-safety decision. Human verification is always required.
 */
export interface FoodAnalysisResult {
  // ── Input echo ────────────────────────────────────────────────────────────
  /** The food name as submitted by the donor. */
  foodName: string
  /** Resolved food category — may differ from donor's selection if input is ambiguous. */
  category: FoodCategory
  /** Quantity string echoed from the donation (e.g. "25 portions"). */
  quantity: string

  // ── Time & storage ────────────────────────────────────────────────────────
  /** Estimated remaining shelf life from the time of analysis (advisory). */
  estimatedShelfLife: string
  /** Recommended storage condition for safe handling during redistribution. */
  storageRecommendation: RecommendedStorage
  /** Availability window in hours from preparation to expiry. */
  availabilityWindowHours: number
  /** Status of the availability window (Active or Expired). */
  availabilityStatus?: 'Active' | 'Expired'
  /** Human-readable display for availability window (e.g. "13h total — Active"). */
  availabilityWindowDisplay?: string
  /** Food age in hours from preparation to assessment time. */
  foodAgeHours?: number
  /** Human-readable food age at assessment (e.g. "4 hours" or "2 days and 14 hours"). */
  foodAgeAtAssessment?: string
  /** Hours remaining in the availability window (0 if expired). */
  remainingAvailabilityHours?: number
  /** Hours elapsed since availability deadline expired (0 if still active). */
  elapsedSinceExpiryHours?: number

  // ── Safety & suitability ─────────────────────────────────────────────────
  /**
   * Safety-relevant observations derived from the submitted information.
   * These are informational prompts for human review, NOT safety certifications.
   */
  safetyConsiderations: string[]
  /**
   * Advisory suitability classification for community redistribution.
   * Must be verified by a responsible human before action is taken.
   */
  donationSuitability: DonationSuitability

  // ── Prioritisation ────────────────────────────────────────────────────────
  /** Redistribution priority based on food type, quantity, and time window. */
  priority: Priority
  /**
   * Model confidence in this analysis (0–1).
   * Phase 2A: deterministic mock — value reflects input completeness.
   * Phase 2B+: will reflect real model confidence from the AI provider.
   */
  confidence: number

  // ── Recommendation & reasoning ────────────────────────────────────────────
  /** Short one-sentence recommended action for the coordinator. */
  recommendation: string
  /**
   * Plain-language explanation of why this analysis was produced.
   * Required field — every result must explain its reasoning.
   */
  reasoning: string
  /** Relevant handling guidance points for this food type and context. */
  relevantGuidance: string[]

  // ── Verification flag ─────────────────────────────────────────────────────
  /**
   * Always true in Phase 2A.
   * In future phases this may be false for low-risk, well-characterised donations
   * once a qualified reviewer has established a trusted workflow.
   */
  requiresHumanVerification: boolean

  // ── Metadata ─────────────────────────────────────────────────────────────
  /** ISO 8601 timestamp when the analysis was generated. */
  analysedAt: string
  /**
   * Estimated number of servings this donation can provide.
   * Carried forward from the donation form; may be refined by the analyser.
   */
  estimatedServings: number
}

// ─── Community Requests ───────────────────────────────────────────────────────

export type UrgencyLevel = 'Critical' | 'High' | 'Medium' | 'Low'
export type RequestStatus = 'Open' | 'Partially Matched' | 'Matched' | 'Closed'

export interface CommunityRequest {
  id: string
  organizationName: string
  requestedType: string
  quantityNeeded: string
  urgency: UrgencyLevel
  availabilityRequirement: string
  area: string
  status: RequestStatus
  notes: string
}

// ─── Match Recommendation ────────────────────────────────────────────────────

/**
 * Structured breakdown of why a match scored the way it did.
 * Every factor that was evaluated contributes one boolean here.
 * Used for transparent display in the UI alongside the human-readable `reason`.
 */
export interface MatchFactors {
  /** Food category is compatible with what the recipient accepts. */
  categoryMatch: boolean
  /** Available quantity meets or partially meets the recipient's stated need. */
  quantityMatch: boolean
  /** True = fully meets requested quantity; false = partial or insufficient. */
  quantityFullyMet: boolean
  /** Recipient status is 'Open' or 'Partially Matched' (i.e. still accepting). */
  availabilityMatch: boolean
  /** Donor and recipient are in the same or nearby area. */
  locationMatch: boolean
  /** Food analysis suitability is not 'Not Recommended'. */
  safetyMatch: boolean
}

export interface MatchRecommendation {
  id: string
  communityRequestId: string
  organizationName: string
  matchScore: number
  recommendedQuantity: string
  reason: string
  priority: Priority
  approvalStatus: 'Pending Human Approval' | 'Approved' | 'Declined'
  /** Structured factor breakdown — present for Phase 3+ live matches; absent for Phase 1 demo data. */
  matchFactors?: MatchFactors
}

/**
 * Outcome when food analysis marks the donation as unsafe/not recommended.
 * Returned in place of normal MatchRecommendation[].
 */
export interface SafetyBlockedMatchResult {
  blocked: true
  reason: string
  donationSuitability: DonationSuitability
  foodName: string
}

/**
 * Result from matchFromAnalysis — either a list of recommendations or a safety block.
 */
export type MatchingResult =
  | { blocked: false; matches: MatchRecommendation[] }
  | SafetyBlockedMatchResult

// ─── AI Assistant ────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// ─── Impact Metrics ───────────────────────────────────────────────────────────

export interface ImpactMetrics {
  mealsPotentiallySupported: number
  foodPotentiallyRedirectedKg: number
  donationEvents: number
  communityRequests: number
  successfulDemoMatches: number
}

// ─── Active Donation Lifecycle ────────────────────────────────────────────────

/**
 * The lifecycle status of a confirmed donation.
 * Progresses linearly: Available → Matched → Accepted → In Transit → Completed
 * Or may be Cancelled from Matched or Accepted.
 */
export type DonationStatus =
  | 'Available'
  | 'Matched'
  | 'Accepted'
  | 'In Transit'
  | 'Completed'
  | 'Cancelled'

/**
 * The donor-facing model for a confirmed donation in the Phase 4 workflow.
 * Created when a coordinator confirms a match on the Community Matching page.
 * Stored in sessionStorage under key 'activeDonation'.
 */
export interface ActiveDonation {
  /** Unique ID for this donation session (generated at confirmation time). */
  id: string
  /** Food name from the analysis result. */
  foodName: string
  /** Food category from the analysis result. */
  category: FoodCategory
  /** Quantity string (e.g. "25 portions"). */
  quantity: string
  /** Estimated number of servings. */
  estimatedServings: number
  /** Donor area/location from the donation form. */
  donorArea: string
  /** Advisory suitability at the time of confirmation — never 'Not Recommended'. */
  donationSuitability: DonationSuitability
  /** The confirmed match recommendation. */
  confirmedMatch: MatchRecommendation
  /** ID of the selected CommunityRequest. */
  communityRequestId: string
  /** Name of the recipient organisation. */
  organizationName: string
  /** Area of the recipient organisation. */
  recipientArea: string
  /** Type of food requested by the recipient. */
  requestedType: string
  /** Current lifecycle status. */
  status: DonationStatus
  /** ISO 8601 timestamp when the match was confirmed. */
  confirmedAt: string
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export type ActivityType = 'donation' | 'match' | 'request' | 'approval'

export interface ActivityItem {
  id: string
  type: ActivityType
  description: string
  time: string
  detail: string
}
