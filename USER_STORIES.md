# User Stories Backlog - Clarence Insurance Platform

## Epic 1: Quote Request Flow (Unauthenticated)

### Story 1.1: Landing Page Discovery
**As a** potential customer  
**I want to** understand what Clarence offers when I land on the homepage  
**So that** I can decide if it's the right insurance platform for me

**Acceptance Criteria:**
- [ ] Clear headline explaining Clarence is an AI-powered insurance agent
- [ ] Distinct paths for Personal vs Business insurance visible
- [ ] "Get Covered" and "Speak to Agent" CTAs are prominent
- [ ] Trust indicators (testimonials, ratings) visible below the fold
- [ ] Instant quote messaging visible in header

**Priority:** P0 (Must Have)  
**Story Points:** 5  
**Dependencies:** None

---

### Story 1.2: Business Insurance Path Selection
**As a** business owner  
**I want to** clearly indicate I need business insurance  
**So that** I see relevant coverage options and questions

**Acceptance Criteria:**
- [ ] Clicking "Get Business Coverage" takes me to Step 1 of quote flow
- [ ] URL updates to /get-quote/business
- [ ] Progress indicator shows I'm on Step 1 of 5
- [ ] Can return to homepage with back button

**Priority:** P0 (Must Have)  
**Story Points:** 3  
**Dependencies:** Story 1.1

---

### Story 1.3: Insurance Needs Assessment
**As a** business owner  
**I want to** specify if I need new coverage or renewal help  
**So that** the platform can tailor the experience to my situation

**Acceptance Criteria:**
- [ ] Two clear options presented: "New Coverage" and "Renewal Help"
- [ ] Selection is visually indicated with highlight/checkmark
- [ ] Descriptive text explains each option
- [ ] "Next" button is enabled after selection
- [ ] Can't proceed without making a selection

**Priority:** P0 (Must Have)  
**Story Points:** 3  
**Dependencies:** Story 1.2

---

### Story 1.4: Manual Business Information Entry
**As a** business owner  
**I want to** manually enter my business information  
**So that** I can provide accurate details for my quote

**Acceptance Criteria:**
- [ ] All required fields marked with asterisk (*)
- [ ] Real-time validation on blur for each field
- [ ] Legal Structure dropdown includes all common types (LLC, Corp, etc.)
- [ ] Primary Industry is searchable dropdown with NAICS codes
- [ ] Phone number auto-formats as user types
- [ ] FEIN validates as XX-XXXXXXX format
- [ ] Year fields validate reasonable ranges (1900-2025)
- [ ] "Previous" button returns to Step 1
- [ ] "Next" button disabled until all required fields valid

**Priority:** P0 (Must Have)  
**Story Points:** 8  
**Dependencies:** Story 1.3

---

### Story 1.5: Document Upload for Auto-Fill
**As a** business owner with existing coverage  
**I want to** upload my declaration page  
**So that** the system can pre-fill my information automatically

**Acceptance Criteria:**
- [ ] Drag-and-drop upload area visible
- [ ] Click to browse file option available
- [ ] Accepts PDF, PNG, JPG, CSV, XLS, XLSX formats
- [ ] Max file size 5MB enforced with clear error message
- [ ] Upload progress indicator shown
- [ ] After upload, AI extraction begins automatically
- [ ] Extracted data pre-fills form fields
- [ ] User can review and edit all extracted data
- [ ] "Download Sample Template" link works
- [ ] Can remove uploaded file and start over

**Priority:** P1 (Should Have)  
**Story Points:** 13  
**Dependencies:** Story 1.4

---

### Story 1.6: Financial Information Entry
**As a** business owner  
**I want to** provide my financial information  
**So that** underwriters can assess my risk and provide accurate quotes

