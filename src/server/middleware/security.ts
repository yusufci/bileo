// Perimeter Defense & Security Headers Subsystem for Bileo Platform
// Enforces Helmet HTTP security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
// and Restrictive CORS whitelist policy.

import helmet from 'helmet';
import cors, { CorsOptions } from 'cors';

/**
 * Helmet Security Middleware Configuration:
 * - Content-Security-Policy (CSP) with strict source whitelisting
 * - HTTP Strict Transport Security (HSTS) with 1-year max age & includeSubDomains
 * - X-Frame-Options: DENY (clickjacking protection)
 * - X-Content-Type-Options: nosniff (MIME sniffing defense)
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Suppressed X-Powered-By header
 */
export const helmetSecurityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
  hidePoweredBy: true,
});

/**
 * Allowed CORS Origins Whitelist
 */
export const ALLOWED_ORIGINS = (
  process.env.CORS_ORIGIN ||
  'http://localhost:5173,http://localhost:3000,http://localhost:4173,http://127.0.0.1:5173,http://127.0.0.1:3000'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

/**
 * Checks if an origin is permitted by the CORS whitelist
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true; // Allow non-browser tools, curl, mobile native or same-origin
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Restrictive CORS Middleware Options
 */
export const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token'],
  exposedHeaders: ['RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
  maxAge: 86400, // 24 hours preflight cache
};

export const corsMiddleware = cors(corsOptions);

/**
 * Security headers verify helper for assertions and audits
 */
export function verifySecurityHeaders(resHeaders: Record<string, string | string[] | undefined>): {
  hasNosniff: boolean;
  hasFrameDeny: boolean;
  hasHsts: boolean;
  hasCsp: boolean;
  noPoweredBy: boolean;
} {
  const xcto = resHeaders['x-content-type-options'];
  const xfo = resHeaders['x-frame-options'];
  const hsts = resHeaders['strict-transport-security'];
  const csp = resHeaders['content-security-policy'];
  const xpb = resHeaders['x-powered-by'];

  return {
    hasNosniff: xcto === 'nosniff',
    hasFrameDeny: typeof xfo === 'string' && (xfo.toUpperCase() === 'DENY' || xfo.toUpperCase() === 'SAMEORIGIN'),
    hasHsts: typeof hsts === 'string' && hsts.includes('max-age'),
    hasCsp: typeof csp === 'string' && csp.length > 0,
    noPoweredBy: xpb === undefined,
  };
}
