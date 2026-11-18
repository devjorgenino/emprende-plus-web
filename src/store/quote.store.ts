import { create } from 'zustand';
import * as quoteRepository from '../services/db/repositories/quote.repository';
import { getRate, type CachedRate } from '../services/api/bcv.service';
import { type Quote, type QuoteItem, type Service } from '@/types';
import { generateId } from '@/utils/id';

function now(): string {
  return new Date().toISOString();
}

interface DraftQuote {
  items: QuoteItem[];
  clientName: string;
  notes: string;
}

interface QuoteState {
  draft: DraftQuote;
  quotes: Quote[];
  isLoading: boolean;
  error: string | null;
}

interface QuoteActions {
  loadQuotes: () => Promise<void>;
  addItem: (service: Pick<Service, 'id' | 'name' | 'priceUSD'>) => void;
  removeItem: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  setClientName: (name: string) => void;
  setNotes: (notes: string) => void;
  clearDraft: () => void;
  saveQuote: () => Promise<string>;
  sendQuote: (id: string) => Promise<void>;
  acceptQuote: (id: string) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
}

const getInitialDraft = () => {
  try {
    const saved = localStorage.getItem('draft_quote');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return { items: [] as any[], clientName: '', notes: '' };
};

const saveDraft = (draft: DraftQuote) => {
  try {
    localStorage.setItem('draft_quote', JSON.stringify(draft));
  } catch {}
};

export const useQuoteStore = create<QuoteState & QuoteActions>((set, get) => ({
  draft: getInitialDraft(),

  quotes: [],
  isLoading: false,
  error: null,

  loadQuotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const quotes = await quoteRepository.getAllQuotes();
      set({ quotes, isLoading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar cotizaciones';
      set({ error: message, isLoading: false });
    }
  },

  addItem: (service) => {
    const state = get().draft;
    const existing = state.items.find((i) => i.serviceId === service.id);

    if (existing) {
      get().updateQuantity(service.id, existing.quantity + 1);
      return;
    }

    const priceUSD = typeof service.priceUSD === 'number' ? service.priceUSD : 0;
    const newItem: QuoteItem = {
      serviceId: service.id,
      serviceName: service.name,
      priceUSD,
      quantity: 1,
      subtotalUSD: priceUSD,
    };

    set((state) => {
      const newDraft = { ...state.draft, items: [...state.draft.items, newItem] };
      saveDraft(newDraft);
      return { draft: newDraft };
    });
  },

  removeItem: (serviceId) => {
    set((state) => {
      const newDraft = { ...state.draft, items: state.draft.items.filter((i) => i.serviceId !== serviceId) };
      saveDraft(newDraft);
      return { draft: newDraft };
    });
  },

  updateQuantity: (serviceId, quantity) => {
    const clamped = Math.max(1, Math.min(999, quantity));
    set((state) => {
      const newItems = state.draft.items.map((i) =>
        i.serviceId === serviceId
          ? {
              ...i,
              quantity: clamped,
              subtotalUSD: Math.round(i.priceUSD * clamped * 100) / 100,
            }
          : i,
      );
      const newDraft = { ...state.draft, items: newItems };
      saveDraft(newDraft);
      return { draft: newDraft };
    });
  },

  setClientName: (name) => {
    set((state) => {
      const newDraft = { ...state.draft, clientName: name };
      saveDraft(newDraft);
      return { draft: newDraft };
    });
  },

  setNotes: (notes) => {
    set((state) => {
      const newDraft = { ...state.draft, notes };
      saveDraft(newDraft);
      return { draft: newDraft };
    });
  },

  clearDraft: () => {
    set({
      draft: {
        items: [],
        clientName: '',
        notes: '',
      },
    });
    localStorage.removeItem('draft_quote');
  },

  saveQuote: async () => {
    const { draft } = get();
    const cached = getRate();
    const exchangeRate = cached?.rate ?? 735;
    const exchangeRateDate = new Date().toISOString();

    const totalUSD = draft.items.reduce((sum, i) => sum + i.subtotalUSD, 0);
    const totalVES = Math.round(totalUSD * exchangeRate * 100) / 100;

    const quote: Omit<Quote, 'id'> = {
      items: draft.items,
      totalUSD,
      totalVES,
      exchangeRate,
      exchangeRateDate,
      clientName: draft.clientName || 'Cliente',
      notes: draft.notes || undefined,
      status: 'draft',
      createdAt: now(),
    };

    const id = await quoteRepository.createQuoteWithItems(quote, draft.items);

    return id;
  },

  sendQuote: async (id) => {
    await quoteRepository.updateQuoteStatus(id, 'sent');
    set((state) => ({
      quotes: state.quotes.map((q) => (q.id === id ? { ...q, status: 'sent' } : q)),
    }));
  },

  acceptQuote: async (id) => {
    await quoteRepository.updateQuoteStatus(id, 'accepted');
    set((state) => ({
      quotes: state.quotes.map((q) => (q.id === id ? { ...q, status: 'accepted' } : q)),
    }));
  },

  deleteQuote: async (id) => {
    await quoteRepository.deleteQuote(id);
    set((state) => ({
      quotes: state.quotes.filter((q) => q.id !== id),
    }));
  },

  getQuoteById: (id: string) => {
    return get().quotes.find((q) => q.id === id);
  },
}));