export interface Service {
  id: string;
  name: string;
  description?: string;
  priceUSD: number;
  priceVES: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteItem {
  serviceId: string;
  serviceName: string;
  priceUSD: number;
  quantity: number;
  subtotalUSD: number;
}

export interface Quote {
  id: string;
  items: QuoteItem[];
  totalUSD: number;
  totalVES: number;
  exchangeRate: number;
  exchangeRateDate: string;
  clientName?: string;
  notes?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  imageUri?: string;
  createdAt: string;
}

export type PaymentMethod =
  | 'usd_cash'
  | 'ves_cash'
  | 'pago_movil'
  | 'kontigo'
  | 'binance'
  | 'transfer_ves'
  | 'other';

export interface Sale {
  id: string;
  quoteId?: string;
  items: QuoteItem[];
  totalUSD: number;
  totalVES: number;
  exchangeRate: number;
  clientName?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unit: string;
  purchasePriceUSD?: number;
  purchasePriceVES?: number;
  exchangeRateAtPurchase?: number;
  supplier?: string;
  purchaseDate?: string;
  notes?: string;
  photoUri?: string;
  lowStockThreshold?: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amountUSD: number;
  amountVES: number;
  exchangeRate: number;
  paymentMethod: PaymentMethod;
  supplier?: string;
  notes?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface ExchangeRate {
  rate: number;
  fetchedAt: string;
  source: 'bcv' | 'manual' | 'cached';
}

export interface CachedRate {
  rate: number;
  fetchedAt: string;
  source: 'bcv' | 'manual' | 'cached';
}