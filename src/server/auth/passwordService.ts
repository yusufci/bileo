// Password Security & Cryptographic Service for Bileo Transportation Platform
// Implements salted bcrypt (work factor 12), constant-time timing attack defense,
// zero plaintext leakage sanitization, and enterprise password complexity validation.

import bcrypt from 'bcryptjs';
import { UserRow } from '../db/types';

export const BCRYPT_WORK_FACTOR = 12;

// Static pre-computed dummy bcrypt hash (cost 12) for constant-time comparison on non-existent users
export const DUMMY_BCRYPT_HASH = '$2b$12$e8I6gV/qK9u0b7pQ1H6e7e4oG5hU4t.L3v3z3w4y6A8B0C2D4E6F.';

export interface PasswordCriteria {
  minLength: boolean;
  maxLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  score: number; // 0 to 5
  errors: string[];
  criteria: PasswordCriteria;
}

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  surname: string;
  phone: string;
  tcNo?: string | null;
  tc_no_masked?: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  role: 'customer' | 'admin' | 'operator' | 'auditor' | string;
  avatarInitials: string;
  avatar_initials?: string | null;
  isActive: boolean;
  is_active?: boolean;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

/**
 * Hashes a plaintext password using bcrypt with work factor 12.
 * @param password The plaintext password to hash
 * @returns The salted bcrypt hash string (format: $2b$12$...)
 */
export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Parola boş bırakılamaz.');
  }
  if (password.length < 8) {
    throw new Error('Parola en az 8 karakter uzunluğunda olmalıdır.');
  }
  if (password.length > 72) {
    throw new Error('Parola en fazla 72 karakter uzunluğunda olabilir.');
  }

  const salt = await bcrypt.genSalt(BCRYPT_WORK_FACTOR);
  return bcrypt.hash(password, salt);
}

/**
 * Verifies a candidate password against a stored bcrypt hash in constant-time.
 * Safely catches malformed hashes and returns false without throwing unhandled exceptions.
 * @param candidate The plaintext candidate password
 * @param hash The stored bcrypt hash
 * @returns True if password matches hash, false otherwise
 */
export async function verifyPassword(candidate: string, hash: string): Promise<boolean> {
  if (!candidate || !hash || typeof candidate !== 'string' || typeof hash !== 'string') {
    return false;
  }

  try {
    return await bcrypt.compare(candidate, hash);
  } catch {
    return false;
  }
}

/**
 * Executes a dummy bcrypt work factor 12 comparison against a pre-computed hash.
 * Used during login when a requested user does not exist to eliminate user enumeration
 * timing discrepancies between existing and non-existing email lookups (~80-140ms).
 */
export async function dummyPasswordComparison(): Promise<void> {
  try {
    await bcrypt.compare('dummy_candidate_timing_defense_2026', DUMMY_BCRYPT_HASH);
  } catch {
    // Suppress internal dummy comparison error
  }
}

/**
 * Validates password strength and entropy against enterprise security policies:
 * - Minimum 8 characters
 * - Maximum 72 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one numeric digit (0-9)
 * - At least one special symbol (!@#$%^&*...)
 * @param password Plaintext candidate password
 * @returns Comprehensive validation result with criteria breakdown and score
 */
