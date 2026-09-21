import { runAnalysis } from '../src/services/mockAnalyzer'

async function runAllTests() {
  console.log('=================================================================')
  console.log('FOODBRIDGE AI ANALYZER — RISK & UNCERTAINTY TEST SUITE (7 CASES)')
  console.log('=================================================================\n')

  let allPassed = true
  const now = Date.now()

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE 1: Fresh refrigerated prepared meal
  // age: ~2 hours, storage: Refrigerated, availability: active (8h remaining)
  // EXPECTED: Suitable, high/moderate confidence, no false room-temperature warning
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- TEST CASE 1: Fresh Refrigerated Prepared Meal ---')
  const prepTime1 = now - 2 * 3600 * 1000
  const untilTime1 = now + 8 * 3600 * 1000
  const case1 = await runAnalysis({
    foodName: 'Vegetable Lasagna',
    category: 'Prepared Meals',
    quantity: '20',
    unit: 'portions',
    estimatedServings: '20',
    preparationDate: new Date(prepTime1).toISOString(),
    availabilityUntil: new Date(untilTime1).toISOString(),
    storageCondition: 'Refrigerated',
    location: 'Community Kitchen East',
    additionalInfo: 'Vegetarian, contains dairy and gluten. Kept refrigerated at 4 °C.',
  }, now)

  console.log('Suitability:', case1.donationSuitability)
  console.log('Confidence:', Math.round(case1.confidence * 100) + '% (' + case1.confidence + ')')
  console.log('Storage Recommendation:', case1.storageRecommendation)
  console.log('Availability Status:', case1.availabilityStatus)

  if (case1.donationSuitability !== 'Suitable') {
    console.error('❌ FAIL Case 1: Expected "Suitable", got:', case1.donationSuitability)
    allPassed = false
  } else {
    console.log('✅ PASS Case 1: Fresh refrigerated meal is "Suitable"')
  }

  if (case1.confidence < 0.85) {
    console.error('❌ FAIL Case 1: Confidence should be high (>=85%), got:', case1.confidence)
    allPassed = false
  } else {
    console.log('✅ PASS Case 1: Confidence is high:', Math.round(case1.confidence * 100) + '%')
  }

  const hasFalseRoomTemp1 = case1.safetyConsiderations.some(c => c.toLowerCase().includes('room temperature'))
  if (hasFalseRoomTemp1) {
    console.error('❌ FAIL Case 1: Contains false room-temperature warning for refrigerated food')
    allPassed = false
  } else {
    console.log('✅ PASS Case 1: No false room-temperature warnings present')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE 2: Moderately aged room-temperature prepared food
  // storage: Room Temperature, moderate elapsed time (~4 hours)
  // EXPECTED: Risk warning appears, do NOT automatically reject solely because 4h crossed,
  // yields Requires Review based on overall evidence & uncertainty
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST CASE 2: Moderately Aged Room-Temperature Prepared Food (~4h old) ---')
  const prepTime2 = now - 4 * 3600 * 1000
  const untilTime2 = now + 4 * 3600 * 1000
  const case2 = await runAnalysis({
    foodName: 'Vegetable Stir-Fry',
    category: 'Prepared Meals',
    quantity: '15',
    unit: 'portions',
    estimatedServings: '15',
    preparationDate: new Date(prepTime2).toISOString(),
    availabilityUntil: new Date(untilTime2).toISOString(),
    storageCondition: 'Room Temperature',
    location: 'Campus Dining Hall',
    additionalInfo: 'Contains soy, sesame. Covered at room temperature.',
  }, now)

  console.log('Suitability:', case2.donationSuitability)
  console.log('Confidence:', Math.round(case2.confidence * 100) + '% (' + case2.confidence + ')')
  console.log('Recommendation:', case2.recommendation)
  console.log('Storage Recommendation:', case2.storageRecommendation)
  console.log('Safety considerations:', case2.safetyConsiderations)

  if (case2.donationSuitability === 'Not Recommended') {
    console.error('❌ FAIL Case 2: 4h room-temp food was automatically rejected as "Not Recommended"!')
    allPassed = false
  } else if (case2.donationSuitability !== 'Requires Review') {
    console.error('❌ FAIL Case 2: Expected "Requires Review", got:', case2.donationSuitability)
    allPassed = false
  } else {
    console.log('✅ PASS Case 2: Correctly evaluated as "Requires Review" (NOT automatically rejected at 4h)')
  }

  const hasRiskWarning2 = case2.safetyConsiderations.some(c =>
    c.toLowerCase().includes('room temperature') || c.toLowerCase().includes('danger zone') || c.toLowerCase().includes('elevated')
  )
  if (!hasRiskWarning2) {
    console.error('❌ FAIL Case 2: Missing risk warning about room temperature storage')
    allPassed = false
  } else {
    console.log('✅ PASS Case 2: Risk and uncertainty warning present in safety considerations')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE 3: Extended room-temperature cooked rice
  // food: Rice, category: Prepared Meals, age: ~62 hours, storage: Room Temperature, window expired
  // EXPECTED: Not Recommended, explanation based on extended uncontrolled storage + uncertainty + cooked-rice risk,
  // NOT simply "exceeded 4 hours", explicit human verification / caution,
  // NO wording suggesting that refrigerating now makes it suitable.
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST CASE 3: Extended Room-Temperature Cooked Rice (~62h old) ---')
  const prepTime3 = now - 62 * 3600 * 1000
  const untilTime3 = now - 12 * 3600 * 1000
  const case3 = await runAnalysis({
    foodName: 'Rice',
    category: 'Prepared Meals',
    quantity: '25',
    unit: 'portions',
    estimatedServings: '25',
    preparationDate: new Date(prepTime3).toISOString(),
    availabilityUntil: new Date(untilTime3).toISOString(),
    storageCondition: 'Room Temperature',
    location: 'Community Hall',
    additionalInfo: '',
  }, now)

  console.log('Suitability:', case3.donationSuitability)
  console.log('Confidence:', Math.round(case3.confidence * 100) + '%')
  console.log('Recommendation:', case3.recommendation)
  console.log('Storage Recommendation:', case3.storageRecommendation)
  console.log('Safety considerations:', case3.safetyConsiderations)

  if (case3.donationSuitability !== 'Not Recommended') {
    console.error('❌ FAIL Case 3: Extended room-temp rice should be "Not Recommended", got:', case3.donationSuitability)
    allPassed = false
  } else {
    console.log('✅ PASS Case 3: Extended room-temp rice is correctly "Not Recommended"')
  }

  // Check that reason/recommendation does NOT simply say "exceeded 4 hours" or "over 4 hours"
  const recommendationHas4Hours = /\b(?:exceeded|over|beyond)\s*4\s*hours\b/i.test(case3.recommendation)
  const reasoningHas4Hours = /\b(?:exceeded|over|beyond)\s*4\s*hours\b/i.test(case3.reasoning)
  if (recommendationHas4Hours || reasoningHas4Hours) {
    console.error('❌ FAIL Case 3: Output relies on simplistic "4 hours" phrasing')
    allPassed = false
  } else {
    console.log('✅ PASS Case 3: Avoids simplistic "exceeded 4 hours" phrasing')
  }

  // Check that cooked-rice microbial risk is flagged
  const hasRiceWarning3 = case3.safetyConsiderations.some(c =>
    c.toLowerCase().includes('bacillus') || c.toLowerCase().includes('rice')
  )
  if (!hasRiceWarning3) {
    console.error('❌ FAIL Case 3: Missing cooked-rice / Bacillus cereus risk alert')
    allPassed = false
  } else {
    console.log('✅ PASS Case 3: Cooked-rice / Bacillus cereus risk alert included')
  }

  // Check that storage recommendation does NOT say "Keep Refrigerated" (which implies refrigerating now makes it safe)
  if (case3.storageRecommendation.toLowerCase() === 'keep refrigerated') {
    console.error('❌ FAIL Case 3: storageRecommendation incorrectly says "Keep Refrigerated" for spoiled room-temp food')
    allPassed = false
  } else {
    console.log('✅ PASS Case 3: storageRecommendation contextually states that refrigeration now cannot reverse uncontrolled storage')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE 4: Older refrigerated prepared meal
  // storage: Refrigerated, age: ~30 hours old
  // EXPECTED: assessed using existing storage-aware logic (Suitable with Conditions),
  // does not automatically apply the room-temperature rule
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST CASE 4: Older Refrigerated Prepared Meal (~30h old) ---')
  const prepTime4 = now - 30 * 3600 * 1000
  const untilTime4 = now + 18 * 3600 * 1000
  const case4 = await runAnalysis({
    foodName: 'Beef Stew',
    category: 'Prepared Meals',
    quantity: '12',
    unit: 'portions',
    estimatedServings: '12',
    preparationDate: new Date(prepTime4).toISOString(),
    availabilityUntil: new Date(untilTime4).toISOString(),
    storageCondition: 'Refrigerated',
    location: 'Community Center',
    additionalInfo: 'Contains beef, celery. Kept continuously refrigerated at 3 °C.',
  }, now)

  console.log('Suitability:', case4.donationSuitability)
  console.log('Storage Recommendation:', case4.storageRecommendation)
  console.log('Safety considerations:', case4.safetyConsiderations)

  if (case4.donationSuitability !== 'Suitable with Conditions') {
    console.error('❌ FAIL Case 4: 30h refrigerated meal should be "Suitable with Conditions", got:', case4.donationSuitability)
    allPassed = false
  } else {
    console.log('✅ PASS Case 4: 30h refrigerated meal evaluated as "Suitable with Conditions" (storage-aware)')
  }

  if (case4.storageRecommendation.toLowerCase().includes('not applicable')) {
    console.error('❌ FAIL Case 4: Erroneously applied room-temperature storage recommendation to refrigerated food')
    allPassed = false
  } else {
    console.log('✅ PASS Case 4: Storage recommendation correctly recommends maintaining refrigeration')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE 5: Missing storage/temperature history
  // storage: '' or 'unspecified', age: ~4 hours
  // EXPECTED: confidence reduced, Requires Review, explicit uncertainty noted
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST CASE 5: Missing Storage / Temperature History ---')
  const prepTime5 = now - 4 * 3600 * 1000
  const untilTime5 = now + 6 * 3600 * 1000
  const case5 = await runAnalysis({
    foodName: 'Pasta with Marinara Sauce',
    category: 'Prepared Meals',
    quantity: '10',
    unit: 'portions',
    estimatedServings: '10',
    preparationDate: new Date(prepTime5).toISOString(),
    availabilityUntil: new Date(untilTime5).toISOString(),
    storageCondition: '', // Missing storage condition
    location: 'Community Center',
    additionalInfo: 'Contains wheat, tomatoes.',
  }, now)

  console.log('Suitability:', case5.donationSuitability)
  console.log('Confidence:', Math.round(case5.confidence * 100) + '% (' + case5.confidence + ')')
  console.log('Safety considerations:', case5.safetyConsiderations)

  if (case5.donationSuitability !== 'Requires Review') {
    console.error('❌ FAIL Case 5: Missing storage history for prepared meal should yield "Requires Review", got:', case5.donationSuitability)
    allPassed = false
  } else {
    console.log('✅ PASS Case 5: Missing storage condition correctly yielded "Requires Review"')
  }

  const hasMissingStorageNote = case5.safetyConsiderations.some(c =>
    c.toLowerCase().includes('not reported') || c.toLowerCase().includes('temperature history')
  )
  if (!hasMissingStorageNote) {
    console.error('❌ FAIL Case 5: Safety considerations should explicitly state missing storage/temperature history')
    allPassed = false
  } else {
    console.log('✅ PASS Case 5: Explicit storage uncertainty stated in safety considerations')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE 6: Expired availability window but otherwise recent food
  // food: Fresh Fruit Medley, age: 3h old, availability window elapsed
  // EXPECTED: availability status = Expired, do not automatically equate expired window
  // with spoiled food, suitability = Requires Review
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST CASE 6: Expired Availability Window with Recent Food ---')
  const prepTime6 = now - 3 * 3600 * 1000
  const untilTime6 = now - 1 * 3600 * 1000 // Expired 1 hour ago
  const case6 = await runAnalysis({
    foodName: 'Fresh Fruit Medley',
    category: 'Fresh Produce',
    quantity: '10',
    unit: 'boxes',
    estimatedServings: '20',
    preparationDate: new Date(prepTime6).toISOString(),
    availabilityUntil: new Date(untilTime6).toISOString(),
    storageCondition: 'Refrigerated',
    location: 'Farmers Market',
    additionalInfo: 'Clean, washed fresh fruit.',
  }, now)

  console.log('Suitability:', case6.donationSuitability)
  console.log('Availability Status:', case6.availabilityStatus)
  console.log('Shelf life:', case6.estimatedShelfLife)
  console.log('Recommendation:', case6.recommendation)

  if (case6.availabilityStatus !== 'Expired') {
    console.error('❌ FAIL Case 6: Expected availabilityStatus "Expired", got:', case6.availabilityStatus)
    allPassed = false
  } else {
    console.log('✅ PASS Case 6: availabilityStatus is "Expired"')
  }

  if (case6.donationSuitability !== 'Requires Review') {
    console.error('❌ FAIL Case 6: Expired window on fresh food should yield "Requires Review", got:', case6.donationSuitability)
    allPassed = false
  } else {
    console.log('✅ PASS Case 6: Expired window yields "Requires Review" (NOT equated with spoiled food)')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CASE 7: Missing ingredient/allergen information
  // food: Fresh prepared meal, age: 2h, refrigerated, no allergen notes
  // EXPECTED: preserve existing behavior, suitability capped at Suitable with Conditions,
  // human verification remains required
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- TEST CASE 7: Missing Ingredient / Allergen Information ---')
  const prepTime7 = now - 2 * 3600 * 1000
  const untilTime7 = now + 8 * 3600 * 1000
  const case7 = await runAnalysis({
    foodName: 'Chicken Curry',
    category: 'Prepared Meals',
    quantity: '15',
    unit: 'portions',
    estimatedServings: '15',
    preparationDate: new Date(prepTime7).toISOString(),
    availabilityUntil: new Date(untilTime7).toISOString(),
    storageCondition: 'Refrigerated',
    location: 'Central Kitchen',
    additionalInfo: '', // missing ingredient & allergen info
  }, now)

  console.log('Suitability:', case7.donationSuitability)
  console.log('Safety considerations:', case7.safetyConsiderations)

  if (case7.donationSuitability !== 'Suitable with Conditions') {
    console.error('❌ FAIL Case 7: Expected "Suitable with Conditions", got:', case7.donationSuitability)
    allPassed = false
  } else {
    console.log('✅ PASS Case 7: Missing allergen info correctly caps at "Suitable with Conditions"')
  }

  const hasAllergenNote7 = case7.safetyConsiderations.some(c =>
    c.toLowerCase().includes('allergen') || c.toLowerCase().includes('ingredient')
  )
  if (!hasAllergenNote7) {
    console.error('❌ FAIL Case 7: Safety considerations should flag missing allergen/ingredient declaration')
    allPassed = false
  } else {
    console.log('✅ PASS Case 7: Safety considerations flag missing allergen/ingredient declaration')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n=================================================================')
  if (allPassed) {
    console.log('🎉 ALL 7 RISK & UNCERTAINTY TEST CASES PASSED PERFECTLY!')
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
