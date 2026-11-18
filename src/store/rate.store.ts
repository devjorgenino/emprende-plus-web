import { create } from 'zustand';
import { fetchBCVRate, getRate as getCachedRate, setRate as setCachedRate } from '@/services/api/bcv.service';

const REFRESH_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours

interface RateState {
  rate: number | null;
  source: 'bcv' | 'manual' | 'cached' | null;
  provider: string | null;
  fetchedAt: string | null;
  isLoading: boolean;
  error: string | null;
}

interface RateActions {
  loadRate: (force?: boolean) => Promise<void>;
  setManualRate: (rate: number) => Promise<void>;
  refresh: () => Promise<void>;
  startPolling: () => () => void;
}

export const useRateStore = create<RateState & RateActions>((set, get) => ({
  rate: null,
  source: null,
  provider: null,
  fetchedAt: null,
  isLoading: false,
  error: null,

  loadRate: async (force = false) => {
    if (get().isLoading) return;

    set({ isLoading: true, error: null });

    if (!force) {
      const cached = getCachedRate();
      if (cached) {
        set({
          rate: cached.rate,
          source: cached.source,
          provider: cached.provider || null,
          fetchedAt: cached.fetchedAt,
          isLoading: false,
        });
      }
    }

    try {
      const result = await fetchBCVRate();

      if (result !== null) {
        setCachedRate(result.rate, 'bcv', result.source);

        if (get().source === 'manual' && !force) {
          set({ isLoading: false });
          return;
        }

        set({
          rate: result.rate,
          source: 'bcv',
          provider: result.source,
          fetchedAt: new Date().toISOString(),
          isLoading: false,
          error: null,
        });
      } else {
        const cached = getCachedRate();
        set({
          isLoading: false,
          error: cached ? null : 'Error al obtener la tasa',
        });
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },

  setManualRate: async (rate: number) => {
    setCachedRate(rate, 'manual', 'Manual');
    set({
      rate,
      source: 'manual',
      provider: 'Manual',
      fetchedAt: new Date().toISOString(),
      error: null,
      isLoading: false,
    });
  },

  refresh: async () => {
    await get().loadRate(true);
  },

  startPolling: () => {
    const interval = setInterval(() => {
      get().loadRate();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  },
}));