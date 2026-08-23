// Authentication & User Identity REST Routes for Bileo Platform
// Enforces endpoint-specific rate limiting, Zod validation, and JWT auth gatekeeping.

import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { validateRequest } from '../middleware/validateRequest';
import { requireAuth } from '../middleware/authMiddleware';
import { loginRateLimiter, registerRateLimiter } from '../middleware/rateLimit';
import { loginSchema, registerSchema } from '../schemas/authSchemas';

export const authRouter = Router();

// 1. User Registration (Anti-Bot rate limit: 5 / hr)
authRouter.post(
  '/register',
  registerRateLimiter,
  validateRequest({ body: registerSchema }),
  AuthController.register
);

// 2. User Login (Brute-Force rate limit: 5 / 15 mins)
authRouter.post(
  '/login',
  loginRateLimiter,
  validateRequest({ body: loginSchema }),
  AuthController.login
);

// 3. User Profile (Requires JWT Authentication)
authRouter.get(
  '/me',
  requireAuth,
  AuthController.getMe
);

// 4. User Logout
authRouter.post(
  '/logout',
  AuthController.logout
);
