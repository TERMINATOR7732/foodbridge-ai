import type {
  FoodDonation,
  CommunityRequest,
  MatchRecommendation,
  FoodAnalysisResult,
  ImpactMetrics,
  ActivityItem,
  ChatMessage,
} from '../types'

// ─── Demo Donations ───────────────────────────────────────────────────────────

export const demoDonations: FoodDonation[] = [
  {
    id: 'don-001',
    foodName: 'Vegetable Curry & Rice',
    category: 'Prepared Meals',
    quantity: '25',
    unit: 'portions',
    estimatedServings: '25',
    preparationDate: '2025-07-14T10:00',
    availabilityUntil: '2025-07-14T18:00',
    storageCondition: 'Refrigerated',
    location: 'Central District',
    additionalInfo: 'Vegetarian. Contains gluten. Freshly prepared this morning.',
    submittedAt: '2025-07-14T10:30:00',
    status: 'analysed',
  },
  {
    id: 'don-002',
    foodName: 'Assorted Bread Loaves',
    category: 'Bakery & Bread',
    quantity: '18',
    unit: 'items',
    estimatedServings: '72',
    preparationDate: '2025-07-14T07:00',
    availabilityUntil: '2025-07-14T20:00',
    storageCondition: 'Room Temperature',
    location: 'North Quarter',
    additionalInfo: 'Mix of white and wholegrain. No nuts.',
    submittedAt: '2025-07-14T08:45:00',
    status: 'matched',
  },
  {
    id: 'don-003',
    foodName: 'Fresh Salad Greens',
    category: 'Fresh Produce',
    quantity: '8',
    unit: 'kg',
    estimatedServings: '40',
    preparationDate: '2025-07-14T06:00',
    availabilityUntil: '2025-07-14T16:00',
    storageCondition: 'Refrigerated',
    location: 'Market District',
    additionalInfo: 'Mixed lettuce, spinach, rocket. Washed and packaged.',
    submittedAt: '2025-07-14T09:15:00',
    status: 'pending',
  },
]

// ─── Demo Community Requests ──────────────────────────────────────────────────

export const demoCommunityRequests: CommunityRequest[] = [
  {
    id: 'req-001',
    organizationName: 'Community Center A',
    requestedType: 'Prepared Meals',
    quantityNeeded: '20–30 portions',
    urgency: 'High',
    availabilityRequirement: 'Available by midday',
    area: 'Central District',
    status: 'Open',
    notes: 'Serving lunch for approximately 25 visitors today. Dietary requirements vary.',
  },
  {
    id: 'req-002',
    organizationName: 'Community Shelter B',
    requestedType: 'Bread, staples, or prepared food',
    quantityNeeded: '50–80 portions',
    urgency: 'Critical',
    availabilityRequirement: 'Available by 5pm today',
    area: 'East Side',
    status: 'Partially Matched',
    notes: 'Evening meal service for residents. Any non-perishable staples also welcomed.',
  },
  {
    id: 'req-003',
    organizationName: 'Community Support Center C',
    requestedType: 'Fresh produce or dairy',
    quantityNeeded: '10–15 kg',
    urgency: 'Medium',
    availabilityRequirement: 'Flexible — within 24 hours',
    area: 'West End',
    status: 'Open',
    notes: 'Weekly food hamper programme. Serving approximately 30 families.',
  },
  {
    id: 'req-004',
    organizationName: 'Student Community Kitchen',
    requestedType: 'Any food suitable for cooking',
    quantityNeeded: 'Flexible',
    urgency: 'Low',
    availabilityRequirement: 'Weekend preferred',
    area: 'University Quarter',
    status: 'Open',
    notes: 'Student-run community kitchen. Can work with various ingredients.',
  },
]

// ─── Demo Match Recommendations ───────────────────────────────────────────────

export const demoMatchRecommendations: MatchRecommendation[] = [
  {
    id: 'match-001',
    communityRequestId: 'req-001',
    organizationName: 'Community Center A',
    matchScore: 94,
    recommendedQuantity: '25 portions',
    reason:
      'Same district reduces transport time. Requested meal type matches donation exactly. Urgency and availability window are well aligned.',
    priority: 'High',
    approvalStatus: 'Pending Human Approval',
  },
  {
    id: 'match-002',
    communityRequestId: 'req-002',
    organizationName: 'Community Shelter B',
    matchScore: 71,
    recommendedQuantity: '18 bread loaves',
    reason:
      'Bread provides staple nutrition aligned with shelter needs. Quantity partially meets the requirement. Proximity is moderate.',
    priority: 'High',
    approvalStatus: 'Pending Human Approval',
  },
  {
    id: 'match-003',
    communityRequestId: 'req-004',
    organizationName: 'Student Community Kitchen',
    matchScore: 58,
    recommendedQuantity: '8 kg salad greens',
    reason:
      'Flexible request matches available produce type. Kitchen can incorporate salad greens into meals. Lower urgency allows time for coordination.',
    priority: 'Medium',
    approvalStatus: 'Pending Human Approval',
  },
]

// ─── Demo Food Analysis Result ────────────────────────────────────────────────
// This object is used when the Food Analysis page is opened without a
// prior donation submission (i.e. navigated to directly). It demonstrates
// what a real analysis result looks like for coordinators reviewing the UI.

