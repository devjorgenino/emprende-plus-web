import { create } from 'zustand';
import * as inventoryRepository from '../services/db/repositories/inventory.repository';
import { getRate, type CachedRate } from '../services/api/bcv.service';
import { type InventoryItem } from '@/types';
import { generateId } from '@/utils/id';

function now(): string {
  return new Date().toISOString();
}

export interface CreateInventoryInput {
  name: string;
  description?: string;
  category: string;
  quantity: number;
  unit: string;
  purchasePriceUSD?: number;
  supplier?: string;
  purchaseDate?: string;
  notes?: string;
  photoUri?: string;
  lowStockThreshold?: number;
}

export interface UpdateInventoryInput {
  name?: string;
  description?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  purchasePriceUSD?: number;
  supplier?: string;
  purchaseDate?: string;
  notes?: string;
  photoUri?: string;
  lowStockThreshold?: number;
}

interface InventoryState {
  items: InventoryItem[];
  isLoading: boolean;
  error: string | null;
}

interface InventoryActions {
  loadItems: () => Promise<void>;
  createItem: (data: CreateInventoryInput) => Promise<void>;
  updateItem: (id: string, data: UpdateInventoryInput) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItemById: (id: string) => InventoryItem | undefined;
  getItemsByCategory: (category: string) => InventoryItem[];
  searchItems: (query: string) => InventoryItem[];
}

export const useInventoryStore = create<InventoryState & InventoryActions>(
  (set, get) => ({
    items: [],
    isLoading: false,
    error: null,

    loadItems: async () => {
      set({ isLoading: true, error: null });
      try {
        const items = await inventoryRepository.getAllItems();
        set({ items, isLoading: false });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Error al cargar inventario';
        set({ error: message, isLoading: false });
      }
    },

    createItem: async (data) => {
      const cached = getRate();
      const exchangeRate = cached?.rate ?? 735;
      const now = new Date().toISOString();

      set({ isLoading: true, error: null });
      try {
        const item: InventoryItem = {
          id: generateId(),
          name: data.name,
          description: data.description,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          purchasePriceUSD: data.purchasePriceUSD,
          purchasePriceVES: data.purchasePriceUSD
            ? Math.round(data.purchasePriceUSD * exchangeRate * 100) / 100
            : undefined,
          exchangeRateAtPurchase: data.purchasePriceUSD ? exchangeRate : undefined,
          supplier: data.supplier,
          purchaseDate: data.purchaseDate,
          notes: data.notes,
          photoUri: data.photoUri,
          lowStockThreshold: data.lowStockThreshold,
          createdAt: now,
        };

        await inventoryRepository.createItem(item);
        set((state) => ({
          items: [item, ...state.items],
          isLoading: false,
        }));
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Error al crear item';
        set({ error: message, isLoading: false });
        throw e;
      }
    },

    updateItem: async (id, data) => {
      set({ isLoading: true, error: null });
      try {
        const existing = await inventoryRepository.getItemById(id);
        if (!existing) throw new Error('Item no encontrado');

        const cached = getRate();
        const exchangeRate = cached?.rate ?? 735;

        const updated = {
          ...existing,
          ...data,
          purchasePriceVES:
            data.purchasePriceUSD !== undefined
              ? Math.round(data.purchasePriceUSD * exchangeRate * 100) / 100
              : existing.purchasePriceVES,
          exchangeRateAtPurchase:
            data.purchasePriceUSD !== undefined ? exchangeRate : existing.exchangeRateAtPurchase,
        };

        await inventoryRepository.updateItem(id, updated);
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? updated : i)),
          isLoading: false,
        }));
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Error al actualizar item';
        set({ error: message, isLoading: false });
        throw e;
      }
    },

    deleteItem: async (id) => {
      set({ isLoading: true, error: null });
      try {
        await inventoryRepository.deleteItem(id);
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          isLoading: false,
        }));
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Error al eliminar item';
        set({ error: message, isLoading: false });
        throw e;
      }
    },

    getItemById: (id) => {
      return get().items.find((i) => i.id === id);
    },

    getItemsByCategory: (category) => {
      return get().items.filter((i) => i.category === category);
    },

    searchItems: (query) => {
      const q = query.toLowerCase();
      return get().items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.supplier?.toLowerCase().includes(q),
      );
    },
  }),
);