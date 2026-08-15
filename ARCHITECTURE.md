# M-Pesa StockBook Architecture

M-Pesa StockBook uses a **local-first React Native architecture** so core inventory and sales functions remain available without an internet connection. The app intentionally does not require an account, external payment credential, or server-side synchronization for its initial version.

| Layer | Responsibility | Main implementation |
|---|---|---|
| Presentation | Portrait mobile screens, stack navigation, tabs, forms, feedback | Expo Router and reusable native components |
| State domain | Business profile, catalog, stock, sales, expenses, credit, M-Pesa records, settings | `lib/stockbook/types.ts` and `lib/stockbook/store.tsx` |
| Business rules | KSh calculations, stock alerts, payment mix, credit balances, transaction timeline | `lib/stockbook/calculations.ts` |
| Persistence | Encrypted transport is not needed because data stays on-device; values persist between launches | AsyncStorage under a versioned local key |
| Import and export | Read a user-selected CSV/JSON, write shareable CSV/JSON/PDF to temporary storage | Expo Document Picker, FileSystem, Print, and Sharing |
| Validation | Prevent negative values, accidental negative stock, missing credit customer, duplicate M-Pesa codes | Store-level checks and form alerts |

## Data Relationships

Products are referenced by sale items and stock adjustments. Sale items retain **price and product-name snapshots**, so older sales stay understandable even if a product is edited later. A credit sale may reference a customer, while credit payments reference the customer and reduce the derived outstanding balance. M-Pesa imports remain separate from sales until a user explicitly matches a transaction to a sale.

## Important Business Rules

| Rule | Behavior |
|---|---|
| Sale stock update | Saving a sale deducts each item quantity; deleting that sale restores those quantities. |
| Estimated profit | Sale total less snapshot cost of goods less expenses in the same reporting period. |
| Credit balance | Total credit sales for a customer less recorded payments. |
| M-Pesa deduplication | Imported transaction codes already present in local storage are skipped. |
| Data recovery | The user can export and restore a JSON backup from Settings. |
| Safety default | Negative stock is blocked unless the user consciously enables it in Settings. |

> The data model stores monetary values as numbers in Kenyan shillings. It is designed for small-business decision support and does not replace formal accounting, tax, or payment-provider records.
