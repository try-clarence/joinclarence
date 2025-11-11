# Complete Screen Inventory - Clarence Insurance Platform

## Overview
- **Total Screens:** 26 unique screens
- **Total Routes:** 26+ (including dynamic routes)
- **Public Screens:** 8 (unauthenticated access)
- **Authenticated Screens:** 18 (login required)

---

## 📋 All Screens List

### Public Screens (No Authentication Required)

#### 1. **Landing Page** - `/`
- **Purpose:** Marketing homepage with hero, value props, and social proof
- **Key Features:**
  - Sticky navigation header
  - Animated hero section
  - Personal vs Business coverage cards
  - Testimonial carousel
  - Footer with links

#### 2. **Quote Request Step 1** - `/quote/step-1`
- **Purpose:** Select insurance need (New Coverage vs Renewal)
- **Key Features:**
  - Progress bar (1/5)
  - Two selection cards
  - Next button validation

#### 3. **Quote Request Step 2** - `/quote/step-2`
- **Purpose:** Collect business basic information
- **Key Features:**
  - Document upload (PDF, CSV, XLSX)
  - AI extraction (optional)
  - Business name, structure, industry
  - Contact information

#### 4. **Quote Request Step 3** - `/quote/step-3`
- **Purpose:** Collect detailed business information
- **Key Features:**
  - Annual revenue, employees
  - Business location
  - Risk information
  - Claims history

#### 5. **Quote Request Step 4** - `/quote/step-4`
- **Purpose:** Select coverage types
- **Key Features:**
  - Coverage type grid (EB, GL, CPL, etc.)
  - Recommended/Required badges
  - Info tooltips
  - Multiple selection

#### 6. **Quote Request Step 5** - `/quote/step-5`
- **Purpose:** Review and submit quote request
- **Key Features:**
  - Summary of all info
  - Edit buttons for each section
  - Confirmation checkbox
  - Submit with loading state

#### 7. **Registration** - `/register`
- **Purpose:** Create account after quote submission
- **Key Features:**
  - Phone number entry (US only)
  - SMS verification (6-digit code)
  - Countdown timer
  - Password creation with strength meter
  - Requirements checklist

#### 8. **Login** - `/login`
- **Purpose:** Existing user login
- **Key Features:**
  - Email/phone + password
  - Remember me
  - Forgot password link
  - 2FA if enabled

---

### Authenticated Screens (Login Required)

#### 9. **Dashboard** - `/dashboard`
- **Purpose:** Central hub for user's insurance activities
- **Key Features:**
  - Welcome message
  - Quote in progress card (with progress %)
  - Quotes ready card (when completed)
  - Recent activity timeline
  - Quick action buttons
  - Sidebar navigation

#### 10. **My Quotes - List View** - `/quotes`
- **Purpose:** View all quote requests
- **Key Features:**
  - Status badges (Ready, In Progress, Action Required, Expired)
  - Quote cards with summary
  - Filter dropdown (All, Ready, etc.)
  - Sort options (Date, Price)
  - "New Quote" button

#### 11. **My Quotes - Detail View** - `/quotes/[id]`
- **Purpose:** View specific quote request and all quote options
- **Key Features:**
  - Quote request details
  - Coverage summary
  - Filter by coverage type, carrier
  - Sort by price
  - Multiple quote cards
  - Compare checkbox
  - Export PDF

#### 12. **Quote Comparison** - `/quotes/[id]/compare`
- **Purpose:** Compare multiple quotes side-by-side
- **Key Features:**
  - Side-by-side table (up to 3 quotes)
  - Feature comparison rows
  - Pricing comparison
  - Select buttons
  - Close comparison

#### 13. **My Policies - List View** - `/policies`
- **Purpose:** View all insurance policies
- **Key Features:**
  - Policy cards with status indicators
  - Active/Expiring/Expired sections
  - Quick actions (View, Certificate, Renew, Payment)
  - Payment summary
  - Filter and sort

#### 14. **My Policies - Detail View** - `/policies/[id]`
- **Purpose:** View detailed policy information
- **Key Features:**
  - Tabs: Overview, Coverage, Documents, Claims
  - Policy status card
  - Carrier information
  - Coverage summary with limits
  - Premium & payment details
  - Quick actions grid
  - Insured information

#### 15. **Certificate of Insurance Generator** - `/policies/[id]/certificate`
- **Purpose:** Generate COI for clients/vendors
- **Key Features:**
  - Certificate holder form
  - Additional options (Additional Insured, Waiver, etc.)
  - Description of operations
  - Policy selection checkboxes
  - Preview and Generate buttons
  - PDF download

#### 16. **Documents** - `/documents`
- **Purpose:** Manage all insurance documents
- **Key Features:**
  - Document cards with metadata
  - Filter by type, policy
  - Search functionality
  - Drag-and-drop upload
  - Actions: View, Download, Share
  - Folder organization
  - Document viewer modal