export const demoAnalysisResult: FoodAnalysisResult = {
  // Input echo
  foodName: 'Vegetable Curry & Rice',
  category: 'Prepared Meals',
  quantity: '25 portions',

  // Time & storage
  estimatedShelfLife: 'Approximately 8 hours remaining — redistribute today',
  storageRecommendation: 'Keep Refrigerated',
  availabilityWindowHours: 8,

  // Safety & suitability
  safetyConsiderations: [
    'This analysis is advisory only and does not constitute a certified food-safety assessment.',
    'Contains gluten — communicate clearly to recipient organisations for allergy management.',
  ],
  donationSuitability: 'Suitable with Conditions',

  // Prioritisation
  priority: 'High',
  confidence: 0.91,

  // Recommendation & reasoning
  recommendation:
    'Prioritise immediate redistribution of this prepared meals donation — approximately 8 hours remaining.',
  reasoning:
    'Vegetable Curry & Rice is classified as Prepared Meals with an availability window of 8 hours and approximately 8 hours remaining before expiry. The submitted quantity is 25 portions (approximately 25 servings). Based on the food type, time window, and storage condition (Refrigerated), the assessed priority is High and donation suitability is "Suitable with Conditions". High confidence based on complete submission data. This analysis is advisory — all redistribution decisions must be confirmed by a responsible coordinator.',
  relevantGuidance: [
    'Prepared meals should be kept refrigerated at or below 5 °C at all times.',
    'Redistribute within the same day of preparation wherever possible.',
    'Confirm ingredients and allergen information before handover.',
    'Recipient organisation should have adequate refrigerated storage on arrival.',
    'Maintain cold chain during any transport period.',
    'Contains gluten — communicate clearly to recipient organisations for allergy management.',
  ],

  // Verification flag
  requiresHumanVerification: true,

  // Metadata
  analysedAt: '2025-07-14T10:35:00',
  estimatedServings: 25,
  assessmentMode: 'historical_demo',
  assessmentBasis: 'Assessment based on the submitted donation timeline.',
}

// ─── Demo Impact Metrics ──────────────────────────────────────────────────────

export const demoImpactMetrics: ImpactMetrics = {
  mealsPotentiallySupported: 1240,
  foodPotentiallyRedirectedKg: 312,
  donationEvents: 47,
  communityRequests: 38,
  successfulDemoMatches: 29,
}

// ─── Demo Activity ────────────────────────────────────────────────────────────

export const demoActivity: ActivityItem[] = [
  {
    id: 'act-001',
    type: 'donation',
    description: 'New food donation submitted',
    time: '10 minutes ago',
    detail: 'Vegetable Curry & Rice — 25 portions — Central District',
  },
  {
    id: 'act-002',
    type: 'match',
    description: 'AI match recommendation generated',
    time: '25 minutes ago',
    detail: 'Bread loaves matched to Community Shelter B (score: 71)',
  },
  {
    id: 'act-003',
    type: 'request',
    description: 'New community request received',
    time: '1 hour ago',
    detail: 'Student Community Kitchen — flexible ingredients needed',
  },
  {
    id: 'act-004',
    type: 'approval',
    description: 'Match approved by coordinator',
    time: '2 hours ago',
    detail: 'Fresh produce allocated to Community Support Center C',
  },
  {
    id: 'act-005',
    type: 'donation',
    description: 'New food donation submitted',
    time: '3 hours ago',
    detail: 'Assorted Bread Loaves — 18 items — North Quarter',
  },
  {
    id: 'act-006',
    type: 'match',
    description: 'AI match recommendation generated',
    time: '4 hours ago',
    detail: 'Salad greens matched to Student Community Kitchen (score: 58)',
  },
]

// ─── Demo Chat Messages ───────────────────────────────────────────────────────

export const demoInitialMessages: ChatMessage[] = [
  {
    id: 'msg-000',
    role: 'assistant',
    content:
      "Hello! I'm the FoodBridge AI Assistant. I can help you understand how the platform works, what information to provide when donating food, and how recommendations are generated. How can I help you today?",
    timestamp: new Date().toISOString(),
  },
]

export const demoSuggestedQuestions = [
  'Can I donate this food?',
  'How does matching work?',
  'What happens after I donate?',
  'How does FoodBridge reduce food waste?',
]

// ─── Mock assistant responses ─────────────────────────────────────────────────

export const mockAssistantResponses: Record<string, string> = {
  'How should surplus food be handled?':
    'Surplus food should be handled with care to maintain safety and quality. Key principles include: keeping prepared meals refrigerated and redistributing within the same day; maintaining cold chain during transport; clearly labelling food with preparation date, ingredients, and allergen information; and ensuring the recipient organisation can store and serve the food appropriately. All redistribution decisions should be verified by a responsible person who can assess food safety on the ground.',
  'What information should I provide when donating food?':
    'When donating food through FoodBridge AI, please provide: the food name and category, quantity and unit of measurement, estimated number of servings, preparation or packaging date, how long the food will remain available, storage requirements (refrigerated, room temperature, etc.), your location or area, and any relevant notes such as allergen information or dietary suitability. The more detail you provide, the better the AI can help identify suitable community matches.',
  'How does FoodBridge decide which community request to prioritise?':
    "FoodBridge AI generates match recommendations based on several factors: food type compatibility with the community organisation's request, urgency of the request, availability window of the donation versus the organisation's schedule, geographic proximity to reduce transport needs, and quantity alignment. The AI provides a match score and explanation. Importantly, all recommendations require human review and approval before any action is taken — the AI supports decisions, it does not make them.",
  'What does the AI recommendation mean?':
    'An AI recommendation is a suggested match between a food donation and a community organisation that may benefit from it. It includes a match score (0–100) reflecting alignment, a recommended quantity, and an explanation of why the match was suggested. These are advisory outputs — they should be reviewed by a coordinator who understands local context, relationships, and any factors the AI cannot assess. Human approval is always required before redistribution.',
}

export const defaultMockResponse =
  "That's a great question. As the FoodBridge AI Assistant, I can provide guidance on food safety, donation procedures, redistribution guidelines, and community support. For specific inquiries, you can also select from the suggested questions in the sidebar. Is there anything else I can help clarify about how the platform works?"
