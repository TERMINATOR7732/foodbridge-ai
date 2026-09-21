import { runAnalysis } from '../src/services/mockAnalyzer'
import { matchFromAnalysis } from '../src/services/matchingService'
import { canTransitionTo } from '../src/services/donationStore'
import { demoCommunityRequests } from '../src/data/demoData'
import type { FoodAnalysisResult, CommunityRequest } from '../src/types'

async function runTests() {
  console.log('=== TEST 1: Food Safety Analysis ===')

  const now = new Date()

  // 1A. Fresh Bread (2 hours old, available for next 20 hours)
  const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000).toISOString()
  const inTwentyHours = new Date(now.getTime() + 20 * 3600 * 1000).toISOString()
  const freshBreadRes = await runAnalysis({
    foodName: 'Fresh Sourdough Bread',
    category: 'Bakery & Bread',
    quantity: '10',
    unit: 'items',
    estimatedServings: '20',
    preparationDate: twoHoursAgo,
    availabilityUntil: inTwentyHours,
    storageCondition: 'Room Temperature',
    location: 'Central District',
    additionalInfo: 'Vegan',
  })
  console.log('Fresh bread suitability:', freshBreadRes.donationSuitability, '| Confidence:', freshBreadRes.confidence)
  if (freshBreadRes.donationSuitability !== 'Suitable') {
    console.error('FAIL: Fresh bread should be Suitable, got:', freshBreadRes.donationSuitability)
    process.exit(1)
  } else {
    console.log('PASS: Fresh bread is Suitable')
  }

  // 1B. 10-day-old bread (240 hours old)
  const tenDaysAgo = new Date(now.getTime() - 240 * 3600 * 1000).toISOString()
  const oldBreadRes = await runAnalysis({
    foodName: 'Old Bread Loaf',
    category: 'Bakery & Bread',
    quantity: '5',
    unit: 'items',
    estimatedServings: '10',
    preparationDate: tenDaysAgo,
    availabilityUntil: inTwentyHours,
    storageCondition: 'Room Temperature',
    location: 'Central District',
    additionalInfo: '',
  })
  console.log('10-day-old bread suitability:', oldBreadRes.donationSuitability, '| Confidence:', oldBreadRes.confidence)
  if (oldBreadRes.donationSuitability !== 'Not Recommended') {
    console.error('FAIL: 10-day-old bread should be Not Recommended, got:', oldBreadRes.donationSuitability)
    process.exit(1)
  } else {
    console.log('PASS: 10-day-old bread is Not Recommended')
  }

  // 1C. 2.5-day-old bread (60 hours old - squarely inside caution band: 24h < 60h <= 72h)
  const twoAndHalfDaysAgo = new Date(now.getTime() - 60 * 3600 * 1000).toISOString()
  const cautionBreadRes = await runAnalysis({
    foodName: '2.5-Day-Old Bread',
    category: 'Bakery & Bread',
    quantity: '5',
    unit: 'items',
    estimatedServings: '10',
    preparationDate: twoAndHalfDaysAgo,
    availabilityUntil: inTwentyHours,
    storageCondition: 'Room Temperature',
    location: 'Central District',
    additionalInfo: '',
  })
  console.log('Caution bread (60h) suitability:', cautionBreadRes.donationSuitability)
  if (cautionBreadRes.donationSuitability !== 'Suitable with Conditions') {
    console.error('FAIL: Caution bread should be Suitable with Conditions, got:', cautionBreadRes.donationSuitability)
    process.exit(1)
  } else {
    console.log('PASS: Caution bread is Suitable with Conditions')
  }

  // 1D. Prepared meal stored at Room Temperature (mismatch check)
  const oneHourAgo = new Date(now.getTime() - 1 * 3600 * 1000).toISOString()
  const roomTempMealRes = await runAnalysis({
    foodName: 'Chicken Curry',
    category: 'Prepared Meals',
    quantity: '10',
    unit: 'portions',
    estimatedServings: '10',
    preparationDate: oneHourAgo,
    availabilityUntil: inTwentyHours,
    storageCondition: 'Room Temperature',
    location: 'Central District',
    additionalInfo: '',
  })
  console.log('Room-temp prepared meal suitability:', roomTempMealRes.donationSuitability)
  if (roomTempMealRes.donationSuitability !== 'Requires Review') {
    console.error('FAIL: Room-temp meal should require review, got:', roomTempMealRes.donationSuitability)
    process.exit(1)
  } else {
    console.log('PASS: Room-temp meal Requires Review')
  }

  // 1E. Prepared meal 30 hours old (refrigerated caution band: 24h-48h -> Suitable with Conditions)
  const thirtyHoursAgo = new Date(now.getTime() - 30 * 3600 * 1000).toISOString()
  const cautionMealRes = await runAnalysis({
    foodName: 'Refrigerated Cooked Pasta',
    category: 'Prepared Meals',
    quantity: '10',
    unit: 'portions',
    estimatedServings: '10',
    preparationDate: thirtyHoursAgo,
    availabilityUntil: inTwentyHours,
    storageCondition: 'Refrigerated',
    location: 'Central District',
    additionalInfo: '',
  })
  console.log('30-hour refrigerated meal suitability:', cautionMealRes.donationSuitability)
  if (cautionMealRes.donationSuitability !== 'Suitable with Conditions') {
    console.error('FAIL: 30-hour refrigerated meal should be Suitable with Conditions, got:', cautionMealRes.donationSuitability)
    process.exit(1)
  } else {
    console.log('PASS: 30-hour refrigerated meal is Suitable with Conditions')
  }

  // 1E2. Prepared meal 100 hours old (exceeds 72h max refrigerated limit -> Not Recommended)
  const hundredHoursAgo = new Date(now.getTime() - 100 * 3600 * 1000).toISOString()
  const oldMealRes = await runAnalysis({
    foodName: 'Old Cooked Pasta',
    category: 'Prepared Meals',
    quantity: '10',
    unit: 'portions',
    estimatedServings: '10',
    preparationDate: hundredHoursAgo,
    availabilityUntil: inTwentyHours,
    storageCondition: 'Refrigerated',
    location: 'Central District',
    additionalInfo: '',
  })
  console.log('100-hour old meal suitability:', oldMealRes.donationSuitability)
  if (oldMealRes.donationSuitability !== 'Not Recommended') {
    console.error('FAIL: 100-hour old meal should be Not Recommended, got:', oldMealRes.donationSuitability)
    process.exit(1)
  } else {
    console.log('PASS: 100-hour old meal is Not Recommended')
  }

  // 1G. Rice test case: 2.5 days old, refrigerated, elapsed window -> Requires Review
  const twoAndHalfDaysAgoHours = 60.5
  const prepTimeRice = new Date(now.getTime() - twoAndHalfDaysAgoHours * 3600 * 1000).toISOString()
  const elapsedWindowUntil = new Date(now.getTime() - 48 * 3600 * 1000).toISOString() // window elapsed 48h ago
  const riceRes = await runAnalysis({
    foodName: 'Rice',
    category: 'Prepared Meals',
    quantity: '25',
    unit: 'portions',
    estimatedServings: '25',
    preparationDate: prepTimeRice,
    availabilityUntil: elapsedWindowUntil,
    storageCondition: 'Refrigerated',
    location: 'Central District',
    additionalInfo: '',
  })
  console.log('Rice (2.5d old, refrig, elapsed window) suitability:', riceRes.donationSuitability, '| Confidence:', riceRes.confidence)
  if (riceRes.donationSuitability !== 'Requires Review') {
    console.error('FAIL: Rice test case should be Requires Review, got:', riceRes.donationSuitability)
    process.exit(1)
  } else {
    console.log('PASS: Rice test case is Requires Review')
  }

  // 1F. Future preparation date
  const tomorrow = new Date(now.getTime() + 24 * 3600 * 1000).toISOString()
  const futurePrepRes = await runAnalysis({
    foodName: 'Future Food',
    category: 'Prepared Meals',
    quantity: '10',
    unit: 'portions',
    estimatedServings: '10',
    preparationDate: tomorrow,
    availabilityUntil: inTwentyHours,
    storageCondition: 'Refrigerated',
    location: 'Central District',
    additionalInfo: '',
  })
  console.log('Future prep date suitability:', futurePrepRes.donationSuitability)
  if (futurePrepRes.donationSuitability !== 'Requires Review') {
    console.error('FAIL: Future date should be Requires Review, got:', futurePrepRes.donationSuitability)
    process.exit(1)
  } else {
    console.log('PASS: Future date flagged as Requires Review')
  }

  console.log('\n=== TEST 2: Community Matching ===')

  // 2A. Matching blocked for Not Recommended food
  const blockedMatchRes = await matchFromAnalysis(oldBreadRes, demoCommunityRequests, 'Central District')
  console.log('Not recommended food matching blocked:', blockedMatchRes.blocked)
  if (!blockedMatchRes.blocked) {
    console.error('FAIL: Not recommended food must be blocked from matching')
    process.exit(1)
  } else {
    console.log('PASS: Not recommended food blocked from matching:', (blockedMatchRes as any).reason)
  }

  // 2B. Matching for fresh food
  const liveMatchRes = await matchFromAnalysis(freshBreadRes, demoCommunityRequests, 'Central District')
  console.log('Fresh bread matching blocked:', liveMatchRes.blocked)
  if (liveMatchRes.blocked) {
    console.error('FAIL: Fresh bread should not be blocked')
    process.exit(1)
  } else {
    console.log('PASS: Matches returned:', liveMatchRes.matches.length)
    liveMatchRes.matches.forEach((m) => {
      console.log(`  - Org: ${m.organizationName} | Score: ${m.matchScore} | Reason: ${m.reason.substring(0, 60)}...`)
    })
  }

  // 2C. Unavailable recipient excluded
  const requestsWithUnavailable: CommunityRequest[] = [
    {
      id: 'req-closed',
      organizationName: 'Closed Shelter',
      requestedType: 'Bread',
      quantityNeeded: '10 items',
      urgency: 'High',
      availabilityRequirement: 'Today',
      area: 'Central District',
      status: 'Closed',
      notes: '',
    },
    {
      id: 'req-open',
      organizationName: 'Open Center',
      requestedType: 'Bread',
      quantityNeeded: '10 items',
      urgency: 'High',
      availabilityRequirement: 'Today',
      area: 'Central District',
      status: 'Open',
      notes: '',
    },
  ]
  const unavailMatchRes = await matchFromAnalysis(freshBreadRes, requestsWithUnavailable, 'Central District')
  if (!unavailMatchRes.blocked) {
    const hasClosed = unavailMatchRes.matches.some((m) => m.communityRequestId === 'req-closed')
    if (hasClosed) {
      console.error('FAIL: Closed recipient was included in matches')
      process.exit(1)
    } else {
      console.log('PASS: Closed recipient was excluded')
    }
  }

  // 2D. Category mismatch & scoring
  const requestsWithMismatch: CommunityRequest[] = [
    {
      id: 'req-diff-cat',
      organizationName: 'Meat/Dairy Only',
      requestedType: 'Dairy and eggs only',
      quantityNeeded: '10 items',
      urgency: 'Low',
      availabilityRequirement: 'Any',
      area: 'East Side',
      status: 'Open',
      notes: '',
    },
  ]
  const diffCatMatchRes = await matchFromAnalysis(freshBreadRes, requestsWithMismatch, 'Central District')
  if (!diffCatMatchRes.blocked) {
    console.log('Mismatched category matches count:', diffCatMatchRes.matches.length)
    if (diffCatMatchRes.matches.length > 0) {
      console.log('Mismatched match score:', diffCatMatchRes.matches[0].matchScore, 'Factors:', diffCatMatchRes.matches[0].matchFactors)
    }
  }

  console.log('\n=== TEST 3: Donation Lifecycle Transitions ===')
  console.log('Matched -> Accepted:', canTransitionTo('Matched', 'Accepted'))
  console.log('Matched -> Cancelled:', canTransitionTo('Matched', 'Cancelled'))
  console.log('Accepted -> In Transit:', canTransitionTo('Accepted', 'In Transit'))
  console.log('Accepted -> Cancelled:', canTransitionTo('Accepted', 'Cancelled'))
  console.log('In Transit -> Completed:', canTransitionTo('In Transit', 'Completed'))
  console.log('In Transit -> Cancelled:', canTransitionTo('In Transit', 'Cancelled'))
  console.log('Completed -> any:', canTransitionTo('Completed', 'Matched'), canTransitionTo('Completed', 'In Transit'))
  console.log('Cancelled -> any:', canTransitionTo('Cancelled', 'Accepted'), canTransitionTo('Cancelled', 'In Transit'))

  if (
    canTransitionTo('Matched', 'Accepted') &&
    canTransitionTo('Accepted', 'In Transit') &&
    canTransitionTo('In Transit', 'Completed') &&
    canTransitionTo('Matched', 'Cancelled') &&
    canTransitionTo('Accepted', 'Cancelled') &&
    !canTransitionTo('In Transit', 'Cancelled') &&
    !canTransitionTo('Completed', 'Matched') &&
    !canTransitionTo('Cancelled', 'Matched')
  ) {
    console.log('PASS: All lifecycle transitions validated correctly')
  } else {
    console.error('FAIL: Lifecycle transitions failed validation')
    process.exit(1)
  }
}

runTests().catch(console.error)