**Acceptance Criteria:**
- [ ] All financial fields format as currency ($ and commas)
- [ ] Revenue/expense fields accept numeric input only
- [ ] Employee count fields accept whole numbers only
- [ ] Percentage field validates 0-100 range
- [ ] Warning shown if expenses > revenue by >20%
- [ ] All fields are required
- [ ] Previous/Next navigation works
- [ ] Data persists if user navigates back

**Priority:** P0 (Must Have)  
**Story Points:** 5  
**Dependencies:** Story 1.4

---

### Story 1.7: Coverage Type Selection
**As a** business owner  
**I want to** see all available coverage types  
**So that** I can select the ones I need

**Acceptance Criteria:**
- [ ] All 13 coverage types displayed in grid layout
- [ ] Each coverage shows icon, name, abbreviation
- [ ] Checkbox selection works for multiple coverages
- [ ] Info tooltip (?) shows detailed explanation
- [ ] Can select/deselect multiple coverages
- [ ] At least one coverage must be selected to proceed
- [ ] Selected coverages visually highlighted

**Priority:** P0 (Must Have)  
**Story Points:** 8  
**Dependencies:** Story 1.6

---

### Story 1.8: AI Coverage Recommendations
**As a** business owner unfamiliar with insurance  
**I want to** receive AI-powered coverage recommendations  
**So that** I don't miss important coverage for my industry

**Acceptance Criteria:**
- [ ] AI analyzes business type, industry, location from Step 2
- [ ] Recommended coverages show "Recommended" badge
- [ ] Required coverages show "Required by Law" badge
- [ ] Tooltip explains why each is recommended
- [ ] Recommendations appear on page load
- [ ] User can still select non-recommended coverages
- [ ] User can deselect recommended coverages (with warning)

**Priority:** P1 (Should Have)  
**Story Points:** 13  
**Dependencies:** Story 1.7, AI Model Integration

---

### Story 1.9: Final Details and Submission
**As a** business owner  
**I want to** add any additional comments and submit my quote request  
**So that** I can receive quotes tailored to my needs

**Acceptance Criteria:**
- [ ] Text area for additional comments (optional)
- [ ] Three confirmation checkboxes displayed
- [ ] All three checkboxes must be checked to enable submit
- [ ] Privacy Policy link opens in new tab
- [ ] "Submit Quote Request" button prominent
- [ ] Previous button returns to Step 4
- [ ] On submit, loading indicator appears
- [ ] On submit, all form data sent to backend
- [ ] On success, redirect to registration page

**Priority:** P0 (Must Have)  
**Story Points:** 5  
**Dependencies:** Story 1.7

---

## Epic 2: User Registration & Authentication

### Story 2.1: New User Phone Registration
**As a** new user who just submitted a quote request  
**I want to** create an account with my phone number  
**So that** I can track my quote and access my dashboard

**Acceptance Criteria:**
- [ ] Registration screen appears after Step 5 submission
- [ ] Phone number field with US format (XXX) XXX-XXXX
- [ ] Real-time validation for US phone numbers only
- [ ] Non-US numbers show error: "Currently only US numbers supported"
- [ ] Field auto-formats as user types
- [ ] Clear messaging: "Just one more step to see your quotes"
- [ ] "Already have an account? Log in" link visible
- [ ] Quote data persists during registration

**Priority:** P0 (Must Have)  
**Story Points:** 8  
**Dependencies:** Story 1.9

---

### Story 2.2: SMS Verification
**As a** new user  
**I want to** verify my phone number via SMS  
**So that** my account is secure

**Acceptance Criteria:**
- [ ] After entering phone, user clicks "Send Code"
- [ ] 6-digit verification code sent via SMS within 10 seconds
- [ ] Code input field displayed
- [ ] Code expires after 10 minutes
- [ ] "Resend code" link available after 60 seconds
- [ ] Max 3 resend attempts enforced
- [ ] Correct code verification happens in real-time
- [ ] Invalid code shows error with attempts remaining
- [ ] After 3 failed attempts, 15-minute lockout enforced
- [ ] Success state moves to password creation

