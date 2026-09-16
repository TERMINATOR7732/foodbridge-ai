# FoodBridge AI — Executive Presentation Summary

**Project Title**: FoodBridge AI  
**Subtitle**: AI-Assisted Food Rescue & Community Redistribution Platform  
**Program Track**: 1M1B (1 Million Leaders Insights to Action) — AI for Sustainability  
**Target SDGs**: UN SDG 12 (Responsible Consumption & Production), UN SDG 2 (Zero Hunger), UN SDG 13 (Climate Action), UN SDG 3 (Good Health & Well-Being)  

---

## 1. What is FoodBridge AI?
FoodBridge AI is an intelligent sustainability decision-support platform designed to connect commercial food donors (bakeries, restaurants, caterers, markets) with local community food relief organisations. Built on a safety-first architecture, it automates shelf-life evaluation, recipient matching, and donation tracking while ensuring human coordinators retain complete decision authority.

---

## 2. What Problem Does It Solve?
Every year, over 1.3 billion tonnes of edible food are wasted globally, decomposing in landfills to produce potent methane emissions, while millions face daily hunger. Donors and community groups face four critical barriers:
- **Time pressure**: Short remaining consumption windows for perishable food.
- **Safety uncertainty**: Fear of liability or inadvertently distributing spoiled food.
- **Logistical mismatch**: Difficulty aligning specific quantities, dietary types, and storage facilities with recipient capacity.
- **Lack of transparency**: Coordinators lack clear, explainable reasoning for match recommendations.

---

## 3. How Does It Work?
FoodBridge AI provides an automated, human-supervised redistribution pipeline:
1. **Intake**: Donor enters surplus food attributes (category, quantity, preparation timestamp, storage conditions).
2. **Deterministic Safety Triage**: Rule-based engine assesses remaining shelf-life and assigns an advisory suitability tier.
3. **Safety Hard Gate**: Items classified as `Not Recommended` are architecturally blocked from matching and transfer.
4. **Explainable Matching**: Multi-factor scoring ranks candidate community organisations with transparent factor chips.
5. **Coordinator Confirmation**: Human coordinator reviews and confirms the match.
6. **Sequential Lifecycle Tracking**: A 4-stage stepper guides the transfer (`Matched` → `Accepted` → `In Transit` → `Completed`).
7. **Dynamic Impact Metrics**: Completed transfers immediately update session-persisted sustainability metrics.

---

## 4. Where is AI Used?
FoodBridge AI utilizes **deterministic, explainable AI-assisted decision logic** rather than an external cloud LLM:
- **Food Safety Intelligence**: Evaluates food age, temperature bounds, and consumption windows against food technology rules.
- **Community Matching Engine**: Computes explainable compatibility scores (0–100) based on category compatibility, quantity alignment, recipient availability, proximity, and urgency.
- **Conversational Assistant**: A local, intent-aware conversational assistant providing instant answers regarding food safety, procedures, and sustainability without external API calls or latency.

---

## 5. How Does It Contribute to Sustainability?
- **SDG 12: Responsible Consumption & Production (Target 12.3)**: Identifies and redirects commercial edible surplus before it enters municipal waste streams.
- **SDG 2: Zero Hunger (Target 2.1)**: Connects wholesome surplus with community pantries and shelters to relieve hunger.
- **SDG 13: Climate Action (Target 13.3)**: Diverting food from municipal landfills prevents anaerobic decomposition, mitigating methane ($\text{CH}_4$) emissions.
- **SDG 3: Good Health and Well-Being (Target 3.9)**: Protects recipients from foodborne illness via automated safety hard gates.

*All sustainability metrics describe intended, model-level contributions within the simulation.*

---

## 6. What Makes the Architecture Responsible?
> **"FoodBridge AI is a decision-support system, not an autonomous food-safety authority."**

- **Human-in-the-Loop**: All outputs are advisory. A qualified human coordinator must physically inspect food and authorize handovers.
- **No False Certainty**: The platform never claims food is "100% safe" or "guaranteed safe."
- **Algorithmic Explainability**: Matches provide structured factor chips (`Category`, `Quantity`, `Available`, `Location`, `Safety`) showing why each score was assigned.
- **Privacy by Design**: Zero personally identifiable information (PII), phone numbers, or private addresses are collected.
- **Deterministic Reliability**: Zero stochastic hallucinations, zero external API keys, zero token fees, and offline resilience.

---

## 7. How Does Matching Score?
Candidates are scored objectively across five factors totaling 100 points:
1. **Category Compatibility (25 pts)**: Recipient accepts the specific food category.
2. **Quantity Alignment (20 pts)**: Available servings meet or partially fulfill recipient capacity.
3. **Availability Match (20 pts)**: Recipient status is `Open` or `Partially Matched` (`Closed` excluded).
4. **Location Proximity (20 pts)**: Same-district matches minimize transit time and emissions.
5. **Urgency Level (15 pts)**: Prioritizes critical and emergency community requests.
* **Safety Pre-Check**: Only food passing the Safety Hard Gate is evaluated.

---

## 8. How Was It Tested?
The platform has been audited and verified across four reproducible test tiers:
- **Build Verification**: `npm run build` (PASS, 0 TypeScript errors, 64 modules transformed).
- **Food Safety & Matching Suite**: `npx tsx scratch/test_suite.ts` (12/12 PASS: bread age, spoilage rules, safety hard gate, recipient exclusion).
- **Dynamic Metrics Suite**: `npx tsx scratch/test_metrics.ts` (10/10 PASS: lifecycle progression, kg parsing, idempotency, multi-donation accumulation).
- **Conversational Assistant Suite**: `npx tsx scratch/test_assistant.ts` (30/30 PASS: intent detection, context awareness, 0 forbidden phrases).
- **Headless Browser CDP Audit**: Full multi-step user journey executed with 0 browser console errors.

---

## 9. What are the Limitations?
- **Demonstration Scope**: Community recipients, requests, and baseline metrics are simulated for demonstration purposes.
- **Client Session Scope**: Data persists in browser `sessionStorage` and resets on tab closure.
- **Decision Support Only**: Physical sensory inspection by human coordinators remains mandatory before distribution.
