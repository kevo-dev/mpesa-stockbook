import { describe, expect, it } from "vitest";
import { getMpesaConnectionStatus, normalizePullResponse, normalizePullTransaction } from "../server/mpesa";

describe("Daraja live-sync safety scaffold", () => {
  it("does not report a ready connection when official configuration is absent", () => {
    const status = getMpesaConnectionStatus({});
    expect(status.configured).toBe(false);
    expect(status.missing).toContain("MPESA_CONSUMER_SECRET");
    expect(status.shortCodeHint).toBeUndefined();
  });

  it("reports readiness without revealing the full business shortcode", () => {
    const status = getMpesaConnectionStatus({ MPESA_CONSUMER_KEY: "key", MPESA_CONSUMER_SECRET: "secret", MPESA_SHORT_CODE: "123456", MPESA_NOMINATED_MSISDN: "254700000000", MPESA_TOKEN_URL: "https://sandbox.safaricom.co.ke/oauth", MPESA_PULL_QUERY_URL: "https://sandbox.safaricom.co.ke/pull" });
    expect(status.configured).toBe(true);
    expect(status.shortCodeHint).toBe("••••3456");
  });

  it("normalizes documented C2B transaction fields and drops incomplete rows", () => {
    expect(normalizePullTransaction({ transactionId: "QKD2M3T9X", trxDate: "2026-08-15", msisdn: "254712345678", sender: "Customer payment", amount: "250.00" })).toMatchObject({ transactionCode: "QKD2M3T9X", transactionDate: "2026-08-15", amount: 250, phoneNumber: "254712345678" });
    expect(normalizePullTransaction({ transactionId: "NO-AMOUNT" })).toBeNull();
  });

  it("deduplicates a returned payload by M-Pesa transaction code before local import", () => {
    const transactions = normalizePullResponse({ response: [{ transactionId: "ABC1", amount: "100" }, { transactionId: "ABC1", amount: "100" }, { transactionId: "ABC2", amount: "150" }] });
    expect(transactions).toHaveLength(2);
    expect(transactions.map((transaction) => transaction.transactionCode)).toEqual(["ABC1", "ABC2"]);
  });
});