**Priority:** P0 (Must Have)  
**Story Points:** 13  
**Dependencies:** Story 2.1, SMS Service Integration

---

### Story 2.3: Password Creation
**As a** new user  
**I want to** create a secure password  
**So that** my account and quotes are protected

**Acceptance Criteria:**
- [ ] Password field with visibility toggle (show/hide)
- [ ] Minimum 8 characters enforced
- [ ] Must include uppercase, lowercase, number, special character
- [ ] Real-time password strength indicator (weak/medium/strong)
- [ ] Specific feedback on missing requirements
- [ ] Confirm password field matches original
- [ ] "Remember me" checkbox (optional)
- [ ] "Create Account" button enabled when all requirements met
- [ ] On success, user auto-logged in
- [ ] Redirect to dashboard immediately

**Priority:** P0 (Must Have)  
**Story Points:** 8  
**Dependencies:** Story 2.2

---

### Story 2.4: Returning User Login
**As a** returning user  
**I want to** log in when I try to register with my existing phone  
**So that** my new quote request is added to my existing account

**Acceptance Criteria:**
- [ ] System detects phone number already registered
- [ ] Message displayed: "Welcome back! This number is already registered."
- [ ] SMS verification skipped, password field shown instead
- [ ] "Forgot password?" link available
- [ ] Successful login merges new quote with account
- [ ] Dashboard shows all quote requests (old and new)
- [ ] Failed login shows "Incorrect password" error
- [ ] Account locks after 5 failed attempts

**Priority:** P0 (Must Have)  
**Story Points:** 8  
**Dependencies:** Story 2.3

---

### Story 2.5: Forgot Password Flow
**As a** returning user who forgot my password  
**I want to** reset my password via SMS  
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] "Forgot password?" link takes to reset page
- [ ] User enters registered phone number
- [ ] SMS verification code sent
- [ ] User enters code to verify identity
- [ ] After verification, new password creation screen shown
- [ ] Same password requirements as registration
- [ ] Success message: "Password reset successfully"
- [ ] Auto-login after reset
- [ ] Security email sent to registered email address

**Priority:** P1 (Should Have)  
**Story Points:** 8  
**Dependencies:** Story 2.4

---

## Epic 3: Dashboard & Quote Status

### Story 3.1: Dashboard First View
**As a** newly registered user  
**I want to** see my quote processing status immediately  
**So that** I know my request is being handled

**Acceptance Criteria:**
- [ ] Welcome message: "Welcome to Clarence, [First Name]!"
- [ ] Quote status card prominently displayed
- [ ] Status shows "Quote in Progress" with animated loader
- [ ] Message: "We're analyzing your information..."
- [ ] Estimated time: "You'll receive quotes within 2-4 hours"
- [ ] Timestamp of submission shown
- [ ] "What Happens Next" section explains process
- [ ] Email confirmation message shown
- [ ] Logout option available

**Priority:** P0 (Must Have)  
**Story Points:** 5  
**Dependencies:** Story 2.3

---

### Story 3.2: Quote Ready Notification
**As a** user waiting for quotes  
**I want to** be notified when my quotes are ready  
**So that** I can review them promptly

**Acceptance Criteria:**
- [ ] Email notification sent when quotes ready
- [ ] SMS notification sent (if opted in)
- [ ] Dashboard notification badge appears
- [ ] Status card updates to "Quotes Ready"
- [ ] "View Your Quotes" CTA button appears
- [ ] Clicking button takes to quote comparison page
- [ ] Notification includes number of quotes received
- [ ] Email includes direct link to dashboard

**Priority:** P0 (Must Have)  
**Story Points:** 8  
**Dependencies:** Story 3.1, Notification Service

---

### Story 3.3: Multiple Quote Requests View
**As a** user with multiple quote requests  
**I want to** see all my requests in the dashboard  
**So that** I can track each one separately

