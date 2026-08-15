import { describe, expect, it } from "vitest";
import { detectMpesaMapping, mapMpesaRows, parseCsv } from "../lib/stockbook/csv";
import { buildTimeline, getCreditBalance, getDashboardMetrics, getReportMetrics, isLowStock, productMargin } from "../lib/stockbook/calculations";
import { demoState, emptyState } from "../lib/stockbook/seed";

describe("M-Pesa StockBook core calculations", () => {
  it("calculates the seeded daily sales, expense and estimated profit correctly", () => {
    const metrics = getDashboardMetrics(demoState());
    expect(metrics.totalSales).toBe(640);
    expect(metrics.totalCost).toBe(525);
    expect(metrics.totalExpenses).toBe(120);
    expect(metrics.estimatedProfit).toBe(-5);
    expect(metrics.cashSales).toBe(190);
    expect(metrics.mpesaSales).toBe(250);
    expect(metrics.creditSales).toBe(200);
    expect(metrics.itemsSold).toBe(7);
  });

  it("keeps payment mix and top-product totals consistent with the sales ledger", () => {
    const report = getReportMetrics(demoState(), "today");
    expect(report.paymentBreakdown).toEqual([
      { method: "cash", amount: 190 },
      { method: "mpesa", amount: 250 },
      { method: "credit", amount: 200 },
    ]);
    expect(report.topProducts[0]).toEqual({ name: "Airtime", quantity: 2, amount: 200 });
  });

  it("computes customer outstanding balances and a coherent activity timeline", () => {
    const state = demoState();
    expect(getCreditBalance(state, "demo-customer")).toBe(200);
    expect(buildTimeline(state).map((item) => item.type)).toContain("sale");
    expect(buildTimeline(state).map((item) => item.type)).toContain("expense");
  });

  it("flags low stock and reports margin using stored product prices", () => {
    const product = { ...demoState().products[0], quantity: 5, lowStockThreshold: 5 };
    expect(isLowStock(product)).toBe(true);
    expect(productMargin(product)).toBe(25);
  });

  it("starts an empty private local state with an explicit data schema", () => {
    const state = emptyState();
    expect(state.schemaVersion).toBe(1);
    expect(state.onboarded).toBe(false);
    expect(state.products).toHaveLength(0);
    expect(state.settings.allowNegativeStock).toBe(false);
  });
});

describe("M-Pesa statement CSV parsing", () => {
  const source = "Receipt No.,Completion Time,Details,Transaction Status,Paid In,Withdrawn,Balance,Phone Number\nQKD2M3T9X,2026-08-15 13:00,Customer payment,Completed,250.00,0,5250.00,0712345678\n";

  it("parses a quoted CSV header and detects a practical M-Pesa mapping", () => {
    const parsed = parseCsv(source);
    const mapping = detectMpesaMapping(parsed.headers);
    expect(mapping.transactionCode).toBe("Receipt No.");
    expect(mapping.amount).toBe("Paid In");
    expect(mapping.balance).toBe("Balance");
  });

  it("maps selected columns into safe import rows", () => {
    const parsed = parseCsv(source);
    const rows = mapMpesaRows(parsed.rows, {
      transactionCode: "Receipt No.",
      description: "Details",
      amount: "Paid In",
      balance: "Balance",
      phoneNumber: "Phone Number",
    });
    expect(rows).toEqual([{
      transactionCode: "QKD2M3T9X",
      transactionDate: undefined,
      transactionTime: undefined,
      description: "Customer payment",
      amount: 250,
      balance: 5250,
      phoneNumber: "0712345678",
    }]);
  });
});
