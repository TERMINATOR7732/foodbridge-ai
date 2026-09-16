# FoodBridge AI — Knowledge & Domain Reference

This directory serves as the documentation and domain reference repository for food safety, redistribution standards, and handling protocols implemented in FoodBridge AI.

## Reference Categories

```
knowledge-base/
├── food-safety/
│   ├── general-guidelines.md       # Category risk tiers, shelf-life boundaries, age thresholds
│   ├── storage-temperatures.md     # Cold-chain protocols (refrigerated <= 5 °C, frozen <= -18 °C)
│   └── allergen-guidance.md        # Major allergen declarations (nuts, gluten, dairy)
├── redistribution/
│   ├── best-practices.md           # Handover protocols, recipient verification, timing
│   └── cold-chain.md               # Transit handling, insulated containers, vehicle checks
└── README.md
```

## Architectural Connection

The core decision-support rules encoded within FoodBridge AI's local advisory engine (`src/services/mockAnalyzer.ts`, `src/services/matchingService.ts`, and `src/services/assistantService.ts`) mirror the safety standards established in these reference documents:

1. **Food Category Baselines**: Max safe availability windows (e.g. Prepared Meals: same-day redistribution; Bakery & Bread: 24–72 hours; Fresh Produce: 48 hours).
2. **Temperature & Storage Rules**: Storage verification required before confirming transfers of refrigerated or perishable items.
3. **Safety Gate Thresholds**: Immediate blocking of stale, expired, or improperly stored surplus food.

## Advisory Notice

All food redistribution recommendations provided by FoodBridge AI are decision-support outputs. A designated human coordinator must conduct physical inspection and sensory verification prior to consumption or distribution.
