import type { VercelRequest, VercelResponse } from '@vercel/node';
import { serveTurnaNode } from '../src/server/turna/http';

export const config = { maxDuration: 30 };

export default function handler(req: VercelRequest, res: VercelResponse) {
  return serveTurnaNode(req, res);
}
