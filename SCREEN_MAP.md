# Clarence Platform - Complete Screen Map & Navigation Flow

## Visual Screen Hierarchy

```
CLARENCE INSURANCE PLATFORM
│
├─── PUBLIC AREA (Unauthenticated) ─────────────────────────────────
│    │
│    ├── 🏠 Landing Page (/)
│    │   ├─→ [Get Personal Coverage] → Quote Flow
│    │   ├─→ [Get Business Coverage] → Quote Flow
│    │   ├─→ [My Account] → Login
│    │   └─→ [Speak to Agent] → Contact
│    │
│    ├── 📝 Quote Request Flow (/quote)
│    │   │
│    │   ├── Step 1: Insurance Needs (/quote/step-1)
│    │   │   └─→ Select: New Coverage or Renewal
│    │   │
│    │   ├── Step 2: Business Basics (/quote/step-2)
│    │   │   ├─→ Upload Document (optional)
│    │   │   └─→ Fill Basic Info
│    │   │
│    │   ├── Step 3: Business Details (/quote/step-3)
│    │   │   └─→ Revenue, Employees, Location
│    │   │
│    │   ├── Step 4: Coverage Selection (/quote/step-4)
│    │   │   └─→ Select Coverage Types
│    │   │
│    │   └── Step 5: Review & Submit (/quote/step-5)
│    │       └─→ [Submit] → Registration
│    │
│    ├── 🔐 Registration (/register)
│    │   ├─→ Phone Verification
│    │   ├─→ SMS Code Entry
│    │   └─→ Password Creation → Dashboard
│    │
│    └── 🔑 Login (/login)
│        └─→ Email/Phone + Password → Dashboard
│
│
├─── AUTHENTICATED AREA (Login Required) ───────────────────────────
│    │
│    ├── 📊 Dashboard (/dashboard)
│    │   ├─→ Quote in Progress Card
│    │   ├─→ Quotes Ready Card → My Quotes
│    │   ├─→ Recent Activity
│    │   └─→ Quick Actions
│    │       ├─→ [Chat with Clarence] → Chat
│    │       ├─→ [View My Info] → Settings
│    │       ├─→ [Get Another Quote] → Quote Flow
│    │       └─→ [Help Center] → Help
│    │
│    ├── 📋 My Quotes (/quotes)
│    │   │
│    │   ├── List View (/quotes)
│    │   │   ├─→ Ready to Review Cards
│    │   │   ├─→ In Progress Cards
│    │   │   ├─→ Action Required Cards
│    │   │   ├─→ Expired Cards
│    │   │   └─→ [+ New Quote] → Quote Flow
│    │   │
│    │   ├── Detail View (/quotes/[id])
│    │   │   ├─→ Filter & Sort
│    │   │   ├─→ View All Quotes
│    │   │   ├─→ [Compare Selected] → Comparison
│    │   │   ├─→ [Select Quote] → Purchase Flow
│    │   │   └─→ [Export PDF]
│    │   │
│    │   └── Comparison Modal (/quotes/[id]/compare)
│    │       ├─→ Side-by-Side View
│    │       └─→ [Select] → Purchase Flow
│    │
│    ├── 📄 My Policies (/policies)
│    │   │
│    │   ├── List View (/policies)
│    │   │   ├─→ Active Policies
│    │   │   ├─→ Expiring Soon
│    │   │   ├─→ Expired/Cancelled
│    │   │   └─→ Payment Summary
│    │   │
│    │   ├── Detail View (/policies/[id])
│    │   │   ├─→ Tab: Overview
│    │   │   ├─→ Tab: Coverage
│    │   │   ├─→ Tab: Documents → Documents Page
│    │   │   ├─→ Tab: Claims
│    │   │   ├─→ [Get Certificate] → COI Generator
│    │   │   ├─→ [Make Payment] → Payment
│    │   │   ├─→ [Download Policy]
│    │   │   └─→ [File Claim]
│    │   │
│    │   └── COI Generator Modal (/policies/[id]/certificate)
│    │       ├─→ Certificate Holder Form
│    │       ├─→ Additional Options
│    │       ├─→ [Preview]
│    │       └─→ [Generate PDF]
│    │
│    ├── 📁 Documents (/documents)
│    │   ├─→ Filter by Type/Policy
│    │   ├─→ Search Documents
│    │   ├─→ Upload New Document
│    │   ├─→ [View] → Document Viewer
│    │   ├─→ [Download]
│    │   └─→ [Share] → Generate Link
│    │
│    ├── 💬 Chat (/chat)
│    │   ├─→ Full Chat View
│    │   ├─→ Message History
│    │   ├─→ Inline Actions
│    │   │   ├─→ [Generate Certificate] → COI Generator
│    │   │   └─→ [View Policy] → Policy Detail
│    │   └─→ Chat Widget (Global)
│    │       ├─→ Minimized (bottom-right)
│    │       └─→ Maximized → Full Chat
│    │
│    ├── ⚙️ Settings (/settings)
│    │   │
│    │   ├── Profile Tab (/settings/profile)
│    │   │   ├─→ Personal Information
│    │   │   ├─→ Business Information
│    │   │   └─→ [Save Changes]
│    │   │
│    │   ├── Security Tab (/settings/security)
│    │   │   ├─→ Change Password
│    │   │   ├─→ Enable/Disable 2FA
│    │   │   ├─→ Active Sessions
│    │   │   └─→ [Sign Out Devices]
│    │   │
│    │   ├── Notifications Tab (/settings/notifications)
│    │   │   ├─→ Email Preferences
│    │   │   ├─→ SMS Preferences
│    │   │   ├─→ Push Preferences
│    │   │   └─→ [Save Preferences]
│    │   │
│    │   └── Billing Tab (/settings/billing)
│    │       ├─→ Payment Methods
│    │       ├─→ [Add Payment Method]
│    │       ├─→ Payment History
│    │       └─→ Invoices & Tax Docs
│    │
│    ├── 🆘 Help Center (/help)
│    │   │
│    │   ├── Main Page (/help)
│    │   │   ├─→ Search Help Articles
│    │   │   ├─→ [Chat with Clarence] → Chat
│    │   │   ├─→ [Schedule Call]
│    │   │   ├─→ [Email Us]
│    │   │   ├─→ Popular Topics
│    │   │   └─→ Browse All Topics
│    │   │
│    │   └── Article View (/help/articles/[slug])
│    │       ├─→ Article Content
│    │       ├─→ Related Articles
│    │       ├─→ Feedback (👍/👎)
│    │       └─→ [Chat with Support] → Chat
│    │
│    └── 🛒 Purchase Flow (/purchase)
│        │
│        ├── Payment (/purchase/payment)
│        │   ├─→ Selection Summary
│        │   ├─→ Payment Plan Selection
│        │   ├─→ Payment Method (Stripe)
│        │   ├─→ Billing Address
│        │   └─→ [Continue to Review]
│        │
│        ├── Review & Sign (/purchase/review)
│        │   ├─→ Final Review
│        │   ├─→ Terms & Conditions
│        │   ├─→ Agreement Checkbox
│        │   ├─→ E-Signature
│        │   └─→ [Confirm Purchase]
│        │
│        └── Success (/purchase/success)
│            ├─→ Policy Numbers
│            ├─→ Effective Dates
│            ├─→ [Download Policies]
│            └─→ [Go to Dashboard] → Dashboard
│
└─── END
```