#### 17. **Chat - Full View** - `/chat`
- **Purpose:** Chat with Clarence AI assistant
- **Key Features:**
  - Message list (AI vs User)
  - Typing indicator
  - Message input with attachment
  - Inline action buttons
  - Timestamp display
  - Message history

#### 18. **Chat Widget** - (Available on all pages)
- **Purpose:** Quick access to Clarence AI
- **Key Features:**
  - Floating button (bottom right)
  - Unread count badge
  - Minimized/maximized states
  - Quick replies

#### 19. **Settings - Profile** - `/settings/profile`
- **Purpose:** Manage personal and business info
- **Key Features:**
  - Profile photo upload
  - Personal information form
  - Business information form
  - Auto-save with notifications

#### 20. **Settings - Security** - `/settings/security`
- **Purpose:** Manage account security
- **Key Features:**
  - Password change form
  - 2FA toggle with setup
  - Active sessions list
  - Sign out devices
  - Backup codes

#### 21. **Settings - Notifications** - `/settings/notifications`
- **Purpose:** Configure notification preferences
- **Key Features:**
  - Email notification toggles
  - SMS notification options
  - Push notification settings
  - Granular control by type
  - Save preferences

#### 22. **Settings - Billing** - `/settings/billing`
- **Purpose:** Manage payment methods and view billing
- **Key Features:**
  - Payment methods list
  - Add/edit/remove cards & bank accounts
  - Billing address
  - Payment history table
  - Invoices & tax documents
  - Download receipts

#### 23. **Help Center - Main** - `/help`
- **Purpose:** Self-service help and support
- **Key Features:**
  - Search bar with autocomplete
  - Quick action cards (Chat, Call, Email)
  - Popular topics expandable sections
  - Browse all topics
  - Contact information
  - Support hours

#### 24. **Help Center - Article** - `/help/articles/[slug]`
- **Purpose:** View individual help article
- **Key Features:**
  - Article content with rich formatting
  - Breadcrumb navigation
  - Actions: Print, Email, Bookmark
  - Feedback (thumbs up/down)
  - Related articles
  - Support CTAs

#### 25. **Purchase - Payment** - `/purchase/payment`
- **Purpose:** Enter payment information
- **Key Features:**
  - Selection summary with pricing
  - Payment plan options (Monthly, Quarterly, Annual)
  - Payment method (Card vs ACH)
  - Stripe integration
  - Billing address
  - Auto-renew checkbox
  - Continue to review

#### 26. **Purchase - Review & Sign** - `/purchase/review`
- **Purpose:** Final review and electronic signature
- **Key Features:**
  - Policy summary
  - Effective dates
  - Terms and conditions (scrollable)
  - Agreement checkbox
  - E-signature (typed or drawn)
  - Signature pad
  - Confirm purchase

#### 27. **Purchase - Success** - `/purchase/success`
- **Purpose:** Confirm successful purchase
- **Key Features:**
  - Success icon animation
  - Policy numbers issued
  - Effective/expiration dates
  - Next steps list
  - Download policies button
  - Go to dashboard button
  - Email confirmation notice

---

## 📊 Screen Categories

### By Function

**Quote Management (6 screens)**
- Quote Request Steps 1-5
- My Quotes List
- My Quotes Detail
- Quote Comparison

**Policy Management (4 screens)**
- My Policies List
- Policy Detail
- COI Generator
- Documents

**Account Management (5 screens)**
- Registration
- Login
- Settings (Profile, Security, Notifications, Billing)

**Purchase Flow (3 screens)**
- Payment
- Review & Sign
- Success

**Support & Help (3 screens)**
- Chat Full View
- Help Center Main
- Help Article

**Other (3 screens)**
- Landing Page
- Dashboard
- Chat Widget (overlay)

---

## 🎨 Design Patterns

### Navigation Patterns

**Public Pages:**
- Top navigation with logo and CTAs
- Footer with links

**Authenticated Pages:**
- Sidebar navigation (collapsible)
- Top bar with notifications and user menu
- Breadcrumbs for deep pages

### Common Components Used Across Screens

1. **Status Badges**
   - Used in: Quotes, Policies, Dashboard
   - States: Active, In Progress, Ready, Action Required, Expired, Cancelled

2. **Progress Bars**
   - Used in: Quote Request Flow, Dashboard
   - Shows completion percentage

3. **Card Components**
   - Used in: Dashboard, Quotes, Policies, Documents
   - Consistent styling with actions

4. **Form Components**
   - Used in: Quote Request, Registration, Settings, Purchase
   - Validation, error states, loading states

5. **File Upload**
   - Used in: Quote Request Step 2, Documents
   - Drag-and-drop, preview, remove

