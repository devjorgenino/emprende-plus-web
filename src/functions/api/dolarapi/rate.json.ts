import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
    const data = await response.json();
    if (typeof data?.promedio === 'number' && data.promedio > 0) {
      res.json({ USD: data.promedio, updated_at: data.fechaActualizacion });
      return;
    }
    res.status(503).json({ error: 'No rate available' });
  } catch (err) {
    console.error('[DolarAPI Function] Error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
