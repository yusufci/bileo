import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeTurnaDirect } from './utils/scraper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { from, to, type, date } = req.query;

    if (!from || !to || !type) {
      return res.status(400).json({ error: 'Missing required parameters: from, to, type' });
    }

    const results = await scrapeTurnaDirect(
      from as string,
      to as string,
      type as string,
      date as string | undefined
    );

    // Ensure cross-origin is allowed
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    return res.status(200).json(results);
  } catch (error) {
    console.error('[vercel-api] Live scrape error:', error);
    return res.status(500).json({ error: 'Internal Server Error during scraping' });
  }
}
