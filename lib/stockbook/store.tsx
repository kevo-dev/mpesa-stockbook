import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { demoState, emptyState } from "./seed";
import type { BusinessProfile, CreditPayment, Customer, ExpenseInput, MpesaImportRow, ProductInput, Sale, SaleInput, StockbookState } from "./types";

const STORAGE_KEY = "mpesa-stockbook.state.v1";
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();

type StoreContextValue = {
  state: StockbookState;
  ready: boolean;
  saveProfile: (input: Omit<BusinessProfile, "id" | "createdAt" | "updatedAt">) => void;
  useDemoData: () => void;
  addProduct: (input: ProductInput) => void;
  updateProduct: (productId: string, input: ProductInput) => void;
  duplicateProduct: (productId: string) => void;
  deleteProduct: (productId: string) => void;
  adjustStock: (productId: string, quantityChange: number, reason: string) => void;
  recordSale: (input: SaleInput) => Sale;
  deleteSale: (saleId: string) => void;
  addExpense: (input: ExpenseInput) => void;
  updateExpense: (expenseId: string, input: ExpenseInput) => void;
  deleteExpense: (expenseId: string) => void;
  addCustomer: (input: Omit<Customer, "id" | "createdAt" | "updatedAt">) => Customer;
  addCreditPayment: (input: Omit<CreditPayment, "id" | "createdAt">) => void;
  deleteCreditPayment: (paymentId: string) => void;
  importMpesa: (rows: MpesaImportRow[]) => { imported: number; duplicates: number };
  matchMpesa: (transactionId: string, saleId: string) => void;
  updateSettings: (input: Partial<StockbookState["settings"]>) => void;
  replaceState: (next: StockbookState) => void;
  clearData: () => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StockbookProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StockbookState>(emptyState());
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) {
        try { setState(JSON.parse(saved) as StockbookState); } catch { AsyncStorage.removeItem(STORAGE_KEY); }
      }
    }).finally(() => setReady(true));
  }, []);

  const commit = useCallback(<T,>(updater: (current: StockbookState) => { next: StockbookState; result: T }): T => {
    const { next, result } = updater(stateRef.current);
    stateRef.current = next;
    setState(next);
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    return result;
  }, []);

  const saveProfile = useCallback((input: Omit<BusinessProfile, "id" | "createdAt" | "updatedAt">) => {
    commit((current) => {
      const timestamp = now();
      const profile = { ...input, id: current.profile?.id ?? id("business"), createdAt: current.profile?.createdAt ?? timestamp, updatedAt: timestamp };
      return { next: { ...current, onboarded: true, profile }, result: undefined };
    });
  }, [commit]);

  const addProduct = useCallback((input: ProductInput) => {
    commit((current) => {
      if (current.settings.plan === "free" && current.products.filter((product) => !product.isArchived).length >= 30) throw new Error("The free plan allows up to 30 products. Upgrade is not active yet, so please archive a product to continue.");
      if (!input.name.trim()) throw new Error("Add a product name before saving.");
      if ([input.buyingPrice, input.sellingPrice, input.quantity, input.lowStockThreshold].some((value) => value < 0 || !Number.isFinite(value))) throw new Error("Prices and stock values cannot be negative.");
      const timestamp = now();
      const product = { ...input, id: id("product"), createdAt: timestamp, updatedAt: timestamp, isArchived: false };
      return { next: { ...current, products: [product, ...current.products] }, result: undefined };
    });
  }, [commit]);

  const updateProduct = useCallback((productId: string, input: ProductInput) => {
    commit((current) => {
      if (!input.name.trim()) throw new Error("Add a product name before saving.");
      if ([input.buyingPrice, input.sellingPrice, input.quantity, input.lowStockThreshold].some((value) => value < 0 || !Number.isFinite(value))) throw new Error("Prices and stock values cannot be negative.");
      return { next: { ...current, products: current.products.map((product) => product.id === productId ? { ...product, ...input, updatedAt: now() } : product) }, result: undefined };
    });
  }, [commit]);

  const duplicateProduct = useCallback((productId: string) => {
    commit((current) => {
      const source = current.products.find((product) => product.id === productId);
      if (!source) throw new Error("That product could not be found.");
      const timestamp = now();
      const copy = { ...source, id: id("product"), name: `${source.name} copy`, sku: "", createdAt: timestamp, updatedAt: timestamp };
      return { next: { ...current, products: [copy, ...current.products] }, result: undefined };
    });
  }, [commit]);

  const deleteProduct = useCallback((productId: string) => {
    commit((current) => ({ next: { ...current, products: current.products.map((product) => product.id === productId ? { ...product, isArchived: true, updatedAt: now() } : product) }, result: undefined }));
  }, [commit]);

  const adjustStock = useCallback((productId: string, quantityChange: number, reason: string) => {
    commit((current) => {
      const product = current.products.find((entry) => entry.id === productId);
      if (!product) throw new Error("That product could not be found.");
      if (!Number.isFinite(quantityChange) || quantityChange === 0) throw new Error("Enter a stock adjustment that is not zero.");
      const quantityAfter = product.quantity + quantityChange;
      if (quantityAfter < 0 && !current.settings.allowNegativeStock) throw new Error("This would make stock negative. Enable negative stock in Settings only if you need it.");
      const adjustment = { id: id("adjustment"), productId, quantityBefore: product.quantity, quantityChange, quantityAfter, reason: reason.trim() || "Manual adjustment", createdAt: now() };
      return { next: { ...current, products: current.products.map((entry) => entry.id === productId ? { ...entry, quantity: quantityAfter, updatedAt: now() } : entry), stockAdjustments: [adjustment, ...current.stockAdjustments] }, result: undefined };
    });
  }, [commit]);

  const recordSale = useCallback((input: SaleInput): Sale => commit((current) => {
    if (input.items.length === 0) throw new Error("Add at least one product to this sale.");
    if (current.settings.plan === "free") {
      const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
      if (current.sales.filter((sale) => new Date(sale.saleDate) >= start).length >= 50) throw new Error("The free plan allows 50 recorded sales this month. The upgrade path is not active yet.");
    }
    const discount = Math.max(0, Number(input.discount ?? 0));
    const saleId = id("sale");
    const items = input.items.map((draft) => {
      const product = current.products.find((entry) => entry.id === draft.productId && !entry.isArchived);
      if (!product) throw new Error("One of the selected products is unavailable.");
      if (!Number.isFinite(draft.quantity) || draft.quantity <= 0) throw new Error("Sale quantities must be greater than zero.");
      if (draft.quantity > product.quantity && !current.settings.allowNegativeStock) throw new Error(`${product.name} has only ${product.quantity} in stock.`);
      const subtotal = draft.quantity * product.sellingPrice;
      const cost = draft.quantity * product.buyingPrice;
      return { id: id("sale-item"), saleId, productId: product.id, productNameSnapshot: product.name, quantity: draft.quantity, buyingPriceSnapshot: product.buyingPrice, sellingPriceSnapshot: product.sellingPrice, subtotal, profit: subtotal - cost };
    });
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    if (discount > subtotal) throw new Error("The discount cannot be higher than the sale subtotal.");
    const totalCost = items.reduce((sum, item) => sum + item.buyingPriceSnapshot * item.quantity, 0);
    let customerId: string | undefined;
    let customers = current.customers;
    if (input.paymentMethod === "credit") {
      if (!input.customerName?.trim()) throw new Error("Add the customer name for a credit sale.");
      const existing = customers.find((customer) => customer.name.trim().toLowerCase() === input.customerName?.trim().toLowerCase());
      if (existing) customerId = existing.id;
      else {
        const timestamp = now();
        const customer = { id: id("customer"), name: input.customerName.trim(), phoneNumber: input.customerPhone?.trim(), notes: input.dueDate ? `Due ${input.dueDate}` : undefined, createdAt: timestamp, updatedAt: timestamp };
        customers = [customer, ...customers];
        customerId = customer.id;
      }
    }
    const timestamp = input.saleDate || now();
    const sale: Sale = { id: saleId, totalAmount: subtotal - discount, totalCost, estimatedProfit: subtotal - discount - totalCost, discount, paymentMethod: input.paymentMethod, mpesaCode: input.mpesaCode?.trim(), customerId, notes: input.notes?.trim(), saleDate: timestamp, createdAt: now(), items };
    return { next: { ...current, customers, sales: [sale, ...current.sales], products: current.products.map((product) => {
      const item = items.find((entry) => entry.productId === product.id);
      return item ? { ...product, quantity: product.quantity - item.quantity, updatedAt: now() } : product;
    }) }, result: sale };
  }), [commit]);

  const deleteSale = useCallback((saleId: string) => {
    commit((current) => {
      const sale = current.sales.find((entry) => entry.id === saleId);
      if (!sale) return { next: current, result: undefined };
      return { next: { ...current, sales: current.sales.filter((entry) => entry.id !== saleId), products: current.products.map((product) => {
        const item = sale.items.find((entry) => entry.productId === product.id);
        return item ? { ...product, quantity: product.quantity + item.quantity, updatedAt: now() } : product;
      }) }, result: undefined };
    });
  }, [commit]);

  const addExpense = useCallback((input: ExpenseInput) => {
    commit((current) => {
      if (!input.title.trim()) throw new Error("Add an expense title.");
      if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Enter an expense amount greater than zero.");
      const expense = { ...input, id: id("expense"), createdAt: now() };
      return { next: { ...current, expenses: [expense, ...current.expenses] }, result: undefined };
    });
  }, [commit]);

  const updateExpense = useCallback((expenseId: string, input: ExpenseInput) => {
    commit((current) => {
      if (!input.title.trim() || !Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Use a title and an amount greater than zero.");
      return { next: { ...current, expenses: current.expenses.map((expense) => expense.id === expenseId ? { ...expense, ...input } : expense) }, result: undefined };
    });
  }, [commit]);

  const deleteExpense = useCallback((expenseId: string) => commit((current) => ({ next: { ...current, expenses: current.expenses.filter((expense) => expense.id !== expenseId) }, result: undefined })), [commit]);

  const addCustomer = useCallback((input: Omit<Customer, "id" | "createdAt" | "updatedAt">): Customer => commit((current) => {
    if (!input.name.trim()) throw new Error("Add the customer name.");
    const timestamp = now();
    const customer = { ...input, id: id("customer"), name: input.name.trim(), createdAt: timestamp, updatedAt: timestamp };
    return { next: { ...current, customers: [customer, ...current.customers] }, result: customer };
  }), [commit]);

  const addCreditPayment = useCallback((input: Omit<CreditPayment, "id" | "createdAt">) => {
    commit((current) => {
      if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error("Enter a payment amount greater than zero.");
      const payment = { ...input, id: id("credit-payment"), createdAt: now() };
      return { next: { ...current, creditPayments: [payment, ...current.creditPayments] }, result: undefined };
    });
  }, [commit]);

  const deleteCreditPayment = useCallback((paymentId: string) => commit((current) => ({ next: { ...current, creditPayments: current.creditPayments.filter((payment) => payment.id !== paymentId) }, result: undefined })), [commit]);

  const importMpesa = useCallback((rows: MpesaImportRow[]) => commit((current) => {
    const seen = new Set(current.mpesaTransactions.map((transaction) => transaction.transactionCode));
    const unique = rows.filter((row) => row.transactionCode && !seen.has(row.transactionCode));
    const transactions = unique.map((row) => ({ ...row, id: id("mpesa"), importedAt: now() }));
    return { next: { ...current, mpesaTransactions: [...transactions, ...current.mpesaTransactions] }, result: { imported: transactions.length, duplicates: rows.length - transactions.length } };
  }), [commit]);

  const matchMpesa = useCallback((transactionId: string, saleId: string) => commit((current) => ({ next: { ...current, mpesaTransactions: current.mpesaTransactions.map((transaction) => transaction.id === transactionId ? { ...transaction, matchedSaleId: saleId } : transaction) }, result: undefined })), [commit]);

  const updateSettings = useCallback((input: Partial<StockbookState["settings"]>) => commit((current) => ({ next: { ...current, settings: { ...current.settings, ...input } }, result: undefined })), [commit]);
  const replaceState = useCallback((next: StockbookState) => {
    if (!next || next.schemaVersion !== 1 || !Array.isArray(next.products) || !Array.isArray(next.sales)) throw new Error("This backup does not look like an M-Pesa StockBook export.");
    commit(() => ({ next, result: undefined }));
  }, [commit]);
  const clearData = useCallback(() => commit(() => ({ next: emptyState(), result: undefined })), [commit]);
  const useDemoData = useCallback(() => commit(() => ({ next: demoState(), result: undefined })), [commit]);

  const value = useMemo(() => ({ state, ready, saveProfile, useDemoData, addProduct, updateProduct, duplicateProduct, deleteProduct, adjustStock, recordSale, deleteSale, addExpense, updateExpense, deleteExpense, addCustomer, addCreditPayment, deleteCreditPayment, importMpesa, matchMpesa, updateSettings, replaceState, clearData }), [state, ready, saveProfile, useDemoData, addProduct, updateProduct, duplicateProduct, deleteProduct, adjustStock, recordSale, deleteSale, addExpense, updateExpense, deleteExpense, addCustomer, addCreditPayment, deleteCreditPayment, importMpesa, matchMpesa, updateSettings, replaceState, clearData]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStockbook() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStockbook must be used inside StockbookProvider");
  return context;
}
