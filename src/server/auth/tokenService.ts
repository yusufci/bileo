// JWT Token Security & Cryptographic Signing Subsystem for Bileo Transportation Platform
// Enforces HS256 cryptographic signatures, strict expiration, RFC 7519 claims,
// algorithm confusion protection (alg: none rejection), and dual-transport token extraction.

import jwt, { JwtPayload as StandardJwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import crypto from 'crypto';

// Development/test-only fallback. It is visible in the public source, so getJwtSecret refuses to
// use it when NODE_ENV=production; otherwise anyone could mint valid tokens for a deployment.
export const JWT_SECRET_DEFAULT = 'bileo-dev-only-insecure-jwt-secret-do-not-deploy';
export const JWT_ISSUER_DEFAULT = 'bileo-api';
export const JWT_AUDIENCE_DEFAULT = 'bileo-app';
export const JWT_EXPIRES_IN_DEFAULT = '1h';

export interface BileoJwtPayload {
  sub: string;
  email: string;
  role: 'customer' | 'admin' | 'operator' | 'auditor' | string;
  name: string;
  surname: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string;
  jti?: string;
}

export interface GenerateTokenOptions {
  expiresIn?: string | number;
  secret?: string;
  issuer?: string;
  audience?: string;
  jti?: string;
}

export interface UserTokenInput {
  id?: string;
  sub?: string;
  userId?: string;
  email: string;
  role?: string;
  name?: string;
  surname?: string;
  fullName?: string;
}

/**
 * Resolves the configured JWT signing secret
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production.');
  }
  return JWT_SECRET_DEFAULT;
}

/**
 * Resolves the configured JWT issuer
 */
export function getJwtIssuer(): string {
  return process.env.JWT_ISSUER || JWT_ISSUER_DEFAULT;
}

/**
 * Resolves the configured JWT audience
 */
export function getJwtAudience(): string {
  return process.env.JWT_AUDIENCE || JWT_AUDIENCE_DEFAULT;
}

/**
 * Generates and signs a tamper-proof JSON Web Token (JWT) with HS256 HMAC-SHA256 signature.
 * @param user User profile details to encode in claims
 * @param optionsOrExpiresIn Optional configuration object or expiresIn string (e.g. '1h', '7d', 3600)
 * @returns Signed JWT string
 */
export function generateToken(
  user: UserTokenInput,
  optionsOrExpiresIn?: GenerateTokenOptions | string | number
): string {
  if (!user || typeof user !== 'object') {
    throw new Error('User payload must be provided to generate token.');
  }

  const userId = user.id || user.sub || user.userId;
  if (!userId) {
    throw new Error('User ID (id or sub) is required for token generation.');
  }
  if (!user.email) {
    throw new Error('User email is required for token generation.');
  }

  let name = user.name || '';
  let surname = user.surname || '';
  if (!name && !surname && user.fullName) {
    const parts = user.fullName.trim().split(' ');
    surname = parts.length > 1 ? parts.pop() || '' : '';
    name = parts.join(' ');
  }

  const options: GenerateTokenOptions =
    typeof optionsOrExpiresIn === 'string' || typeof optionsOrExpiresIn === 'number'
      ? { expiresIn: optionsOrExpiresIn }
      : optionsOrExpiresIn || {};

  const secret = options.secret || getJwtSecret();
  const issuer = options.issuer || getJwtIssuer();
  const audience = options.audience || getJwtAudience();
  const expiresIn = (options.expiresIn ?? JWT_EXPIRES_IN_DEFAULT) as any;
  const jti = options.jti || crypto.randomUUID();

  const payload: Record<string, any> = {
    sub: userId,
    email: user.email.toLowerCase().trim(),
    role: user.role || 'customer',
    name: name.trim(),
    surname: surname.trim(),
  };

  const signOptions: SignOptions = {
    algorithm: 'HS256',
    expiresIn,
    issuer,
    audience,
    jwtid: jti,
  };

  return jwt.sign(payload, secret, signOptions);
}

/**
 * Cryptographically verifies a JWT token:
 * - Rejects empty/malformed tokens
 * - Rejects "none" algorithm and non-HS256 algorithm confusion
 * - Validates HMAC signature against JWT_SECRET
 * - Validates token expiration (exp)
 * - Validates issuer (iss) and audience (aud)
 * @param token Signed JWT token string
 * @param secret Optional override secret key
 * @returns Decoded and validated BileoJwtPayload
 */
export function verifyToken(token: string, secret?: string): BileoJwtPayload {
  if (!token || typeof token !== 'string') {
    throw new Error('No authentication token provided.');
  }

  const cleanToken = token.trim();
  const parts = cleanToken.split('.');
  if (parts.length !== 3) {
    throw new Error('Malformed token format: expected 3 dot-separated segments.');
  }

  // Pre-decode header to inspect algorithm and prevent algorithm confusion attacks (e.g. alg: "none")
  try {
    const headerJson = Buffer.from(parts[0], 'base64url').toString('utf8');
    const header = JSON.parse(headerJson);
    if (!header || typeof header !== 'object') {
      throw new Error('Invalid token header.');
    }
    if (!header.alg || header.alg.toLowerCase() === 'none') {
      throw new Error('Insecure algorithm "none" is strictly forbidden.');
    }
    if (header.alg !== 'HS256') {
      throw new Error(`Unsupported token algorithm: ${header.alg}. Expected HS256.`);
    }
  } catch (err: any) {
    if (err.message.includes('strictly forbidden') || err.message.includes('Unsupported token algorithm')) {
      throw err;
    }
    throw new Error(`Invalid token structure: ${err.message}`);
  }

  const verifySecret = secret || getJwtSecret();
  const verifyOptions: VerifyOptions = {
    algorithms: ['HS256'],
    issuer: getJwtIssuer(),
    audience: getJwtAudience(),
  };

  try {
    const decoded = jwt.verify(cleanToken, verifySecret, verifyOptions) as StandardJwtPayload;

    const payload: BileoJwtPayload = {
      sub: (decoded.sub || (decoded as any).userId || '') as string,
      email: (decoded.email || '') as string,
      role: (decoded.role || 'customer') as any,
      name: (decoded.name || '') as string,
      surname: (decoded.surname || '') as string,
      iat: decoded.iat,
      exp: decoded.exp,
      iss: decoded.iss,
      aud: typeof decoded.aud === 'string' ? decoded.aud : Array.isArray(decoded.aud) ? decoded.aud[0] : undefined,
      jti: decoded.jti,
    };

    return payload;
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new Error(`Invalid authentication token: ${err.message}`);
    }
    throw err;
  }
}

