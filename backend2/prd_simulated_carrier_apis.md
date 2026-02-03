I'll create a dedicated PRD for the Simulated Carrier API backend service with detailed data models, REST APIs, and field explanations.I've created a comprehensive **Simulated Carrier API PRD** with complete data models and REST API specifications. Here's a summary of what's included:

## Key Sections

### Data Models (Configuration-Based, Stateless)

| Model | Purpose |
|-------|---------|
| **Carrier** | Simulated carrier config (Atlas, Shield, Apex) with pricing profiles |
| **CoverageType** | GL, WC, EPL, CYBER, E&O, D&O with rating basis and limits |
| **IndustryRiskProfile** | NAICS codes mapped to risk tiers |
| **StateModifier** | State-specific rate multipliers (CA=1.2x, NY=1.25x, etc.) |
| **QuoteRequest/Response** | API input/output structures |
| **BindRequest/Response** | Policy binding structures |

### REST API Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /quote` | Generate quotes from carriers for a coverage type |
| `POST /quote/bulk` | Quote multiple coverages at once |
| `POST /bind` | Convert quote to policy |
| `GET /carriers` | List available carriers |
| `GET /carriers/:id/coverage-types` | Carrier capabilities |
| `GET /coverage-types` | All supported coverage types |
| `GET /industries/:naicsCode` | Industry risk profile |
| `GET /states/:stateCode` | State modifiers and requirements |
| `POST /validate` | Pre-flight validation without quoting |

### Pricing Engine Logic

- **GL Formula**: Revenue-based with industry/state/experience modifiers
- **WC Formula**: Payroll-based with class codes
- **Experience Modifiers**: Years in business discounts (up to 10%)
- **Claims Impact**: 15-50% surcharges for prior claims
- **Carrier Variance**: ±5-15% random variance for realistic competition
- **Decline Logic**: Risk scoring with carrier-specific thresholds

### Three Simulated Carriers

1. **Atlas Insurance** (PREMIUM) - A+ rated, broader coverage, +10% price
2. **Shield Direct** (VALUE) - Competitive pricing, -10% price, fewer coverages
3. **Apex Mutual** (SPECIALTY) - Tech-focused, limited states, E&O/Cyber expert
