export type PaymentMethod = "cash" | "mpesa" | "credit" | "bank" | "other";

export type BusinessProfile = {
  id: string;
  businessName: string;
  businessType: string;
  ownerName?: string;
  phoneNumber?: string;
  mpesaNumber?: string;
  defaultOpeningBalance: number;
  language: "en" | "sw";
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  sku?: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  quantity: number;
  lowStockThreshold: number;
  supplierName?: string;
  imageUri?: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
};

export type SaleItem = {
  id: string;
  saleId: string;
  productId: string;
  productNameSnapshot: string;
  quantity: number;
  buyingPriceSnapshot: number;
  sellingPriceSnapshot: number;
  subtotal: number;
  profit: number;
};

export type Sale = {
  id: string;
  totalAmount: number;
  totalCost: number;
  estimatedProfit: number;
  discount: number;
  paymentMethod: Extract<PaymentMethod, "cash" | "mpesa" | "credit">;
  mpesaCode?: string;
  customerId?: string;
  notes?: string;
  saleDate: string;
  createdAt: string;
  items: SaleItem[];
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  note?: string;
  expenseDate: string;
  createdAt: string;
};

export type Customer = {
  id: string;
  name: string;
  phoneNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreditPayment = {
  id: string;
  customerId: string;
  saleId?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  note?: string;
  paymentDate: string;
  createdAt: string;
};

export type StockAdjustment = {
  id: string;
  productId: string;
  quantityBefore: number;
  quantityChange: number;
  quantityAfter: number;
  reason: string;
  createdAt: string;
};

export type MpesaTransaction = {
  id: string;
  transactionCode: string;
  transactionDate?: string;
  transactionTime?: string;
  description?: string;
  amount: number;
  balance?: number;
  phoneNumber?: string;
  matchedSaleId?: string;
  importedAt: string;
};

export type AppSettings = {
  colorScheme: "light" | "dark";
  allowNegativeStock: boolean;
  demoData: boolean;
  plan: "free" | "pro-placeholder";
};

export type StockbookState = {
  schemaVersion: 1;
  onboarded: boolean;
  profile?: BusinessProfile;
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  customers: Customer[];
  creditPayments: CreditPayment[];
  stockAdjustments: StockAdjustment[];
  mpesaTransactions: MpesaTransaction[];
  settings: AppSettings;
};

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt" | "isArchived">;

export type SaleDraftItem = {
  productId: string;
  quantity: number;
};

export type SaleInput = {
  items: SaleDraftItem[];
  discount?: number;
  paymentMethod: Extract<PaymentMethod, "cash" | "mpesa" | "credit">;
  mpesaCode?: string;
  customerName?: string;
  customerPhone?: string;
  dueDate?: string;
  notes?: string;
  saleDate?: string;
};

export type ExpenseInput = Omit<Expense, "id" | "createdAt">;

export type MpesaImportRow = Omit<MpesaTransaction, "id" | "importedAt" | "matchedSaleId">;

export type TimelineItem = {
  id: string;
  type: "sale" | "expense" | "stock" | "credit-payment";
  title: string;
  subtitle: string;
  amount?: number;
  date: string;
  paymentMethod?: PaymentMethod;
  positive?: boolean;
};
