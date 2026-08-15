import { describe, expect, it } from "vitest";
import { getReportTrend } from "../lib/stockbook/calculations";
import { demoState, emptyState } from "../lib/stockbook/seed";

describe("report trend chart data", () => {
  const now = new Date();
  now.setHours(16, 0, 0, 0);

  it("reconciles today’s chart point with the persisted sales and expense records", () => {
    const trend = getReportTrend(demoState(), "today", now);
    expect(trend).toHaveLength(1);
    expect(trend[0]).toMatchObject({ label: "Today", sales: 640, expenses: 120 });
  });

  it("keeps all-time trend totals equal to the source ledger", () => {
    const trend = getReportTrend(demoState(), "all", now);
    expect(trend).toHaveLength(6);
    expect(trend.reduce((sum, point) => sum + point.sales, 0)).toBe(640);
    expect(trend.reduce((sum, point) => sum + point.expenses, 0)).toBe(120);
  });

  it("creates zero-valued buckets when no records exist instead of inventing chart data", () => {
    const trend = getReportTrend(emptyState(), "week", now);
    expect(trend.length).toBeGreaterThan(0);
    expect(trend.every((point) => point.sales === 0 && point.expenses === 0)).toBe(true);
  });
});
