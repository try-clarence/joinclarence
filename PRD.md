# Product Requirements Document: Clarence AI Insurance Platform

## Executive Summary

Clarence is an AI-powered insurance platform that serves as an intelligent insurance agent for both personal and commercial insurance needs. The platform enables users to obtain insurance quotes, purchase policies, and manage their coverage through an intuitive interface powered by AI, reducing friction in the traditionally complex insurance buying process.

---

## Product Vision

To democratize access to insurance by providing an AI-powered platform that simplifies the insurance buying experience, offers personalized coverage recommendations, and delivers exceptional customer support for both individuals and businesses.

---

## Goals & Objectives

### Primary Goals
1. **Simplify Insurance Acquisition**: Reduce the time and complexity of obtaining insurance quotes from days to minutes
2. **Intelligent Recommendations**: Leverage AI to provide personalized coverage recommendations based on user profiles and needs
3. **Seamless User Experience**: Create an intuitive, conversational interface that guides users through the insurance buying process
4. **Scalable Operations**: Build a platform that can operate with or without direct carrier API integrations

### Success Metrics
- Time to quote: < 10 minutes for standard cases
- Quote-to-purchase conversion rate: > 25%
- Customer satisfaction score (CSAT): > 4.5/5
- Renewal rate: > 80%
- Support query resolution time: < 5 minutes

---

## User Personas

### Persona 1: Individual Insurance Buyer (Personal Insurance)
- **Profile**: Ages 25-65, seeking personal insurance (home, auto, life, umbrella)
- **Goals**: Find affordable coverage quickly, understand what they're buying
- **Pain Points**: Complex insurance jargon, lengthy application processes, unclear coverage details
- **Tech Savviness**: Moderate to high

### Persona 2: Small Business Owner (Commercial Insurance)
- **Profile**: Business owners with 1-100 employees seeking general liability, commercial property, workers comp, etc.
- **Goals**: Protect business assets, comply with legal requirements, minimize risk
- **Pain Points**: Multiple coverage types needed, complex requirements, time-consuming process
- **Tech Savviness**: Moderate

### Persona 3: Insurance Agent/Broker
- **Profile**: Insurance professionals using Clarence to serve clients
- **Goals**: Serve more clients efficiently, provide better recommendations
- **Pain Points**: Manual quote gathering, limited carrier access
- **Tech Savviness**: Moderate to high

---

## User Journey Overview

### Complete Flow Sequence

```
1. Landing Page
   ↓
2. Choose Insurance Type (Personal / Business)
   ↓
3. Five-Step Quote Request
   ├─ Step 1: Insurance Needs (New Coverage / Renewal)
   ├─ Step 2: Business Basics (Manual or Document Upload)
   ├─ Step 3: Financial Information
   ├─ Step 4: Coverage Selection
   └─ Step 5: Final Details & Submission
   ↓
4. User Registration
   ├─ Enter US Phone Number
   ├─ Verify Phone (SMS Code)
   └─ Create Password
   ↓
5. User Dashboard - Quote Processing
   ├─ View Status: "Quote in Progress"
   ├─ Receive Notification: "Quotes Ready"
   └─ View Quotes
   ↓
6. Quote Comparison & Selection
   ↓
7. Purchase & Payment
   ↓
8. Policy Issuance
   ↓
9. Ongoing: Customer Support & Policy Management
   ↓
10. Future: Renewal Process
```

### Key Principle
Users remain **unauthenticated** during the quote request process (Steps 1-5) to reduce friction and increase completion rates. Registration happens **only after** they've invested time in providing their information, making them more likely to complete the sign-up.

---

## Core Features & Requirements

## 1. User Onboarding & Information Gathering

### 1.1 Landing Page & Value Proposition
**Requirements:**
- Clear differentiation between Personal and Business insurance paths
- Compelling value propositions:
  - Personal: "Cover yourself and your loved ones"
  - Business: "Protection tailored for businesses"
- Call-to-action buttons: "Speak to Agent" and "Get Coverage" options
- Trust indicators: Social proof section showing testimonials
- Instant quote messaging in header

**User Stories:**
- As a user, I want to quickly understand what type of insurance Clarence offers so I can determine if it meets my needs
- As a business owner, I want a clear path to business insurance so I don't waste time on personal insurance options

### 1.2 Multi-Step Quote Flow (5 Steps)

