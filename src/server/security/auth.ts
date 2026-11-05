import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../auth/tokenService';

const JWT_EXPIRES_IN = '24h';
const BCRYPT_SALT_ROUNDS = 12;

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export class AuthService {
  /**
   * Hashes a plaintext password with salted bcrypt rounds
   */
  public static async hashPassword(plaintext: string): Promise<string> {
    if (!plaintext || plaintext.length < 8) {
      throw new Error('Parola en az 8 karakter uzunluğunda olmalıdır.');
    }
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    return bcrypt.hash(plaintext, salt);
  }

  /**
   * Verifies plaintext password against stored hash safely (constant-time check)
   */
  public static async verifyPassword(plaintext: string, hash: string): Promise<boolean> {
    if (!plaintext || !hash) return false;
    return bcrypt.compare(plaintext, hash);
  }

  /**
   * Validates password strength and entropy
   */
  public static validatePasswordStrength(password: string): PasswordValidationResult {
    const errors: string[] = [];
    if (!password || password.length < 8) {
      errors.push('Parola en az 8 karakter olmalıdır.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Parola en az bir büyük harf içermelidir.');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Parola en az bir küçük harf içermelidir.');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Parola en az bir rakam içermelidir.');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generates a signed JWT session token
   */
  public static signToken(payload: TokenPayload): string {
    return jwt.sign(payload, getJwtSecret(), {
      expiresIn: JWT_EXPIRES_IN,
      algorithm: 'HS256',
    });
  }

  /**
   * Verifies and decodes a JWT session token
   */
  public static verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, getJwtSecret(), {
        algorithms: ['HS256'],
      }) as TokenPayload;
      return decoded;
    } catch {
      throw new Error('Geçersiz veya süresi dolmuş oturum anahtarı (JWT).');
    }
  }
}
