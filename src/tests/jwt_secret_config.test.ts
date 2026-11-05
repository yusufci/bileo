// The repository is public, so any fallback secret in the source is known to everyone.
// Production must refuse to sign or verify tokens with it.

import { describe, it, expect } from './test_framework';
import { getJwtSecret, JWT_SECRET_DEFAULT } from '../server/auth/tokenService';
import { AuthService } from '../server/security/auth';

function withEnv(env: { NODE_ENV?: string; JWT_SECRET?: string }, fn: () => void) {
  const prev = { NODE_ENV: process.env.NODE_ENV, JWT_SECRET: process.env.JWT_SECRET };
  for (const key of ['NODE_ENV', 'JWT_SECRET'] as const) {
    if (env[key] === undefined) delete process.env[key];
    else process.env[key] = env[key];
  }
  try {
    fn();
  } finally {
    for (const key of ['NODE_ENV', 'JWT_SECRET'] as const) {
      if (prev[key] === undefined) delete process.env[key];
      else process.env[key] = prev[key];
    }
  }
}

export function runJwtSecretConfigTests() {
  describe('JWT secret configuration: no public fallback in production', () => {
    it('S.1 tokenService throws in production when JWT_SECRET is unset', () => {
      withEnv({ NODE_ENV: 'production' }, () => {
        expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
      });
    });

    it('S.2 tokenService uses JWT_SECRET when set, in production too', () => {
      withEnv({ NODE_ENV: 'production', JWT_SECRET: 'configured-secret-value-for-test-1234' }, () => {
        expect(getJwtSecret()).toBe('configured-secret-value-for-test-1234');
      });
    });

    it('S.3 tokenService falls back to the dev secret outside production', () => {
      withEnv({ NODE_ENV: 'test' }, () => {
        expect(getJwtSecret()).toBe(JWT_SECRET_DEFAULT);
      });
    });

    it('S.4 security/auth AuthService refuses to sign in production without JWT_SECRET', () => {
      withEnv({ NODE_ENV: 'production' }, () => {
        expect(() => AuthService.signToken({ userId: 'u1', email: 'a@b.co', role: 'customer' })).toThrow(/JWT_SECRET/);
      });
    });
  });
}
