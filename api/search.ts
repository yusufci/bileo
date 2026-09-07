import type { VercelRequest, VercelResponse } from '@vercel/node';
import { serveSearchNode } from '../src/server/sources/http';

export const config = { maxDuration: 30 };

export default function handler(req: VercelRequest, res: VercelResponse) {
  return serveSearchNode(req, res);
}