#### Step 1: Insurance Needs Assessment
**Requirements:**
- **Question**: "What brings you to Equal Parts today?"
- **Options**:
  - New Coverage: "I need to set up new insurance coverage for my business"
  - Renewal Help: "I have existing coverage and need help with renewal"
- Radio button selection with clear visual indicators
- Progress bar showing Step 1 of 5
- Next button to proceed

**User Stories:**
- As a user, I want to specify whether I'm looking for new coverage or renewal help so the platform can provide relevant options
- As a new customer, I want a clear indication of where I am in the process so I know how much time it will take

#### Step 2: Business Basics & Information Collection

**Manual Input Requirements:**

**Business Information Fields:**
- Legal Business Name* (required)
- Doing Business As (DBA) name
- Legal Structure* (dropdown: LLC, Corporation, Sole Proprietorship, Partnership, etc.)
- Business Website
- Primary Industry* (searchable dropdown)
- Business Description* (text area)
- Business FEIN #
- Year Business Started*
- Years Under Current Ownership

**Address Information:**
- Address Type: Physical Location or Virtual/Online Business (radio buttons)
- Business Address* (street, city, state, zip)

**Additional Business Details:**
- Do you have subsidiaries? (Yes/No)
- Do you have foreign subsidiaries or revenue? (Yes/No)
- Are you seeking coverage for multiple entities? (Yes/No)

**Contact Information:**
- First Name*
- Last Name*
- Email*
- Phone*

**File Upload (Optional - Speed things up):**
- Upload area for business documents (PDF, images, deck pages)
- Supported formats: .csv, .xsl, .xlsx (Max file size: 5MB)
- "Download Sample Template" link for guidance
- Helper text: "Upload a PDF, image or deck page that contains your business information"

**AI-Powered Document Parsing:**
- When user uploads a declaration page (dec page) or business document:
  - AI extracts and pre-fills relevant fields
  - Shows extracted data with confidence scores
  - Allows user to review and edit AI-extracted data
  - Highlights fields that need verification

**User Stories:**
- As a user, I want the option to type my information manually so I have full control
- As a returning customer, I want to upload my existing dec page so I don't have to retype everything
- As a user, I want the AI to pre-fill information from my uploaded document so I can save time
- As a user, I want to review AI-extracted data before proceeding so I can ensure accuracy

**Technical Requirements:**
- OCR and NLP engine to extract data from uploaded documents
- Confidence scoring for extracted fields (>90% auto-fill, <90% flag for review)
- Support for various dec page formats from major carriers
- Secure document storage with encryption

#### Step 3: Financial Information
**Requirements:**
- 2024 Revenue (annual revenue)
- 2024 Expenses (annual expenses)
- Estimated 2025 Revenue
- Estimated 2025 Expenses
- Full-time Employees (count)
- Part-time Employees (count)
- Total Payroll Estimate
- Percentage of Payroll for Independent Contractors (0-100%)

**Validation:**
- All fields accept numeric input with proper formatting ($XX,XXX)
- Revenue/expense validation (warn if expenses > revenue by significant margin)
- Employee count validation (whole numbers only)
- Percentage validation (0-100 range)

**User Stories:**
- As a business owner, I want to input my financial information so the platform can provide accurate quotes
- As a user, I want validation on my inputs so I catch errors before proceeding

#### Step 4: Coverage Selection
**Requirements:**
- Display comprehensive list of available coverage types
- Each coverage type shows:
  - Icon (shield with specific symbol)
  - Coverage name
  - Brief description (e.g., "GL" for General Liability)
  - Checkbox for selection
  - Info tooltip (?) for detailed explanations

**Coverage Types to Display:**
1. Employee Benefits (EB)
2. General Liability (GL)
3. Commercial Property Liability (CPL)
4. Auto Liability (AL)
5. Umbrella / Excess Liability (U)
6. Workers Compensation Liability (WC)
7. Errors & Omissions / Professional Liability (E&O)
8. Directors & Officers Liability (D&O)
9. Cyber Liability (CY)
10. Employment Practices Liability (EPL)
11. Crime Liability (CL)
12. Media Liability (ML)
13. Fiduciary Liability (FL)

**AI-Powered Recommendations:**
- Based on business type, size, and industry, AI suggests recommended coverages
- Highlighted badges: "Recommended for your industry" or "Required by law"
- Brief explanation of why each coverage is recommended

