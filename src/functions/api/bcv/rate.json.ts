import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RateResponse {
  USD: number;
  updated_at: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Primary source: DolarFlow
    const dolarflow = await fetch('https://dolarflow.com/api/oficial/?t=' + Date.now())
      .then(r => r.json())
      .then(d => ({ rate: d.precio, source: 'DolarFlow' }))
      .catch(() => null);

    if (dolarflow) {
      res.json({ USD: dolarflow.rate, updated_at: new Date().toISOString() });
      return;
    }

    // Fallback: DolarAPI
    const dolarapi = await fetch('https://ve.dolarapi.com/v1/dolares/oficial')
      .then(r => r.json())
      .then(d => ({ USD: d.promedio, updated_at: d.fechaActualizacion }))
      .catch(() => null);

    if (dolarapi) {
      res.json(dolarapi);
      return;
    }

    res.status(503).json({ error: 'No exchange rate available' });
  } catch (err) {
    console.error('[BCV Function] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
