import type { StockbookState } from "./types";

const DATE_INPUT = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseLocalDate(value: string, label = "Date"): Date {
  const match = DATE_INPUT.exec(value.trim());
  if (!match) throw new Error(`${label} must use the format YYYY-MM-DD.`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) throw new Error(`${label} is not a real calendar date.`);
  return date;
}

export function localDateInputToIso(value: string, label = "Date"): string {
  return parseLocalDate(value, label).toISOString();
}

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

export function isRestorableStockbookState(value: unknown): value is StockbookState {
  if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.onboarded !== "boolean") return false;
  const arrays = ["products", "sales", "expenses", "customers", "creditPayments", "stockAdjustments", "mpesaTransactions"];
  if (!arrays.every((key) => Array.isArray(value[key]))) return false;
  if (!isRecord(value.settings)) return false;
  const settings = value.settings;
  return (settings.colorScheme === "light" || settings.colorScheme === "dark") && typeof settings.allowNegativeStock === "boolean" && typeof settings.demoData === "boolean" && (settings.plan === "free" || settings.plan === "pro-placeholder");
}
