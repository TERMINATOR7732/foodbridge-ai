# FoodBridge AI — System Architecture & Flow Diagrams

This document compiles the complete Mermaid diagrams representing the architecture, user flows, safety gates, matching algorithms, lifecycle governance, and intelligence components implemented in FoodBridge AI.

---

## 1. Overall System Architecture

```mermaid
flowchart TD
    subgraph Client Application [React + TypeScript Frontend]
        UI[User Interface Layer]
        Router[React Router DOM]
        Store[donationStore Service]
        Analyzer[aiService / mockAnalyzer]
        Matcher[matchingService Engine]
        Assistant[assistantService]
    end

    subgraph Client Persistence [Browser Storage]
        Session[(HTML5 sessionStorage)]
        Events[[Custom Event Bus: impactMetricsChange]]
    end

    UI --> Router
    Router --> UI
    UI --> Analyzer
    UI --> Matcher
    UI --> Store
    UI --> Assistant

    Store --> Session
    Session --> Store
    Store --> Events
    Events --> UI

    Analyzer -.-> Matcher
    Matcher --> Store
```

---

## 2. End-to-End User Flow

```mermaid
flowchart LR
    A[1. Landing Dashboard] --> B[2. Donate Food Form]
    B --> C[3. AI Food Safety Analysis]
    C --> D{Safety Gate Check}
    D -->|Blocked: Not Recommended| E[Safety Warning<br/>Transfer Prohibited]
    D -->|Eligible: Suitable| F[4. Community Matching]
    F --> G[5. Select & Review Match]
    G --> H[6. Confirm Match]
    H --> I[7. Donation Status Stepper]
    I --> J[8. Step: Accepted]
    J --> K[9. Step: In Transit]
    K --> L[10. Step: Completed]
    L --> M[11. Dynamic Metrics Updated]
    M --> N[12. Impact Dashboard & Dashboard]
```

---

## 3. Food Safety Analysis & Hard Gate Flow

```mermaid
flowchart TD
    A[Food Submission] --> B{Valid Preparation & Expiry Dates?}
    B -->|No: Chronological Error| C[Assign: Requires Review<br/>Reason: Date Validation Failed]
    B -->|Yes| D[Calculate Food Age: now - prepDate]
    D --> E{Age Exceeds Max Safe Boundary?}
    E -->|Yes: e.g. Prepared > 24h, Bakery > 168h| F[Assign: Not Recommended<br/>Reason: Spoilage / Age Boundary]
    E -->|No| G[Calculate Remaining Hours: expiry - now]
    G --> H{Remaining Time <= 0?}
    H -->|Yes| I[Assign: Requires Review<br/>Reason: Expiry Elapsed]
    H -->|No| J[Evaluate Storage & Allergen Profile]
    J --> K[Assign: Suitable / Suitable with Conditions]

    C --> L{Safety Hard Gate}
    F --> L
    I --> L
    K --> L

    L -->|Not Recommended| M[❌ Hard Block: Prohibit Matching]
    L -->|Requires Review| N[⚠ Coordinator Direct Review Required]
    L -->|Suitable / Conditions| O[✅ Eligible for Matching]
```

---

## 4. Multi-Factor Community Matching Flow

```mermaid
flowchart TD
    A[Eligible Food Analysis Result] --> B[Retrieve Open Community Requests]
    B --> C{For Each Candidate Request}
    
    C --> F1[1. Category Compatibility Score: 0 to 35 pts]
    C --> F2[2. Quantity Alignment Score: 5 to 25 pts]
    C --> F3[3. Availability Status Score: 0 to 15 pts]
    C --> F4[4. Location Proximity Score: 0 to 15 pts]
    C --> F5[5. Urgency Level Score: 2 to 10 pts]

    F1 --> Sum[Calculate Total Score: 0 - 100]
    F2 --> Sum
    F3 --> Sum
    F4 --> Sum
    F5 --> Sum

    Sum --> Filter{Availability Match & Score > 0?}
    Filter -->|No| Discard[Exclude from Results]
    Filter -->|Yes| Build[Build MatchRecommendation<br/>Generate Plain-Language Reason<br/>Attach Factor Breakdown Chips]

    Build --> Rank[Sort Candidates Descending by Score]
    Rank --> Output[Present Ranked Matches to Coordinator]
```

---

## 5. Sequential Donation Lifecycle Governance

```mermaid
stateDiagram-v2
    [*] --> Matched: Coordinator Confirms Recommendation
    
    Matched --> Accepted: Recipient Confirms Readiness
    Matched --> Cancelled: Coordinator Cancels (Confirmed)
    
    Accepted --> InTransit: Food Dispatched by Courier/Donor
    Accepted --> Cancelled: Coordinator Cancels (Confirmed)
    
    InTransit --> Completed: Recipient Confirms Receipt
    
    Completed --> [*]: Terminal State (Locked)
    Cancelled --> [*]: Terminal State (Locked)
```

---

## 6. Dynamic Impact Metrics Accumulation Flow

