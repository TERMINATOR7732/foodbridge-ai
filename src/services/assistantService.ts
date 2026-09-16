/**
 * assistantService.ts — Natural Conversational Assistant for FoodBridge AI
 *
 * Provides deterministic, context-aware conversational responses for the
 * FoodBridge AI Assistant without requiring external APIs or network connectivity.
 *
 * Reads session context (active analysis and active donation) when relevant
 * to provide grounded, helpful answers.
 */

import { getActiveDonation } from './donationStore'
import type { FoodAnalysisResult, ActiveDonation } from '../types'

export type AssistantIntent =
  | 'greeting'
  | 'food_safety_general'
  | 'food_safety_smell_spoilage'
  | 'food_safety_cooked_food'
  | 'food_safety_temperature_storage'
  | 'food_safety_bread_age'
  | 'donation_howto'
  | 'matching_explanation'
  | 'donation_status'
  | 'cancellation'
  | 'sustainability'
  | 'impact_dashboard'
  | 'app_help'
  | 'thanks'
  | 'clarification'
  | 'unknown'

interface SessionContext {
  analysis: FoodAnalysisResult | null
  donation: ActiveDonation | null
}

function getSessionContext(): SessionContext {
  let analysis: FoodAnalysisResult | null = null
  try {
    const raw = sessionStorage.getItem('analysisResult')
    if (raw) analysis = JSON.parse(raw) as FoodAnalysisResult
  } catch {
    analysis = null
  }

  const donation = getActiveDonation()

  return { analysis, donation }
}

/**
 * Detect the primary intent from the user message.
 */
export function detectIntent(text: string): AssistantIntent {
  const t = text.toLowerCase().trim()

  // 1. Greetings
  if (/^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|howdy)\b/i.test(t)) {
    return 'greeting'
  }

  // 2. Thanks / Gratitude
  if (/\b(thanks|thank\s*you|thx|cheers|appreciate\s*it|grateful)\b/i.test(t)) {
    return 'thanks'
  }

  // 3. Clarification / "I don't understand"
  if (/\b(i don'?t understand|explain that|can you clarify|what do you mean|tell me more|unclear)\b/i.test(t)) {
    return 'clarification'
  }

  // 4. Food Safety — specific spoilage, odor, mold
  if (/\b(smell|odor|odour|strange|bad|funny|sour|mold|mould|slimy|discolor|discolour|off|rotten|spoiled|spoilage)\b/i.test(t)) {
    return 'food_safety_smell_spoilage'
  }

  // 5. Food Safety — temperature abuse, left outside / unrefrigerated
  if (/\b(left\s*out|left\s*outside|unrefrigerated|warm|room\s*temp|forgot.*fridge|sitting\s*out)\b/i.test(t)) {
    return 'food_safety_temperature_storage'
  }

  // 6. Food Safety — bread age / stale bread
  if (/\b(\d+\s*day[s]?\s*old\s*bread|bread.*old|stale\s*bread|old\s*bread|bread.*safe|bread.*okay|bread.*ok)\b/i.test(t)) {
    return 'food_safety_bread_age'
  }

  // 7. Food Safety — cooked food / prepared meals
  if (/\b(cooked\s*food|cooked\s*meal|leftover[s]?|prepared\s*meal|home\s*cooked|homemade|catering)\b/i.test(t)) {
    return 'food_safety_cooked_food'
  }

  // 8. Cancellation
  if (/\b(cancel|cancellation|stop\s*donation|withdraw)\b/i.test(t)) {
    return 'cancellation'
  }

  // 9. Donation Status & Lifecycle details
  if (
    /\b(accepted\s*mean|in\s*transit\s*mean|what\s*happens\s*after|status|where\s*is\s*my\s*donation|track\s*donation|lifecycle)\b/i.test(t) ||
    t.includes('what happens after i donate')
  ) {
    return 'donation_status'
  }

  // 10. Community Matching
  if (/\b(matching|match|who\s*gets|recipient|organi[sz]ation|match\s*score|how\s*do\s*you\s*match|how\s*does\s*matching\s*work)\b/i.test(t)) {
    return 'matching_explanation'
  }

  // 11. Sustainability & Environmental Impact
  if (/\b(sustainability|food\s*waste|environment(al)?|greenhouse|methane|carbon|hunger|landfill|why\s*(should\s*i\s*)?donate)\b/i.test(t)) {
    return 'sustainability'
  }

  // 12. Impact Dashboard & Metrics
  if (/\b(impact\s*dashboard|metrics|statistics|how\s*much\s*food|numbers)\b/i.test(t)) {
    return 'impact_dashboard'
  }

  // 13. Donation How-To & Navigation
  if (/\b(how\s*(do\s*i|can\s*i|to)\s*donate|donate\s*food|steps\s*to\s*donate|what\s*info|what\s*information|where.*analy[sz]e)\b/i.test(t)) {
    return 'donation_howto'
  }

  // 14. Food Safety — general questions ("Is this safe?", "Can I donate this?", "getting old")
  if (
    /\b(safe|safety|can\s*i\s*donate|is\s*it\s*safe|getting\s*old|suitable|edible)\b/i.test(t) ||
    t.includes('can i donate this food') ||
    t.includes('is this food safe')
  ) {
    return 'food_safety_general'
  }

  // 15. App Help & Overview
  if (/\b(what\s*can\s*(i|you)\s*do|how\s*does\s*this\s*app\s*work|features|help\s*me\s*with|guide|overview)\b/i.test(t)) {
    return 'app_help'
  }

  return 'unknown'
}

