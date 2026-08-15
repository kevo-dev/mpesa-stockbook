import type { Customer, MpesaTransaction, Product, Sale, StockbookState, TimelineItem } from "./types";

export const KES = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

export function formatKes(amount: number): string {
  return KES.format(Number.isFinite(amount) ? amount : 0).replace("KES", "KSh");
}

export function toDateKey(value: string | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function isLowStock(product: Product): boolean {
  return product.quantity <= product.lowStockThreshold;
}

export function productProfit(product: Product): number {
  return product.sellingPrice - product.buyingPrice;
}

export function productMargin(product: Product): number {
  return product.sellingPrice > 0 ? (productProfit(product) / product.sellingPrice) * 100 : 0;
}

export function stockValue(product: Product): number {
  return product.quantity * product.buyingPrice;
}

export function potentialSalesValue(product: Product): number {
  return product.quantity * product.sellingPrice;
}

export function startOfPeriod(period: "today" | "week" | "month" | "all", now = new Date()): Date {
  const date = new Date(now);
  date.setHours(0, 0, 0, 0);
  if (period === "today") return date;
  if (period === "week") {
    const offset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - offset);
    return date;
  }
  if (period === "month") return new Date(date.getFullYear(), date.getMonth(), 1);
  return new Date(0);
}

export function inPeriod(value: string, period: "today" | "week" | "month" | "all", now = new Date()): boolean {
  return new Date(value).getTime() >= startOfPeriod(period, now).getTime();
}

export function salesForPeriod(state: StockbookState, period: "today" | "week" | "month" | "all"): Sale[] {
  return state.sales.filter((sale) => inPeriod(sale.saleDate, period));
}

export function expensesForPeriod(state: StockbookState, period: "today" | "week" | "month" | "all") {
  return state.expenses.filter((expense) => inPeriod(expense.expenseDate, period));
}

export function getDashboardMetrics(state: StockbookState) {
  const today = todayKey();
  const sales = state.sales.filter((sale) => toDateKey(sale.saleDate) === today);
  const expenses = state.expenses.filter((expense) => toDateKey(expense.expenseDate) === today);
  const amountFor = (method: Sale["paymentMethod"]) => sales.filter((sale) => sale.paymentMethod === method).reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalCost = sales.reduce((sum, sale) => sum + sale.totalCost, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const itemsSold = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const visibleProducts = state.products.filter((product) => !product.isArchived);

  return {
    totalSales,
    totalCost,
    estimatedProfit: totalSales - totalCost - totalExpenses,
    salesProfit: sales.reduce((sum, sale) => sum + sale.estimatedProfit, 0),
    totalExpenses,
    cashSales: amountFor("cash"),
    mpesaSales: amountFor("mpesa"),
    creditSales: amountFor("credit"),
    transactionCount: sales.length,
    itemsSold,
    lowStockCount: visibleProducts.filter(isLowStock).length,
    stockValue: visibleProducts.reduce((sum, product) => sum + stockValue(product), 0),
  };
}

export function getCreditBalance(state: StockbookState, customerId: string): number {
  const creditSales = state.sales.filter((sale) => sale.paymentMethod === "credit" && sale.customerId === customerId).reduce((sum, sale) => sum + sale.totalAmount, 0);
  const payments = state.creditPayments.filter((payment) => payment.customerId === customerId).reduce((sum, payment) => sum + payment.amount, 0);
  return Math.max(0, creditSales - payments);
}

export function customerHasOverdueCredit(state: StockbookState, customer: Customer): boolean {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - 30);
  return getCreditBalance(state, customer.id) > 0 && state.sales.some((sale) => sale.customerId === customer.id && new Date(sale.saleDate) < threshold);
}

export function getReportMetrics(state: StockbookState, period: "today" | "week" | "month" | "all") {
  const sales = salesForPeriod(state, period);
  const expenses = expensesForPeriod(state, period);
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalCost = sales.reduce((sum, sale) => sum + sale.totalCost, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paymentBreakdown = (["cash", "mpesa", "credit"] as const).map((method) => ({
    method,
    amount: sales.filter((sale) => sale.paymentMethod === method).reduce((sum, sale) => sum + sale.totalAmount, 0),
  }));
  const expenseBreakdown = Array.from(new Set(expenses.map((expense) => expense.category))).map((category) => ({
    category,
    amount: expenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0),
  })).sort((a, b) => b.amount - a.amount);
  const topProducts = Object.values(sales.flatMap((sale) => sale.items).reduce<Record<string, { name: string; quantity: number; amount: number }>>((acc, item) => {
    const current = acc[item.productId] ?? { name: item.productNameSnapshot, quantity: 0, amount: 0 };
    current.quantity += item.quantity;
    current.amount += item.subtotal;
    acc[item.productId] = current;
    return acc;
  }, {})).sort((a, b) => b.amount - a.amount).slice(0, 5);

  return {
    sales,
    expenses,
    totalSales,
    totalCost,
    totalExpenses,
    estimatedProfit: totalSales - totalCost - totalExpenses,
    paymentBreakdown,
    expenseBreakdown,
    topProducts,
  };
}

export function buildTimeline(state: StockbookState): TimelineItem[] {
  const sales: TimelineItem[] = state.sales.map((sale) => ({
    id: sale.id,
    type: "sale",
    title: `Sale · ${sale.paymentMethod === "mpesa" ? "M-Pesa" : sale.paymentMethod}`,
    subtitle: `${sale.items.reduce((sum, item) => sum + item.quantity, 0)} item${sale.items.length === 1 ? "" : "s"}`,
    amount: sale.totalAmount,
    date: sale.saleDate,
    paymentMethod: sale.paymentMethod,
    positive: true,
  }));
  const expenses: TimelineItem[] = state.expenses.map((expense) => ({
    id: expense.id,
    type: "expense",
    title: expense.title,
    subtitle: expense.category,
    amount: expense.amount,
    date: expense.expenseDate,
    paymentMethod: expense.paymentMethod,
    positive: false,
  }));
  const stock: TimelineItem[] = state.stockAdjustments.map((adjustment) => ({
    id: adjustment.id,
    type: "stock",
    title: "Stock adjustment",
    subtitle: adjustment.reason,
    date: adjustment.createdAt,
    positive: adjustment.quantityChange >= 0,
  }));
  const credit: TimelineItem[] = state.creditPayments.map((payment) => ({
    id: payment.id,
    type: "credit-payment",
    title: "Credit payment received",
    subtitle: payment.note || "Customer payment",
    amount: payment.amount,
    date: payment.paymentDate,
    paymentMethod: payment.paymentMethod,
    positive: true,
  }));
  return [...sales, ...expenses, ...stock, ...credit].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function unmatchedMpesa(state: StockbookState): MpesaTransaction[] {
  return state.mpesaTransactions.filter((transaction) => !transaction.matchedSaleId);
}