/**
 * Dual-Transport Token Extractor:
 * Extracts JWT token string from HTTP request headers or cookies.
 * Order of precedence:
 * 1. Authorization: Bearer <token> header (case-insensitive "bearer ")
 * 2. req.cookies.bileo_token
 * 3. req.cookies.access_token
 * @param req Express Request object (or request-like mock object)
 * @returns Clean JWT token string or null if not found
 */
export function extractToken(req: any): string | null {
  if (!req || typeof req !== 'object') {
    return null;
  }

  // 1. Check Authorization header
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (typeof authHeader === 'string') {
    const trimmed = authHeader.trim();
    if (trimmed.toLowerCase().startsWith('bearer ')) {
      const token = trimmed.slice(7).trim();
      if (token.length > 0) {
        return token;
      }
    }
  }

  // 2. Check HTTP-only cookies
  const cookies = req.cookies;
  if (cookies && typeof cookies === 'object') {
    if (typeof cookies.bileo_token === 'string' && cookies.bileo_token.trim().length > 0) {
      return cookies.bileo_token.trim();
    }
    if (typeof cookies.access_token === 'string' && cookies.access_token.trim().length > 0) {
      return cookies.access_token.trim();
    }
  }

  return null;
}

/**
 * Safely decodes a token payload without verifying signature (for client inspection or logging)
 * @param token JWT string
 * @returns Decoded payload or null
 */
export function decodeToken(token: string): BileoJwtPayload | null {
  if (!token || typeof token !== 'string') return null;
  try {
    const decoded = jwt.decode(token.trim()) as StandardJwtPayload | null;
    if (!decoded || typeof decoded !== 'object') return null;
    return {
      sub: (decoded.sub || (decoded as any).userId || '') as string,
      email: (decoded.email || '') as string,
      role: (decoded.role || 'customer') as any,
      name: (decoded.name || '') as string,
      surname: (decoded.surname || '') as string,
      iat: decoded.iat,
      exp: decoded.exp,
      iss: decoded.iss,
      aud: typeof decoded.aud === 'string' ? decoded.aud : Array.isArray(decoded.aud) ? decoded.aud[0] : undefined,
      jti: decoded.jti,
    };
  } catch {
    return null;
  }
}

// Class-based TokenService facade
export class TokenService {
  public static generateToken = generateToken;
  public static verifyToken = verifyToken;
  public static extractToken = extractToken;
  public static decodeToken = decodeToken;
  public static getJwtSecret = getJwtSecret;
}
