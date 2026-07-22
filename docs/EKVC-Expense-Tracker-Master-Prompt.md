# Master Prompt: EKVC Club Expense Tracker & Dues Manager

Use this entire document as a single prompt to an AI coding tool (Claude Code, Cursor, etc.) to scaffold the full project in one go.

---

## 1. Project Overview

Build a **web app** called **"EKVC Ledger"** — a shared expense tracker and dues management system for a 14-member college go-kart racing club (EKVC Season 4). It has two purposes:

1. **Common pool ledger** — track money flowing in and out of the club's shared fund (sponsorships, member contributions, purchases, event costs).
2. **Individual dues tracking** — each member has a total amount they owe the club (e.g. ₹12,000 for the season). As they pay in installments, the system tracks running balance and generates a **billed receipt** for every payment (like an invoice: amount paid, date, balance remaining, paid to whom).

Only 14 specific people (all @skcet.ac.in emails) can access this app. 3 of them are Admins with full control; the other 11 are Members with read-only + "my dues" access.

---

## 2. Tech Stack (mandatory)

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend/Data:** Firebase — Firestore (database) + Firebase Auth (Google Sign-In) + Firebase Storage (receipt/bill image uploads)
- **Charts:** Recharts
- **PDF/Excel export:** `jspdf` + `jspdf-autotable` for PDF receipts and reports, `sheetjs (xlsx)` for Excel export
- **Hosting:** Firebase Hosting or Vercel — must produce a real deployable URL with a working build command

Keep the backend logic minimal (no separate Node/Express server needed) — do everything through Firestore rules + client SDK, since this must ship fast with low maintenance.

---

## 3. Authentication & Access Control

