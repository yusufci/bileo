import { z } from 'zod';

/**
 * 1. Authentication Schemas
 */
export const RegisterSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Ad soyad en az 3 karakter olmalıdır.')
    .max(100, 'Ad soyad en fazla 100 karakter olabilir.')
    .regex(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/, 'Ad soyad sadece harflerden oluşmalıdır.'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz.').max(255),
  phone: z
    .string()
    .regex(/^(05|5)[0-9]{9}$/, 'Geçerli bir Türkiye telefon numarası giriniz (05XX XXX XX XX).'),
  password: z
    .string()
    .min(8, 'Parola en az 8 karakter olmalıdır.')
    .max(128, 'Parola en fazla 128 karakter olabilir.')
    .regex(/[A-Z]/, 'Parola en az bir büyük harf içermelidir.')
    .regex(/[a-z]/, 'Parola en az bir küçük harf içermelidir.')
    .regex(/[0-9]/, 'Parola en az bir rakam içermelidir.'),
  kvkkAccepted: z.literal(true),
});

export const LoginSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  password: z.string().min(1, 'Parola boş bırakılamaz.'),
});

/**
 * 2. Search & Filter Validation Schemas
 */
export const RouteSearchSchema = z.object({
  from: z.string().min(2, 'Kalkış noktası en az 2 karakter olmalıdır.').max(50),
  to: z.string().min(2, 'Varış noktası en az 2 karakter olmalıdır.').max(50),
  date: z.string().min(4, 'Geçerli bir tarih seçiniz.'),
  transportType: z.enum(['all', 'otobus', 'ucak', 'tren', 'feribot']).default('all'),
  passengerCount: z.number().int().min(1).max(9).default(1),
});

/**
 * 3. Booking & Passenger Validation Schemas
 */
export const PassengerItemSchema = z.object({
  firstName: z
    .string()
    .min(2, 'İsim en az 2 karakter olmalıdır.')
    .max(50)
    .regex(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/, 'İsim sadece harflerden oluşmalıdır.'),
  lastName: z
    .string()
    .min(2, 'Soyisim en az 2 karakter olmalıdır.')
    .max(50)
    .regex(/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/, 'Soyisim sadece harflerden oluşmalıdır.'),
  tc: z.string().regex(/^[1-9]{1}[0-9]{10}$/, '11 haneli geçerli T.C. Kimlik Numarası giriniz.'),
  gender: z.enum(['male', 'female']),
});

export const CreateBookingSchema = z.object({
  routeId: z.string().min(1, 'Sefer seçilmelidir.'),
  seats: z.array(z.union([z.number(), z.string()])).min(1, 'En az 1 koltuk seçilmelidir.').max(9),
  passengers: z.array(PassengerItemSchema).min(1, 'En az 1 yolcu bilgisi girilmelidir.'),
  contactEmail: z.string().email('Geçerli bir iletişim e-postası giriniz.'),
  contactPhone: z.string().regex(/^(05|5)[0-9]{9}$/, 'Geçerli bir iletişim telefonu giriniz.'),
  cardNumber: z.string().regex(/^[0-9]{16}$/, '16 haneli geçerli kart numarası giriniz.'),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/[0-9]{2}$/, 'AA/YY formatında son kullanma tarihi giriniz.'),
  cardCvv: z.string().regex(/^[0-9]{3,4}$/, 'Geçerli CVV kodu giriniz.'),
});

export const RefundRequestSchema = z.object({
  pnr: z.string().min(4, 'Geçerli bir PNR giriniz.').max(32),
  reason: z.string().max(255).optional(),
});

/**
 * 4. XSS & Payload Sanitization Utility
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/[<>]/g, (char) => (char === '<' ? '&lt;' : '&gt;'))
    .trim();
}

/**
 * 5. KVKK / GDPR Sensitive Data Masking Utility
 */
export class DataMasker {
  public static maskTCKN(tc: string): string {
    if (!tc || tc.length < 11) return '***********';
    return `${tc.slice(0, 3)}*****${tc.slice(-2)}`;
  }

  public static maskCreditCard(cardNumber: string): string {
    const cleaned = cardNumber.replace(/\s+/g, '');
    if (cleaned.length < 16) return '**** **** **** ****';
    return `**** **** **** ${cleaned.slice(-4)}`;
  }

  public static maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '***@***.***';
    const [user, domain] = email.split('@');
    if (user.length <= 2) return `*@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }

  public static maskPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) return '05** *** ** **';
    return `05** *** ${cleaned.slice(-4)}`;
  }
}