6. **Document Viewer**
   - Used in: Documents, Policies
   - PDF viewing with zoom and navigation

7. **Action Buttons**
   - Primary, Secondary, Outline, Danger
   - Loading and disabled states

8. **Modals/Dialogs**
   - Used in: COI Generator, Comparisons, Confirmations
   - Overlay with backdrop

---

## 📱 Responsive Behavior

### Mobile (320px - 767px)
- Hamburger menu
- Single column layouts
- Bottom navigation for key actions
- Swipe gestures for carousels
- Full-screen modals
- Touch-friendly targets (44px min)

### Tablet (768px - 1023px)
- Collapsible sidebar
- Two-column grids
- Larger forms
- Modal dialogs

### Desktop (1024px+)
- Full sidebar navigation
- Three-column grids
- Side-by-side comparisons
- Hover states and tooltips

---

## 🔐 Authentication Flow

```
Landing Page → Quote Request (Steps 1-5) → Registration → Dashboard
                                                    ↓
                                        Email Verification
                                                    ↓
                                            Phone Verification
                                                    ↓
                                            Password Creation
                                                    ↓
                                            Account Created
```

---

## 🛒 Purchase Flow

```
My Quotes → Quote Detail → Select Quote → Payment → Review & Sign → Success
                                              ↓
                                        Stripe Integration
                                              ↓
                                        Payment Processing
                                              ↓
                                        Policy Issuance
```

---

## 🎯 Key User Journeys

### 1. First-Time User Requesting Quote
1. Land on homepage
2. Click "Get Coverage"
3. Complete 5-step quote request
4. Register account with phone verification
5. Wait for quotes (view progress on dashboard)
6. Receive notification when ready
7. Compare quotes
8. Select and purchase

### 2. Existing User Managing Policies
1. Login to dashboard
2. Navigate to "My Policies"
3. View policy details
4. Generate COI for client
5. Download and share

### 3. User Getting Support
1. Click chat widget
2. Ask Clarence AI question
3. If needed, escalate to Help Center
4. Search or browse articles
5. Contact support if still stuck

---

## 📖 Specification Reference

All screens are fully specified in `UI_SCREEN_SPECIFICATIONS.md` with:
- ASCII wireframes showing layout
- Component specifications
- Interactive element details
- Form validation rules
- Loading/error/empty states
- Accessibility requirements
- Mobile responsive notes

**Line References:**
- Design System: Lines 17-135
- Landing Page: Lines 138-209
- Quote Flow: Lines 211-490
- Registration: Lines 493-567
- Dashboard: Lines 570-660
- Quote Comparison: Lines 664-752
- Purchase Flow: Lines 756-912
- Chat: Lines 916-999
- My Quotes: Lines 1002-1130
- My Policies: Lines 1133-1353
- Documents: Lines 1356-1446
- Settings: Lines 1449-1703
- Help: Lines 1706-1859
- Mobile: Lines 1862-1900
- Accessibility: Lines 1903-1929

---

## ✅ Implementation Checklist

Use this checklist when building:

### Foundation
- [ ] Design system CSS variables
- [ ] Component library setup (shadcn/ui)
- [ ] Typography and spacing
- [ ] Color palette
- [ ] Layout components

### Public Screens
- [ ] Landing page
- [ ] Quote request step 1
- [ ] Quote request step 2
- [ ] Quote request step 3
- [ ] Quote request step 4
- [ ] Quote request step 5
- [ ] Registration
- [ ] Login

### Authenticated Screens
- [ ] Dashboard (both states)
- [ ] My Quotes list
- [ ] My Quotes detail
- [ ] Quote comparison
- [ ] My Policies list
- [ ] Policy detail
- [ ] COI generator
- [ ] Documents
- [ ] Chat full view
- [ ] Settings profile
- [ ] Settings security
- [ ] Settings notifications
- [ ] Settings billing
- [ ] Help center main
- [ ] Help article

### Purchase Flow
- [ ] Payment screen
- [ ] Review & sign
- [ ] Success screen

### Components
- [ ] Chat widget (overlay)
- [ ] Sidebar navigation
- [ ] Status badges
- [ ] Progress bars
- [ ] File upload
- [ ] Document viewer
- [ ] Form components
- [ ] Modal dialogs

### Features
- [ ] Authentication (NextAuth)
- [ ] Phone verification (SMS)
- [ ] File upload (uploadthing)
- [ ] Payment processing (Stripe)
- [ ] E-signature
- [ ] PDF generation
- [ ] Search functionality
- [ ] Notifications

### Polish
- [ ] Responsive design
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Animations
- [ ] Accessibility
- [ ] Performance optimization
- [ ] SEO metadata

---

**Total Implementation Estimate:** 6-8 weeks for a team of 2-3 developers
**Lines of Code Estimate:** 15,000-20,000 lines (TypeScript/TSX)

