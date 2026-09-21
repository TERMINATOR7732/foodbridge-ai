import { runAnalysis } from '../src/services/mockAnalyzer'

async function runAllTests() {
  console.log('=================================================================')
  console.log('FOODBRIDGE AI ANALYZER — COMPREHENSIVE HOLISTIC EVALUATION SUITE')
  console.log('=================================================================\n')

  let allPassed = true

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE 1: The Rice test case from user prompt
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST CASE 1: Rice (Prepared Meals, 2.5 days old, refrigerated, elapsed window) ---')
  // Prep: 19/9/2026 11:00 AM, Until: 19/9/2026 10:00 PM, Analysis: 21/9/2026 11:33 PM
  const prepTime1 = new Date(2026, 8, 19, 11, 0, 0).getTime()
  const untilTime1 = new Date(2026, 8, 19, 22, 0, 0).getTime()
  const analysisTime1 = new Date(2026, 8, 21, 23, 33, 0).getTime()

  const case1 = await runAnalysis(
    {
      foodName: 'Rice',
      category: 'Prepared Meals',
      quantity: '25',
      unit: 'portions',
      estimatedServings: '25',
      preparationDate: new Date(prepTime1).toISOString(),
      availabilityUntil: new Date(untilTime1).toISOString(),
      storageCondition: 'Refrigerated',
      location: 'Central Community Hall',
      additionalInfo: '',
    },
    analysisTime1,
  )

  console.log('Suitability:', case1.donationSuitability)
  console.log('Priority:', case1.priority)
  console.log('Confidence:', Math.round(case1.confidence * 100) + '% (' + case1.confidence + ')')
  console.log('Shelf life:', case1.estimatedShelfLife)
  console.log('Recommendation:', case1.recommendation)
  console.log('Reasoning:', case1.reasoning)
  console.log('Safety considerations:', case1.safetyConsiderations)

  // Assertions for Case 1:
  // Must NOT be "Not Recommended" (which was the bug)
  // Must NOT be "Suitable" (which would be unsafe)
  // Must be "Requires Review"
  if (case1.donationSuitability !== 'Requires Review') {
    console.error('❌ FAIL Case 1: Expected "Requires Review", got:', case1.donationSuitability)
    allPassed = false
  } else {
    console.log('✅ PASS Case 1: Suitability correctly evaluated as "Requires Review"')
  }

  // Confidence should reflect uncertainty (Moderate, NOT High 95%)
  if (case1.confidence >= 0.85) {
    console.error('❌ FAIL Case 1: Confidence is overly high (>=85%):', case1.confidence)
    allPassed = false
  } else {
    console.log('✅ PASS Case 1: Confidence is appropriately calibrated (Moderate, <85%):', Math.round(case1.confidence * 100) + '%')
  }

  // Safety considerations must mention Bacillus cereus / rice risk and elapsed window
  const hasRiceNote = case1.safetyConsiderations.some(c => c.toLowerCase().includes('bacillus') || c.toLowerCase().includes('rice'))
  const hasWindowNote = case1.safetyConsiderations.some(c => c.toLowerCase().includes('elapsed'))
  if (!hasRiceNote || !hasWindowNote) {
    console.error('❌ FAIL Case 1: Missing domain-specific safety notes (rice or elapsed window)')
    allPassed = false
  } else {
    console.log('✅ PASS Case 1: Domain-specific notes present for cooked rice and elapsed window')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE 2: Old bread (~1 month old, ~720 hours)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST CASE 2: 1-Month-Old Bread (~720 hours old) ---')
  const prepTime2 = new Date(2026, 7, 22, 10, 0, 0).getTime() // Aug 22
  const analysisTime2 = new Date(2026, 8, 21, 10, 0, 0).getTime() // Sep 21 (~30 days later)

  const case2 = await runAnalysis(
    {
      foodName: 'Artisan Sourdough',
      category: 'Bakery & Bread',
      quantity: '4',
      unit: 'items',
      estimatedServings: '8',
      preparationDate: new Date(prepTime2).toISOString(),
      availabilityUntil: new Date(analysisTime2 + 24 * 3600 * 1000).toISOString(),
      storageCondition: 'Room Temperature',
      location: 'Bakery Hub',
      additionalInfo: 'Contains gluten',
    },
    analysisTime2,
  )

  console.log('Suitability:', case2.donationSuitability)
  console.log('Confidence:', Math.round(case2.confidence * 100) + '%')
  console.log('Recommendation:', case2.recommendation)

  if (case2.donationSuitability !== 'Not Recommended') {
    console.error('❌ FAIL Case 2: 1-month-old bread should be Not Recommended, got:', case2.donationSuitability)
    allPassed = false
  } else {
    console.log('✅ PASS Case 2: 1-month-old bread is correctly "Not Recommended"')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE 3: Normal recently prepared refrigerated meal (2h old, active window)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST CASE 3: Fresh Refrigerated Meal (2 hours old, 8h remaining) ---')
  const analysisTime3 = Date.now()
  const prepTime3 = analysisTime3 - 2 * 3600 * 1000
  const untilTime3 = analysisTime3 + 8 * 3600 * 1000

  const case3 = await runAnalysis(
    {
      foodName: 'Vegetable Lasagna',
      category: 'Prepared Meals',
      quantity: '20',
      unit: 'portions',
      estimatedServings: '20',
      preparationDate: new Date(prepTime3).toISOString(),
      availabilityUntil: new Date(untilTime3).toISOString(),
      storageCondition: 'Refrigerated',
      location: 'Community Kitchen East',
      additionalInfo: 'Vegetarian, contains dairy and gluten. Chilled immediately after baking.',
    },
    analysisTime3,
  )

  console.log('Suitability:', case3.donationSuitability)
  console.log('Priority:', case3.priority)
  console.log('Confidence:', Math.round(case3.confidence * 100) + '%')
  console.log('Recommendation:', case3.recommendation)

  if (case3.donationSuitability !== 'Suitable') {
    console.error('❌ FAIL Case 3: Fresh refrigerated meal should be "Suitable", got:', case3.donationSuitability)
    allPassed = false
  } else {
    console.log('✅ PASS Case 3: Fresh refrigerated meal is correctly "Suitable"')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE 4: Fresh item with elapsed availability window
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST CASE 4: Fresh item with elapsed availability window ---')
  const analysisTime4 = Date.now()
  const prepTime4 = analysisTime4 - 3 * 3600 * 1000 // 3h old
  const untilTime4 = analysisTime4 - 1 * 3600 * 1000 // elapsed 1h ago

  const case4 = await runAnalysis(
    {
      foodName: 'Fresh Fruit Medley',
      category: 'Fresh Produce',
      quantity: '10',
      unit: 'boxes',
      estimatedServings: '20',
      preparationDate: new Date(prepTime4).toISOString(),
      availabilityUntil: new Date(untilTime4).toISOString(),
      storageCondition: 'Refrigerated',
      location: 'Farmers Market',
      additionalInfo: 'Clean, washed fruit.',
    },
    analysisTime4,
  )

  console.log('Suitability:', case4.donationSuitability)
  console.log('Shelf life:', case4.estimatedShelfLife)
  console.log('Recommendation:', case4.recommendation)

  if (case4.donationSuitability !== 'Requires Review') {
    console.error('❌ FAIL Case 4: Fresh item with elapsed window should be "Requires Review", got:', case4.donationSuitability)
    allPassed = false
  } else {
    console.log('✅ PASS Case 4: Item with elapsed window is correctly "Requires Review"')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE 5: Missing ingredient / allergen information on Prepared Meal
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST CASE 5: Fresh Prepared Meal with missing allergen/ingredient info ---')
  const analysisTime5 = Date.now()
  const prepTime5 = analysisTime5 - 2 * 3600 * 1000
  const untilTime5 = analysisTime5 + 10 * 3600 * 1000

  const case5 = await runAnalysis(
    {
      foodName: 'Pasta Bolognese',
      category: 'Prepared Meals',
      quantity: '15',
      unit: 'portions',
      estimatedServings: '15',
      preparationDate: new Date(prepTime5).toISOString(),
      availabilityUntil: new Date(untilTime5).toISOString(),
      storageCondition: 'Refrigerated',
      location: 'Downtown Bistro',
      additionalInfo: '', // missing ingredient/allergen info
    },
    analysisTime5,
  )

  console.log('Suitability:', case5.donationSuitability)
  console.log('Safety considerations:', case5.safetyConsiderations)

  // Must NOT be "Not Recommended" (missing notes does not prove food is unsafe)
  // Should be "Suitable with Conditions" (condition: check allergens)
  if (case5.donationSuitability !== 'Suitable with Conditions') {
    console.error('❌ FAIL Case 5: Missing allergen info should yield "Suitable with Conditions", got:', case5.donationSuitability)
    allPassed = false
  } else {
    console.log('✅ PASS Case 5: Missing allergen info correctly yielded "Suitable with Conditions"')
  }

  const hasAllergenWarning = case5.safetyConsiderations.some(c => c.toLowerCase().includes('allergen') || c.toLowerCase().includes('ingredient'))
  if (!hasAllergenWarning) {
    console.error('❌ FAIL Case 5: Safety considerations should flag missing allergen/ingredient info')
    allPassed = false
  } else {
    console.log('✅ PASS Case 5: Safety considerations explicitly flag missing allergen/ingredient declaration')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE 6: Temperature abuse (Prepared meal stored at Room Temp for 5h)
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST CASE 6: Prepared Meal stored at Room Temperature for 5 hours ---')
  const analysisTime6 = Date.now()
  const prepTime6 = analysisTime6 - 5 * 3600 * 1000

  const case6 = await runAnalysis(
    {
      foodName: 'Chicken Biryani',
      category: 'Prepared Meals',
      quantity: '10',
      unit: 'portions',
      estimatedServings: '10',
      preparationDate: new Date(prepTime6).toISOString(),
      availabilityUntil: new Date(analysisTime6 + 2 * 3600 * 1000).toISOString(),
      storageCondition: 'Room Temperature',
      location: 'Catering Hall',
      additionalInfo: '',
    },
    analysisTime6,
  )

  console.log('Suitability:', case6.donationSuitability)
  console.log('Safety considerations:', case6.safetyConsiderations)

  if (case6.donationSuitability !== 'Not Recommended') {
    console.error('❌ FAIL Case 6: 5-hour room-temp cooked meal should be "Not Recommended", got:', case6.donationSuitability)
    allPassed = false
  } else {
    console.log('✅ PASS Case 6: Prepared meal held at room temperature >4h is correctly "Not Recommended"')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n=================================================================')
  if (allPassed) {
    console.log('🎉 ALL 6 COMPREHENSIVE ANALYZER TEST CASES PASSED PERFECTLY!')
  } else {
    console.error('❌ SOME TESTS FAILED!')
    process.exit(1)
  }
  console.log('=================================================================\n')
}

runAllTests().catch((err) => {
  console.error('Error running tests:', err)
  process.exit(1)
})
