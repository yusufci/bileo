// JWT Authentication & Role-Based Authorization Gatekeeping Middlewares
// Enforces cryptographic token verification, role permissions, and guest optional auth.

import { Request, Response, NextFunction } from 'express';
import { extractToken, verifyToken, BileoJwtPayload } from '../auth/tokenService';

export interface AuthenticatedRequest extends Request {
  user?: BileoJwtPayload;
}

/**
 * Require Authentication Middleware
 * Validates cryptographic JWT signature, expiration, issuer/audience,
 * and attaches validated payload to req.user. Rejects unauthenticated requests with 401.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'No authentication token provided.',
      code: 'AUTH_TOKEN_MISSING',
    });
    return;
  }

  try {
    const payload = verifyToken(token);
    (req as AuthenticatedRequest).user = payload;
    next();
  } catch (err: any) {
    if (err.message === 'Token expired') {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'AUTH_TOKEN_EXPIRED',
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: err.message || 'Invalid authentication token',
      code: 'AUTH_TOKEN_INVALID',
    });
  }
}

/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies that the authenticated user possesses one of the authorized roles.
 * Returns 401 if unauthenticated, 403 if forbidden.
 * @param roles Array of permitted roles (e.g. ['admin', 'operator'])
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required for role verification.',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const userRole = authReq.user.role;
    if (!roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Access denied: insufficient permissions.',
        code: 'FORBIDDEN',
        requiredRoles: roles,
        userRole,
      });
      return;
    }

    next();
  };
}

/**
 * Optional Authentication Middleware
 * Non-blocking token inspector: populates req.user if a valid token is supplied,
 * otherwise permits anonymous guest access without rejection.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);

  if (token) {
    try {
      const payload = verifyToken(token);
      (req as AuthenticatedRequest).user = payload;
    } catch {
      (req as AuthenticatedRequest).user = undefined;
    }
  } else {
    (req as AuthenticatedRequest).user = undefined;
  }

  next();
}
