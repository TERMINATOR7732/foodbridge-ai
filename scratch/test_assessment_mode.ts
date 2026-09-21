import { runAnalysis } from '../src/services/mockAnalyzer'

async function runAssessmentModeTests() {
  console.log('=================================================================')
  console.log('FOODBRIDGE AI — ASSESSMENT MODE REGRESSION SUITE (5 CASES)')
  console.log('=================================================================\n')

  let allPassed = true

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE A: Current active
  // Preparation = now - 2h, Availability = now + 11h
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- CASE A: Current Active Submission ---')
  const nowA = Date.now()
  const prepA = new Date(nowA - 2 * 3600 * 1000).toISOString()
  const untilA = new Date(nowA + 11 * 3600 * 1000).toISOString()

  const resA = await runAnalysis(
    {
      foodName: 'Fresh Soup',
      category: 'Prepared Meals',
      quantity: '10',
      unit: 'portions',
      estimatedServings: '10',
      preparationDate: prepA,
      availabilityUntil: untilA,
      storageCondition: 'Refrigerated',
      location: 'Central Kitchen',
      additionalInfo: 'Contains dairy',
    },
    nowA,
  )

  console.log('Case A assessmentMode:', resA.assessmentMode)
  console.log('Case A foodAgeHours:', resA.foodAgeHours)
  console.log('Case A availabilityStatus:', resA.availabilityStatus)
  console.log('Case A remainingAvailabilityHours:', resA.remainingAvailabilityHours)
  console.log('Case A assessmentBasis:', resA.assessmentBasis)

  if (resA.assessmentMode !== 'live') {
    console.error(`❌ FAIL Case A: Expected assessmentMode "live", got "${resA.assessmentMode}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Case A: assessmentMode = live')
  }

  if (Math.abs(resA.foodAgeHours! - 2) > 0.1) {
    console.error(`❌ FAIL Case A: Expected foodAgeHours ~ 2, got ${resA.foodAgeHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Case A: foodAgeHours ≈ 2')
  }

  if (resA.availabilityStatus !== 'Active') {
    console.error(`❌ FAIL Case A: Expected availabilityStatus "Active", got "${resA.availabilityStatus}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Case A: availabilityStatus = Active')
  }

  if (resA.elapsedSinceExpiryHours !== 0) {
    console.error(`❌ FAIL Case A: Expected elapsedSinceExpiryHours = 0, got ${resA.elapsedSinceExpiryHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Case A: not expired (elapsed = 0)')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE B: Historical submission
  // Preparation = 2026-09-19T10:00:00, Availability = 2026-09-19T22:00:00, Current = 2026-09-22T00:53:50
  // Storage = Refrigerated
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- CASE B: Historical Timeline Submission ---')
  const prepB = '2026-09-19T10:00:00'
  const untilB = '2026-09-19T22:00:00'
  const currentB = new Date('2026-09-22T00:53:50').getTime()

  const resB = await runAnalysis(
    {
      foodName: 'Vegetable Stew',
      category: 'Prepared Meals',
      quantity: '20',
      unit: 'portions',
      estimatedServings: '20',
      preparationDate: prepB,
      availabilityUntil: untilB,
      storageCondition: 'Refrigerated',
      location: 'Central Kitchen',
      additionalInfo: 'Refrigerated stew',
    },
    currentB,
  )

  console.log('Case B assessmentMode:', resB.assessmentMode)
  console.log('Case B analysedAt:', resB.analysedAt)
  console.log('Case B foodAgeHours:', resB.foodAgeHours)
  console.log('Case B availabilityWindowHours:', resB.availabilityWindowHours)
  console.log('Case B availabilityStatus:', resB.availabilityStatus)
  console.log('Case B remainingAvailabilityHours:', resB.remainingAvailabilityHours)
  console.log('Case B elapsedSinceExpiryHours:', resB.elapsedSinceExpiryHours)
  console.log('Case B assessmentBasis:', resB.assessmentBasis)

  if (resB.assessmentMode !== 'historical_demo') {
    console.error(`❌ FAIL Case B: Expected assessmentMode "historical_demo", got "${resB.assessmentMode}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Case B: assessmentMode = historical_demo')
  }

  const prepTimeB = new Date(prepB).getTime()
  const untilTimeB = new Date(untilB).getTime()
  const analysedTimeB = new Date(resB.analysedAt).getTime()
  if (analysedTimeB < prepTimeB || analysedTimeB > untilTimeB) {
    console.error('❌ FAIL Case B: assessmentTime is not between prep and until dates')
    allPassed = false
  } else {
    console.log('✅ PASS Case B: assessmentTime is inside submitted timeline')
  }

  if (Math.abs(resB.foodAgeHours! - 6) > 0.1) {
    console.error(`❌ FAIL Case B: Expected foodAgeHours ~ 6, got ${resB.foodAgeHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Case B: foodAgeHours ≈ 6h (deterministic midpoint)')
  }

  if (resB.availabilityWindowHours !== 12) {
    console.error(`❌ FAIL Case B: Expected availabilityWindowHours = 12, got ${resB.availabilityWindowHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Case B: availabilityWindowHours = 12')
  }

  if (resB.availabilityStatus !== 'Active') {
    console.error(`❌ FAIL Case B: Expected availabilityStatus "Active", got "${resB.availabilityStatus}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Case B: availabilityStatus = Active')
  }

  if (resB.elapsedSinceExpiryHours !== 0) {
    console.error(`❌ FAIL Case B: Expected elapsedSinceExpiryHours = 0, got ${resB.elapsedSinceExpiryHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Case B: NOT expired (elapsed = 0)')
  }

  if (resB.foodAgeHours! < 0 || resB.remainingAvailabilityHours! < 0) {
    console.error('❌ FAIL Case B: Found negative time values!')
    allPassed = false
  } else {
    console.log('✅ PASS Case B: No negative values')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE C: Historical room-temperature food
  // Preparation = 2026-09-19T10:00:00, Availability = 2026-09-19T22:00:00, Current = 2026-09-22T00:53:50
  // Storage = Room Temperature
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- CASE C: Historical Room-Temperature Food ---')
  const resC = await runAnalysis(
    {
      foodName: 'Rice',
      category: 'Prepared Meals',
      quantity: '25',
      unit: 'portions',
      estimatedServings: '25',
      preparationDate: prepB,
      availabilityUntil: untilB,
      storageCondition: 'Room Temperature',
      location: 'Community Hall',
      additionalInfo: '',
    },
    currentB,
  )

  console.log('Case C assessmentMode:', resC.assessmentMode)
  console.log('Case C foodAgeHours:', resC.foodAgeHours)
  console.log('Case C foodAgeAtAssessment:', resC.foodAgeAtAssessment)
  console.log('Case C recommendation:', resC.recommendation)
  console.log('Case C safety considerations:', resC.safetyConsiderations)

  if (resC.assessmentMode !== 'historical_demo') {
    console.error(`❌ FAIL Case C: Expected assessmentMode "historical_demo", got "${resC.assessmentMode}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Case C: historical mode triggers')
  }

  if (Math.abs(resC.foodAgeHours! - 6) > 0.1) {
    console.error(`❌ FAIL Case C: Expected foodAgeHours ~ 6, got ${resC.foodAgeHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Case C: foodAgeHours ≈ 6h (inside timeline)')
  }

  const rawJsonC = JSON.stringify(resC)
  if (rawJsonC.includes('2 day') || rawJsonC.includes('2 days')) {
    console.error('❌ FAIL Case C: Result incorrectly reports 2 days of food age!')
    allPassed = false
  } else {
    console.log('✅ PASS Case C: Does NOT report 2 days 15 hours of food age')
  }

  const mentionsRoomTempExposure = resC.safetyConsiderations.some(c =>
    c.toLowerCase().includes('room temperature') || c.toLowerCase().includes('microbiological risk')
  )
  if (!mentionsRoomTempExposure) {
    console.error('❌ FAIL Case C: Safety model did not evaluate room-temperature exposure!')
    allPassed = false
  } else {
    console.log('✅ PASS Case C: Risk & uncertainty model active for 6h room-temperature exposure')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE D: Current expired
  // Preparation = now - 12h, Availability = now - 2h
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- CASE D: Current Expired Submission ---')
  const nowD = Date.now()
  const prepD = new Date(nowD - 12 * 3600 * 1000).toISOString()
  const untilD = new Date(nowD - 2 * 3600 * 1000).toISOString()

  const resD = await runAnalysis(
    {
      foodName: 'Lunch Trays',
      category: 'Prepared Meals',
      quantity: '15',
      unit: 'portions',
      estimatedServings: '15',
      preparationDate: prepD,
      availabilityUntil: untilD,
      storageCondition: 'Refrigerated',
      location: 'Catering Center',
      additionalInfo: '',
    },
    nowD,
  )

  console.log('Case D assessmentMode:', resD.assessmentMode)
  console.log('Case D foodAgeHours:', resD.foodAgeHours)
  console.log('Case D availabilityStatus:', resD.availabilityStatus)
  console.log('Case D elapsedSinceExpiryHours:', resD.elapsedSinceExpiryHours)

  if (resD.assessmentMode !== 'live') {
    console.error(`❌ FAIL Case D: Expected assessmentMode "live", got "${resD.assessmentMode}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Case D: assessmentMode = live')
  }

  if (resD.availabilityStatus !== 'Expired') {
    console.error(`❌ FAIL Case D: Expected availabilityStatus "Expired", got "${resD.availabilityStatus}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Case D: availabilityStatus = Expired')
  }

  if (Math.abs(resD.elapsedSinceExpiryHours! - 2) > 0.1) {
    console.error(`❌ FAIL Case D: Expected elapsedSinceExpiryHours ~ 2, got ${resD.elapsedSinceExpiryHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Case D: elapsedSinceExpiryHours ≈ 2h')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE E: Future preparation
  // Preparation = now + 2h, Availability = now + 12h
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- CASE E: Future Preparation ---')
  const nowE = Date.now()
  const prepE = new Date(nowE + 2 * 3600 * 1000).toISOString()
  const untilE = new Date(nowE + 12 * 3600 * 1000).toISOString()

  const resE = await runAnalysis(
    {
      foodName: 'Future Bread',
      category: 'Bakery & Bread',
      quantity: '10',
      unit: 'loaves',
      estimatedServings: '10',
      preparationDate: prepE,
      availabilityUntil: untilE,
      storageCondition: 'Room Temperature',
      location: 'Bakery',
      additionalInfo: '',
    },
    nowE,
  )

  console.log('Case E assessmentMode:', resE.assessmentMode)
  console.log('Case E donationSuitability:', resE.donationSuitability)
  console.log('Case E foodAgeHours:', resE.foodAgeHours)
  console.log('Case E assessmentBasis:', resE.assessmentBasis)

  if (resE.assessmentMode !== 'future_invalid') {
    console.error(`❌ FAIL Case E: Expected assessmentMode "future_invalid", got "${resE.assessmentMode}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Case E: assessmentMode = future_invalid')
  }

  if (resE.donationSuitability !== 'Requires Review') {
    console.error(`❌ FAIL Case E: Expected donationSuitability "Requires Review", got "${resE.donationSuitability}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Case E: review/validation behavior active')
  }

  if (resE.foodAgeHours! < 0) {
    console.error('❌ FAIL Case E: Found negative foodAgeHours!')
    allPassed = false
  } else {
    console.log('✅ PASS Case E: no negative food age')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n=================================================================')
  if (allPassed) {
    console.log('🎉 ALL 5 ASSESSMENT MODE REGRESSION TESTS (A, B, C, D, E) PASSED PERFECTLY!')
  } else {
    console.error('❌ SOME TESTS FAILED!')
    process.exit(1)
  }
  console.log('=================================================================\n')
}

runAssessmentModeTests().catch((err) => {
  console.error('Error running assessment mode tests:', err)
  process.exit(1)
})
