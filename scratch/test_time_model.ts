import { runAnalysis } from '../src/services/mockAnalyzer'

async function runTimeModelTests() {
  console.log('=================================================================')
  console.log('FOODBRIDGE AI ANALYZER — TIME-MODEL VALIDATION SUITE')
  console.log('Tests A, B, C, D: Decoupling Food Age from Availability Window')
  console.log('=================================================================\n')

  let allPassed = true

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST A: Prepared 19/9 10:00 AM, Until 19/9 11:00 PM, Assessed 19/9 2:00 PM
  // Expected:
  // - Food age at assessment: 4h
  // - Availability duration: 13h
  // - Availability status: Active
  // - Remaining availability: 9h
  // - Elapsed since expiry: 0h
  // - Display: "13h total — Active"
  // - Must NOT report 2 days old!
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST A: Active Window with Food Age < Window Duration ---')
  const prepA = '19/09/2026, 10:00 AM'
  const untilA = '19/09/2026, 11:00 PM'
  // 19/09/2026 14:00:00
  const assessTimeA = new Date(2026, 8, 19, 14, 0, 0).getTime()

  const resA = await runAnalysis(
    {
      foodName: 'Rice & Vegetables',
      category: 'Prepared Meals',
      quantity: '25',
      unit: 'portions',
      estimatedServings: '25',
      preparationDate: prepA,
      availabilityUntil: untilA,
      storageCondition: 'Refrigerated',
      location: 'Central Kitchen',
      additionalInfo: 'Vegetarian rice dish, kept refrigerated.',
    },
    assessTimeA,
  )

  console.log('Test A Food Age (hours):', resA.foodAgeHours)
  console.log('Test A Food Age at Assessment:', resA.foodAgeAtAssessment)
  console.log('Test A Availability Window (hours):', resA.availabilityWindowHours)
  console.log('Test A Availability Status:', resA.availabilityStatus)
  console.log('Test A Remaining Availability:', resA.remainingAvailabilityHours)
  console.log('Test A Elapsed Since Expiry:', resA.elapsedSinceExpiryHours)
  console.log('Test A Availability Display:', resA.availabilityWindowDisplay)

  if (resA.foodAgeHours !== 4) {
    console.error(`❌ FAIL Test A: Expected foodAgeHours = 4, got ${resA.foodAgeHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Test A: foodAgeHours = 4')
  }

  if (resA.availabilityWindowHours !== 13) {
    console.error(`❌ FAIL Test A: Expected availabilityWindowHours = 13, got ${resA.availabilityWindowHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Test A: availabilityWindowHours = 13')
  }

  if (resA.availabilityStatus !== 'Active') {
    console.error(`❌ FAIL Test A: Expected availabilityStatus = "Active", got "${resA.availabilityStatus}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Test A: availabilityStatus = Active')
  }

  if (resA.remainingAvailabilityHours !== 9) {
    console.error(`❌ FAIL Test A: Expected remainingAvailabilityHours = 9, got ${resA.remainingAvailabilityHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Test A: remainingAvailabilityHours = 9')
  }

  if (resA.availabilityWindowDisplay !== '13h total — Active') {
    console.error(`❌ FAIL Test A: Expected availabilityWindowDisplay = "13h total — Active", got "${resA.availabilityWindowDisplay}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Test A: availabilityWindowDisplay = "13h total — Active"')
  }

  const mentions2DaysA = JSON.stringify(resA).includes('2 day')
  if (mentions2DaysA) {
    console.error('❌ FAIL Test A: Incorrectly mentions "2 day" for 4h old food!')
    allPassed = false
  } else {
    console.log('✅ PASS Test A: Does NOT mention 2 days old')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST B: Prepared 19/9 10:00 AM, Until 19/9 11:00 PM, Assessed 19/9 11:00 PM
  // Expected:
  // - Food age at assessment: 13h
  // - Availability duration: 13h
  // - Availability status: Expired (boundary)
  // - Remaining availability: 0h
  // - Elapsed since expiry: 0h
  // - Display: "13h total — Expired"
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST B: Exact Deadline Boundary Assessment ---')
  const assessTimeB = new Date(2026, 8, 19, 23, 0, 0).getTime()

  const resB = await runAnalysis(
    {
      foodName: 'Rice & Vegetables',
      category: 'Prepared Meals',
      quantity: '25',
      unit: 'portions',
      estimatedServings: '25',
      preparationDate: prepA,
      availabilityUntil: untilA,
      storageCondition: 'Refrigerated',
      location: 'Central Kitchen',
      additionalInfo: 'Vegetarian rice dish, kept refrigerated.',
    },
    assessTimeB,
  )

  console.log('Test B Food Age (hours):', resB.foodAgeHours)
  console.log('Test B Food Age at Assessment:', resB.foodAgeAtAssessment)
  console.log('Test B Availability Window (hours):', resB.availabilityWindowHours)
  console.log('Test B Availability Status:', resB.availabilityStatus)
  console.log('Test B Remaining Availability:', resB.remainingAvailabilityHours)
  console.log('Test B Elapsed Since Expiry:', resB.elapsedSinceExpiryHours)
  console.log('Test B Availability Display:', resB.availabilityWindowDisplay)

  if (resB.foodAgeHours !== 13) {
    console.error(`❌ FAIL Test B: Expected foodAgeHours = 13, got ${resB.foodAgeHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Test B: foodAgeHours = 13')
  }

  if (resB.availabilityWindowHours !== 13) {
    console.error(`❌ FAIL Test B: Expected availabilityWindowHours = 13, got ${resB.availabilityWindowHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Test B: availabilityWindowHours = 13')
  }

  if (resB.availabilityStatus !== 'Expired') {
    console.error(`❌ FAIL Test B: Expected availabilityStatus = "Expired", got "${resB.availabilityStatus}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Test B: availabilityStatus = Expired')
  }

  if (resB.remainingAvailabilityHours !== 0) {
    console.error(`❌ FAIL Test B: Expected remainingAvailabilityHours = 0, got ${resB.remainingAvailabilityHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Test B: remainingAvailabilityHours = 0')
  }

  if (resB.availabilityWindowDisplay !== '13h total — Expired') {
    console.error(`❌ FAIL Test B: Expected availabilityWindowDisplay = "13h total — Expired", got "${resB.availabilityWindowDisplay}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Test B: availabilityWindowDisplay = "13h total — Expired"')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST C: Prepared 19/9 10:00 AM, Until 19/9 11:00 PM, Assessed 22/9 12:26 AM
  // Expected:
  // - Food age at assessment: ~62.43h (~2 days and 14 hours)
  // - Availability duration: 13h
  // - Availability status: Expired
  // - Elapsed since expiry: ~49.43h (~2 days and 1 hour)
  // - Display: "13h total — Expired"
  // - Wording clearly distinguishes 13h window from food age at assessment
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST C: Assessed Days After Availability Window Expired ---')
  // 22/09/2026 00:26:00
  const assessTimeC = new Date(2026, 8, 22, 0, 26, 0).getTime()

  const resC = await runAnalysis(
    {
      foodName: 'Rice',
      category: 'Prepared Meals',
      quantity: '25',
      unit: 'portions',
      estimatedServings: '25',
      preparationDate: prepA,
      availabilityUntil: untilA,
      storageCondition: 'Refrigerated',
      location: 'Central Kitchen',
      additionalInfo: 'Refrigerated rice.',
    },
    assessTimeC,
  )

  console.log('Test C Food Age (hours):', resC.foodAgeHours)
  console.log('Test C Food Age at Assessment:', resC.foodAgeAtAssessment)
  console.log('Test C Availability Window (hours):', resC.availabilityWindowHours)
  console.log('Test C Availability Status:', resC.availabilityStatus)
  console.log('Test C Remaining Availability:', resC.remainingAvailabilityHours)
  console.log('Test C Elapsed Since Expiry:', resC.elapsedSinceExpiryHours)
  console.log('Test C Availability Display:', resC.availabilityWindowDisplay)
  console.log('Test C Recommendation:', resC.recommendation)
  console.log('Test C Shelf Life:', resC.estimatedShelfLife)

  if (Math.abs(resC.foodAgeHours! - 62.43) > 0.1) {
    console.error(`❌ FAIL Test C: Expected foodAgeHours ~ 62.43, got ${resC.foodAgeHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Test C: foodAgeHours is ~62.43 (~2 days and 14 hours)')
  }

  if (resC.availabilityWindowHours !== 13) {
    console.error(`❌ FAIL Test C: Expected availabilityWindowHours = 13, got ${resC.availabilityWindowHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Test C: availabilityWindowHours = 13')
  }

  if (resC.availabilityStatus !== 'Expired') {
    console.error(`❌ FAIL Test C: Expected availabilityStatus = "Expired", got "${resC.availabilityStatus}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Test C: availabilityStatus = Expired')
  }

  if (Math.abs(resC.elapsedSinceExpiryHours! - 49.43) > 0.1) {
    console.error(`❌ FAIL Test C: Expected elapsedSinceExpiryHours ~ 49.43, got ${resC.elapsedSinceExpiryHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Test C: elapsedSinceExpiryHours is ~49.43 (~2 days and 1 hour)')
  }

  if (resC.availabilityWindowDisplay !== '13h total — Expired') {
    console.error(`❌ FAIL Test C: Expected availabilityWindowDisplay = "13h total — Expired", got "${resC.availabilityWindowDisplay}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Test C: availabilityWindowDisplay = "13h total — Expired"')
  }

  if (!resC.recommendation.includes('original 13h availability window')) {
    console.error('❌ FAIL Test C: Recommendation should mention the original 13h availability window')
    allPassed = false
  } else {
    console.log('✅ PASS Test C: Recommendation mentions original 13h availability window')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // TEST D: Fresh refrigerated rice prepared 2h ago with 13h window
  // Expected:
  // - Food age: ~2h
  // - Availability status: Active
  // - Storage recognized: Refrigerated
  // - Suitability: Suitable with Conditions (or Suitable)
  // - Do NOT classify as 2 days old or Expired
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST D: Fresh Refrigerated Rice (2h old, 13h window) ---')
  const now = Date.now()
  const prepD = new Date(now - 2 * 3600 * 1000).toISOString()
  const untilD = new Date(now + 11 * 3600 * 1000).toISOString()

  const resD = await runAnalysis(
    {
      foodName: 'Rice',
      category: 'Prepared Meals',
      quantity: '25',
      unit: 'portions',
      estimatedServings: '25',
      preparationDate: prepD,
      availabilityUntil: untilD,
      storageCondition: 'Refrigerated',
      location: 'Central Kitchen',
      additionalInfo: 'Freshly cooked jasmine rice, cooled and refrigerated.',
    },
    now,
  )

  console.log('Test D Food Age (hours):', resD.foodAgeHours)
  console.log('Test D Availability Window (hours):', resD.availabilityWindowHours)
  console.log('Test D Availability Status:', resD.availabilityStatus)
  console.log('Test D Suitability:', resD.donationSuitability)

  if (Math.abs(resD.foodAgeHours! - 2) > 0.1) {
    console.error(`❌ FAIL Test D: Expected foodAgeHours ~ 2, got ${resD.foodAgeHours}`)
    allPassed = false
  } else {
    console.log('✅ PASS Test D: foodAgeHours is ~2')
  }

  if (resD.availabilityStatus !== 'Active') {
    console.error(`❌ FAIL Test D: Expected availabilityStatus = "Active", got "${resD.availabilityStatus}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Test D: availabilityStatus = Active')
  }

  if (resD.donationSuitability !== 'Suitable') {
    console.error(`❌ FAIL Test D: Fresh refrigerated rice should be Suitable, got "${resD.donationSuitability}"`)
    allPassed = false
  } else {
    console.log('✅ PASS Test D: donationSuitability = Suitable')
  }

  const mentions2DaysD = JSON.stringify(resD).includes('2 day')
  if (mentions2DaysD) {
    console.error('❌ FAIL Test D: Fresh rice incorrectly mentions 2 days!')
    allPassed = false
  } else {
    console.log('✅ PASS Test D: Does NOT mention 2 days')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n=================================================================')
  if (allPassed) {
    console.log('🎉 ALL TIME-MODEL REGRESSION TESTS (A, B, C, D) PASSED PERFECTLY!')
  } else {
    console.error('❌ SOME TESTS FAILED!')
    process.exit(1)
  }
  console.log('=================================================================\n')
}

runTimeModelTests().catch((err) => {
  console.error('Error running tests:', err)
  process.exit(1)
})
