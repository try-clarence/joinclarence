# Next.js Build Prompt for Clarence Insurance Platform

## Complete Screen Inventory

### Public Screens (Unauthenticated)

1. **Landing Page** (`/`)
   - Header with navigation
   - Hero section with animated elements
   - Value proposition cards (Personal & Business)
   - Social proof/testimonials section
   - Footer

2. **Quote Request Flow** (`/quote/*`)
   - `/quote/step-1` - Insurance Needs (New Coverage vs Renewal)
   - `/quote/step-2` - Business Basics (with document upload)
   - `/quote/step-3` - Business Details (size, location, risk info)
   - `/quote/step-4` - Coverage Selection (multiple coverage types)
   - `/quote/step-5` - Review & Submit (confirmation)

3. **Registration Screen** (`/register`)
   - Phone number entry
   - SMS verification (6-digit code)
   - Password creation with strength indicator
   - Account creation

### Authenticated Screens (Require Login)

4. **Dashboard** (`/dashboard`)
   - Quote in progress state
   - Quotes ready state
   - Recent activity
   - Quick actions
   - Sidebar navigation

5. **My Quotes** (`/quotes`)
   - `/quotes` - List view (all quote requests with status)
   - `/quotes/[id]` - Quote detail view
   - Quote comparison modal
   - Filter & sort functionality

6. **Quote Comparison** (`/quotes/[id]/compare`)
   - Side-by-side quote comparison
   - Coverage details comparison
   - Select quotes for purchase

7. **My Policies** (`/policies`)
   - `/policies` - List view (active, expiring, expired)
   - `/policies/[id]` - Policy detail view with tabs
   - `/policies/[id]/certificate` - COI generator modal
   - Payment summary

8. **Documents** (`/documents`)
   - Document list with filters
   - Upload interface (drag & drop)
   - Document viewer
   - Share & download functionality

9. **Chat Interface** (`/chat` or widget)
   - Full chat view
   - Minimized widget (available on all pages)
   - Clarence AI assistant conversations
   - Inline action buttons

10. **Settings** (`/settings`)
    - `/settings/profile` - Personal & business information
    - `/settings/security` - Password, 2FA, sessions
    - `/settings/notifications` - Email, SMS, push preferences
    - `/settings/billing` - Payment methods, history, invoices

11. **Help Center** (`/help`)
    - `/help` - Main help page with search
    - `/help/articles/[slug]` - Individual article view
    - `/help/categories/[category]` - Category listing
    - Quick action cards

12. **Purchase Flow** (`/purchase/*`)
    - `/purchase/payment` - Payment method selection
    - `/purchase/review` - Final review & e-signature
    - `/purchase/success` - Purchase confirmation

---

## Prompt for Cursor/Claude AI Code Generation

