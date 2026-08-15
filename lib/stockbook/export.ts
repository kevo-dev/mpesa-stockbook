import { Platform, Share } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { formatKes, getReportMetrics } from "./calculations";
import type { StockbookState } from "./types";

const escape = (value: string | number | undefined) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const safeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "stockbook";

async function shareFile(filename: string, content: string, mimeType: string) {
  if (Platform.OS === "web") { await Share.share({ message: content, title: filename }); return; }
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.UTF8 });
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is unavailable on this device.");
  await Sharing.shareAsync(uri, { dialogTitle: "Share M-Pesa StockBook export", mimeType });
}

export async function shareText(title: string, text: string) {
  await Share.share({ title, message: text });
}

export function allDataJson(state: StockbookState): string {
  return JSON.stringify(state, null, 2);
}

export async function shareBackup(state: StockbookState) {
  await shareFile(`mpesa-stockbook-backup-${new Date().toISOString().slice(0, 10)}.json`, allDataJson(state), "application/json");
}

export function reportCsv(state: StockbookState, period: "today" | "week" | "month" | "all"): string {
  const report = getReportMetrics(state, period);
  const rows = [
    ["M-Pesa StockBook report", period],
    ["Sales", report.totalSales],
    ["Cost of goods sold", report.totalCost],
    ["Expenses", report.totalExpenses],
    ["Estimated net profit", report.estimatedProfit],
    [],
    ["Payment method", "Amount"],
    ...report.paymentBreakdown.map((item) => [item.method, item.amount]),
    [],
    ["Top product", "Quantity", "Sales value"],
    ...report.topProducts.map((item) => [item.name, item.quantity, item.amount]),
  ];
  return rows.map((row) => row.map(escape).join(",")).join("\n");
}

export async function shareReportCsv(state: StockbookState, period: "today" | "week" | "month" | "all") {
  await shareFile(`stockbook-${period}-report.csv`, reportCsv(state, period), "text/csv");
}

export async function shareReportPdf(state: StockbookState, period: "today" | "week" | "month" | "all") {
  const report = getReportMetrics(state, period);
  const business = state.profile?.businessName || "M-Pesa StockBook";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /><style>@page{margin:24px}body{font-family:Arial;color:#172B25}h1{color:#0B6E4F}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{padding:9px;border-bottom:1px solid #DDE5DF;text-align:left}.amount{text-align:right}.note{margin-top:28px;color:#5B6B63;font-size:12px}</style></head><body><h1>${business}</h1><p>${period[0].toUpperCase() + period.slice(1)} performance report · ${new Date().toLocaleDateString("en-KE")}</p><table><tr><th>Measure</th><th class="amount">Amount</th></tr><tr><td>Total sales</td><td class="amount">${formatKes(report.totalSales)}</td></tr><tr><td>Cost of goods sold</td><td class="amount">${formatKes(report.totalCost)}</td></tr><tr><td>Expenses</td><td class="amount">${formatKes(report.totalExpenses)}</td></tr><tr><td><strong>Estimated net profit</strong></td><td class="amount"><strong>${formatKes(report.estimatedProfit)}</strong></td></tr></table><h2>Payment mix</h2><table>${report.paymentBreakdown.map((row) => `<tr><td>${row.method === "mpesa" ? "M-Pesa" : row.method}</td><td class="amount">${formatKes(row.amount)}</td></tr>`).join("")}</table><p class="note">Estimated profit is based on the buying and selling prices entered by the user. It is not formal accounting advice. M-Pesa StockBook is independent and is not affiliated with Safaricom.</p></body></html>`;
  if (Platform.OS === "web") { await Share.share({ title: `${business} report`, message: `Sales ${formatKes(report.totalSales)} · Estimated net profit ${formatKes(report.estimatedProfit)}` }); return; }
  const { uri } = await Print.printToFileAsync({ html });
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing is unavailable on this device.");
  await Sharing.shareAsync(uri, { dialogTitle: "Share PDF report", mimeType: "application/pdf", UTI: ".pdf" });
}

export function receiptText(state: StockbookState, saleId: string): string {
  const sale = state.sales.find((entry) => entry.id === saleId);
  if (!sale) return "Sale receipt unavailable.";
  const lines = sale.items.map((item) => `${item.quantity} × ${item.productNameSnapshot} — ${formatKes(item.subtotal)}`);
  return `${state.profile?.businessName || "M-Pesa StockBook"}\nReceipt\n${lines.join("\n")}\n\nTotal: ${formatKes(sale.totalAmount)}\nPaid by: ${sale.paymentMethod === "mpesa" ? "M-Pesa" : sale.paymentMethod}\n${sale.mpesaCode ? `M-Pesa code: ${sale.mpesaCode}\n` : ""}Thank you.`;
}

export function exportFileName(state: StockbookState) {
  return safeName(state.profile?.businessName || "mpesa-stockbook");
}