**Acceptance Criteria:**
- [ ] Dashboard shows list of all quote requests
- [ ] Each request shows: date, coverage types, status
- [ ] Requests sorted by date (newest first)
- [ ] Can filter by status (In Progress, Ready, Accepted, Expired)
- [ ] Can click each request to see details
- [ ] Expired quotes (>30 days) marked clearly
- [ ] Can request new quote from dashboard

**Priority:** P1 (Should Have)  
**Story Points:** 8  
**Dependencies:** Story 3.1

---

## Epic 4: Quote Generation & Comparison

### Story 4.1: Sandbox Quote Generation (Backend)
**As a** system  
**I want to** generate realistic insurance quotes using AI  
**So that** users can see accurate pricing during sandbox phase

**Acceptance Criteria:**
- [ ] API endpoint accepts quote request data
- [ ] AI model analyzes business risk factors
- [ ] Generates 3-5 quotes per coverage type
- [ ] Quotes vary by 5-15% for realism
- [ ] Response time 2-5 seconds per quote
- [ ] Quotes include: premium, limits, deductibles, highlights
- [ ] State-specific pricing adjustments applied
- [ ] Industry-specific risk factors considered
- [ ] Quotes stored in database
- [ ] Quote IDs generated in format CLR-YYYY-XXXXXX

**Priority:** P0 (Must Have)  
**Story Points:** 21  
**Dependencies:** LLM Integration, Risk Model

---

### Story 4.2: Quote Comparison View
**As a** user  
**I want to** compare multiple quotes side-by-side  
**So that** I can choose the best option for my business

**Acceptance Criteria:**
- [ ] Quotes grouped by coverage type
- [ ] Each quote shows carrier, premium, limits
- [ ] Annual and monthly premium options displayed
- [ ] Key highlights listed (3-5 bullets)
- [ ] "View Details" expands to show full coverage
- [ ] Can select up to 3 quotes for comparison
- [ ] Comparison view shows line-by-line details
- [ ] Price differences highlighted
- [ ] "Best Value" badge on AI-recommended quote
- [ ] Can toggle between coverage types

**Priority:** P0 (Must Have)  
**Story Points:** 13  
**Dependencies:** Story 4.1

---

### Story 4.3: AI Quote Recommendations
**As a** user unfamiliar with insurance pricing  
**I want to** see which quote is recommended for my needs  
**So that** I can make an informed decision

**Acceptance Criteria:**
- [ ] AI analyzes all quotes and business profile
- [ ] "Best for your needs" badge on recommended quote
- [ ] Explanation tooltip: why this is recommended
- [ ] Coverage gaps identified and highlighted
- [ ] Warning if user selects coverage without dependencies
- [ ] Total package pricing shown for multiple coverages
- [ ] Savings calculations shown if applicable

**Priority:** P1 (Should Have)  
**Story Points:** 13  
**Dependencies:** Story 4.2, AI Recommendation Engine

---

### Story 4.4: Quote Selection
**As a** user  
**I want to** select one or more quotes to purchase  
**So that** I can proceed to buy insurance

**Acceptance Criteria:**
- [ ] Can select multiple quotes (for different coverages)
- [ ] Selected quotes added to "cart"
- [ ] Total premium calculated and displayed
- [ ] Shows annual and monthly payment options
- [ ] Summary card shows all selected coverages
- [ ] "Proceed to Purchase" button enabled
- [ ] Can remove quotes from selection
- [ ] Can return to comparison view

**Priority:** P0 (Must Have)  
**Story Points:** 8  
**Dependencies:** Story 4.2

---

## Epic 5: Purchase & Payment

### Story 5.1: Coverage Customization
**As a** user  
**I want to** adjust coverage limits and deductibles before purchasing  
**So that** I get exactly the coverage I need