```markdown
# TASK: Build Clarence Insurance Platform in Next.js 15 (App Router)

I need you to build a complete, production-ready insurance platform based on the detailed UI specifications in @UI_SCREEN_SPECIFICATIONS.md. This is a comprehensive implementation that should be modern, accessible, and follow best practices.

## PROJECT OVERVIEW

**Platform Name:** Clarence Insurance Platform
**Type:** Insurance quote aggregation and policy management
**Target Users:** Individuals and businesses seeking insurance coverage
**Key Differentiator:** AI-powered quote comparison across multiple carriers

## TECHNICAL STACK REQUIREMENTS

### Core Framework
- **Next.js 15** with App Router (not Pages Router)
- **TypeScript** (strict mode enabled)
- **React 18+** with Server Components where appropriate

### Styling & UI
- **Tailwind CSS 4** for styling
- **shadcn/ui** for base component library
- **Framer Motion** for animations (hero section, transitions)
- **Lucide React** for icons
- Follow the design system specified in lines 17-135 of @UI_SCREEN_SPECIFICATIONS.md

### State Management & Data
- **Zustand** for client state management
- **React Query (TanStack Query)** for server state
- **Zod** for schema validation
- **React Hook Form** for form handling

### Authentication & Security
- **NextAuth.js v5** for authentication
- JWT tokens with refresh token rotation
- Phone (SMS) verification using a mock service initially
- Password strength validation

### File Upload & Storage
- **uploadthing** or **AWS S3** for file storage
- Support PDF, CSV, XLSX, images
- AI document parsing placeholder (can be mocked initially)

### Payments
- **Stripe** integration (test mode)
- Support credit/debit cards and ACH
- Payment plans (monthly, quarterly, annual)

### Other Libraries
- **date-fns** for date manipulation
- **react-pdf** for document viewing
- **signature_pad** for e-signatures
- **recharts** for data visualization (if needed)

## DESIGN SYSTEM IMPLEMENTATION

### Colors (CSS Variables)
Implement exactly as specified in lines 19-44:
```css
--primary-blue: #0066FF;
--primary-blue-dark: #0052CC;
--primary-blue-light: #E6F0FF;
--neutral-900: #1A1A1A;
--neutral-700: #4A4A4A;
--neutral-500: #9CA3AF;
--neutral-300: #D1D5DB;
--neutral-100: #F3F4F6;
--neutral-50: #F9FAFB;
--success-green: #10B981;
--warning-yellow: #F59E0B;
--error-red: #EF4444;
--info-blue: #3B82F6;
--accent-pink: #EC4899;
--accent-purple: #8B5CF6;
```

### Typography
- Font family: Inter (from Google Fonts)
- Font sizes and weights as specified in lines 46-69
- Implement responsive typography

### Spacing
- Use 8px base unit system (lines 71-85)
- Consistent spacing across all components

## PROJECT STRUCTURE

```
clarence-platform/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 # Landing page
│   │   ├── quote/
│   │   │   ├── step-1/page.tsx
│   │   │   ├── step-2/page.tsx
│   │   │   ├── step-3/page.tsx
│   │   │   ├── step-4/page.tsx
│   │   │   └── step-5/page.tsx
│   │   └── register/page.tsx
│   ├── (authenticated)/
│   │   ├── dashboard/page.tsx
│   │   ├── quotes/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── policies/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── documents/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── settings/
│   │   │   ├── profile/page.tsx
│   │   │   ├── security/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── billing/page.tsx
│   │   └── help/
│   │       ├── page.tsx
│   │       └── articles/[slug]/page.tsx
│   ├── purchase/
│   │   ├── payment/page.tsx
│   │   ├── review/page.tsx
│   │   └── success/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── quotes/route.ts
│   │   ├── policies/route.ts
│   │   ├── documents/route.ts
│   │   └── chat/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navigation.tsx
│   ├── forms/
│   │   ├── QuoteForm.tsx
│   │   ├── RegistrationForm.tsx
│   │   └── PaymentForm.tsx
│   ├── quote/
│   │   ├── QuoteCard.tsx
│   │   ├── QuoteComparison.tsx
│   │   └── CoverageSelector.tsx
│   ├── policy/
│   │   ├── PolicyCard.tsx
│   │   ├── PolicyDetail.tsx
│   │   └── COIGenerator.tsx
│   ├── chat/
│   │   ├── ChatWidget.tsx
│   │   ├── ChatMessage.tsx
│   │   └── ChatInput.tsx
│   └── shared/
│       ├── ProgressBar.tsx
│       ├── StatusBadge.tsx
│       ├── FileUpload.tsx
│       └── DocumentViewer.tsx
├── lib/
│   ├── auth.ts
│   ├── api.ts
│   ├── utils.ts
│   ├── validators.ts
│   └── constants.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useQuotes.ts
│   ├── usePolicies.ts
│   └── useChat.ts
├── store/
│   ├── authStore.ts
│   ├── quoteStore.ts
│   └── uiStore.ts
├── types/
│   ├── quote.ts
│   ├── policy.ts
│   ├── user.ts
│   └── index.ts
└── public/
    ├── images/
    └── fonts/