**User Stories:**
- As a business owner, I want to see all available coverage options so I can make informed decisions
- As a new insurance buyer, I want AI recommendations so I don't miss important coverage
- As a user, I want detailed information about each coverage type so I understand what I'm buying

#### Step 5: Final Details & Submission
**Requirements:**
- Additional Comments (text area for any special requirements or questions)
- Confirmation checkboxes:
  - "I confirm that all information provided is accurate and complete to the best of my knowledge"
  - "I consent to Equal Parts Insurance Agency collecting, using the information provided and sharing it with its partners to communicate with me via my email, text, and phone regarding my insurance quote and coverage options. You may opt out by replying STOP or via the opt-out link. Message and data rates may apply."
  - "I have reviewed and agree to the Privacy Policy" (with link)
- Submit Quote Request button

**User Stories:**
- As a user, I want to add any additional context so the agent has complete information
- As a user, I want to review all my information before submitting so I can catch any errors
- As a user, I want clear privacy and consent information so I know how my data will be used

### 1.3 User Registration & Account Creation

**Timing:** After completing Step 5 (Final Details & Submission) and before quote processing begins

**Requirements:**

**Registration Flow:**
After user clicks "Submit Quote Request" in Step 5, they are directed to a registration screen to create their account.

**Registration Fields:**
- **Phone Number*** (required)
  - US area code only
  - Format: (XXX) XXX-XXXX
  - Real-time validation for US phone numbers
  - SMS verification code sent to validate phone
- **Password*** (required)
  - Minimum 8 characters
  - Must include: uppercase, lowercase, number, special character
  - Password strength indicator (weak/medium/strong)
  - Password visibility toggle
- Optional: "Remember me" checkbox

**Phone Verification:**
1. User enters US phone number
2. System sends 6-digit verification code via SMS
3. User enters verification code
4. Code valid for 10 minutes
5. "Resend code" option (max 3 attempts)
6. Upon successful verification, user creates password
7. Account created and user logged in automatically

**Design Considerations:**
- Clean, minimal design to reduce friction
- Progress indication: "Just one more step to see your quotes"
- Reassurance message: "Your quote information is saved and being processed"
- Alternative: "Already have an account? Log in"
- Security badge: "Your information is secure and encrypted"

**Post-Registration:**
- Immediate redirect to user dashboard
- Quote request processing status displayed (as per section 2.1)
- Welcome message: "Welcome to Clarence! We're analyzing your information..."
- Email confirmation sent to the email provided in Step 2

**Error Handling:**
- Phone number already registered: "This number is already registered. Please log in or use a different number"
- Invalid verification code: "Code incorrect. Please try again. X attempts remaining"
- Weak password: Specific feedback on requirements not met

**Technical Requirements:**
- SMS service integration (Twilio or similar)
- Phone number validation and formatting
- Rate limiting on verification code requests
- Secure password hashing (bcrypt, argon2)
- Session management
- CSRF protection
- Account lockout after failed attempts (security)

**User Stories:**
- As a new user, I want quick registration with just my phone so I can access my quotes immediately
- As a user, I want to verify my phone number so my account is secure
- As a returning user, I want to log in easily if I already have an account
- As a user, I want my quote information saved during registration so I don't lose my progress

**Returning User Flow:**
If phone number is already registered:
1. Display message: "Welcome back! This number is already registered."
2. Show password field instead of verification flow
3. "Forgot password?" link available
4. Upon successful login, merge new quote data with existing account
5. Redirect to dashboard showing both old and new quote requests

**Edge Cases:**
- User closes browser during verification: Save quote data, allow login to retrieve
- User doesn't receive SMS: Provide troubleshooting steps, alternative contact method
- User already logged in from Step 1: Skip registration, proceed directly to dashboard
- International phone numbers: Display error message "Currently only US phone numbers are supported"
- Multiple quote requests in progress: Dashboard shows all requests with separate status cards
- User abandons registration: Quote data saved for 7 days, email sent with "Complete your registration" link