```mermaid
flowchart TD
    A[Donation Status Transition] --> B{New Status == Completed?}
    B -->|No: Matched / Accepted / In Transit / Cancelled| C[No Contribution to Completed Metrics]
    B -->|Yes| D[Store in sessionStorage: completedDonations]
    D --> E[Deduplicate Completed Donations by ID]
    E --> F[getImpactMetrics Computation]

    F --> G[Meals Supported: Baseline 1,240 + Sum Servings]
    F --> H[Food Redirected: Baseline 312 kg + Sum parseKg]
    F --> I[Donation Events: Baseline 47 + Count Completed]
    F --> J[Successful Matches: Baseline 29 + Count Completed]
    F --> K[Community Requests: Max 38, Successful Matches]
    F --> L[Match Rate: Round Matches / Requests * 100]

    G --> M[Emit impactMetricsChange CustomEvent]
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M

    M --> N[Dashboard Re-Renders Cards]
    M --> O[Impact Dashboard Re-Renders Cards & Charts]
    M --> P[Recent Donations Table Prepends Record]
```

---

## 7. AI Assistant Context-Aware Interaction Flow

```mermaid
sequenceDiagram
    actor User
    participant Page as AIAssistantPage
    participant Service as assistantService
    participant Store as sessionStorage

    User->>Page: Submits question (e.g. "Is my food safe?")
    Page->>Service: generateAssistantResponse(userMessage)
    Service->>Service: detectIntent(userMessage)
    Service->>Store: Check for activeDonation & analysisResult
    
    alt Active Analysis Found
        Store-->>Service: Returns FoodAnalysisResult (e.g. "Vegetable Curry & Rice")
        Service-->>Page: Formats tailored response incorporating active food name, suitability, and shelf-life
    else Active Donation Found
        Store-->>Service: Returns ActiveDonation (e.g. status: "In Transit")
        Service-->>Page: Formats response explaining current stage and recipient organisation
    else No Active Session Data
        Service-->>Page: Provides general food rescue domain guidance and suggested prompts
    end

    Page-->>User: Renders formatted Markdown response in chat thread
```

---

## 8. Responsible AI Decision Boundary

```mermaid
flowchart TD
    subgraph Automated Advisory AI [What the System Does]
        A1[Calculate Food Age]
        A2[Derive Shelf-Life Windows]
        A3[Recommend Storage Protocols]
        A4[Score Recipient Compatibility]
        A5[Explain Match Reasons]
        A6[Track State Transitions]
    end

    subgraph Mandatory Human Responsibility [What the Human Does]
        H1[Physical Sensory Inspection: Smell, Texture, Temp]
        H2[Verify Allergen & Ingredient Integrity]
        H3[Direct Verification of Requires Review Flags]
        H4[Final Selection of Community Recipient]
        H5[Authorisation of Physical Handover]
    end

    Automated Advisory AI ==>|Advisory Decision Support| Mandatory Human Responsibility
```

*Explanation: Strict division of responsibility ensuring that automated calculations advise rather than replace human physical inspection, allergen verification, and transfer authority.*

---

## 9. Client-Side Data Entity & State Model

```mermaid
erDiagram
    DONATION_FORM ||--|| FOOD_SAFETY_ANALYSIS : evaluated_by
    FOOD_SAFETY_ANALYSIS ||--o{ MATCH_RECOMMENDATION : generates
    MATCH_RECOMMENDATION }o--|| COMMUNITY_REQUEST : matches_with
    MATCH_RECOMMENDATION ||--|| ACTIVE_DONATION : confirmed_as
    ACTIVE_DONATION ||--o| COMPLETED_DONATION : transitions_to
    COMPLETED_DONATION }o--|| IMPACT_METRICS : aggregates_into

    DONATION_FORM {
        string id
        string foodName
        string category
        number quantity
        string unit
        string preparationDate
        string availableUntil
        string storageCondition
        string location
    }

    FOOD_SAFETY_ANALYSIS {
        string id
        string suitability
        number shelfLifeHours
        string storageRecommendation
        string[] safetyConsiderations
        boolean canProceedToMatching
    }

    COMMUNITY_REQUEST {
        string id
        string recipientName
        string categoryNeeded
        number quantityNeeded
        string urgency
        string status
    }

    ACTIVE_DONATION {
        string id
        string status
        string recipientName
        string confirmedAt
    }

    IMPACT_METRICS {
        number mealsPotentiallySupported
        number foodPotentiallyRedirectedKg
        number donationEvents
        number successfulMatches
        number matchSuccessRate
    }
```

*Explanation: Entity-relationship diagram representing client-side domain data models and state progression from donation submission to impact aggregation.*

---

## 10. Sustainability Impact Pathway (SDG 12, SDG 2 & SDG 13)

```mermaid
flowchart TD
    A[Edible Commercial Surplus Food] --> B[FoodBridge AI Platform]
    
    B --> C{Food Safety Gate}
    C -->|Unsafe / Spoiled| D[Safe Disposal / Composting]
    C -->|Safe / Suitable| E[Community Matching Engine]
    
    E --> F[Direct Redistribution to Shelters & Community Pantries]
    
    F --> G[Nutritious Meals Delivered]
    G --> H["SDG 2: Zero Hunger<br/>(Target 2.1: Food Insecurity Relief)"]
    
    F --> I[Diversion from Municipal Landfills]
    I --> J["SDG 12: Responsible Consumption<br/>(Target 12.3: Halving Food Waste)"]
    
    I --> K[Prevented Anaerobic Landfill Decomposition]
    K --> L[Avoided Methane CH4 Emissions]
    L --> M["SDG 13: Climate Action<br/>(Target 13.3: Organic Waste Abatement)"]
```

*Explanation: The three-pronged environmental and humanitarian impact pathway illustrating how surplus diversion concurrently supports food security (SDG 2), waste reduction (SDG 12), and methane emission avoidance (SDG 13).*

