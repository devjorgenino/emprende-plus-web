import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const response = await fetch('https://dolarflow.com/api/oficial/?t=' + Date.now());
    const data = await response.json();
    if (typeof data?.precio === 'number' && data.precio > 0) {
      res.json({ USD: data.precio, updated_at: data.fechaActualizacion || new Date().toISOString() });
      return;
    }
    res.status(503).json({ error: 'No rate available' });
  } catch (err) {
    console.error('[DolarFlow Function] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
