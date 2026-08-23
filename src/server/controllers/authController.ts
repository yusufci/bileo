// Authentication & Session Controller for Bileo Platform
// Implements secure registration, timing-attack-safe login, profile retrieval, and logout.

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { DatabaseManager } from '../db';
import { hashPassword, verifyPassword, dummyPasswordComparison, sanitizeUser } from '../auth/passwordService';
import { generateToken } from '../auth/tokenService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { RegisterInput, LoginInput } from '../schemas/authSchemas';

export class AuthController {
  /**
   * Register a new user with salted bcrypt (cost 12), parameterized SQL, and JWT session issuance.
   */
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = DatabaseManager.getInstance().getService();
      const body = req.body as RegisterInput;

      const email = body.email.toLowerCase().trim();
      const name = body.name.trim();
      const surname = body.surname.trim();
      const phone = body.phone.trim();

      // 1. Check if email already exists
      const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = $1', [email]);
      if (existing.rowCount > 0) {
        res.status(409).json({
          success: false,
          error: 'Bu e-posta adresi ile kayıtlı bir hesap zaten bulunmaktadır.',
          code: 'EMAIL_ALREADY_EXISTS',
        });
        return;
      }

      // 2. Hash password with bcrypt work factor 12
      const passwordHash = await hashPassword(body.password);
      const userId = `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const avatarInitials = `${name[0]?.toUpperCase() || 'U'}${surname[0]?.toUpperCase() || 'S'}`;

      // 3. Insert into users table
      await db.query(
        `INSERT INTO users (id, email, password_hash, name, surname, phone, tc_no_masked, tc_no_hash, gender, role, avatar_initials, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          userId,
          email,
          passwordHash,
          name,
          surname,
          phone,
          null,
          null,
          null,
          'customer',
          avatarInitials,
          true,
        ]
      );

      // 4. Fetch the newly created user record
      const userRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      const userRecord = userRes.rows[0];
      const safeUser = sanitizeUser(userRecord);

      // 5. Generate signed JWT token
      const token = generateToken({
        id: userId,
        email,
        name,
        surname,
        role: 'customer',
      });

      // 6. Set HTTP-Only Cookie
      res.cookie('bileo_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.status(201).json({
        success: true,
        message: 'Kullanıcı hesabı başarıyla oluşturuldu.',
        user: safeUser,
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Authenticate user credentials with constant-time comparison defense against timing attacks.
   */
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = DatabaseManager.getInstance().getService();
      const body = req.body as LoginInput;
      const email = body.email.toLowerCase().trim();

      // 1. Fetch user record by email
      const userRes = await db.query('SELECT * FROM users WHERE LOWER(email) = $1', [email]);

      if (userRes.rowCount === 0) {
        // Timing attack defense: execute dummy bcrypt comparison to equalize latency (~80-140ms)
        await dummyPasswordComparison();
        res.status(401).json({
          success: false,
          error: 'E-posta adresi veya şifre hatalı.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      const userRecord = userRes.rows[0];

      // 2. Verify candidate password
      const isPasswordValid = await verifyPassword(body.password, userRecord.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: 'E-posta adresi veya şifre hatalı.',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      // 3. Verify user active status
      if (userRecord.is_active === false) {
        res.status(403).json({
          success: false,
          error: 'Hesabınız askıya alınmıştır. Lütfen destek ekibi ile iletişime geçiniz.',
          code: 'ACCOUNT_SUSPENDED',
        });
        return;
      }

      // 4. Generate signed JWT token
      const expiresIn = body.rememberMe ? '7d' : '1h';
      const token = generateToken(
        {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.name,
          surname: userRecord.surname,
          role: userRecord.role || 'customer',
        },
        { expiresIn }
      );

      // 5. Set HTTP-Only Cookie
      const maxAge = body.rememberMe ? 7 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
      res.cookie('bileo_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge,
        path: '/',
      });

      const safeUser = sanitizeUser(userRecord);

      res.status(200).json({
        success: true,
        message: 'Giriş başarılı.',
        user: safeUser,
        token,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve current authenticated user profile
   */
  public static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required.',
          code: 'UNAUTHORIZED',
        });
        return;
      }

      const db = DatabaseManager.getInstance().getService();
      const userRes = await db.query('SELECT * FROM users WHERE id = $1', [authReq.user.sub]);

      if (userRes.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Kullanıcı profili bulunamadı.',
          code: 'USER_NOT_FOUND',
        });
        return;
      }

      const safeUser = sanitizeUser(userRes.rows[0]);
      res.status(200).json({
        success: true,
        user: safeUser,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Terminate current session & purge auth cookies
   */
  public static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('bileo_token', { path: '/' });
    res.clearCookie('access_token', { path: '/' });

    res.status(200).json({
      success: true,
      message: 'Oturum başarıyla sonlandırıldı.',
    });
  }
}