**Acceptance Criteria:**
- [ ] Can adjust coverage limits via dropdown or slider
- [ ] Can adjust deductibles via dropdown
- [ ] Premium recalculates in real-time
- [ ] Changes highlighted in summary
- [ ] Tooltips explain what each adjustment means
- [ ] Can reset to original quote
- [ ] "Continue to Payment" button updates with new price

**Priority:** P1 (Should Have)  
**Story Points:** 13  
**Dependencies:** Story 4.4

---

### Story 5.2: Payment Method Entry
**As a** user  
**I want to** enter my payment information securely  
**So that** I can purchase my insurance

**Acceptance Criteria:**
- [ ] Payment plan options: Pay in Full, Monthly, Quarterly
- [ ] Discount shown for Pay in Full option
- [ ] Payment methods: Credit/Debit, ACH/Bank, Check
- [ ] Secure card entry (Stripe Elements or similar)
- [ ] Card validation in real-time
- [ ] Billing address fields
- [ ] Auto-renewal toggle (opt-in/opt-out)
- [ ] All payment data encrypted
- [ ] PCI compliance maintained
- [ ] "Review Purchase" button enabled when valid

**Priority:** P0 (Must Have)  
**Story Points:** 13  
**Dependencies:** Story 5.1, Payment Gateway Integration

---

### Story 5.3: Final Review & E-Signature
**As a** user  
**I want to** review all details and sign electronically  
**So that** I can finalize my insurance purchase

**Acceptance Criteria:**
- [ ] Complete policy summary displayed
- [ ] Premium breakdown shown
- [ ] Effective and expiration dates clear
- [ ] Terms and conditions scrollable text
- [ ] E-signature capture (draw or type name)
- [ ] All required fields must be complete
- [ ] "Confirm Purchase" button prominent
- [ ] Can return to edit any section
- [ ] Loading state during processing
- [ ] Error handling for failed payments

**Priority:** P0 (Must Have)  
**Story Points:** 13  
**Dependencies:** Story 5.2, E-Signature Integration

---

### Story 5.4: Payment Processing
**As a** user  
**I want to** have my payment processed securely and quickly  
**So that** my coverage starts immediately

**Acceptance Criteria:**
- [ ] Payment processed via Stripe/payment gateway
- [ ] Processing time < 5 seconds
- [ ] Success confirmation shown immediately
- [ ] Receipt generated and emailed
- [ ] Payment confirmation number provided
- [ ] Failed payment shows clear error message
- [ ] Can retry payment on failure
- [ ] Refund policy clearly stated

**Priority:** P0 (Must Have)  
**Story Points:** 8  
**Dependencies:** Story 5.3, Payment Gateway

---

## Epic 6: Policy Issuance & Documents

### Story 6.1: AI Policy Document Generation
**As a** user who just purchased insurance  
**I want to** receive my policy documents immediately  
**So that** I have proof of coverage

**Acceptance Criteria:**
- [ ] LLM generates complete policy document
- [ ] Includes: declarations page, coverage forms, endorsements
- [ ] State-specific language included
- [ ] Business information accurately reflected
- [ ] Coverage details match purchased quote
- [ ] PDF formatted professionally
- [ ] Policy ID assigned (format: CLR-2025-XXXXXX)
- [ ] Generated within 30 seconds of purchase
- [ ] Stored securely in database
- [ ] Downloadable immediately

**Priority:** P0 (Must Have)  
**Story Points:** 21  
**Dependencies:** LLM Integration, PDF Generation

---

### Story 6.2: Policy Delivery
**As a** user  
**I want to** receive my policy documents via email and dashboard  
**So that** I can access them anytime

**Acceptance Criteria:**
- [ ] Policy PDF emailed immediately after purchase
- [ ] Email includes policy ID and effective date
- [ ] Welcome message in email
- [ ] Dashboard updated with active policy
- [ ] Policy accessible in document library
- [ ] Can download policy anytime
- [ ] Can print policy directly
- [ ] Confirmation page shows next steps

