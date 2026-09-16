import { detectIntent, generateAssistantResponse } from '../src/services/assistantService'

const questionsToTest = [
  // Food Safety
  { q: "Is this food safe?", expectedIntent: "food_safety_general" },
  { q: "Can I donate this?", expectedIntent: "food_safety_general" },
  { q: "Is 2 day old bread okay?", expectedIntent: "food_safety_bread_age" },
  { q: "What should I do with food that's getting old?", expectedIntent: "food_safety_general" },
  { q: "This food smells strange", expectedIntent: "food_safety_smell_spoilage" },
  { q: "The food was left outside", expectedIntent: "food_safety_temperature_storage" },
  { q: "Can I donate cooked food?", expectedIntent: "food_safety_cooked_food" },

  // Donation
  { q: "How do I donate food?", expectedIntent: "donation_howto" },
  { q: "What happens after I donate?", expectedIntent: "donation_status" },
  { q: "How does matching work?", expectedIntent: "matching_explanation" },
  { q: "Who gets my donation?", expectedIntent: "matching_explanation" },
  { q: "Can I cancel a donation?", expectedIntent: "cancellation" },
  { q: "What does Accepted mean?", expectedIntent: "donation_status" },
  { q: "What does In Transit mean?", expectedIntent: "donation_status" },

  // Sustainability
  { q: "How does FoodBridge reduce food waste?", expectedIntent: "sustainability" },
  { q: "How does this help hunger?", expectedIntent: "sustainability" },
  { q: "Why should I donate surplus food?", expectedIntent: "sustainability" },
  { q: "What is the environmental impact?", expectedIntent: "sustainability" },

  // App Help
  { q: "What can I do here?", expectedIntent: "app_help" },
  { q: "How does this app work?", expectedIntent: "app_help" },
  { q: "What is the impact dashboard?", expectedIntent: "impact_dashboard" },

  // General Conversation
  { q: "Hi", expectedIntent: "greeting" },
  { q: "Hello", expectedIntent: "greeting" },
  { q: "Hey", expectedIntent: "greeting" },
  { q: "Thanks", expectedIntent: "thanks" },
  { q: "Thank you", expectedIntent: "thanks" },
  { q: "What can you help me with?", expectedIntent: "app_help" },
  { q: "Can you explain that?", expectedIntent: "clarification" },
  { q: "I don't understand", expectedIntent: "clarification" },

  // Unknown
  { q: "What is the capital of Mars?", expectedIntent: "unknown" },
]

const FORBIDDEN_WORDS = [
  '100% safe',
  'definitely safe',
  'guaranteed safe',
  'perfectly safe',
  'as an ai',
  'i am an ai assistant',
  'prototype',
  'phase 1',
  'phase 2',
  'phase 3',
  'rag',
]

console.log('=== TEST 1: Intent Detection & Response Quality ===\n')

let passed = 0
let failed = 0

for (const item of questionsToTest) {
  const intent = detectIntent(item.q)
  const response = generateAssistantResponse(item.q)
  const lowerResp = response.toLowerCase()

  let testOk = true
  if (intent !== item.expectedIntent) {
    console.error(`❌ Intent mismatch for "${item.q}": expected ${item.expectedIntent}, got ${intent}`)
    testOk = false
  }

  for (const forbidden of FORBIDDEN_WORDS) {
    const regex = new RegExp(`\\b${forbidden}\\b`, 'i')
    if (regex.test(lowerResp)) {
      console.error(`❌ Forbidden phrase "${forbidden}" found in response for "${item.q}"!`)
      testOk = false
    }
  }

  if (testOk) {
    passed++
    console.log(`✅ [${intent}] "${item.q}"`)
    console.log(`   Response (${response.length} chars): ${response.substring(0, 90).replace(/\n/g, ' ')}...\n`)
  } else {
    failed++
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`)
if (failed > 0) process.exit(1)

console.log('\n=== TEST 2: Context-Aware Responses with Mock Session Storage ===\n')

// Mock sessionStorage in Node
const mockStorage = new Map<string, string>()
;(globalThis as any).sessionStorage = {
  getItem: (k: string) => mockStorage.get(k) ?? null,
  setItem: (k: string, v: string) => mockStorage.set(k, v),
  removeItem: (k: string) => mockStorage.delete(k),
  clear: () => mockStorage.clear(),
}

// 1. Context test with Active Analysis (Suitable)
mockStorage.set('analysisResult', JSON.stringify({
  foodName: 'Artisan Sourdough Loaf',
  category: 'Bakery & Bread',
  quantity: '10 items',
  donationSuitability: 'Suitable',
  priority: 'Medium',
  recommendation: 'Redistribute within availability window.',
  estimatedServings: 20,
}))

const respWithAnalysis = generateAssistantResponse('Is my food safe?')
console.log('Response with active analysis:')
console.log(respWithAnalysis)

if (!respWithAnalysis.includes('Artisan Sourdough Loaf') || !respWithAnalysis.includes('Suitable')) {
  console.error('FAIL: Response did not reflect active analysis!')
  process.exit(1)
} else {
  console.log('✅ PASS: Assistant accurately reflected active analysis data.\n')
}

// 2. Context test with Active Analysis (Not Recommended)
mockStorage.set('analysisResult', JSON.stringify({
  foodName: 'Old Spoiled Soup',
  category: 'Prepared Meals',
  quantity: '5 portions',
  donationSuitability: 'Not Recommended',
  priority: 'Low',
  recommendation: 'Do not redistribute based on reported age.',
  estimatedServings: 5,
}))

const respUnsafeAnalysis = generateAssistantResponse('Can I donate this?')
console.log('Response with unsafe analysis:')
console.log(respUnsafeAnalysis)

if (!respUnsafeAnalysis.includes('blocks it from community matching') || !respUnsafeAnalysis.includes('Not Recommended')) {
  console.error('FAIL: Unsafe analysis was not properly explained as blocked!')
  process.exit(1)
} else {
  console.log('✅ PASS: Assistant properly explained safety block for Not Recommended food.\n')
}

// 3. Context test with Active Donation
mockStorage.delete('analysisResult')
mockStorage.set('activeDonation', JSON.stringify({
  id: 'don-active-test',
  foodName: 'Warm Vegetable Stew',
  category: 'Prepared Meals',
  quantity: '25 portions',
  estimatedServings: 25,
  donorArea: 'Central District',
  donationSuitability: 'Suitable',
  communityRequestId: 'req-001',
  organizationName: 'City Harvest Shelter',
  recipientArea: 'Central District',
  requestedType: 'Prepared Meals',
  status: 'In Transit',
  confirmedAt: new Date().toISOString(),
}))

const respWithDonation = generateAssistantResponse('Where is my donation?')
console.log('Response with active donation:')
console.log(respWithDonation)

if (!respWithDonation.includes('Warm Vegetable Stew') || !respWithDonation.includes('City Harvest Shelter') || !respWithDonation.includes('In Transit')) {
  console.error('FAIL: Active donation details not reflected in response!')
  process.exit(1)
} else {
  console.log('✅ PASS: Assistant accurately reflected active donation status and recipient.\n')
}

console.log('ALL ASSISTANT TESTS PASSED!')
