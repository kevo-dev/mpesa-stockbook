import type { MpesaImportRow } from "../lib/stockbook/types";

type ConfigEnvironment = Record<string, string | undefined>;

const REQUIRED_CONFIGURATION = [
  "MPESA_CONSUMER_KEY",
  "MPESA_CONSUMER_SECRET",
  "MPESA_SHORT_CODE",
  "MPESA_NOMINATED_MSISDN",
  "MPESA_TOKEN_URL",
  "MPESA_PULL_QUERY_URL",
] as const;

export type MpesaConnectionStatus = {
  configured: boolean;
  missing: string[];
  shortCodeHint?: string;
  syncWindowHours: number;
  source: "Safaricom Daraja Pull Transactions";
};

type PullResponse = Record<string, unknown>;

function environment(source: ConfigEnvironment = process.env): Record<(typeof REQUIRED_CONFIGURATION)[number], string | undefined> {
  return Object.fromEntries(REQUIRED_CONFIGURATION.map((key) => [key, source[key]?.trim()])) as Record<(typeof REQUIRED_CONFIGURATION)[number], string | undefined>;
}

function assertOfficialHttpsUrl(value: string, label: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error(`${label} must be a complete HTTPS URL from Safaricom Daraja.`); }
  if (url.protocol !== "https:" || !(url.hostname === "safaricom.co.ke" || url.hostname.endsWith(".safaricom.co.ke"))) {
    throw new Error(`${label} must use an official HTTPS Safaricom domain.`);
  }
  return url.toString();
}

function formatDarajaDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function value(record: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const current = record[key];
    if (typeof current === "string" && current.trim()) return current.trim();
    if (typeof current === "number" && Number.isFinite(current)) return String(current);
  }
  return undefined;
}

function toAmount(input: string | undefined): number {
  return Number((input ?? "0").replace(/[^0-9.-]/g, "")) || 0;
}

export function getMpesaConnectionStatus(source: ConfigEnvironment = process.env): MpesaConnectionStatus {
  const config = environment(source);
  const missing = REQUIRED_CONFIGURATION.filter((key) => !config[key]);
  const shortCode = config.MPESA_SHORT_CODE;
  return {
    configured: missing.length === 0,
    missing,
    shortCodeHint: shortCode ? `••••${shortCode.slice(-4)}` : undefined,
    syncWindowHours: 48,
    source: "Safaricom Daraja Pull Transactions",
  };
}

export function normalizePullTransaction(input: PullResponse): MpesaImportRow | null {
  const transactionCode = value(input, "transactionId", "TransactionID", "TransID", "transactionCode");
  const amount = toAmount(value(input, "amount", "Amount", "TransAmount"));
  if (!transactionCode || amount <= 0) return null;
  return {
    transactionCode,
    transactionDate: value(input, "trxDate", "TransactionDate", "date"),
    transactionTime: value(input, "trxTime", "TransactionTime", "time"),
    description: value(input, "sender", "Sender", "billreference", "BillRefNumber", "transactiontype"),
    amount,
    balance: toAmount(value(input, "balance", "Balance")) || undefined,
    phoneNumber: value(input, "msisdn", "MSISDN", "phoneNumber", "PhoneNumber"),
  };
}

export function normalizePullResponse(payload: unknown): MpesaImportRow[] {
  if (!payload || typeof payload !== "object") return [];
  const object = payload as Record<string, unknown>;
  const candidates = [object.transactions, object.Transactions, object.response, object.Response, object.data];
  const rows = candidates.find(Array.isArray) as unknown[] | undefined;
  if (!rows) return [];
  const unique = new Map<string, MpesaImportRow>();
  for (const row of rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const transaction = normalizePullTransaction(row as PullResponse);
    if (transaction) unique.set(transaction.transactionCode, transaction);
  }
  return [...unique.values()];
}

async function getAccessToken(config: ReturnType<typeof environment>): Promise<string> {
  const tokenUrl = assertOfficialHttpsUrl(config.MPESA_TOKEN_URL!, "MPESA_TOKEN_URL");
  const credential = Buffer.from(`${config.MPESA_CONSUMER_KEY}:${config.MPESA_CONSUMER_SECRET}`).toString("base64");
  const response = await fetch(tokenUrl, { method: "GET", headers: { Authorization: `Basic ${credential}`, Accept: "application/json" }, signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error("Daraja token request was rejected. Confirm the business credentials and environment.");
  const payload = await response.json() as { access_token?: unknown };
  if (typeof payload.access_token !== "string" || !payload.access_token) throw new Error("Daraja did not return an access token.");
  return payload.access_token;
}

export async function pullRecentMpesaTransactions(source: ConfigEnvironment = process.env, now = new Date()) {
  const status = getMpesaConnectionStatus(source);
  if (!status.configured) throw new Error("Live M-Pesa sync is not configured. Add the official Daraja values in project settings first.");
  const config = environment(source);
  const queryUrl = assertOfficialHttpsUrl(config.MPESA_PULL_QUERY_URL!, "MPESA_PULL_QUERY_URL");
  const start = new Date(now.getTime() - status.syncWindowHours * 60 * 60 * 1000);
  const accessToken = await getAccessToken(config);
  const response = await fetch(queryUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ShortCode: config.MPESA_SHORT_CODE, StartDate: formatDarajaDate(start), EndDate: formatDarajaDate(now), OffSetValue: 0 }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error("Daraja could not retrieve transactions. Confirm Pull Transactions is approved and the business C2B service is active.");
  const payload = await response.json();
  return { transactions: normalizePullResponse(payload), syncedAt: now.toISOString(), windowStart: start.toISOString(), windowEnd: now.toISOString() };
}
