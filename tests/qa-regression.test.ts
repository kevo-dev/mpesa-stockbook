import { describe, expect, it } from "vitest";
import { customerHasOverdueCredit, toDateKey } from "../lib/stockbook/calculations";
import { mapMpesaRows } from "../lib/stockbook/csv";
import { demoState } from "../lib/stockbook/seed";
import { isRestorableStockbookState, localDateInputToIso, parseLocalDate } from "../lib/stockbook/validation";

describe("QA regression coverage", () => {
  it("uses the device-local calendar date instead of shifting dashboard days through UTC", () => {
    const localLateDate = new Date(2026, 7, 15, 23, 59, 0);
    expect(toDateKey(localLateDate)).toBe("2026-08-15");
  });

  it("accepts a valid local form date and rejects malformed or impossible dates", () => {
    expect(parseLocalDate("2026-02-28").getFullYear()).toBe(2026);
    expect(localDateInputToIso("2026-08-15")).toContain("2026-08-15");
    expect(() => parseLocalDate("2026-02-30")).toThrow("not a real calendar date");
    expect(() => parseLocalDate("15/08/2026")).toThrow("YYYY-MM-DD");
  });

  it("does not flag fully paid old credit as overdue", () => {
    const state = demoState();
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);
    state.sales[0] = { ...state.sales[0], saleDate: oldDate.toISOString() };
    state.creditPayments = [{ id: "paid", customerId: "demo-customer", amount: 200, paymentMethod: "mpesa", paymentDate: new Date().toISOString(), createdAt: new Date().toISOString() }];
    expect(customerHasOverdueCredit(state, state.customers[0])).toBe(false);
  });

  it("flags genuinely unpaid old credit as overdue", () => {
    const state = demoState();
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 45);
    state.sales[0] = { ...state.sales[0], saleDate: oldDate.toISOString() };
    expect(customerHasOverdueCredit(state, state.customers[0])).toBe(true);
  });

  it("ignores statement rows without official transaction codes and normalizes valid codes", () => {
    const mapped = mapMpesaRows([
      { Receipt: "", Amount: "100" },
      { Receipt: " qkd2m3t9x ", Amount: "250" },
    ], { transactionCode: "Receipt", amount: "Amount" });
    expect(mapped).toEqual([{ transactionCode: "QKD2M3T9X", transactionDate: undefined, transactionTime: undefined, description: undefined, amount: 250, balance: 0, phoneNumber: undefined }]);
  });

  it("accepts complete app backups and refuses structurally incomplete restore payloads", () => {
    expect(isRestorableStockbookState(demoState())).toBe(true);
    expect(isRestorableStockbookState({ schemaVersion: 1, products: [] })).toBe(false);
  });
});
