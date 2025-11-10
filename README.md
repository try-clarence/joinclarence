# Clarence - AI-Powered Insurance Platform

![Clarence Logo](https://via.placeholder.com/200x60?text=Clarence)

## Overview

Clarence is an AI-powered insurance platform that revolutionizes how individuals and businesses purchase insurance. By combining intelligent document processing, automated quote generation, and conversational AI support, Clarence makes insurance accessible, understandable, and efficient.

### Key Features

- 🤖 **AI-Powered Quote Generation** - Get multiple competitive quotes in minutes
- 📄 **Smart Document Parsing** - Upload your declaration page and let AI extract the information
- 💬 **Intelligent Chat Support** - 24/7 AI assistant that understands your policies
- 📱 **Phone-Based Registration** - Simple SMS verification for secure account creation
- 🔄 **Automated Renewals** - Proactive renewal reminders and one-click renewal options
- 📊 **Policy Management** - All your policies, documents, and certificates in one place

---

## Project Documentation

This repository contains comprehensive documentation for building the Clarence platform:

### 📋 [Product Requirements Document (PRD.md)](./PRD.md)
Complete product specification including:
- Executive summary and product vision
- User personas and journey maps
- Feature requirements (Quote flow, Purchase, Support, Renewal)
- Success metrics and KPIs
- Development phases and timeline
- Risk assessment and mitigation strategies

**Read this first** to understand the product vision and requirements.

### 📖 [User Stories (USER_STORIES.md)](./USER_STORIES.md)
48 detailed user stories across 8 epics:
- Epic 1: Quote Request Flow (9 stories)
- Epic 2: User Registration & Authentication (5 stories)
- Epic 3: Dashboard & Quote Status (3 stories)
- Epic 4: Quote Generation & Comparison (4 stories)
- Epic 5: Purchase & Payment (4 stories)
- Epic 6: Policy Issuance & Documents (3 stories)
- Epic 7: Customer Support Chat (4 stories)
- Epic 8: Renewal & Retention (5 stories)

Each story includes acceptance criteria, priority, story points, and dependencies.

### 🔌 [API Specification (API_SPECIFICATION.md)](./API_SPECIFICATION.md)
Complete REST API documentation:
- Authentication endpoints (Registration, Login, SMS verification)
- Quote request endpoints (Create, upload documents, track status)
- Sandbox quote generation (AI-powered simulated quotes)
- Purchase endpoints (Payment, e-signature, policy issuance)
- Policy management (View, modify, generate certificates)
- Chat support endpoints
- Renewal endpoints
- Webhook events

Includes request/response examples, error codes, and testing guidelines.

### 💻 [Technical Implementation Guide (TECHNICAL_IMPLEMENTATION.md)](./TECHNICAL_IMPLEMENTATION.md)
Detailed technical specifications:
- Architecture overview and tech stack recommendations
- Phone registration & SMS verification implementation
- AI document parsing with AWS Textract + GPT-4
- Sandbox quote generation with LLM
- Policy document generation
- Chat AI implementation
- Database schema (Prisma)
- Security & compliance checklist
- Infrastructure & deployment (AWS architecture)

Includes complete code examples and best practices.

### 🎨 [UI Screen Specifications (UI_SCREEN_SPECIFICATIONS.md)](./UI_SCREEN_SPECIFICATIONS.md)
Comprehensive UI/UX design specifications:
- Design system (colors, typography, spacing, components)
- Screen-by-screen layouts with ASCII mockups
- Landing page design
- 5-step quote request flow
- Registration screens (phone verification, password creation)
- Dashboard (quote status, active policies)
- Quote comparison interface
- Purchase flow (payment, e-signature, success)
- Policy management
- Chat interface
- Mobile responsive considerations
- Accessibility (WCAG 2.1 AA compliance)

---

## Quick Start Guide

### For Product Managers
1. Read [PRD.md](./PRD.md) for complete product specification
2. Review [USER_STORIES.md](./USER_STORIES.md) for backlog planning
3. Check [UI_SCREEN_SPECIFICATIONS.md](./UI_SCREEN_SPECIFICATIONS.md) for UX requirements

### For Engineers
1. Read [TECHNICAL_IMPLEMENTATION.md](./TECHNICAL_IMPLEMENTATION.md) for architecture
2. Review [API_SPECIFICATION.md](./API_SPECIFICATION.md) for endpoint specs
3. Check database schema in technical guide
4. Review code examples for key features

### For Designers
1. Read [UI_SCREEN_SPECIFICATIONS.md](./UI_SCREEN_SPECIFICATIONS.md) for design system
2. Review screen layouts and user flows
3. Check accessibility requirements
4. Review mobile responsive considerations

---

## Product Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  Landing → Quote Flow → Registration → Dashboard         │
└────────────────────────┬────────────────────────────────┘
                         │
                    API Gateway
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼───────┐ ┌──────▼─────┐ ┌───────▼────────┐
│ Auth Service  │ │Quote Engine│ │ Policy Service │
│ - SMS verify  │ │ - AI quotes│ │ - Issuance     │
│ - JWT tokens  │ │ - Doc parse│ │ - Management   │
└───────┬───────┘ └──────┬─────┘ └───────┬────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
┌───────▼──────┐  ┌──────▼──────┐  ┌─────▼─────┐
│  PostgreSQL  │  │    Redis    │  │  MongoDB  │
│  (Primary)   │  │  (Cache)    │  │ (Docs)    │
└──────────────┘  └─────────────┘  └───────────┘

External Services:
- Twilio (SMS)
- OpenAI/Anthropic (LLM)
- AWS Textract (OCR)
- Stripe (Payments)
- AWS S3 (Storage)
```

### User Journey Flow

```
1. Landing Page
   ↓
2. Choose Insurance Type (Personal/Business)
   ↓
3. Five-Step Quote Request
   - Step 1: Insurance needs
   - Step 2: Business basics (+ optional doc upload)
   - Step 3: Financial information
   - Step 4: Coverage selection
   - Step 5: Final details
   ↓
4. User Registration (NEW - after Step 5)
   - Enter US phone number
   - Verify via SMS code
   - Create password
   ↓
5. Dashboard - Quote Processing
   - View status: "Quote in Progress"
   - Receive notification when ready
   ↓
6. Quote Comparison
   - Review 3-5 quotes per coverage
   - AI recommendations
   - Side-by-side comparison
   ↓
7. Purchase Flow
   - Select quotes
   - Enter payment info
   - E-signature
   ↓
8. Policy Issuance
   - Instant policy documents
   - Certificate of Insurance (COI)
   ↓
9. Ongoing Management
   - Policy dashboard
   - Chat support
   - Document access
   ↓
10. Renewal (90 days before expiration)
    - Automated reminders
    - AI renewal assessment
    - One-click renewal
```

---

## Key Features Deep Dive

### 1. AI Document Parsing

Upload your existing insurance documents (declaration pages, policies) and our AI will:
- Extract business information automatically
- Pre-fill the quote request form
- Identify current coverage and limits
- Highlight fields that need review

**Technology:** AWS Textract for OCR + GPT-4 for structured extraction

### 2. Sandbox Quote Generation (MVP Phase)

During initial development, quotes are generated using AI to simulate real carrier quotes:
- Realistic pricing based on industry, location, and risk factors
- 3-5 quotes per coverage type from different simulated carriers
- AI-powered recommendations
- Proper insurance terminology and coverage details

**Technology:** GPT-4 with custom prompts trained on insurance data

### 3. Phone-Based Registration

Simple and secure registration flow:
- Enter US phone number (formatted automatically)
- Receive 6-digit SMS verification code
- Create secure password (with strength indicator)
- Instant access to dashboard

**Technology:** Twilio for SMS, Redis for code storage, bcrypt for password hashing

### 4. Real-Time Quote Status

After submitting a quote request:
- Live progress tracking (pending → processing → ready)
- Email and SMS notifications when quotes are ready
- Estimated completion time
- Visual progress indicators

### 5. AI Chat Support

24/7 intelligent assistant that can:
- Answer questions about your specific policies
- Explain insurance terms and coverage
- Generate certificates of insurance
- Guide through claims process
- Escalate to human agents when needed

**Technology:** GPT-4 with RAG (Retrieval-Augmented Generation) for policy-specific queries

### 6. Automated Renewal Management

Proactive renewal system:
- Notifications starting 90 days before expiration
- AI analyzes business changes and recommends coverage updates
- Three renewal options: one-click, review & update, shop & compare
- Predictive analytics to identify at-risk customers

---

## Development Phases

### Phase 1: MVP (Months 1-3) - P0 Features
- Landing page and marketing site
- 5-step quote request flow (manual input)
- Phone-based registration with SMS verification
- User dashboard with quote status tracking
- Sandbox quote generation (AI-powered)
- Basic quote presentation
- Email/SMS notifications

**Success Criteria:**
- End-to-end quote request functional
- SMS verification >95% delivery rate
- Quote generation in <5 minutes

### Phase 2: Purchase & Policy Issuance (Months 4-5)
- Quote comparison and selection
- Payment integration (Stripe)
- E-signature capture
- AI-powered policy document generation
- Policy delivery and COI generation
- User dashboard with policy management

**Success Criteria:**
- Complete purchase flow operational
- Policy documents auto-generated
- Payment processing functional

### Phase 3: AI Enhancement (Months 6-7)
- Document upload and AI parsing
- AI-powered chat support
- AI coverage recommendations
- Intelligent quote analysis

**Success Criteria:**
- 80%+ accuracy on document parsing
- 70%+ of support questions handled by AI
- Measurable conversion improvement

### Phase 4: Retention & Renewal (Months 8-9)
- Renewal notification system
- AI renewal assessment
- Predictive renewal analytics
- Customer retention campaigns
- Loyalty programs

**Success Criteria:**
- Automated renewal reminders sent
- >70% renewal rate
- Measurable reduction in lapse rate

### Phase 5: Carrier Integration (Months 10-12)
- Real carrier API integrations
- Live quote comparison
- Direct bind capabilities
- Real-time policy issuance
- Claims integration

**Success Criteria:**
- At least 3 carrier integrations live
- Real quotes returned in <30 seconds
- Direct bind operational

---

## Tech Stack

### Frontend
- **Framework:** Next.js 14+ (React 18+)
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand / React Query
- **Forms:** React Hook Form + Zod
- **Real-time:** Socket.io / Pusher

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express / Fastify
- **Language:** TypeScript
- **ORM:** Prisma
- **Queue:** BullMQ (Redis)
- **Caching:** Redis

### Database
- **Primary:** PostgreSQL 15+
- **Documents:** MongoDB
- **Cache:** Redis
- **Search:** Elasticsearch (optional)

### AI/ML
- **LLM:** OpenAI GPT-4 / Anthropic Claude
- **OCR:** AWS Textract
- **Vector DB:** Pinecone / Weaviate

### Infrastructure
- **Cloud:** AWS
- **Frontend Hosting:** Vercel
- **Backend:** ECS / Lambda
- **Storage:** S3
- **CDN:** CloudFront

### Third-Party Services
- **SMS:** Twilio
- **Payments:** Stripe
- **Email:** SendGrid / AWS SES
- **E-signature:** DocuSign / HelloSign
- **Analytics:** Mixpanel / Amplitude
- **Monitoring:** Datadog / New Relic

---

## Success Metrics

### Acquisition Metrics
- Landing page conversion rate: Target >15%
- Quote request completion rate: Target >70%
- Time to complete quote: Target <10 minutes

### Conversion Metrics
- Quote-to-purchase conversion: Target >25%
- Average policy premium: Track and optimize
- Multi-policy attachment rate: Target >40%

### Engagement Metrics
- Dashboard login frequency: Track weekly
- Chat utilization rate: Target >50%
- Self-service completion: Target >80%

### Retention Metrics
- Renewal rate: Target >80%
- Net Promoter Score (NPS): Target >50
- Customer lifetime value (LTV): Maximize

### Operational Metrics
- Quote generation time: Target <5 minutes
- Chat response time: Target <3 seconds
- Policy issuance time: Target <30 seconds

---

## Security & Compliance

### Security Measures
- ✅ JWT authentication with short-lived tokens
- ✅ Bcrypt password hashing (12+ rounds)
- ✅ SMS verification for account creation
- ✅ Rate limiting on all endpoints
- ✅ Account lockout after failed attempts
- ✅ Data encryption at rest and in transit
- ✅ Secure file upload validation
- ✅ PCI DSS compliance for payments

### Compliance Requirements
- ✅ SOC 2 Type II
- ✅ GDPR (data export, deletion, consent)
- ✅ CCPA (data access, deletion rights)
- ✅ State insurance regulations
- ✅ HIPAA (if handling health insurance)

---

## Getting Started (For Developers)

### Prerequisites
```bash
- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- MongoDB 6+
```

### Environment Variables
```bash
# Database
DATABASE_URL="postgresql://..."
MONGODB_URL="mongodb://..."
REDIS_URL="redis://..."

# Authentication
JWT_SECRET="..."
JWT_EXPIRES_IN="3600"

# SMS (Twilio)
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="..."

# AI Services
OPENAI_API_KEY="..."
AWS_TEXTRACT_REGION="..."

# Payments
STRIPE_SECRET_KEY="..."
STRIPE_PUBLISHABLE_KEY="..."

# AWS
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="..."

# Email
SENDGRID_API_KEY="..."
```

### Installation
```bash
# Clone repository
git clone https://github.com/yourorg/clarence.git
cd clarence

# Install dependencies
npm install

# Set up database
npx prisma migrate dev

# Seed database (optional)
npm run seed

# Start development server
npm run dev
```

### Running Tests
```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

---

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier (config included)
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## Support

### For Users
- **Help Center:** https://help.joinclarence.com
- **Chat Support:** Available 24/7 in the app
- **Email:** support@joinclarence.com
- **Phone:** 1-800-CLARENCE

### For Developers
- **API Docs:** https://docs.joinclarence.com
- **Developer Portal:** https://developers.joinclarence.com
- **Status Page:** https://status.joinclarence.com
- **Email:** dev-support@joinclarence.com

---

## License

[License Type] - See LICENSE.md for details

---

## Team

Built with ❤️ by the Clarence team

**Product:** [Your Name]  
**Engineering:** [Team]  
**Design:** [Team]

---

## Acknowledgments

- Insurance industry partners for domain expertise
- Early adopters and beta testers
- Open source community for amazing tools

---

**Last Updated:** November 6, 2025  
**Version:** 1.0.0  
**Status:** In Development


