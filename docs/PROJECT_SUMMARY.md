# FoodBridge AI — Presentation Project Summary

**Project Title**: FoodBridge AI  
**Subtitle**: AI-Assisted Food Rescue & Community Redistribution Platform  
**Program Track**: 1M1B AI for Sustainability  
**Target SDGs**: UN SDG 3 (Good Health and Well-Being) & UN SDG 12 (Responsible Consumption and Production)  

---

## 1. Problem
Globally, over 1.3 billion tonnes of edible food are wasted annually, generating significant landfill methane emissions. Simultaneously, community shelters and food pantries struggle with food insecurity. Donors and community groups face three major bottlenecks:
- **Time pressure**: Short consumption windows for surplus food.
- **Safety uncertainty**: Fear of liability or distributing spoiled food.
- **Logistical mismatch**: Difficulty matching specific food quantities, categories, and storage needs to local organisations.

---

## 2. Solution
FoodBridge AI is an intelligent, safety-first web platform that guides donors and community coordinators through a structured redistribution pipeline:
1. **Intake**: Donors enter surplus food details.
2. **Analysis**: AI assesses remaining shelf-life and assigns safety classifications.
3. **Hard Safety Gate**: Unsafe or expired food is blocked from redistribution.
4. **Matching**: Multi-factor scoring connects eligible surplus with suitable local charities.
5. **Tracking**: A transparent lifecycle tracks delivery from handover to completion.
6. **Impact**: Completed donations automatically update platform sustainability metrics.

---

## 3. How AI is Used
FoodBridge AI employs **deterministic, local intelligence**:
- **Food Safety Analyser**: Evaluates food age, temperature requirements, and remaining availability windows against food technology rules.
- **Community Matching Engine**: Computes weighted scores (0–100) across six transparent criteria.
- **Conversational Assistant**: An intent-aware local assistant answering user queries regarding safety, donation tracking, and sustainability without external cloud API calls.

---

## 4. How Safety is Handled
- **Architectural Hard Gate**: Food classified as `Not Recommended` is locked out of community matching and cannot be confirmed.
- **Age Bounds**: Stale food stored beyond category limits is automatically flagged for review or blocked.
- **Advisory Integrity**: Analysis is strictly advisory—the system never makes absolute safety guarantees (`100% safe`), requiring human coordinator verification before distribution.

---

## 5. How Matching Works
Every potential recipient is ranked objectively across six transparent criteria:
1. **Category Compatibility (35 pts)**: Recipient accepts the specific food category.
2. **Quantity Alignment (25 pts)**: Servings meet or partially fulfill recipient stated need.
3. **Availability (15 pts)**: Recipient is currently open to receive donations.
4. **Location Proximity (15 pts)**: Same-district matches minimise transport time.
5. **Urgency Level (10 pts)**: Prioritises emergency and critical community needs.
6. **Safety Pre-Check**: Only eligible, safe food is evaluated.

---

## 6. How Impact is Measured
The platform calculates dynamic sustainability metrics that update when donations reach `Completed`:
- **Meals Potentially Supported**: Cumulative servings redirected to community meals.
- **Food Potentially Redirected**: Kilograms diverted from landfills (calculated via realistic conversion algorithms).
- **Donation Events**: Number of successfully completed food rescue handovers.
- **Successful Matches & Rate**: Ratio of matched community requests to total requests.

*Baseline metrics are clearly labeled as simulated demonstration data.*

---

## 7. UN SDG Alignment
- **Primary — SDG 12: Responsible Consumption and Production (Target 12.3)**: Halving per capita food waste by enabling commercial kitchens, bakeries, and markets to rescue edible surplus before expiration.
- **Secondary — SDG 2: Zero Hunger (Target 2.1)**: Bridging hunger gaps by redirecting wholesome surplus to community shelters and pantries.
- **Supporting — SDG 13: Climate Action (Target 13.3)**: Mitigating greenhouse gases by preventing organic waste from decomposing into methane ($\text{CH}_4$) in municipal landfills.
- **Supporting — SDG 3: Good Health and Well-Being (Target 3.9)**: Preventing foodborne illness through strict algorithmic safety gates and cold-chain compliance.

---

## 8. Technology Stack
- **Frontend**: React 18.2, TypeScript 5.2, Vite 5.0, React Router v6.
- **Design System**: Scoped CSS Modules with custom design tokens.
- **State & Storage**: Client-side HTML5 `sessionStorage` with event-driven reactivity.
- **Dependencies**: Self-contained (zero external APIs, zero paid database requirements).

---

## 9. Responsible AI
- **Human-in-the-Loop**: All recommendations are advisory; coordinators make final decisions.
- **Explainability**: Structured factor chips show exactly why each recommendation was made.
- **Privacy First**: Zero personal identification or tracking collected.

---

## 10. Demonstration Flow
1. **Explore Dashboard**: View baseline impact figures (`1,240` meals, `312 kg`).
2. **Submit Food**: Enter surplus details (e.g. `25 portions Vegetable Curry & Rice`).
3. **Safety Review**: Observe AI-generated shelf-life assessment (`Suitable with Conditions`).
4. **Community Matching**: Review ranked community matches and factor breakdown.
5. **Confirm Match**: Review recipient details and confirm transfer.
6. **Advance Lifecycle**: Step through `Matched` &rarr; `Accepted` &rarr; `In Transit` &rarr; `Completed`.
7. **Verify Dynamic Impact**: Return to Dashboard/Impact to see updated totals (`1,265` meals, `322 kg`, `48` events, `79%` match rate).
8. **Consult Assistant**: Chat with the local AI assistant regarding safety or donation status.

---

## 11. Limitations
- **Demonstration Scope**: Community requests and baseline impact data are simulated for demonstration.
- **Session Scoped**: Data is held in `sessionStorage` and resets on tab closure.
- **Decision Support Only**: Human coordinator inspection remains mandatory before consumption.