/**
 * Generate a natural, helpful response based on intent and session context.
 */
export function generateAssistantResponse(userMessage: string): string {
  const intent = detectIntent(userMessage)
  const { analysis, donation } = getSessionContext()

  switch (intent) {
    case 'greeting': {
      let extra = ''
      if (donation) {
        extra = ` You currently have an active donation for ${donation.foodName} (${donation.status}).`
      } else if (analysis) {
        extra = ` I also see you have an assessment for ${analysis.foodName} (${analysis.donationSuitability}).`
      }
      return `Hello! I'm your FoodBridge guide.${extra} I can help you understand food safety guidelines, how community matching works, donation tracking, or our sustainability goals. How can I assist you today?`
    }

    case 'thanks': {
      return `You're very welcome! If you have any other questions about food safety, donating surplus food, or how FoodBridge works, feel free to ask anytime.`
    }

    case 'clarification': {
      return `I want to make sure this is completely clear. FoodBridge connects surplus food with local organisations in four clear steps: you submit details on the Donate Food page, review the safety analysis, choose a community match, and track delivery on the Donation Status page.

Would you like me to clarify a specific step, such as safety guidelines or how matching works?`
    }

    case 'food_safety_smell_spoilage': {
      return `If food smells strange, shows discoloration, unusual texture, or signs of mold, it should not be donated.

For community redistribution, food must be wholesome, intact, and safe to consume. When there is any sign of spoilage, the safest course of action is to compost or discard it rather than offering it for redistribution. Food safety always comes first.`
    }

    case 'food_safety_temperature_storage': {
      return `Perishable foods—especially prepared meals, cooked meats, and dairy—left at room temperature for extended periods enter the temperature danger zone where bacteria grow quickly.

As a general rule, perishable cooked food left out for more than 2 hours should not be redistributed. To ensure safety, cold items should remain refrigerated at or below 5 °C until handover, and frozen items must remain frozen.`
    }

    case 'food_safety_bread_age': {
      return `Fresh bread is best redistributed within 24 to 72 hours of baking.

Bread that is 1 or 2 days old is typically suitable if stored in clean, sealed packaging at room temperature. However, as bread passes 3 to 4 days it becomes stale, and bread exceeding 7 days or showing any mold is marked as Not Recommended by FoodBridge.

If you have bread to donate, you can enter its preparation date on the Donate Food page to receive an advisory evaluation.`
    }

    case 'food_safety_cooked_food': {
      return `Yes, prepared and cooked meals can be donated through FoodBridge, provided strict safety guidelines are followed:

- Meals should be cooled and refrigerated promptly after preparation.
- Food must be stored in clean, food-safe, covered containers.
- Clearly note the preparation time, ingredients, and any allergens (like gluten, nuts, or dairy).
- Prepared meals should be redistributed on the same day whenever possible.

FoodBridge evaluates the time window and storage method before suggesting community recipients.`
    }

    case 'food_safety_general': {
      if (analysis) {
        return `Based on your submitted details for **${analysis.foodName}** (${analysis.category}):

- **Suitability:** ${analysis.donationSuitability}
- **Priority:** ${analysis.priority}
- **Guidance:** ${analysis.recommendation}

${
  analysis.donationSuitability === 'Not Recommended'
    ? 'Because this donation was evaluated as Not Recommended, FoodBridge blocks it from community matching to ensure food safety.'
    : 'You can proceed to Community Matching to view suitable organisations for this donation.'
}

Please remember that all FoodBridge assessments are advisory and require coordinator verification before handover.`
      }

      return `FoodBridge assesses whether surplus food is suitable for redistribution by checking the food category, preparation time, remaining availability window, and storage conditions.

Based on the information provided in the donation form:
- Fresh, properly stored items within safe use windows are classified as Suitable.
- Items near their window or with special handling needs are marked as Suitable with Conditions or Requires Review.
- Stale, expired, or improperly stored foods are flagged as Not Recommended and blocked from matching.

To check your specific food, start on the **Donate Food** page.`
    }

    case 'matching_explanation': {
      if (analysis) {
        return `For your current analysis of **${analysis.foodName}**, FoodBridge matches community requests using six key factors:

1. **Category compatibility:** Finding organisations that requested ${analysis.category}.
2. **Quantity alignment:** Ensuring your ${analysis.quantity} meets or partially satisfies their stated need.
3. **Availability & status:** Connecting only with organisations actively accepting donations.
4. **Location proximity:** Minimising transit time by finding nearby recipients in or around ${analysis.foodName.includes('District') ? 'your area' : 'the local district'}.
5. **Urgency:** Prioritising critical and high-urgency requests.
6. **Safety gate:** Confirming the donation meets safety criteria.

You can select and review any recommended match on the **Community Matching** page.`
      }

      return `FoodBridge looks at several factors when finding a potential recipient for surplus food:

- **Category:** Compatible with what the organisation specifically requested (e.g. prepared meals, fresh produce, bakery).
- **Quantity:** How well available servings match the organisation's daily need.
- **Availability:** Only matching organisations with open or partially matched requests.
- **Location:** Prioritising nearby recipients to reduce transit time and maintain freshness.
- **Urgency:** Giving higher priority to critical or time-sensitive community needs.
- **Safety hard gate:** Donations marked as Not Recommended are never matched.

All matches are recommendations and require human approval before any transfer occurs.`
    }

    case 'donation_status': {
      if (donation) {
        const stepExpl: Record<string, string> = {
          Matched: 'A community organisation has been recommended and is awaiting acceptance.',
          Accepted: 'The recipient organisation has confirmed they can receive the food. Preparation for collection or transit is underway.',
          'In Transit': 'The donation is currently en route to the recipient organisation.',
          Completed: 'The donation was delivered and received safely. Thank you for supporting the community!',
          Cancelled: 'This donation was cancelled and removed from active redistribution.',
        }

        return `Your current donation of **${donation.foodName}** for **${donation.organizationName}** is currently in status: **${donation.status}**.

${stepExpl[donation.status] ?? ''}

You can view full details or advance the simulation anytime on the **Donation Status** page.`
      }

      return `Once a match is confirmed, FoodBridge tracks donations through four sequential stages:

1. **Matched:** A community organisation has been selected; awaiting confirmation.
2. **Accepted:** The recipient has accepted the donation and prepared storage.
3. **In Transit:** The food is en route to the community location.
4. **Completed:** The food has been safely handed over.

Donations can be cancelled while in the Matched or Accepted stage. The system prevents invalid backwards steps to maintain reliable coordination.`
    }

    case 'cancellation': {
      if (donation && (donation.status === 'Matched' || donation.status === 'Accepted')) {
        return `Yes, your active donation for **${donation.foodName}** can be cancelled right now because it is in the **${donation.status}** stage.

To cancel:
1. Open the **Donation Status** page.
2. Click **Cancel Donation**.
3. Confirm in the dialog.

Once food is marked as In Transit or Completed, cancellation is no longer possible.`
      }

      return `Donations can be cancelled while they are in the **Matched** or **Accepted** stages directly from the **Donation Status** page.

When you click 'Cancel Donation', a confirmation box appears to prevent accidental cancellations. Once a donation reaches **In Transit** or **Completed**, cancellation is disabled to ensure logistics integrity.`
    }

    case 'sustainability': {
      return `FoodBridge supports environmental and social sustainability by keeping wholesome surplus food out of landfills.

- **Reduced Methane Emissions:** When organic food waste decomposes in landfills, it releases methane, a potent greenhouse gas. Redirecting surplus food prevents these emissions.
- **Resource Conservation:** Every meal rescued conserves the water, land, and energy used in growing, packaging, and transporting it.
- **Community Nutrition:** Surplus food from bakeries, kitchens, and donors directly supports local families, shelters, and community kitchens.`
    }

    case 'impact_dashboard': {
      return `The **Impact Dashboard** provides a simulated overview of collective redistribution efforts:

- Estimated meals potentially supported
- Total kilograms of food redirected
- Weekly donation trends and category distributions
- Community match success rates

You can inspect these metrics anytime on the **Impact** page in the main navigation.`
    }

    case 'donation_howto': {
      return `Donating surplus food through FoodBridge takes four straightforward steps:

1. **Enter Details:** Go to **Donate Food** and provide the food name, category, quantity, preparation date, availability window, and storage conditions.
2. **Review Analysis:** FoodBridge assesses shelf life, suitability, and handling guidance.
3. **Choose a Match:** On **Community Matching**, review recommended recipients and select the best fit.
4. **Confirm & Track:** Confirm the match and follow the donation lifecycle on **Donation Status** until completion.`
    }

    case 'app_help': {
      return `FoodBridge AI is a community food redistribution platform. Here is how you can use it:

- **Donate Food:** Enter surplus food details to generate an advisory safety assessment.
- **Food Analysis:** Review estimated shelf life, storage needs, and suitability before redistributing.
- **Community Matching:** Connect with verified local organisations based on category, quantity, and urgency.
- **Donation Status:** Follow confirmed donations from acceptance to delivery.
- **Impact:** Explore simulated environmental and community metrics.

What area would you like help with?`
    }

    case 'unknown':
    default: {
      return `I'm not sure I understood that completely. I can help you with:

- Assessing food safety and storage requirements
- Steps to donate surplus food
- How community matching and scoring works
- Checking your current donation status
- The environmental impact of reducing food waste

What would you like to know more about?`
    }
  }
}
