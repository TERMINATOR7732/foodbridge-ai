import { runAnalysis } from '../src/services/mockAnalyzer'

async function reproduce() {
  const prepDate = '2026-09-19T10:00:00'
  const untilDate = '2026-09-19T22:00:00'
  const actualCurrentTime = new Date('2026-09-22T00:53:50').getTime()

  const result = await runAnalysis({
    foodName: 'Rice',
    category: 'Prepared Meals',
    quantity: '25',
    unit: 'portions',
    preparationDate: prepDate,
    availabilityUntil: untilDate,
    storageCondition: 'Room Temperature',
    estimatedServings: '25',
  }, actualCurrentTime)

  console.log('=== REPRODUCTION RESULTS ===')
  console.log('preparationTime:', prepDate)
  console.log('availabilityUntil:', untilDate)
  console.log('actual current time:', new Date(actualCurrentTime).toISOString())
  console.log('analysedAt:', result.analysedAt)
  console.log('assessmentMode:', result.assessmentMode)
  console.log('assessmentBasis:', result.assessmentBasis)
  console.log('foodAgeHours:', result.foodAgeHours)
  console.log('foodAgeAtAssessment:', result.foodAgeAtAssessment)
  console.log('availabilityStatus:', result.availabilityStatus)
  console.log('availabilityWindowHours:', result.availabilityWindowHours)
  console.log('remainingAvailabilityHours:', result.remainingAvailabilityHours)
  console.log('elapsedSinceExpiryHours:', result.elapsedSinceExpiryHours)
  console.log('recommendation:', result.recommendation)
  console.log('estimatedShelfLife:', result.estimatedShelfLife)
}

reproduce()