## Navigation Access Matrix

| Screen | Public Access | Authenticated Access | Notes |
|--------|--------------|---------------------|-------|
| Landing Page | ✅ | ✅ | Always accessible |
| Quote Flow | ✅ | ✅ | Can start without login |
| Registration | ✅ | ❌ | After quote submission |
| Login | ✅ | ❌ | Redirects if logged in |
| Dashboard | ❌ | ✅ | Login required |
| My Quotes | ❌ | ✅ | Login required |
| My Policies | ❌ | ✅ | Login required |
| Documents | ❌ | ✅ | Login required |
| Chat | ❌ | ✅ | Login required |
| Settings | ❌ | ✅ | Login required |
| Help Center | ❌ | ✅ | Login required |
| Purchase Flow | ❌ | ✅ | Login + Quote selected |

## User Journey Maps

### Journey 1: First-Time Business Insurance Quote

```
Landing Page
    ↓ Click "Get Business Coverage"
Quote Step 1: Select "New Coverage"
    ↓ Click "Next"
Quote Step 2: Enter business basics + Upload doc
    ↓ Click "Next"
Quote Step 3: Enter detailed info
    ↓ Click "Next"
Quote Step 4: Select coverage types
    ↓ Click "Next"
Quote Step 5: Review & Submit
    ↓ Click "Submit Request"
Registration: Phone + SMS + Password
    ↓ Complete registration
Dashboard: "Quote in Progress" state
    ↓ Wait 2-4 hours
Dashboard: "Quotes Ready" notification
    ↓ Click "View Your Quotes"
My Quotes Detail: 9 quotes from 4 carriers
    ↓ Compare quotes
Quote Comparison: Side-by-side
    ↓ Select best quote
Purchase Payment: Enter payment
    ↓ Click "Continue to Review"
Purchase Review: Sign documents
    ↓ Click "Confirm Purchase"
Purchase Success: Policies issued
    ↓ Click "Go to Dashboard"
Dashboard: Welcome back!
```

