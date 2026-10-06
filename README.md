# M-Pesa StockBook

A local-first React Native / Expo stock, sales and cashflow companion for small businesses in Kenya.

## Product focus
- Products, stock levels and stock adjustments
- Sales with cash, M-Pesa and credit payment mixes
- Customer credit and payment history
- Expenses and closing summaries
- Reports and estimated profit
- CSV M-Pesa statement import with column mapping and duplicate protection
- JSON backup and restore
- Optional secure Daraja pull-transaction integration
- Offline-first local persistence

## Architecture
Expo Router handles navigation, reusable React Native components provide the UI, a local domain store holds business state, calculation helpers contain business rules, and AsyncStorage provides on-device persistence.

See ARCHITECTURE.md for data relationships and business rules.

## Data safety
M-Pesa CSV files are parsed locally on the device. Imported transaction codes are normalized and checked so duplicate imports are skipped. Live Daraja sync is disabled until required server configuration is present and requires an authenticated session.

The app is independent of Safaricom. It does not replace formal accounting, tax records or payment-provider records.

## Development
Requirements: Node.js, pnpm 9.x, Expo tooling, and an Android/iOS development environment for native testing.

Install:
```bash
pnpm install
```

Quality checks:
```bash
pnpm check
pnpm lint
pnpm test
```

Run Expo web:
```bash
pnpm dev:metro
```

Run Android:
```bash
pnpm android
```

## QA status
QA_REPORT.md records successful TypeScript checking, linting and deterministic business-logic tests. Physical-device validation remains the final release checkpoint for native document picker, sharing, PDF and responsive layout behavior.

## Project positioning
This project demonstrates practical mobile product engineering: local-first architecture, Kenyan payment workflows, import/reconciliation logic, business rules, defensive validation and production-minded QA.