### 1.4 Data Validation & Quality
**Requirements:**
- Real-time field validation with helpful error messages
- Required field indicators (*)
- Format validation (email, phone, ZIP, FEIN, etc.)
- Business logic validation (e.g., start date can't be in the future)
- "Save and continue later" functionality with email link
- Auto-save draft every 30 seconds

**Technical Requirements:**
- Client-side validation for immediate feedback
- Server-side validation for security
- Session management for draft saving
- Email notification system for saved drafts

---

## 2. Quote Generation & Policy Purchase Flow

### 2.1 Quote Request Processing

**Context:** User has completed the 5-step quote flow, registered/logged in, and is now viewing their dashboard.

**Requirements:**

**Dashboard View - Quote Processing Status:**
- **Welcome Message**: "Welcome to Clarence, [First Name]!"
- **Status Card** prominently displayed:
  - Status indicator: "Quote in Progress" with animated loading icon
  - Progress message: "We're analyzing your information and preparing your quotes"
  - Estimated time: "You'll receive quotes within 2-4 hours"
  - Timestamp: "Request submitted at [time]"
- **What Happens Next** section:
  - "Our AI is reviewing your business information"
  - "We're comparing coverage options from multiple carriers"
  - "You'll receive an email and dashboard notification when quotes are ready"
- **Email Confirmation**: Sent to user with submission summary and dashboard login link

**Status Progression:**
1. **Quote in Progress** (0-4 hours)
   - Animated progress indicator
   - "We're working on your quotes"
2. **Quotes Ready** (When complete)
   - Dashboard notification badge
   - Email alert: "Your Clarence quotes are ready!"
   - SMS notification (if opted in)
   - CTA button: "View Your Quotes"
3. **Quote Viewed** (After user reviews)
   - Access to quote comparison tools
4. **Quote Selected** (After user selects quotes)
   - Proceed to purchase flow
5. **Policy Issued** (After purchase complete)
   - Access to policy documents

**Backend Processing:**
1. **Data Normalization**: Clean and structure user-provided data
2. **Risk Assessment**: AI evaluates risk factors based on business profile
3. **Coverage Matching**: Match business needs to appropriate coverage types
4. **Carrier Selection**: Identify suitable carriers (real or simulated)

**User Stories:**
- As a user, I want immediate confirmation that my request was received so I know it's being processed
- As a user, I want to track the status of my quote request so I know when to expect results

### 2.2 Quote Generation Engine (Sandbox Phase)

**Phase 1: Simulated Carrier APIs**

Since direct carrier API access isn't immediately available, build a sophisticated simulation layer:

**Requirements:**

**Sandbox API Architecture:**
- RESTful API endpoints that mimic real carrier APIs
- Realistic response times (2-5 seconds per quote)
- Standardized quote format across all simulated carriers
- Random variation in quotes (5-15% price variance) for realism

**LLM-Powered Quote Generation:**
- Use AI model to generate realistic quotes based on:
  - Business type and industry risk factors
  - Coverage amounts requested
  - Location (state-specific regulations and pricing)
  - Claims history (if available)
  - Business size (revenue, employees)
- Generate 3-5 competitive quotes per coverage type
- Include coverage details, limits, deductibles, and premiums

**Quote Structure:**
```json
{
  "quote_id": "CLR-2025-001234",
  "carrier": "Simulated Carrier A",
  "coverage_type": "General Liability",
  "effective_date": "2025-12-01",
  "expiration_date": "2026-12-01",
  "coverage_limits": {
    "per_occurrence": "$1,000,000",
    "general_aggregate": "$2,000,000"
  },
  "premium": {
    "annual": "$1,250",
    "monthly": "$110",
    "quarterly": "$325"
  },
  "deductible": "$500",
  "highlights": [
    "Coverage for bodily injury and property damage",
    "Legal defense costs covered",
    "Medical payments up to $5,000"
  ],
  "exclusions": [
    "Professional services",
    "Pollution",
    "Employee injuries (covered by Workers Comp)"
  ]
}
```

**User Stories:**
- As a user, I want to receive multiple quote options so I can compare and choose the best value
- As a user, I want to understand what each quote covers so I can make an informed decision

### 2.3 Quote Presentation

**Requirements:**

**Quote Dashboard:**
- Display all quotes grouped by coverage type
- For each quote show:
  - Carrier name and logo
  - Annual premium (prominently displayed)
  - Monthly payment option
  - Coverage limits summary
  - Key highlights (3-5 bullet points)
  - "View Details" expandable section
  - "Select This Quote" button
  - "Compare" checkbox

**Comparison View:**
- Side-by-side comparison of selected quotes (up to 3)
- Line-by-line coverage comparison
- Price difference highlighting
- "Best Value" badge on AI-recommended option

**AI Recommendations:**
- "Best for your needs" badge with explanation
- Coverage gaps identified: "You selected GL but not E&O - this is recommended for your industry"
- Total package pricing when multiple coverages selected

**Interactive Elements:**
- Tooltips for insurance terms
- "Why is this recommended?" explanations
- Chat widget: "Questions about these quotes? Ask Clarence"

**User Stories:**
- As a user, I want to easily compare quotes side-by-side so I can find the best option
- As a user, I want AI to highlight the best choice so I don't have to be an insurance expert
- As a business owner, I want to see total package pricing so I can budget appropriately

### 2.4 Quote Acceptance & Purchase Flow

**Requirements:**

**Quote Selection:**
- User selects one or more quotes
- Displays total premium (annual and monthly)
- Shows all selected coverages in a summary card
- "Proceed to Purchase" button

**Purchase Steps:**

**Step 1: Review & Customize**
- Review all coverage details
- Option to adjust coverage limits
- Option to change deductibles
- Real-time premium recalculation if adjustments made

**Step 2: Payment Information**
- Payment plan selection:
  - Pay in Full (potential discount)
  - Monthly payments (with financing details)
  - Quarterly payments
- Payment method:
  - Credit/Debit card
  - ACH/Bank account
  - Check (for large commercial policies)
- Billing address
- Auto-renewal preference (opt-in/opt-out)

**Step 3: Final Review & E-Signature**
- Complete policy summary
- Premium breakdown
- Effective dates
- Terms and conditions
- E-signature capture
- "Confirm Purchase" button

**Step 4: Payment Processing**
- Secure payment processing via Stripe/similar
- Payment confirmation
- Receipt generation and email

**User Stories:**
- As a user, I want to customize my coverage before purchasing so I get exactly what I need
- As a user, I want flexible payment options so I can manage my cash flow
- As a user, I want a clear final review before I commit so there are no surprises

### 2.5 Policy Issuance (Simulated)

**Requirements:**

**LLM-Powered Policy Generation:**
- AI generates complete policy documents based on:
  - Selected coverage details
  - Business information
  - State-specific requirements
  - Standard policy language templates

**Policy Document Structure:**
- Declarations page
- Coverage forms
- Endorsements
- Terms and conditions
- Certificate of insurance

**Policy Delivery:**
- Immediate delivery upon purchase confirmation
- Email with policy documents (PDF)
- Access via user dashboard
- Policy ID and effective date clearly displayed
- Welcome message: "Your coverage is now active"

**Certificate of Insurance (COI):**
- Auto-generated COI available immediately
- Option to add additional insureds
- Option to add specific certificate holders
- Download as PDF

**User Stories:**
- As a user, I want to receive my policy immediately after purchase so I have proof of coverage
- As a business owner, I want to download a certificate of insurance so I can provide it to clients/partners
- As a user, I want my policy documents organized in one place so I can easily find them

---

## 3. Customer Support & Policy Management

### 3.1 AI-Powered Chat Support

**Requirements:**

**Chat Interface:**
- Persistent chat widget on all pages
- Conversational AI (Clarence) as first-line support
- Seamless escalation to human agents when needed
- Chat history saved and accessible

**Clarence AI Capabilities:**
- Answer policy-related questions:
  - "What does my general liability cover?"
  - "When does my policy expire?"
  - "What's my deductible?"
- Explain insurance terms and concepts
- Help with claims process guidance
- Provide certificate of insurance
- Assist with policy changes
- Check renewal dates
- Compare coverage options

**Knowledge Base:**
- AI trained on:
  - User's specific policy documents
  - General insurance knowledge
  - State-specific regulations
  - Clarence platform functionality
  - Common insurance FAQs

**Response Features:**
- Natural language processing
- Context-aware responses (knows user's policy details)
- Citation of policy sections when providing answers
- "Show me in my policy" links
- Ability to generate and attach documents (COI, policy summaries)

**Escalation Triggers:**
- Complex questions AI can't answer
- User requests human agent
- Claims-related inquiries
- Policy cancellation requests
- Complaints or dissatisfaction indicators

**User Stories:**
- As a user, I want instant answers to policy questions so I don't have to wait for business hours
- As a user, I want to chat with AI that understands my specific policy so I get relevant answers
- As a user, I want the option to speak with a human if AI can't help so I'm never stuck

### 3.2 Self-Service Portal

**Requirements:**

**Dashboard Overview:**
- Active policies summary
- Upcoming renewals
- Recent activity
- Quick actions: Download policy, Get COI, Make payment, File claim

**Policy Management:**
- View all policy details
- Download policy documents (PDF)
- Generate certificates of insurance
- View payment history
- Update payment method
- Add additional insureds or certificate holders
- Request policy changes (endorsements)

**Document Library:**
- All policy documents organized by:
  - Policy type
  - Policy period
  - Document type (policy, COI, endorsement, etc.)
- Search and filter functionality
- Download individual or bulk documents

**Payment Management:**
- View upcoming payments
- Make one-time payments
- Update payment methods
- View payment history and receipts
- Set up auto-pay

**User Stories:**
- As a user, I want a dashboard that shows all my policies at a glance so I can stay organized
- As a user, I want to download my policy documents anytime so I can access them when needed
- As a user, I want to manage my payments online so I don't have to call an agent

### 3.3 Policy Modifications & Endorsements

**Requirements:**

**Common Modifications:**
- Add/remove additional insureds
- Change coverage limits
- Adjust deductibles
- Add/remove locations
- Update business information
- Add/remove vehicles (auto policies)
- Add/remove employees (workers comp)

**Modification Process:**
1. User requests change via chat or portal
2. AI or agent reviews change
3. Premium adjustment calculated
4. User reviews and approves additional premium or refund
5. Endorsement generated and policy updated
6. Updated documents delivered

**User Stories:**
- As a business owner, I want to easily add a new location to my policy so I'm always covered
- As a user, I want to see the cost impact before making changes so I can budget accordingly

---

## 4. Retention & Renewal Strategy

### 4.1 Renewal Timeline & Communications

**Requirements:**

**Renewal Notifications:**
- 90 days before expiration: First renewal notice via email
- 60 days before expiration: Reminder + invitation to review coverage
- 45 days before expiration: Early renewal incentive offer
- 30 days before expiration: Renewal quote provided
- 15 days before expiration: Urgent renewal reminder
- 7 days before expiration: Final notice with easy renew button

**Communication Channels:**
- Email
- SMS (if opted in)
- In-app notifications
- Dashboard alerts

**User Stories:**
- As a user, I want advance notice of my renewal so I can plan ahead
- As a user, I want multiple reminders so I don't accidentally let my coverage lapse

### 4.2 AI-Powered Renewal Experience

**Requirements:**

**Automatic Renewal Assessment:**
- AI reviews user's current policy 90 days before expiration
- Analyzes any changes in business:
  - Revenue growth/decline
  - New locations
  - Employee count changes
  - Industry changes
  - Claims history
- Identifies coverage gaps or over-coverage
- Generates renewal recommendations

**Proactive Engagement:**
- "Your business has grown - let's review your coverage"
- "We noticed you added a new location - is it covered?"
- "Industry trends suggest you might want cyber liability"

**Simplified Renewal Options:**

**Option 1: One-Click Renewal**
- "Renew with current coverage" button
- Shows updated premium (if any change)
- Automatic coverage continuation

**Option 2: Review & Update**
- Guided review of current coverage
- Update business information
- Adjust coverage limits
- Get new quotes if significant changes

**Option 3: Shop & Compare**
- Full market quotes (like new customer)
- Compare current vs. new options
- Highlight savings opportunities

**User Stories:**
- As a returning customer, I want renewal to be effortless so I can focus on my business
- As a user, I want AI to identify if my coverage needs have changed so I'm always properly protected
- As a cost-conscious business owner, I want to compare renewal quotes so I'm getting the best value

### 4.3 Retention Strategies

**Requirements:**

**Loyalty Program:**
- Claims-free discounts (increase each year without claims)
- Multi-policy discounts (bundle personal + commercial)
- Renewal discounts (1%, 2%, 3%+ for each renewal)
- Referral rewards

**Proactive Risk Management:**
- Annual risk assessment included
- Safety resources and training materials
- Loss control consulting (for larger policies)
- Quarterly business check-ins

**Customer Success:**
- Dedicated renewal specialist assigned at 60 days
- Personalized renewal review meeting (optional)
- White-glove service for complex renewals

**Win-Back Campaigns:**
- For customers who don't renew:
  - Post-lapse survey (understand why)
  - Win-back offer (30/60/90 days after lapse)
  - Improved quote based on feedback

**User Stories:**
- As a loyal customer, I want to be rewarded for staying with Clarence so I feel valued
- As a business owner, I want help managing risk, not just insurance so I can prevent claims
- As a former customer, I want a path back if my circumstances change so I can return easily

### 4.4 Renewal Analytics & Automation

**Requirements:**

**Predictive Analytics:**
- ML model predicts renewal likelihood score (0-100%)
- Identifies at-risk customers based on:
  - Engagement levels
  - Support interactions
  - Payment history
  - Coverage satisfaction
  - Competitive market changes

**Automated Interventions:**
- Low engagement: Personalized outreach campaign
- High risk score: Assign to retention specialist
- Price-sensitive: Proactive discount offers
- Coverage concerns: Schedule review with agent

**Renewal Dashboard (Internal):**
- List of upcoming renewals with risk scores
- Automated task assignments
- Renewal pipeline metrics
- Win/loss tracking

**Technical Requirements:**
- ML model trained on historical renewal data
- Integration with CRM for task management
- Automated email/SMS workflows
- A/B testing framework for renewal messaging

---

## Technical Architecture

### System Components

**Frontend:**
- Modern web application (React/Next.js recommended)
- Mobile-responsive design
- Progressive Web App (PWA) capabilities
- Real-time chat interface

**Backend:**
- API Gateway
- Microservices architecture:
  - User Management Service
  - Quote Engine Service
  - Policy Management Service
  - Payment Processing Service
  - Document Generation Service
  - Notification Service
- Database: PostgreSQL for structured data, MongoDB for documents
- File Storage: AWS S3 or similar for document storage
- Queue System: Redis/RabbitMQ for async processing

**AI/ML Components:**
- LLM Integration (GPT-4, Claude, or similar) for:
  - Document parsing
  - Quote generation
  - Policy document generation
  - Customer support chatbot
- OCR Engine: For document scanning
- NLP Pipeline: For intent detection and entity extraction
- Recommendation Engine: For coverage suggestions

**Integrations:**
- Payment Gateway (Stripe, Square)
- E-signature (DocuSign, HelloSign)
- Email Service (SendGrid, AWS SES)
- SMS Service (Twilio)
- Analytics (Mixpanel, Amplitude)

**Security & Compliance:**
- SOC 2 Type II compliance
- Data encryption at rest and in transit
- Role-based access control (RBAC)
- Audit logging
- PII data protection
- State insurance regulation compliance
- GDPR/CCPA compliance for data privacy

### Data Model

**Key Entities:**
- Users/Clients
- Business Profiles
- Quote Requests
- Quotes
- Policies
- Payments
- Claims
- Documents
- Chat Messages
- Notifications

---

## Development Phases

### Phase 1: MVP (Months 1-3)
**Core Features:**
- Landing page and basic marketing pages
- 5-step quote request flow (manual input)
- Phone-based registration with SMS verification (US only)
- User authentication and session management
- User dashboard with quote status tracking
- Sandbox quote generation API
- Basic quote presentation
- Email and SMS notifications
- Admin dashboard for reviewing quotes

**Success Criteria:**
- End-to-end quote request flow functional (including registration)
- SMS verification working reliably (>95% delivery rate)
- Can generate and present simulated quotes
- Secure user authentication with phone + password
- Dashboard displays real-time quote processing status

### Phase 2: Purchase & Policy Issuance (Months 4-5)
**Features:**
- Quote comparison and selection
- Payment integration
- E-signature capture
- AI-powered policy document generation
- Policy delivery and COI generation
- User dashboard with policy management

**Success Criteria:**
- Complete purchase flow operational
- Policy documents generated automatically
- Payment processing functional

### Phase 3: AI Enhancement (Months 6-7)
**Features:**
- Document upload and AI parsing
- AI-powered chat support
- AI coverage recommendations
- Intelligent quote analysis
- Natural language query for policy information

**Success Criteria:**
- 80%+ accuracy on document parsing
- 70%+ of support questions handled by AI
- Measurable improvement in conversion with recommendations

### Phase 4: Retention & Renewal (Months 8-9)
**Features:**
- Renewal notification system
- Renewal flow optimization
- Predictive renewal analytics
- Customer retention campaigns
- Loyalty program
- Multi-policy management

**Success Criteria:**
- Automated renewal reminders sent
- >70% renewal rate
- Measurable reduction in lapse rate

### Phase 5: Carrier Integration (Months 10-12)
**Features:**
- Real carrier API integrations
- Live quote comparison
- Direct bind capabilities
- Real-time policy issuance
- Claims integration
- Agent portal for complex cases

**Success Criteria:**
- At least 3 carrier integrations live
- Real quotes returned in <30 seconds
- Direct bind operational

---

## Success Metrics & KPIs

### Acquisition Metrics
- Landing page conversion rate (visitor → quote request)
- Quote request completion rate
- Time to complete quote request
- Quote request abandonment rate by step

### Conversion Metrics
- Quote-to-purchase conversion rate
- Average time from quote to purchase
- Multi-policy attachment rate
- Average policy premium

### Engagement Metrics
- User dashboard login frequency
- Chat utilization rate
- Document download frequency
- Self-service task completion rate

### Retention Metrics
- Renewal rate (overall and by cohort)
- Customer lifetime value (LTV)
- Net Promoter Score (NPS)
- Customer satisfaction score (CSAT)
- Churn rate and reasons

### Operational Metrics
- Average response time (chat)
- First contact resolution rate
- Agent escalation rate
- Quote generation time
- Policy issuance time

### Financial Metrics
- Customer acquisition cost (CAC)
- Revenue per user
- Gross written premium (GWP)
- Loss ratio (claims paid / premiums collected)
- Operating expense ratio

---

## Risk & Mitigation

### Risks

**1. Regulatory Compliance**
- Risk: Insurance is heavily regulated; non-compliance can result in fines or license revocation
- Mitigation: Engage insurance compliance counsel, obtain proper licenses in each state, implement compliance review process

**2. AI-Generated Content Accuracy**
- Risk: AI may generate incorrect policy information or quotes
- Mitigation: Human review layer for all AI-generated content, clear disclaimers, robust testing, version control for AI models

**3. Data Security & Privacy**
- Risk: Breach of sensitive customer data
- Mitigation: Enterprise-grade security, encryption, regular security audits, cyber insurance, incident response plan

**4. Carrier API Limitations**
- Risk: Carriers may not provide APIs or may have limitations
- Mitigation: Sandbox simulation layer, partnerships with MGAs, explore API-first carriers

**5. User Adoption**
- Risk: Users may not trust AI for insurance decisions
- Mitigation: Emphasize human oversight, provide agent escalation, build trust through transparency, strong branding

**6. Quote Accuracy (Sandbox Phase)**
- Risk: Simulated quotes may not reflect real market prices
- Mitigation: Train LLM on real market data, regular calibration, clear communication this is an estimate

---

## Future Enhancements

### Short-term (6-12 months)
- Mobile app (iOS/Android)
- Spanish language support
- Integration with accounting software (QuickBooks, etc.)
- Broker/agent portal
- Referral program
- Advanced analytics dashboard

### Medium-term (12-24 months)
- Claims filing and management
- Real-time risk monitoring (integrations with telematics, IoT)
- Personal insurance expansion (home, auto, life)
- Additional commercial coverages
- Multi-state expansion
- White-label platform for agencies

### Long-term (24+ months)
- Predictive claims prevention
- Industry-specific insurance packages
- Parametric insurance products
- Global expansion
- Embedded insurance partnerships
- Open insurance API platform

---

## Appendix

### A. Insurance Terms Glossary
(To be populated with common insurance terms used in the platform)

### B. State-Specific Requirements
(To be documented for each state where Clarence operates)

### C. Carrier Integration Specifications
(To be completed as carrier partnerships are established)

### D. AI Model Documentation
(Details on AI models used, training data, accuracy metrics)

### E. Compliance Checklist
(State-by-state licensing and compliance requirements)

---

## Document Control

**Version:** 1.0  
**Date:** November 6, 2025  
**Author:** Product Team  
**Status:** Draft  
**Next Review:** November 20, 2025  

**Revision History:**
- v1.0 (Nov 6, 2025): Initial PRD creation

---

## Approval

This PRD requires approval from:
- [ ] Product Lead
- [ ] Engineering Lead
- [ ] Legal/Compliance
- [ ] CEO