### Journey 2: Returning User Managing Policies

```
Login Page
    ↓ Enter credentials
Dashboard
    ↓ Click "My Policies" in sidebar
My Policies List
    ↓ Click on a policy
Policy Detail
    ↓ Click "Get Certificate"
COI Generator Modal
    ↓ Enter certificate holder info
    ↓ Click "Generate"
Download PDF Certificate
    ↓ Close modal
Policy Detail
    ↓ Click "Documents" tab
Documents List
```

### Journey 3: User Needs Help

```
Any Page
    ↓ Click chat widget (bottom-right)
Chat Widget Expanded
    ↓ Type question
Clarence AI Response
    ↓ Click "View Help Article" in response
Help Article View
    ↓ Still need help?
    ↓ Click "Chat with Support"
Chat Full View
    ↓ Connect with human agent
```

### Journey 4: Policy Renewal

```
Email Notification: "Policy expiring in 30 days"
    ↓ Click link in email
Dashboard
    ↓ Notice "Renewal Available" badge
My Policies List
    ↓ Click "Review Renewal" on expiring policy
Quote Detail: Renewal quote
    ↓ Compare with current
    ↓ Accept renewal
Purchase Flow (Payment → Review → Success)
```

## Sidebar Navigation (Authenticated)

**Available on all authenticated pages:**

```
╔════════════════════╗
║ [≡] Menu           ║
╠════════════════════╣
║ 🏠 Dashboard       ║ → /dashboard
║ 📋 My Quotes       ║ → /quotes
║ 📄 My Policies     ║ → /policies
║ 💬 Chat            ║ → /chat
║ 📊 Documents       ║ → /documents
║ ⚙️ Settings        ║ → /settings/profile
║ 🆘 Help            ║ → /help
╠════════════════════╣
║ 🚪 Log Out         ║ → /login
╚════════════════════╝
```

**Mobile:** Hamburger menu (top-left)
**Desktop:** Always visible (collapsible)

## Header Navigation (Authenticated)

```
┌──────────────────────────────────────────────┐
│ [≡] Clarence      [🔍]    [🔔2]  [👤 John]  │
│                                              │
│ Dropdown menu:                               │
│   • Dashboard                                │
│   • My Account → Settings                    │
│   • Help Center                              │
│   • Log Out                                  │
└──────────────────────────────────────────────┘
```

## Top-Level Routes

