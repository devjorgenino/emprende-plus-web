const CACHE_KEY = 'bcv_exchange_rate';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export interface CachedRate {
  rate: number;
  fetchedAt: string;
  source: 'bcv' | 'manual' | 'cached';
  provider?: string;
}

export interface RateWithTimestamp {
  rate: number;
  timestamp: number;
  source: string;
}

// Local storage helpers
export function getRate(): CachedRate | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed: CachedRate = JSON.parse(cached);
    const age = Date.now() - new Date(parsed.fetchedAt).getTime();
    if (age < CACHE_TTL_MS) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function setRate(rate: number, source: 'bcv' | 'manual' = 'bcv', provider?: string): void {
  const entry: CachedRate = {
    rate,
    fetchedAt: new Date().toISOString(),
    source,
    provider,
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
}

// Proxy endpoints (configured in vite.config.ts to avoid CORS)
const APIS = [
  {
    name: 'DolarFlow',
    url: '/api/dolarflow/api/oficial/',
    priority: 1, // Primary source
    extract: (data: any): RateWithTimestamp | null => {
      if (typeof data?.precio === 'number' && data.precio > 0) {
        const timestamp = data.fechaActualizacion ? new Date(data.fechaActualizacion).getTime() : Date.now();
        return { rate: data.precio, timestamp, source: 'DolarFlow' };
      }
      return null;
    },
  },
  {
    name: 'BCV Today',
    url: '/api/bcv/api/v1/rate.json',
    priority: 2,
    extract: (data: any): RateWithTimestamp | null => {
      if (typeof data?.USD === 'number' && data.USD > 0) {
        const timestamp = data.updated_at ? new Date(data.updated_at).getTime() : Date.now();
        return { rate: data.USD, timestamp, source: 'BCV Today' };
      }
      return null;
    },
  },
  {
    name: 'Dolar API',
    url: '/api/dolarapi/v1/dolares/oficial',
    priority: 3,
    extract: (data: any): RateWithTimestamp | null => {
      if (typeof data?.promedio === 'number' && data.promedio > 0) {
        const timestamp = data.fechaActualizacion ? new Date(data.fechaActualizacion).getTime() : Date.now();
        return { rate: data.promedio, timestamp, source: 'Dolar API' };
      }
      return null;
    },
  },
];

export async function fetchBCVRate(): Promise<{ rate: number; source: string } | null> {
  const results: RateWithTimestamp[] = [];
  const now = Date.now();

  // Try all APIs in parallel with cache busting
  await Promise.all(
    APIS.map(async (api) => {
      try {
        const response = await fetch(`${api.url}?t=${now}`);
        if (!response.ok) return;
        const data = await response.json();
        const result = api.extract(data);
        if (result) results.push({ ...result, priority: api.priority });
      } catch (err) {
        console.warn(`[BCV] Failed to fetch from ${api.name}`, err);
      }
    })
  );

  if (results.length === 0) return null;

  // Strategy:
  // 1. Sort by priority (DolarFlow = 1 first)
  // 2. If priority equal, sort by timestamp (newest first)
  results.sort((a, b) => {
    const aPriority = (a as any).priority ?? 99;
    const bPriority = (b as any).priority ?? 99;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return b.timestamp - a.timestamp;
  });

  const best = results[0];
  console.log('[BCV] Rates available:', results);
  console.log('[BCV] Selected:', best.source, '(priority:', (best as any).priority, ')');

  return { rate: best.rate, source: best.source };
}