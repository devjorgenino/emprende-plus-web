import { create } from 'zustand';
import * as clientRepository from '../services/db/repositories/client.repository';
import { type Client } from '@/types';
import { generateId } from '@/utils/id';

function now(): string {
  return new Date().toISOString();
}

interface ClientState {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
}

interface ClientActions {
  loadClients: () => Promise<void>;
  createClient: (client: Omit<Client, 'id' | 'createdAt'>) => Promise<void>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  getClientById: (id: string) => Client | undefined;
  searchClients: (query: string) => Client[];
  getClientSalesCount: (clientId: string) => number;
  getClientTotalSpent: (clientId: string) => number;
}

export const useClientStore = create<ClientState & ClientActions>((set, get) => ({
  clients: [],
  isLoading: false,
  error: null,

  loadClients: async () => {
    set({ isLoading: true, error: null });
    try {
      const clients = await clientRepository.getAllClients();
      set({ clients, isLoading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar clientes';
      set({ error: message, isLoading: false });
    }
  },

  createClient: async (client) => {
    set({ isLoading: true, error: null });
    try {
      const newClient: Client = {
        id: generateId(),
        ...client,
        createdAt: now(),
      };
      await clientRepository.createClient(newClient);
      set((state) => ({
        clients: [newClient, ...state.clients],
        isLoading: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al crear cliente';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  updateClient: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      await clientRepository.updateClient(id, data);
      set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
        isLoading: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al actualizar cliente';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  deleteClient: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await clientRepository.deleteClient(id);
      set((state) => ({
        clients: state.clients.filter((c) => c.id !== id),
        isLoading: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al eliminar cliente';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  getClientById: (id) => {
    return get().clients.find((c) => c.id === id);
  },

  searchClients: (query) => {
    const q = query.toLowerCase().trim();
    if (!q) return get().clients;
    return get().clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q),
    );
  },

  getClientById: (id: string) => {
    return get().clients.find((c) => c.id === id);
  },

  getClientSalesCount: (clientId) => {
    // Esto requiere acceso al saleStore - se puede resolver desde allí
    return 0;
  },

  getClientTotalSpent: (clientId) => {
    // Esto requiere acceso al saleStore - se puede resolver desde allí
    return 0;
  },

  // Métodos complementarios que podrían necesitarse
  getClientByName: (name: string) => {
    const q = name.toLowerCase();
    return get().clients.find((c) => c.name.toLowerCase().includes(q));
  },

  getFrequentClients: (limit = 5) => {
    // Este método puede usarse cuando integremos sale.store
    return get().clients.slice(0, limit);
  },
}));

export type { ClientState as ClientStoreState } from './client.store';