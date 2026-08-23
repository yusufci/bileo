// Zod Schemas for Authentication & Identity Management
// Enforces email normalization, NIST SP 800-63B password complexity, and KVKK terms consent.

import { z } from 'zod';

/**
 * Login Request Schema
 */
export const loginSchema = z.object({
  email: z
    .string({ message: 'E-posta adresi gereklidir.' })
    .trim()
    .email('Geçerli bir e-posta adresi giriniz.')
    .toLowerCase(),
  password: z
    .string({ message: 'Şifre alanı zorunludur.' })
    .min(1, 'Şifre alanı zorunludur.')
    .max(72, 'Şifre en fazla 72 karakter olabilir.'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Registration Request Schema
 */
export const registerSchema = z
  .object({
    name: z
      .string({ message: 'Ad alanı zorunludur.' })
      .trim()
      .min(2, 'Ad en az 2 karakter olmalıdır.')
      .max(50, 'Ad en fazla 50 karakter olabilir.'),
    surname: z
      .string({ message: 'Soyad alanı zorunludur.' })
      .trim()
      .min(2, 'Soyad en az 2 karakter olmalıdır.')
      .max(50, 'Soyad en fazla 50 karakter olabilir.'),
    email: z
      .string({ message: 'E-posta adresi zorunludur.' })
      .trim()
      .email('Geçerli bir e-posta adresi giriniz.')
      .toLowerCase(),
    phone: z
      .string({ message: 'Telefon numarası zorunludur.' })
      .trim()
      .regex(/^(05|\+905|5)\d{9}$/, 'Geçerli bir cep telefonu numarası giriniz (örn: 05321234567).'),
    password: z
      .string({ message: 'Şifre zorunludur.' })
      .min(8, 'Şifreniz en az 8 karakterden oluşmalıdır.')
      .max(72, 'Şifre en fazla 72 karakter olabilir.')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.'),
    passwordConfirm: z.string({ message: 'Şifre tekrarı zorunludur.' }),
    acceptTerms: z.literal(true, {
      message: 'Kullanım Koşulları ve KVKK metnini onaylamanız gerekmektedir.',
    }),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'Girdiğiniz şifreler birbiriyle eşleşmiyor.',
    path: ['passwordConfirm'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Password Reset Request Schema
 */
export const passwordResetRequestSchema = z.object({
  email: z
    .string({ message: 'E-posta adresi zorunludur.' })
    .trim()
    .email('Geçerli bir e-posta adresi giriniz.')
    .toLowerCase(),
});

export type PasswordResetRequestInput = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password Reset Confirmation Schema
 */
export const passwordResetConfirmSchema = z
  .object({
    token: z.string({ message: 'Sıfırlama anahtarı zorunludur.' }).min(1),
    newPassword: z
      .string({ message: 'Yeni şifre zorunludur.' })
      .min(8, 'Şifreniz en az 8 karakterden oluşmalıdır.')
      .max(72, 'Şifre en fazla 72 karakter olabilir.')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir.'),
    newPasswordConfirm: z.string({ message: 'Yeni şifre tekrarı zorunludur.' }),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: 'Girdiğiniz şifreler birbiriyle eşleşmiyor.',
    path: ['newPasswordConfirm'],
  });

export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;

// Alias for backwards compatibility
export const passwordResetSchema = passwordResetRequestSchema;