export function validatePasswordStrength(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (typeof password !== 'string' || password.length === 0) {
    return {
      isValid: false,
      score: 0,
      errors: ['Parola boş bırakılamaz.'],
      criteria: {
        minLength: false,
        maxLength: false,
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSymbol: false,
      },
    };
  }

  const minLength = password.length >= 8;
  const maxLength = password.length <= 72;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`^]/.test(password);

  if (!minLength) {
    errors.push('Parola en az 8 karakter olmalıdır.');
  }
  if (!maxLength) {
    errors.push('Parola en fazla 72 karakter olmalıdır.');
  }
  if (!hasUppercase) {
    errors.push('Parola en az bir büyük harf (A-Z) içermelidir.');
  }
  if (!hasLowercase) {
    errors.push('Parola en az bir küçük harf (a-z) içermelidir.');
  }
  if (!hasNumber) {
    errors.push('Parola en az bir rakam (0-9) içermelidir.');
  }
  if (!hasSymbol) {
    errors.push('Parola en az bir özel karakter (!@#$%^&* vb.) içermelidir.');
  }

  let score = 0;
  if (minLength && maxLength) score += 1;
  if (hasUppercase && hasLowercase) score += 1;
  if (hasNumber) score += 1;
  if (hasSymbol) score += 1;
  if (password.length >= 12 && hasUppercase && hasLowercase && hasNumber && hasSymbol) score += 1;

  const isValid = minLength && maxLength && hasUppercase && hasLowercase && hasNumber && hasSymbol;

  return {
    isValid,
    score,
    errors,
    criteria: {
      minLength,
      maxLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSymbol,
    },
  };
}

/**
 * Sanitizes an internal user record/row by stripping all sensitive credential fields:
 * - password_hash
 * - password
 * - salt
 * - tc_no_hash
 * - id_number_hash
 * - tokens
 * Computes safe avatar initials and formats dates.
 * @param user Raw user database row or object
 * @returns Sanitized public UserDTO
 */
export function sanitizeUser(user: Partial<UserRow> & Record<string, any>): UserDTO {
  if (!user || typeof user !== 'object') {
    throw new Error('Invalid user object provided for sanitization.');
  }

  // Destructure and omit sensitive fields
  const {
    password_hash,
    password,
    salt,
    tc_no_hash,
    id_number_hash,
    reset_token,
    token,
    ...cleanRecord
  } = user;

  const name = (cleanRecord.name || '').trim();
  const surname = (cleanRecord.surname || '').trim();
  const firstLetter = name.length > 0 ? name[0].toUpperCase() : 'U';
  const lastLetter = surname.length > 0 ? surname[0].toUpperCase() : 'S';
  const avatarInitials = cleanRecord.avatar_initials || cleanRecord.avatarInitials || `${firstLetter}${lastLetter}`;

  const createdAt = cleanRecord.created_at
    ? typeof cleanRecord.created_at === 'string'
      ? cleanRecord.created_at
      : new Date(cleanRecord.created_at).toISOString()
    : cleanRecord.createdAt || new Date().toISOString();

  const updatedAt = cleanRecord.updated_at
    ? typeof cleanRecord.updated_at === 'string'
      ? cleanRecord.updated_at
      : new Date(cleanRecord.updated_at).toISOString()
    : cleanRecord.updatedAt || undefined;

  const isActive = cleanRecord.is_active !== undefined ? Boolean(cleanRecord.is_active) : (cleanRecord.isActive ?? true);

  const dto: UserDTO = {
    id: cleanRecord.id || '',
    email: cleanRecord.email || '',
    name: name,
    surname: surname,
    phone: cleanRecord.phone || '',
    tcNo: cleanRecord.tc_no_masked || cleanRecord.tcNo || undefined,
    tc_no_masked: cleanRecord.tc_no_masked || cleanRecord.tcNo || undefined,
    gender: cleanRecord.gender || null,
    role: cleanRecord.role || 'customer',
    avatarInitials,
    avatar_initials: avatarInitials,
    isActive,
    is_active: isActive,
    createdAt,
    created_at: createdAt,
    ...(updatedAt ? { updatedAt, updated_at: updatedAt } : {}),
  };

  return dto;
}

// Class-based service facade for backward compatibility and OOP consumers
export class PasswordService {
  public static hashPassword = hashPassword;
  public static verifyPassword = verifyPassword;
  public static dummyPasswordComparison = dummyPasswordComparison;
  public static validatePasswordStrength = validatePasswordStrength;
  public static sanitizeUser = sanitizeUser;
}
