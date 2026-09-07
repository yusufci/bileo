/**
 * SERVER ONLY. Best-effort robots.txt check for the Turna fetcher.
 *
 * One robots.txt fetch per host per instance (24 h cache for parsed rules, 10 min for a
 * failed fetch). Only the `User-agent: *` group is evaluated, with Google-style longest-match
 * semantics (Allow wins ties). A fetch failure never blocks a request: the caller proceeds and
 * carries the warning `robots.txt alınamadı; izin var kabul edildi` in the response.
 */

export interface RobotsRule {
  allow: boolean;
  pattern: string;
}

export interface RobotsRules {
  rules: RobotsRule[];
}

export interface RobotsCacheEntry {
  /** null when robots.txt could not be fetched or answered with a non-200 status (fail-open). */
  rules: RobotsRules | null;
  fetchedAt: number;
  warning?: string;
}

export interface RobotsState {
  byHost: Map<string, RobotsCacheEntry>;
}

export interface RobotsDeps {
  fetchImpl: typeof fetch;
  now: () => number;
  headers?: Record<string, string>;
  /** robots.txt read timeout; slow hosts get a longer one from fetch.ts (robotsTimeoutMs). Defaults to ROBOTS_TIMEOUT_MS. */
  timeoutMs?: number;
}

export interface RobotsVerdict {
  allowed: boolean;
  warning?: string;
}

export const ROBOTS_TTL_MS = 24 * 60 * 60 * 1000;
export const ROBOTS_FAIL_TTL_MS = 10 * 60 * 1000;
export const ROBOTS_TIMEOUT_MS = 5000;
export const ROBOTS_FETCH_FAILED_WARNING = 'robots.txt alınamadı; izin var kabul edildi';

export function createRobotsState(): RobotsState {
  return { byHost: new Map() };
}

/** Parse robots.txt and keep only the rules of groups that address `User-agent: *`. */
export function parseRobotsTxt(text: string): RobotsRules {
  const rules: RobotsRule[] = [];
  let groupAgents: string[] = [];
  let groupHasRules = false;
  let groupIsWildcard = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const field = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (field === 'user-agent') {
      // A user-agent line after rules starts a new group.
      if (groupHasRules) {
        groupAgents = [];
        groupHasRules = false;
        groupIsWildcard = false;
      }
      groupAgents.push(value.toLowerCase());
      if (value === '*') groupIsWildcard = true;
      continue;
    }

    if (field === 'allow' || field === 'disallow') {
      groupHasRules = true;
      if (!groupIsWildcard) continue;
      // An empty Disallow means "allow everything"; an empty Allow is meaningless.
      if (value === '') continue;
      rules.push({ allow: field === 'allow', pattern: value });
      continue;
    }

    // Other directives (Sitemap, Crawl-delay, ...) are ignored but keep the group open.
  }
  return { rules };
}

function patternToRegExp(pattern: string): RegExp {
  let anchored = false;
  let body = pattern;
  if (body.endsWith('$')) {
    anchored = true;
    body = body.slice(0, -1);
  }
  const escaped = body
    .split('*')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${escaped}${anchored ? '$' : ''}`);
}

/** Longest matching pattern decides; on equal length Allow wins; no match means allowed. */
export function isPathAllowed(rules: RobotsRules, path: string): boolean {
  let bestLength = -1;
  let bestAllow = true;
  for (const rule of rules.rules) {
    if (!patternToRegExp(rule.pattern).test(path)) continue;
    const length = rule.pattern.length;
    if (length > bestLength || (length === bestLength && rule.allow && !bestAllow)) {
      bestLength = length;
      bestAllow = rule.allow;
    }
  }
  return bestAllow;
}

async function loadRobots(host: string, state: RobotsState, deps: RobotsDeps): Promise<RobotsCacheEntry> {
  const cached = state.byHost.get(host);
  const now = deps.now();
  if (cached) {
    const ttl = cached.rules ? ROBOTS_TTL_MS : ROBOTS_FAIL_TTL_MS;
    if (now - cached.fetchedAt < ttl) return cached;
  }

  let entry: RobotsCacheEntry;
  const timeoutMs = deps.timeoutMs ?? ROBOTS_TIMEOUT_MS;
  try {
    const res = await deps.fetchImpl(`https://${host}/robots.txt`, {
      method: 'GET',
      headers: deps.headers ?? { accept: 'text/plain,*/*;q=0.8' },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status === 200) {
      const text = await res.text();
      entry = { rules: parseRobotsTxt(text), fetchedAt: now };
    } else {
      entry = { rules: null, fetchedAt: now, warning: `${ROBOTS_FETCH_FAILED_WARNING} (HTTP ${res.status})` };
    }
  } catch (err) {
    // A timeout names the limit that was hit so the warning tells operators which host budget to look at.
    const reason = err instanceof Error ? (err.name === 'TimeoutError' ? `${timeoutMs / 1000} s içinde yanıt yok` : err.message) : String(err);
    entry = { rules: null, fetchedAt: now, warning: `${ROBOTS_FETCH_FAILED_WARNING} (${reason})` };
  }
  state.byHost.set(host, entry);
  return entry;
}

/**
 * Decide whether `url` may be fetched according to the host's robots.txt.
 * Fail-open: when robots.txt is unavailable the verdict is `allowed: true` plus a warning.
 */
export async function checkRobots(url: string, state: RobotsState, deps: RobotsDeps): Promise<RobotsVerdict> {
  const target = new URL(url);
  const entry = await loadRobots(target.host, state, deps);
  if (!entry.rules) {
    return { allowed: true, warning: entry.warning ?? ROBOTS_FETCH_FAILED_WARNING };
  }
  return { allowed: isPathAllowed(entry.rules, target.pathname + target.search) };
}