- **Login:** Google Sign-In only (Firebase Auth `GoogleAuthProvider`).
- **Domain restriction:** After sign-in, immediately check `user.email` ends with `@skcet.ac.in`. If not, sign the user out and show "Access restricted to SKCET college accounts."
- **Whitelist restriction:** Beyond domain check, only allow sign-in if the email exists in a Firestore `members` collection (pre-seeded with the 14 real emails by the admin). Anyone with a valid @skcet.ac.in email but NOT in that list should be denied with a clear "You are not a registered member of EKVC Ledger. Contact an admin." message.
- **Roles:** Each document in `members` has a `role` field: `"admin"` or `"member"`. Exactly 3 should be admins initially (seed data placeholder — I will fill in real names/emails later).
- **Firestore Security Rules:** Write actual rules enforcing:
  - Any authenticated + whitelisted user can `read` all collections (transactions, dues, categories, members — but never see other people's auth tokens etc.)
  - Only users with `role == "admin"` can `create`, `update`, `delete` in transactions, members, categories, dues collections.
  - No writes at all from unauthenticated or non-whitelisted users.

---

## 4. Data Model (Firestore Collections)

```
members/{memberId}
  - name, email, role ("admin" | "member"), joinedAt, totalDue (number, e.g. 12000), photoURL

categories/{categoryId}
  - name (e.g. "Kart Parts", "Fuel", "Travel", "Events", "Sponsorship"), createdBy, createdAt

transactions/{transactionId}     // common pool ledger
  - type ("credit" | "debit")
  - amount
  - categoryId
  - description
  - date
  - addedBy (admin uid)
  - receiptImageURL (optional, uploaded bill/proof)

dues_payments/{paymentId}        // individual member payments toward their totalDue
  - memberId
  - amount
  - date
  - method (Cash/UPI/Bank Transfer — simple dropdown)
  - collectedBy (admin uid)
  - note (optional)
  - receiptNumber (auto-incrementing, e.g. EKVC-0001)
```

Balance due per member = `member.totalDue - sum(dues_payments where memberId == member.id)`.

---

## 5. Core Features by Role

### Admins (3 people) — full CRUD
- Add / edit / delete common-pool transactions (credit or debit), each with category, description, date, and optional receipt photo upload.
- Add / edit / delete members, set/change each member's `totalDue`, promote/demote roles.
- Add / edit / delete categories.
- Record a dues payment for any member (amount, date, method) — this auto-generates a **billed receipt**.
- Access an admin dashboard with full financial overview.

### Members (11 people) — read-only
- View the full common-pool transaction ledger (read-only, cannot edit).
- View category-wise spending.
- View **their own** dues page: total due, total paid, balance remaining, full payment history, and can download/view each receipt.
- Cannot see edit/delete/add buttons anywhere.

---

## 6. Billed Receipt Module (important — build this carefully)

This is the core "who has paid how much" feature. Example scenario: total due per member is ₹12,000; a member has paid ₹6,500 so far in 2-3 installments.

When an admin records a payment:
1. Generate a **receipt** (both on-screen and downloadable as PDF) styled like a simple invoice, containing:
   - Club name/logo placeholder ("EKVC Season 4")
   - Receipt number (auto-incrementing, e.g. `EKVC-0001`)
   - Member name & email
   - Payment date
   - Amount paid (this transaction)
   - Payment method
   - **Total due**, **total paid till date**, **balance remaining** (clearly shown as a small summary table)
   - Collected by (admin name)
2. Store this receipt data in `dues_payments` so it can be regenerated/viewed anytime later.
3. On the member's "My Dues" page, show a running list of all their receipts with a "Download PDF" button on each, plus a progress bar (paid vs total due).
4. On the admin side, show a table of all 14 members with columns: Total Due | Paid | Balance | Status (Fully Paid / Partial / Not Paid) — sortable, with a "Record Payment" button per row.

---

## 7. Reporting & Extras

- **Dashboard (home page):** total pool balance (credits − debits), total dues collected vs pending across all members, a small line/bar chart of monthly cash flow, and a pie chart of spending by category (Recharts).
- **Excel export:** button to export the full transaction ledger and the dues summary table as `.xlsx`.
- **PDF export:** button to export a monthly summary report as PDF (not just individual receipts).
- **Receipt/bill image upload:** when admins add a debit transaction (e.g. bought kart parts), allow attaching a photo of the physical bill to Firebase Storage; show a thumbnail/link in the ledger.

---

## 8. Design Requirements — Minimalist, Clean White (strict)

This is not negotiable — no gimmicks, no clutter:

- **Background:** pure white (`#FFFFFF`) or off-white (`#FAFAFA`) everywhere. No gradients, no dark mode toggle needed.
- **Accent color:** exactly ONE accent color (pick a calm, confident color like a deep charcoal-blue or forest green — not neon, not multiple accent colors) used sparingly for buttons, links, and key numbers only.
- **Typography:** a single clean sans-serif font (Inter or system-ui). Clear hierarchy using weight and size, not color, for emphasis.
- **Layout:** generous whitespace, simple grid/card layouts, max content width (don't stretch full screen on large monitors), left sidebar or top nav — pick one, keep it simple.
- **No:** drop shadows beyond a very subtle 1px border/shadow, no rounded-pill buttons with heavy gradients, no emoji-heavy UI, no decorative illustrations, no animation flourishes. Micro-transitions (150ms fade/hover) are fine, nothing more.
- **Tables:** clean bordered/striped tables for the ledger and member lists — this is a finance app, it should look like a calm, trustworthy spreadsheet-meets-app, similar in spirit to Stripe Dashboard or Notion's simplicity — NOT like a colorful consumer app.
- **Mobile responsive:** must work cleanly on phones since members will mostly check "my dues" on mobile.

---

## 9. Pages / Routes

- `/login` — Google Sign-In button, restricted-access messaging
- `/` — Dashboard (role-aware: admins see full stats, members see summary + their own due status)
- `/ledger` — full transaction list (filter by category/date/type), add button visible only to admins
- `/members` — member list with due status (admin: full CRUD; member: view-only, redirected to their own dues if they try to view others in detail)
- `/my-dues` — personal dues + receipts (all members, shows only their own data)
- `/categories` — manage categories (admin only)
- `/reports` — monthly summary, charts, export buttons

---

## 10. Deliverables I want from you

1. Full working project scaffold (folder structure, all components, Firebase config placeholders).
2. Firestore security rules file, ready to paste into Firebase console.
3. Seed script or instructions to add the 14 members (I'll provide real names/emails).
4. Clear README with setup steps: creating the Firebase project, enabling Google Auth, setting authorized domain, deploying to Firebase Hosting/Vercel.
5. Keep the code clean and commented since I'm a student maintaining this myself — avoid over-engineering.

---

**Now build this project step by step, starting with the folder structure and Firebase setup, then the auth flow, then the ledger, then the dues/receipt module, then the dashboard/reports, styled per the design section above.**
