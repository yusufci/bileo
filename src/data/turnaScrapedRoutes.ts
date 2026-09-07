// Turna.com routes are never bundled statically: live results arrive through /api/turna
// (see src/lib/turna/client.ts). This export stays only because src/data/mockData.ts spreads it
// into ALL_ROUTES; it is intentionally empty.
import type { RouteItem } from '../types';

export const TURNA_SCRAPED_ROUTES: RouteItem[] = [];
