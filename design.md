# M-Pesa StockBook — Mobile Interface Design

## Product Intent

M-Pesa StockBook is a calm, practical daily companion for Kenyan small-business owners. The interface prioritizes speedy, reliable recordkeeping over accounting jargon. The most frequent action—recording a sale—should remain reachable within one thumb tap from the primary dashboard. All monetary values are shown in Kenyan shillings as `KSh 1,250`.

## Mobile Design Principles

The app is designed for a portrait 9:16 phone held in one hand. Primary actions sit in the lower half of screens or in an easy-to-reach floating action button. Screens use large type, high-contrast figures, short labels, 44 pt or larger controls, clear validation, and a consistent tab bar. The visual language follows mainstream iOS conventions while remaining straightforward and readable on Android.

## Color Choices

| Token | Color | Intended use |
|---|---:|---|
| Stockbook Green | `#0B6E4F` | Primary action, selected controls, positive emphasis |
| Deep Ink | `#172B25` | Primary text and strong figures |
| Cream Canvas | `#F7F7F2` | Quiet screen background |
| Paper Surface | `#FFFFFF` | Cards, sheets, and forms |
| Warm Gold | `#D79C2F` | M-Pesa, cautions, and low-stock attention states |
| Receipt Coral | `#C8533E` | Errors, destructive actions, and overdue credit |
| Fresh Mint | `#E6F5EE` | Soft success and positive-value backgrounds |
| Border Gray | `#DDE5DF` | Separators and inactive controls |

## Screen List and Primary Content

| Screen | Primary content | Main functionality |
|---|---|---|
| Welcome / onboarding | Three benefit-focused panels and progress dots | Skip, Next, and Get Started actions |
| Business setup | Business profile form with language placeholder | Save offline profile and opening cash balance |
| Dashboard | Date, sales, profit, expenses, payment breakdown, low-stock count, stock value, activity | Rapid navigation, Close Today summary, record a sale |
| Record sale | Search, product results, basket, quantity stepper, payment method, discount and note | Add multiple items, validate stock, save a sale, reduce stock, share receipt |
| Sale success | Clear confirmation and receipt total | Start a new sale or share the receipt |
| Products | Search, category chips, sort/filter tools and product list | Add, edit, duplicate, archive/delete, and adjust stock |
| Product editor | Practical fields including costs, price, quantity, threshold and supplier | Validate non-negative values and surface calculated margins |
| Expenses | Today/week/month totals, categories and expense rows | Add, edit, view or delete an expense |
| Transactions | Unified timeline of sales, expenses, stock changes and credit events | Filter by period, type and payment method; open transaction details |
| Transaction details | Timestamp, payment information, notes, linked goods, totals | Safely edit/delete and maintain accurate stock adjustments |
| Credit book | Outstanding, customer count, overdue credit and credit sales | Add customer, record payment, mark paid, call/message only after user action |
| Customer detail | Contact, balance, payment history and note | Record a partial payment or resolve a balance |
| Reports | Period selector, simple charts and key metrics | View daily/monthly snapshots, export, and share reports |
| M-Pesa import | Informational consent, picker, detected fields, mapping and preview | Import user-supplied CSV, deduplicate codes, manually match sales |
| Settings | Profile, currency, language placeholder, display preference, data tools and support | Export/import a data backup and confirm destructive clearing |
| Close Today | Readable closing figures and low-stock warnings | Share an end-of-day summary without changing data |

## Navigation Model

The bottom tab bar includes **Home**, **Products**, **Sales**, **Activity**, and **More**. The centered Sales tab uses a prominent raised affordance. More holds Credit Book, Reports, M-Pesa Import, and Settings. Detail views open as native-style stack screens; short, focused edits open as bottom sheets or full-screen forms when the keyboard needs room.

## Key User Flows

1. **First setup:** Welcome → onboarding panels → business profile → Dashboard with a small, explicitly identified sample-data starter set.
2. **Record a sale:** Dashboard or Sales tab → search product → add quantity to basket → choose Cash, M-Pesa, or Credit → review total → Save Sale → success receipt → optional share or New Sale.
3. **Manage stock:** Products → search/filter product → open product → Adjust Stock → provide adjustment amount and reason → confirm → activity timeline updates.
4. **Review daily performance:** Dashboard → Close Today → review sales, expenses, estimated profit, payment mix, items sold, and low-stock count → share summary.
5. **Handle credit:** More → Credit Book → customer → Add Payment → record amount, payment method, and note → balance decreases and activity updates.
6. **Import an M-Pesa statement:** More → M-Pesa Import → choose a CSV → check detected column mappings and preview → import non-duplicates → optionally open matching queue to link a transaction to a sale.

## Content and Interaction Details

Cards use a 16 pt radius with modest elevation and generous interior padding. Important figures use tabular, bold numerals. Key commands have text labels in addition to familiar icons, helping less technical users. Disabled save actions explain what needs fixing, rather than silently preventing progress. Destructive operations use a confirmation dialog that names the affected record. All profit values are labeled as **estimated** and reports retain the formal-accounting disclaimer.

