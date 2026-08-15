import type { StockbookState } from "./types";

const isoToday = (hour: number) => {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

export function emptyState(): StockbookState {
  return {
    schemaVersion: 1,
    onboarded: false,
    products: [],
    sales: [],
    expenses: [],
    customers: [],
    creditPayments: [],
    stockAdjustments: [],
    mpesaTransactions: [],
    settings: { colorScheme: "light", allowNegativeStock: false, demoData: false, plan: "free" },
  };
}

export function demoState(): StockbookState {
  const createdAt = isoToday(7);
  const milk = { id: "demo-milk", name: "Milk 500ml", category: "Groceries", buyingPrice: 45, sellingPrice: 60, quantity: 25, lowStockThreshold: 5, createdAt, updatedAt: createdAt, isArchived: false };
  const bread = { id: "demo-bread", name: "Bread", category: "Bakery", buyingPrice: 55, sellingPrice: 70, quantity: 18, lowStockThreshold: 5, createdAt, updatedAt: createdAt, isArchived: false };
  const sugar = { id: "demo-sugar", name: "Sugar 1kg", category: "Groceries", buyingPrice: 120, sellingPrice: 150, quantity: 10, lowStockThreshold: 3, createdAt, updatedAt: createdAt, isArchived: false };
  const soap = { id: "demo-soap", name: "Soap", category: "Household", buyingPrice: 80, sellingPrice: 100, quantity: 12, lowStockThreshold: 4, createdAt, updatedAt: createdAt, isArchived: false };
  const airtime = { id: "demo-airtime", name: "Airtime", category: "Services", buyingPrice: 90, sellingPrice: 100, quantity: 20, lowStockThreshold: 5, createdAt, updatedAt: createdAt, isArchived: false };
  const customer = { id: "demo-customer", name: "Amina Wanjiku", phoneNumber: "0712345678", notes: "Regular customer", createdAt, updatedAt: createdAt };
  const cashSale = {
    id: "demo-cash-sale", totalAmount: 190, totalCost: 145, estimatedProfit: 45, discount: 0, paymentMethod: "cash" as const, saleDate: isoToday(10), createdAt: isoToday(10),
    items: [
      { id: "demo-cash-item-1", saleId: "demo-cash-sale", productId: milk.id, productNameSnapshot: milk.name, quantity: 2, buyingPriceSnapshot: 45, sellingPriceSnapshot: 60, subtotal: 120, profit: 30 },
      { id: "demo-cash-item-2", saleId: "demo-cash-sale", productId: bread.id, productNameSnapshot: bread.name, quantity: 1, buyingPriceSnapshot: 55, sellingPriceSnapshot: 70, subtotal: 70, profit: 15 },
    ],
  };
  const mpesaSale = {
    id: "demo-mpesa-sale", totalAmount: 250, totalCost: 200, estimatedProfit: 50, discount: 0, paymentMethod: "mpesa" as const, mpesaCode: "QKD2M3T9X", saleDate: isoToday(13), createdAt: isoToday(13),
    items: [
      { id: "demo-mpesa-item", saleId: "demo-mpesa-sale", productId: sugar.id, productNameSnapshot: sugar.name, quantity: 1, buyingPriceSnapshot: 120, sellingPriceSnapshot: 150, subtotal: 150, profit: 30 },
      { id: "demo-mpesa-item-2", saleId: "demo-mpesa-sale", productId: soap.id, productNameSnapshot: soap.name, quantity: 1, buyingPriceSnapshot: 80, sellingPriceSnapshot: 100, subtotal: 100, profit: 20 },
    ],
  };
  const creditSale = {
    id: "demo-credit-sale", totalAmount: 200, totalCost: 180, estimatedProfit: 20, discount: 0, paymentMethod: "credit" as const, customerId: customer.id, notes: "Due Friday", saleDate: isoToday(15), createdAt: isoToday(15),
    items: [{ id: "demo-credit-item", saleId: "demo-credit-sale", productId: airtime.id, productNameSnapshot: airtime.name, quantity: 2, buyingPriceSnapshot: 90, sellingPriceSnapshot: 100, subtotal: 200, profit: 20 }],
  };
  return {
    schemaVersion: 1,
    onboarded: true,
    profile: { id: "demo-profile", businessName: "Mama Asha Kiosk", businessType: "Kiosk", ownerName: "Asha", defaultOpeningBalance: 1500, language: "en", createdAt, updatedAt: createdAt },
    products: [milk, bread, sugar, soap, airtime],
    sales: [creditSale, mpesaSale, cashSale],
    expenses: [{ id: "demo-expense", title: "Restock transport", amount: 120, category: "Transport", paymentMethod: "cash", expenseDate: isoToday(9), createdAt: isoToday(9), note: "Morning supplier trip" }],
    customers: [customer],
    creditPayments: [],
    stockAdjustments: [],
    mpesaTransactions: [{ id: "demo-mpesa-transaction", transactionCode: "QKD2M3T9X", transactionDate: isoToday(13).slice(0, 10), transactionTime: "13:00", description: "Customer payment", amount: 250, balance: 5250, phoneNumber: "0712345678", matchedSaleId: mpesaSale.id, importedAt: isoToday(16) }],
    settings: { colorScheme: "light", allowNegativeStock: false, demoData: true, plan: "free" },
  };
}
