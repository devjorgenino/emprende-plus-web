import { create } from 'zustand';
import * as saleRepository from '../services/db/repositories/sale.repository';
import { getRate } from '../services/api/bcv.service';
import { type Sale, type PaymentMethod, type Quote } from '@/types';
import { generateId } from '@/utils/id';

function now(): string {
  return new Date().toISOString();
}

interface SaleState {
  sales: Sale[];
  isLoading: boolean;
  error: string | null;
}

interface SaleActions {
  loadSales: () => Promise<void>;
  createSale: (sale: Omit<Sale, 'id' | 'totalUSD' | 'totalVES' | 'createdAt'>, items: Sale['items']) => Promise<string>;
  createSaleFromQuote: (quote: Quote, paymentMethod: PaymentMethod) => Promise<string>;
  updateSale: (sale: Sale) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  getSaleById: (id: string) => Sale | undefined;
  getSalesInRange: (startDate: string, endDate: string) => Sale[];
  searchSales: (query: string) => Sale[];
  getTotalUSDInRange: (startDate: string, endDate: string) => number;
  getTotalVESInRange: (startDate: string, endDate: string) => number;
}

export const useSaleStore = create<SaleState & SaleActions>((set, get) => ({
  sales: [],
  isLoading: false,
  error: null,

  loadSales: async () => {
    set({ isLoading: true, error: null });
    try {
      const sales = await saleRepository.getAllSales();
      set({ sales, isLoading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar ventas';
      set({ error: message, isLoading: false });
    }
  },

  createSale: async (sale, items) => {
    const cached = getRate();
    const exchangeRate = cached?.rate ?? 735;
    const now = new Date().toISOString();

    const totalUSD = items.reduce((sum, i) => sum + i.subtotalUSD, 0);
    const totalVES = Math.round(totalUSD * exchangeRate * 100) / 100;

    const fullSale: Omit<Sale, 'id'> = {
      ...sale,
      totalUSD,
      totalVES,
      exchangeRate,
      createdAt: now,
    };

    set({ isLoading: true, error: null });
    try {
      const id = await saleRepository.createSaleWithItems(fullSale, items);
      set((state) => ({
        sales: [{ ...fullSale, id }, ...state.sales],
        isLoading: false,
      }));
      return id;
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al crear venta';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  createSaleFromQuote: async (quote, paymentMethod) => {
    const items = quote.items.map((item) => ({
      serviceId: item.serviceId,
      serviceName: item.serviceName,
      priceUSD: item.priceUSD,
      quantity: item.quantity,
    }));

    const sale = {
      quoteId: quote.id,
      items,
      totalUSD: quote.totalUSD,
      totalVES: quote.totalVES,
      exchangeRate: quote.exchangeRate,
      clientName: quote.clientName,
      paymentMethod,
      notes: quote.notes,
    };

    const id = await get().createSale(sale, items);
    return id;
  },

  updateSale: async (sale) => {
    set({ isLoading: true, error: null });
    try {
      await saleRepository.updateSale(sale);
      set((state) => ({
        sales: state.sales.map((s) => (s.id === sale.id ? sale : s)),
        isLoading: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al actualizar venta';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  deleteSale: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await saleRepository.deleteSale(id);
      set((state) => ({
        sales: state.sales.filter((s) => s.id !== id),
        isLoading: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al eliminar venta';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  getSaleById: (id) => {
    return get().sales.find((s) => s.id === id);
  },

  getSalesInRange: (startDate, endDate) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return get().sales.filter((s) => {
      const t = new Date(s.createdAt).getTime();
      return t >= start && t <= end;
    });
  },

  searchSales: (query) => {
    const q = query.toLowerCase();
    return get().sales.filter((s) => s.clientName?.toLowerCase().includes(q));
  },

  getTotalUSDInRange: (startDate, endDate) => {
    return get()
      .getSalesInRange(startDate, endDate)
      .reduce((sum, s) => sum + s.totalUSD, 0);
  },

  getTotalVESInRange: (startDate, endDate) => {
    return get()
      .getSalesInRange(startDate, endDate)
      .reduce((sum, s) => sum + s.totalVES, 0);
  },
}));

export type { SaleState as SaleStoreState } from './sale.store';