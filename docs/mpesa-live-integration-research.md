# Official M-Pesa Live Integration Research

## Sources Reviewed

| Source | Relevant finding | URL |
|---|---|---|
| Safaricom Daraja Developer Portal | Safaricom’s official developer portal presents Daraja APIs for accepting and managing M-Pesa payments. | https://developer.safaricom.co.ke/ |
| Pull Transactions API | Safaricom describes Pull Transactions as a reconciliation tool for partners to query C2B transactions made under their PayBill or Till number. | https://developer.safaricom.co.ke/apis/PullTransaction |
| M-Pesa Business Developers page | The official business portal identifies C2B, reversal, and transaction-status query interactions as available API categories. | https://business.m-pesa.com/developers/ |

## Design Implications

The live feature must use the business owner’s official Daraja credentials and business shortcode rather than consumer statement credentials. The connection should be server-side so secrets never reach the mobile client. The first supported live source should be **C2B Pull Transactions** for a registered PayBill or Till, with local reconciliation based on the provider transaction code already used by the app’s CSV importer.

The app should not claim to provide an unrestricted consumer M-Pesa statement feed. Availability, scopes, live approval, callback requirements, and permitted business products must be confirmed in the owner’s Daraja account. A manual CSV import remains available as the offline fallback.

## Confirmed Pull Transactions Contract

Safaricom’s official page describes Pull Transactions as a **C2B reconciliation** mechanism for a registered PayBill or Till, not a general-purpose consumer statement connection. It can retrieve C2B transactions for a recent selected period, with the documentation describing a 48-hour window. The account must be live, have an existing C2B API integration, and have an appropriate business administrator or manager operator before production use.

The official documentation specifies a one-time registration `POST` at `https://sandbox.safaricom.co.ke/pulltransactions/v1/register` in sandbox and a separate transaction query after registration. It documents OAuth bearer-token authentication, a secure callback URL, a ShortCode, and a nominated organization MSISDN. The query request includes `ShortCode`, `StartDate`, `EndDate`, and `OffSetValue`. Its response identifies the transaction through `transactionId` and includes `trxDate`, `msisdn`, `sender`, `transactiontype`, `billreference`, and `amount`.

## StockBook Connection Architecture

| Component | Responsibility |
|---|---|
| Expo client | Displays connection readiness, allows a user to choose a period and initiate a sync, then imports newly received transactions into the existing local M-Pesa reconciliation queue. It never handles a Daraja key or secret. |
| Server-side adapter | Obtains a Daraja OAuth token, validates the configured shortcode and date period, calls the user-provided official query endpoint, and normalizes only expected C2B fields. |
| Project secrets | Hold the Daraja consumer key/secret, production or sandbox mode, registered shortcode, nominated MSISDN, callback URL, and the exact query URL supplied by Daraja. |
| Local store | Deduplicates by M-Pesa transaction code, preserving the existing CSV import, matching queue, and local-first data model. |

> The query URL is kept as a configuration value rather than hard-coded from a third-party source. The owner must copy the endpoint received from their official Daraja live onboarding materials, which avoids a guessed production endpoint and allows Safaricom changes to be made without a mobile release.

## Sources

1. Safaricom, “Pull Transactions.” https://developer.safaricom.co.ke/apis/PullTransaction
2. Safaricom, “Daraja 3.0.” https://developer.safaricom.co.ke/
3. M-Pesa Business, “Developers.” https://business.m-pesa.com/developers/
