import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { term, type } = req.query;
    const termStr = (term as string) || '';
    const typeStr = (type as string) || 'flight';

    if (!termStr.trim()) {
      return res.status(200).json([]);
    }

    const endpoint = typeStr === 'bus'
      ? `https://www.turna.com/api/proxy/v1/meta/autocomplete/bus?term=${encodeURIComponent(termStr)}&languageCode=TR`
      : `https://www.turna.com/api/proxy/v1/meta/autocomplete/flight?term=${encodeURIComponent(termStr)}&languageCode=TR`;

    const turnaRes = await fetch(endpoint, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    if (turnaRes.ok) {
      const data = await turnaRes.json();
      return res.status(200).json(data);
    } else {
      return res.status(200).json([]);
    }
  } catch (err) {
    console.error('[vercel-api] Autocomplete proxy error:', err);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json([]);
  }
}