```
/                           Landing Page
/quote/step-1               Quote Step 1
/quote/step-2               Quote Step 2
/quote/step-3               Quote Step 3
/quote/step-4               Quote Step 4
/quote/step-5               Quote Step 5
/register                   Registration
/login                      Login
/dashboard                  Dashboard
/quotes                     Quotes List
/quotes/[id]                Quote Detail
/quotes/[id]/compare        Quote Comparison
/policies                   Policies List
/policies/[id]              Policy Detail
/policies/[id]/certificate  COI Generator
/documents                  Documents
/chat                       Chat
/settings/profile           Settings Profile
/settings/security          Settings Security
/settings/notifications     Settings Notifications
/settings/billing           Settings Billing
/help                       Help Center
/help/articles/[slug]       Help Article
/purchase/payment           Purchase Payment
/purchase/review            Purchase Review
/purchase/success           Purchase Success
```

## Screen State Variations

### Dashboard
- **State 1:** Quote in Progress (shows progress bar)
- **State 2:** Quotes Ready (shows quote summary)
- **State 3:** Multiple Quotes (shows list)

### My Quotes List
- **Empty State:** No quotes yet
- **Loading State:** Fetching quotes
- **Error State:** Failed to load
- **With Data:** List of quote cards

### Policy Detail
- **Tab 1:** Overview (default)
- **Tab 2:** Coverage details
- **Tab 3:** Documents
- **Tab 4:** Claims history

### Chat Widget
- **Minimized:** Floating button with badge
- **Maximized:** Overlay panel
- **Full View:** Dedicated page

## Modal/Overlay Components

**Used Across Multiple Screens:**

1. **COI Generator Modal**
   - Triggered from: Policy Detail, Chat
   - Returns to: Previous screen

2. **Document Viewer Modal**
   - Triggered from: Documents, Policies
   - Shows: PDF with zoom/navigate

3. **Quote Comparison**
   - Triggered from: Quote Detail
   - Can be: Modal or dedicated view

4. **Confirmation Dialogs**
   - Used for: Delete, Cancel, Sign Out
   - Overlay with backdrop

5. **Chat Widget**
   - Global component
   - Available on all authenticated pages

## Mobile Bottom Navigation

**On mobile (<768px):**

```
┌─────────────────────────────────────┐
│  🏠       📋       💬       👤     │
│ Home   Quotes   Chat   Account    │
└─────────────────────────────────────┘
```

Links to:
- Home → Dashboard
- Quotes → My Quotes
- Chat → Chat
- Account → Settings

## Quick Action Shortcuts

**Available on Dashboard:**

```
┌────────────────────────────────────┐
│  💬 Chat with Clarence → /chat    │
│  📄 View My Info → /settings       │
│  ➕ Get Another Quote → /quote     │
│  ❓ Help Center → /help            │
└────────────────────────────────────┘
```

## Context Menus (⋮ More Actions)

**Policy Card:**
- View Policy → Policy Detail
- Get Certificate → COI Generator
- Make Payment → Payment
- Request Changes → Support
- Cancel Policy → Confirmation Dialog

**Quote Card:**
- View Details → Quote Detail
- Compare → Add to comparison
- Select → Purchase Flow
- Export PDF → Download

**Document Card:**
- View → Document Viewer
- Download → File download
- Share → Generate link
- Delete → Confirmation Dialog

---

## Summary Statistics

- **Total Screens:** 27 unique screens
- **Public Routes:** 8 routes
- **Authenticated Routes:** 19 routes
- **Navigation Levels:** 3 levels deep max
- **Modals/Overlays:** 5 reusable modals
- **Navigation Components:** 3 (Header, Sidebar, Bottom Nav)
- **User Journeys:** 4 primary paths
- **Average Clicks to Goal:** 3-5 clicks

---

**This screen map shows the complete navigation structure and user flows for the Clarence Insurance Platform. Use it as a reference when implementing routing and navigation logic.**