**Priority:** P0 (Must Have)  
**Story Points:** 5  
**Dependencies:** Story 6.1, Email Service

---

### Story 6.3: Certificate of Insurance (COI)
**As a** business owner  
**I want to** generate and download a certificate of insurance  
**So that** I can provide proof of coverage to clients/partners

**Acceptance Criteria:**
- [ ] "Generate COI" button in dashboard
- [ ] Auto-generated with business and coverage info
- [ ] Option to add additional insureds
- [ ] Option to add certificate holders
- [ ] Standard ACORD form format
- [ ] PDF download immediate
- [ ] Can generate multiple COIs
- [ ] Each COI tracked in system

**Priority:** P1 (Should Have)  
**Story Points:** 13  
**Dependencies:** Story 6.2, PDF Generation

---

## Epic 7: Customer Support Chat

### Story 7.1: AI Chat Interface
**As a** user  
**I want to** chat with an AI assistant  
**So that** I can get instant answers to my questions

**Acceptance Criteria:**
- [ ] Chat widget visible on all logged-in pages
- [ ] Minimizable and expandable
- [ ] Greeting message on first open
- [ ] Text input with send button
- [ ] Typing indicator when AI is responding
- [ ] Response time < 3 seconds
- [ ] Chat history saved and accessible
- [ ] Can attach images/documents
- [ ] Works on mobile and desktop

**Priority:** P1 (Should Have)  
**Story Points:** 13  
**Dependencies:** Chat UI Library, LLM Integration

---

### Story 7.2: Policy-Specific Questions
**As a** policyholder  
**I want to** ask questions about my specific policy  
**So that** I understand my coverage

**Acceptance Criteria:**
- [ ] AI has access to user's policy documents
- [ ] Can answer: "What does my GL cover?"
- [ ] Can answer: "When does my policy expire?"
- [ ] Can answer: "What's my deductible?"
- [ ] Cites specific policy sections in responses
- [ ] "Show me in my policy" link opens relevant page
- [ ] Handles follow-up questions with context
- [ ] Explains insurance terms in simple language

**Priority:** P1 (Should Have)  
**Story Points:** 21  
**Dependencies:** Story 7.1, RAG System for Policy Docs

---

### Story 7.3: Document Generation via Chat
**As a** user  
**I want to** request documents through chat  
**So that** I can quickly get what I need

**Acceptance Criteria:**
- [ ] Can request: "Generate a certificate of insurance"
- [ ] Can request: "Send me my policy"
- [ ] Can request: "I need proof of coverage"
- [ ] AI generates document and provides download link in chat
- [ ] Document also appears in document library
- [ ] Confirmation of what was generated
- [ ] Can specify details (e.g., certificate holder name)

**Priority:** P2 (Nice to Have)  
**Story Points:** 13  
**Dependencies:** Story 7.2, Document Generation

---

### Story 7.4: Escalation to Human Agent
**As a** user with a complex question  
**I want to** be connected to a human agent  
**So that** I can get personalized help

**Acceptance Criteria:**
- [ ] "Talk to human agent" button always available
- [ ] AI detects when it can't answer and suggests escalation
- [ ] Chat transferred with full context/history
- [ ] Agent sees all previous AI conversation
- [ ] Agent availability status shown
- [ ] If no agent available, option to schedule callback
- [ ] Email notification when agent responds
- [ ] Smooth handoff experience

**Priority:** P2 (Nice to Have)  
**Story Points:** 21  
**Dependencies:** Story 7.2, Agent Dashboard System

---

## Epic 8: Renewal & Retention

### Story 8.1: Renewal Notifications
**As a** policyholder  
**I want to** receive timely reminders about my policy renewal  
**So that** I don't accidentally let my coverage lapse