```

## SCREEN-BY-SCREEN IMPLEMENTATION GUIDE

### 1. Landing Page (`app/(public)/page.tsx`)

**Requirements:**
- Sticky header with navigation (see lines 184-188)
- Hero section with animated elements (see lines 190-195)
- Two value proposition cards with CTAs (see lines 196-201)
- Testimonial carousel (see lines 203-207)
- Fully responsive

**Key Features:**
- Smooth scroll to sections
- Hover animations on cards
- Animated pink circle behind hero text
- Testimonial carousel on mobile

**Components to create:**
- `HeroSection.tsx`
- `ValuePropCard.tsx`
- `TestimonialCarousel.tsx`
- `CTAButton.tsx`

### 2. Quote Request Flow (5 Steps)

**Step 1: Insurance Needs** (`app/(public)/quote/step-1/page.tsx`)
- See specification lines 213-258
- Two selection cards: "New Coverage" vs "Renewal Help"
- Progress indicator showing step 1/5
- Next button disabled until selection

**Step 2: Business Basics** (`app/(public)/quote/step-2/page.tsx`)
- See specification lines 260-329
- File upload with drag-and-drop (PDF, CSV, XLSX)
- Form fields: business name, DBA, legal structure, etc.
- AI extraction progress indicator (can be mocked)

**Step 3: Business Details** (`app/(public)/quote/step-3/page.tsx`)
- See specification lines 331-382
- Annual revenue, employees, years in business
- Address fields with validation
- Risk information (existing coverage, claims history)

**Step 4: Coverage Selection** (`app/(public)/quote/step-4/page.tsx`)
- See specification lines 385-427
- Grid of coverage cards (3 columns desktop, 1 mobile)
- Badges: Recommended (yellow), Required (red)
- Info tooltips on hover
- Multiple selection allowed

**Step 5: Review & Submit** (`app/(public)/quote/step-5/page.tsx`)
- See specification lines 430-490
- Summary of all entered information
- Edit buttons to go back to specific steps
- Confirmation checkbox
- Submit button with loading state

**Implementation Notes:**
- Use Zustand store to persist form data across steps
- Implement browser back/forward navigation
- Save progress to localStorage
- Form validation with Zod schemas
- Progress bar component showing 1-5 steps

### 3. Registration Screen (`app/(public)/register/page.tsx`)

**Requirements:** (lines 493-567)
- Phone number input with US formatting
- SMS verification with 6-digit code input
- Countdown timer (10 minutes)
- Password creation with real-time strength indicator
- Requirements checklist with checkmarks

**Implementation:**
- Use React Hook Form for each section
- Mock SMS service initially (log code to console)
- Password strength: zxcvbn library
- Auto-advance on verification code input

### 4. Dashboard (`app/(authenticated)/dashboard/page.tsx`)

**Two States:**

**State 1: Quote in Progress** (lines 570-606)
- Progress card with percentage
- Estimated completion time
- "What Happens Next" timeline
- Quick action buttons

**State 2: Quotes Ready** (lines 608-643)
- Success card with quote summary
- Quote details and pricing
- "View Quotes" CTA
- Recent activity timeline

**Sidebar Navigation** (lines 645-660)
- Slide-out menu
- Icons for each section
- Active state highlighting
- Logout button

### 5. My Quotes (`app/(authenticated)/quotes/page.tsx`)

**List View** (lines 1004-1073)
- Status badges (Ready ✅, In Progress 🔄, Action Required ⚠️, Expired)
- Quote cards with summary info
- Filter dropdown (All, Ready, In Progress, etc.)
- Sort options (Date, Price, Status)
- "New Quote" button

**Detail View** (`app/(authenticated)/quotes/[id]/page.tsx`)
- Lines 1075-1121
- Coverage summary
- Filter by coverage type, carrier
- Sort by price
- Quote cards (reuse from Quote Comparison section)
- Compare checkbox
- Export PDF button

### 6. Quote Comparison

**Regular View** (lines 664-721)
- Quote cards with carrier info, pricing, coverage limits
- "Best Value" badge
- Expandable key highlights
- Compare checkbox + Select button

**Comparison Mode** (lines 723-752)
- Side-by-side table view (up to 3 quotes)
- Row-by-row feature comparison
- Sticky header
- Select buttons for each quote

### 7. My Policies

**List View** (`app/(authenticated)/policies/page.tsx`)
- Lines 1135-1205
- Policy cards with status indicators
- Active vs expiring vs expired states
- Quick actions (View, Certificate, Renew, Payment)
- Payment summary section

**Detail View** (`app/(authenticated)/policies/[id]/page.tsx`)
- Lines 1207-1296
- Tabs: Overview, Coverage, Documents, Claims
- Policy status card
- Carrier information
- Coverage summary
- Premium & payments section
- Quick actions grid

**COI Generator** (lines 1298-1343)
- Modal component
- Form for certificate holder info
- Additional options (Additional Insured, Waiver, etc.)
- Preview button
- Generate & download PDF

### 8. Documents (`app/(authenticated)/documents/page.tsx`)

**Requirements:** (lines 1356-1446)
- Document cards with metadata
- Filter by type, policy
- Search functionality
- Drag-and-drop upload
- Actions: View, Download, Share
- Document viewer modal with PDF support

### 9. Chat Interface

**Full View** (`app/(authenticated)/chat/page.tsx`)
- Lines 916-979
- Message list (Clarence vs User)
- Typing indicator
- Message input with attachment
- Inline action buttons in messages
- Timestamp display

**Widget Component** (lines 981-988)
- Floating button (bottom right)
- Unread count badge
- Minimized/maximized states
- Available on all authenticated pages

### 10. Settings (4 Tabs)

**Profile Tab** (`app/(authenticated)/settings/profile/page.tsx`)
- Lines 1450-1510
- Photo upload with crop
- Personal information form
- Business information form
- Auto-save with toast notification

**Security Tab** (`app/(authenticated)/settings/security/page.tsx`)
- Lines 1512-1569
- Password change form
- 2FA toggle with QR code
- Active sessions list
- Sign out buttons

**Notifications Tab** (`app/(authenticated)/settings/notifications/page.tsx`)
- Lines 1571-1630
- Email notification toggles
- SMS notification options
- Push notification settings
- Save preferences button

**Billing Tab** (`app/(authenticated)/settings/billing/page.tsx`)
- Lines 1632-1692
- Payment methods list
- Add/edit/remove payment methods
- Billing address
- Payment history table
- Invoices & tax documents

### 11. Help Center

**Main Page** (`app/(authenticated)/help/page.tsx`)
- Lines 1706-1787
- Search bar with autocomplete
- Quick action cards
- Popular topics (expandable)
- Browse all topics grid
- Contact information

**Article View** (`app/(authenticated)/help/articles/[slug]/page.tsx`)
- Lines 1789-1847
- Article content with rich formatting
- Breadcrumb navigation
- Actions: Print, Email, Bookmark
- Feedback (thumbs up/down)
- Related articles
- Still need help? CTAs

### 12. Purchase Flow

**Payment** (`app/purchase/payment/page.tsx`)
- Lines 758-821
- Selection summary with pricing
- Payment plan options (radio buttons)
- Payment method (card vs ACH)
- Stripe integration
- Billing address
- Auto-renew checkbox

**Review** (`app/purchase/review/page.tsx`)
- Lines 823-877
- Final review of policies
- Terms and conditions (scrollable)
- Agreement checkbox
- E-signature (typed or drawn)
- Signature pad component

**Success** (`app/purchase/success/page.tsx`)
- Lines 879-912
- Success icon animation
- Policy numbers issued
- Effective dates
- Next steps
- Download & dashboard CTAs

## RESPONSIVE DESIGN

**Breakpoints** (lines 1864-1900):
```css
Mobile: 320px - 767px
Tablet: 768px - 1023px
Desktop: 1024px+
```

**Mobile Adjustments:**
- Hamburger menu navigation
- Bottom nav bar for key actions
- Single column forms
- Touch-friendly targets (min 44px)
- Swipe gestures for carousels
- Full-screen chat
- Stacked dashboard cards

## ACCESSIBILITY REQUIREMENTS (lines 1903-1929)

**WCAG 2.1 AA Compliance:**
- Color contrast ratios (4.5:1 for text)
- Keyboard navigation for all interactive elements
- Visible focus indicators
- ARIA labels and landmarks
- Semantic HTML
- Alt text for images
- Form label associations
- Error messages linked to fields

## DATA MODELS & TYPES

### Quote Type
```typescript
interface Quote {
  id: string;
  userId: string;
  status: 'in_progress' | 'ready' | 'action_required' | 'expired';
  businessInfo: {
    legalName: string;
    dba?: string;
    legalStructure: string;
    industry: string;
    website?: string;
    description: string;
    annualRevenue: number;
    yearsInBusiness: number;
    employees: {
      fullTime: number;
      partTime: number;
      contractors: number;
    };
    address: Address;
  };
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  coverageTypes: string[];
  quotes: QuoteOption[];
  requestedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

interface QuoteOption {
  id: string;
  carrier: Carrier;
  coverageType: string;
  monthlyPrice: number;
  annualPrice: number;
  limits: {
    perOccurrence: number;
    aggregate: number;
    deductible: number;
  };
  highlights: string[];
  recommended: boolean;
}
```

### Policy Type
```typescript
interface Policy {
  id: string;
  userId: string;
  quoteId: string;
  policyNumber: string;
  carrier: Carrier;
  coverageType: string;
  status: 'active' | 'expiring_soon' | 'expired' | 'cancelled';
  effectiveDate: Date;
  expirationDate: Date;
  premium: {
    annual: number;
    paymentPlan: 'monthly' | 'quarterly' | 'annual';
    paymentAmount: number;
    nextPaymentDate: Date;
  };
  limits: PolicyLimits;
  documents: Document[];
}
```

## API ROUTES TO IMPLEMENT

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/verify-phone` - Send SMS code
- `POST /api/auth/verify-code` - Verify SMS code
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Quotes
- `POST /api/quotes` - Create quote request
- `GET /api/quotes` - List user's quotes
- `GET /api/quotes/[id]` - Get quote details
- `POST /api/quotes/[id]/compare` - Compare quotes
- `GET /api/quotes/[id]/export` - Export to PDF

### Policies
- `GET /api/policies` - List user's policies
- `GET /api/policies/[id]` - Get policy details
- `POST /api/policies/[id]/certificate` - Generate COI
- `POST /api/policies/[id]/payment` - Make payment

### Documents
- `GET /api/documents` - List documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/[id]` - Get document
- `POST /api/documents/[id]/share` - Generate share link

### Chat
- `POST /api/chat` - Send message (streaming response)
- `GET /api/chat/history` - Get chat history

### Payments
- `POST /api/payment/create-intent` - Create Stripe payment intent
- `POST /api/payment/confirm` - Confirm payment
- `GET /api/payment/history` - Payment history

## MOCK DATA

For initial development, create mock data generators:
- Mock carriers (4: Reliable, TechShield, Premier, FastBind)
- Mock quotes (varying prices and coverage)
- Mock policies
- Mock documents
- Mock chat responses (simple keyword matching)

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1)
- Project setup with Next.js 15
- Design system implementation
- Base component library (shadcn/ui)
- Authentication flow
- Layout components (Header, Footer, Sidebar)

### Phase 2: Public Screens (Week 2)
- Landing page
- Quote request flow (all 5 steps)
- Registration screen
- Form validation and state management

### Phase 3: Dashboard & Quotes (Week 3)
- Dashboard (both states)
- My Quotes (list & detail)
- Quote comparison
- Quote selection

### Phase 4: Policies & Documents (Week 4)
- My Policies (list & detail)
- COI generator
- Documents page
- Document viewer

### Phase 5: Purchase Flow (Week 5)
- Payment screen with Stripe
- Review & e-signature
- Success screen
- Payment processing

### Phase 6: Settings & Help (Week 6)
- All settings tabs
- Help center
- Chat interface
- Search functionality

### Phase 7: Polish & Testing (Week 7)
- Responsive design refinement
- Accessibility audit
- Performance optimization
- Error handling
- Loading states

## QUALITY STANDARDS

### Code Quality
- TypeScript strict mode
- ESLint + Prettier
- Component composition over inheritance
- Reusable hooks
- Proper error boundaries
- Loading and error states for all async operations

### Performance
- Server Components where possible
- Dynamic imports for large components
- Image optimization
- Code splitting
- Lazy loading

### Testing
- Unit tests for utilities and hooks
- Integration tests for critical flows
- E2E tests for quote and purchase flows
- Accessibility testing

### Documentation
- Component documentation
- API documentation
- README with setup instructions
- Environment variable documentation

## ENVIRONMENT VARIABLES

```env
# Database
DATABASE_URL=

# Authentication
NEXTAUTH_URL=
NEXTAUTH_SECRET=
JWT_SECRET=

# SMS (Twilio or similar)
SMS_API_KEY=
SMS_API_SECRET=

# File Upload
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=

# Payments
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=

# AI/LLM (for chat)
OPENAI_API_KEY=
```

## GETTING STARTED

1. Create Next.js project:
```bash
npx create-next-app@latest clarence-platform --typescript --tailwind --app --src-dir=false
```

2. Install dependencies:
```bash
npm install zustand @tanstack/react-query zod react-hook-form @hookform/resolvers
npm install next-auth@beta stripe @stripe/stripe-js
npm install framer-motion lucide-react date-fns
npm install uploadthing @uploadthing/react
npm install signature_pad react-pdf
npm install -D @types/node @types/react @types/react-dom
```

3. Set up shadcn/ui:
```bash
npx shadcn-ui@latest init
```

4. Install shadcn components:
```bash
npx shadcn-ui@latest add button input card select textarea dialog dropdown-menu tabs badge progress
```

## SUCCESS CRITERIA

A successful implementation will have:
✅ All 12 main screens fully functional
✅ Complete quote request flow (5 steps) with validation
✅ User authentication with phone verification
✅ Quote comparison and selection
✅ Policy management
✅ Document upload and viewing
✅ Payment integration (test mode)
✅ Chat interface (basic responses)
✅ Settings management
✅ Help center
✅ Fully responsive (mobile, tablet, desktop)
✅ WCAG 2.1 AA accessible
✅ Fast page loads (<3s on 3G)
✅ No console errors
✅ Clean, maintainable code

## ADDITIONAL NOTES

- Reference @UI_SCREEN_SPECIFICATIONS.md for exact layout and design details
- Use the ASCII wireframes as reference for component placement
- Follow the interactive elements specifications closely
- Implement all loading states, error states, and empty states
- Add subtle animations for better UX
- Include toast notifications for user actions
- Implement proper SEO metadata
- Add analytics events (placeholder)

---

**Start with Phase 1 and work through each phase systematically. Build each screen pixel-perfect to the specifications. Focus on creating a polished, production-ready application.**

**Remember:** Quality over speed. Each component should be reusable, well-typed, and thoroughly tested.
```

---

## Quick Reference: Screen-to-Route Mapping

| Screen Name | Route | Specification Lines | State |
|------------|-------|-------------------|-------|
| Landing Page | `/` | 138-209 | Public |
| Quote Step 1 | `/quote/step-1` | 213-258 | Public |
| Quote Step 2 | `/quote/step-2` | 260-329 | Public |
| Quote Step 3 | `/quote/step-3` | 331-382 | Public |
| Quote Step 4 | `/quote/step-4` | 385-427 | Public |
| Quote Step 5 | `/quote/step-5` | 430-490 | Public |
| Registration | `/register` | 493-567 | Public |
| Dashboard | `/dashboard` | 570-660 | Auth |
| My Quotes List | `/quotes` | 1004-1073 | Auth |
| Quote Detail | `/quotes/[id]` | 1075-1121 | Auth |
| Quote Comparison | `/quotes/compare` | 664-752 | Auth |
| My Policies List | `/policies` | 1135-1205 | Auth |
| Policy Detail | `/policies/[id]` | 1207-1296 | Auth |
| COI Generator | `/policies/[id]/certificate` | 1298-1343 | Auth |
| Documents | `/documents` | 1356-1446 | Auth |
| Chat | `/chat` | 916-999 | Auth |
| Settings Profile | `/settings/profile` | 1450-1510 | Auth |
| Settings Security | `/settings/security` | 1512-1569 | Auth |
| Settings Notifications | `/settings/notifications` | 1571-1630 | Auth |
| Settings Billing | `/settings/billing` | 1632-1692 | Auth |
| Help Center | `/help` | 1706-1787 | Auth |
| Help Article | `/help/articles/[slug]` | 1789-1847 | Auth |
| Purchase Payment | `/purchase/payment` | 758-821 | Auth |
| Purchase Review | `/purchase/review` | 823-877 | Auth |
| Purchase Success | `/purchase/success` | 879-912 | Auth |

**Total Screens:** 26 unique screens/pages
**Total Routes:** 26+ (including dynamic routes)

