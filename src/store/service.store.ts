import { create } from 'zustand';
import * as serviceRepository from '../services/db/repositories/service.repository';
import { getRate, setRate, type CachedRate } from '../services/api/bcv.service';
import { type Service } from '@/types';
import { generateId } from '@/utils/id';

function now(): string {
  return new Date().toISOString();
}

interface ServiceState {
  services: Service[];
  isLoading: boolean;
  error: string | null;
}

interface ServiceActions {
  loadServices: () => Promise<void>;
  createService: (data: Omit<Service, 'id' | 'priceVES' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateService: (id: string, data: Partial<Omit<Service, 'updatedAt' | 'priceVES'>>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  getServiceById: (id: string) => Service | undefined;
}

export const useServiceStore = create<ServiceState & ServiceActions>((set, get) => ({
  services: [],
  isLoading: false,
  error: null,

  loadServices: async () => {
    set({ isLoading: true, error: null });
    try {
      const services = await serviceRepository.getAllServices();
      set({ services, isLoading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al cargar servicios';
      set({ error: message, isLoading: false });
    }
  },

  createService: async (data) => {
    const cached = getRate();
    const exchangeRate = cached?.rate ?? 735; // fallback

    set({ isLoading: true, error: null });
    try {
      const newService = {
        ...data,
        priceVES: Math.round(data.priceUSD * exchangeRate * 100) / 100,
        isActive: true,
        createdAt: now(),
        updatedAt: now(),
      };

      await serviceRepository.createService(newService);
      set((state) => ({
        services: [newService, ...state.services],
        isLoading: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al crear servicio';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  updateService: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const existing = await serviceRepository.getServiceById(id);
      if (!existing) {
        throw new Error('Servicio no encontrado');
      }

      const cached = getRate();
      const exchangeRate = cached?.rate ?? 735;
      const priceUSD = data.priceUSD ?? existing.priceUSD;

      const updated: Service = {
        ...existing,
        ...data,
        priceUSD,
        priceVES: data.priceUSD ? Math.round(priceUSD * exchangeRate * 100) / 100 : existing.priceVES,
        updatedAt: now(),
      };

      await serviceRepository.updateService(id, updated);
      set((state) => ({
        services: state.services.map((s) => (s.id === id ? updated : s)),
        isLoading: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al actualizar servicio';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  deleteService: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await serviceRepository.deleteService(id);
      set((state) => ({
        services: state.services.filter((s) => s.id !== id),
        isLoading: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al eliminar servicio';
      set({ error: message, isLoading: false });
      throw e;
    }
  },

  getServiceById: (id) => {
    return get().services.find((s) => s.id === id);
  },
}));