**Acceptance Criteria:**
- [ ] Notification at 90 days before expiration
- [ ] Notification at 60 days before expiration
- [ ] Notification at 45 days (with early renewal incentive)
- [ ] Notification at 30 days (with renewal quote)
- [ ] Notification at 15 days (urgent reminder)
- [ ] Notification at 7 days (final notice)
- [ ] Sent via email, SMS (if opted in), and dashboard
- [ ] Each notification has clear CTA
- [ ] Unsubscribe option available (with warning)

**Priority:** P1 (Should Have)  
**Story Points:** 8  
**Dependencies:** Notification Service, Cron Jobs

---

### Story 8.2: AI Renewal Assessment
**As a** policyholder  
**I want to** receive personalized renewal recommendations  
**So that** my coverage stays appropriate for my business

**Acceptance Criteria:**
- [ ] AI reviews policy 90 days before expiration
- [ ] Analyzes changes: revenue, employees, locations
- [ ] Identifies coverage gaps or over-coverage
- [ ] Generates renewal recommendations
- [ ] Proactive message: "Your business has grown..."
- [ ] Suggests new coverage types if applicable
- [ ] Shows updated premium estimate
- [ ] Dashboard shows renewal insights

**Priority:** P1 (Should Have)  
**Story Points:** 21  
**Dependencies:** AI Model, Business Change Detection

---

### Story 8.3: One-Click Renewal
**As a** policyholder satisfied with current coverage  
**I want to** renew with one click  
**So that** I can quickly maintain my coverage

**Acceptance Criteria:**
- [ ] "Renew with Current Coverage" button prominent
- [ ] Shows updated premium (if changed)
- [ ] Explains any price changes
- [ ] Requires payment method confirmation
- [ ] E-signature required
- [ ] New policy issued immediately
- [ ] Effective date is day after current expiration
- [ ] Confirmation email sent

**Priority:** P1 (Should Have)  
**Story Points:** 13  
**Dependencies:** Story 8.1, Payment System

---

### Story 8.4: Review & Update Renewal
**As a** policyholder whose business has changed  
**I want to** review and update my coverage during renewal  
**So that** I have appropriate protection

**Acceptance Criteria:**
- [ ] "Review & Update" option available
- [ ] Guided flow reviews current coverage
- [ ] Can update business information
- [ ] Can adjust coverage limits
- [ ] Can add/remove coverage types
- [ ] New quotes generated based on changes
- [ ] Can compare current vs new options
- [ ] "Confirm Renewal" finalizes changes

**Priority:** P1 (Should Have)  
**Story Points:** 13  
**Dependencies:** Story 8.3, Quote Generation

---

### Story 8.5: Loyalty & Retention Programs
**As a** long-term customer  
**I want to** be rewarded for my loyalty  
**So that** I feel valued and have a reason to stay

**Acceptance Criteria:**
- [ ] Claims-free discount applied automatically
- [ ] Multi-policy discount calculated
- [ ] Renewal discount increases each year (1%, 2%, 3%)
- [ ] Dashboard shows loyalty benefits earned
- [ ] "Your savings" section highlights discounts
- [ ] Referral program accessible
- [ ] Special perks for 3+ year customers
- [ ] Anniversary emails with thank you

**Priority:** P2 (Nice to Have)  
**Story Points:** 13  
**Dependencies:** Business Logic, Discount Engine

---

## Story Priority Legend
- **P0 (Must Have):** Critical for MVP launch
- **P1 (Should Have):** Important for full launch
- **P2 (Nice to Have):** Future enhancements

## Story Points Reference
- **1-3:** Simple task, < 1 day
- **5:** Moderate task, 1-2 days
- **8:** Complex task, 3-4 days
- **13:** Very complex, 5+ days
- **21:** Epic-level task, 1-2 weeks

---

**Total Story Count:** 48 user stories across 8 epics  
**MVP Stories (P0):** 24 stories  
**Estimated MVP Story Points:** 238 points (~30-40 weeks with 2-person team)


