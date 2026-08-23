// Zod Schemas for Booking, Passenger Data, Algorithmic Luhn Payments & PNR Operations
// Enforces Turkish Citizen ID (TCKN) checksums, Passport validation, Luhn modulo-10 card checking,
// future expiration date verification, and PNR patterns.

import { z } from 'zod';
import { validateTCKN, validatePassport, validateLuhn } from '../../utils/validation';

/**
 * Individual Passenger Schema with TCKN & Passport Algorithmic Verification
 */
export const passengerSchema = z
  .object({
    seatNumber: z.union([z.string(), z.number()], {
      message: 'Koltuk numarası gereklidir.',
    }),
    seatId: z.string().optional(),
    firstName: z
      .string({ message: 'Yolcu adı gereklidir.' })
      .trim()
      .min(2, 'Yolcu adı en az 2 karakter olmalıdır.')
      .max(50, 'Yolcu adı en fazla 50 karakter olabilir.')
      .regex(/^[a-zA-ZçğıöşüÇĞİÖŞÜ\s'-]+$/, 'Yolcu adı yalnızca harflerden oluşmalıdır.'),
    lastName: z
      .string({ message: 'Yolcu soyadı gereklidir.' })
      .trim()
      .min(2, 'Yolcu soyadı en az 2 karakter olmalıdır.')
      .max(50, 'Yolcu soyadı en fazla 50 karakter olabilir.')
      .regex(/^[a-zA-ZçğıöşüÇĞİÖŞÜ\s'-]+$/, 'Yolcu soyadı yalnızca harflerden oluşmalıdır.'),
    isForeigner: z.boolean().default(false),
    idNumber: z.string({ message: 'Kimlik / Pasaport numarası gereklidir.' }).trim(),
    gender: z.enum(['male', 'female'], {
      message: 'Cinsiyet seçimi zorunludur.',
    }),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Doğum tarihi YYYY-MM-DD formatında olmalıdır.')
      .optional(),
    email: z
      .string({ message: 'Yolcu e-posta adresi gereklidir.' })
      .trim()
      .email('Geçerli bir e-posta adresi giriniz.')
      .toLowerCase(),
    phone: z
      .string({ message: 'Yolcu telefon numarası gereklidir.' })
      .trim()
      .min(10, 'Geçerli bir telefon numarası giriniz.'),
    luggageKg: z.number().int().nonnegative().optional().default(20),
    hasInsurance: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.isForeigner) {
      const passportRes = validatePassport(data.idNumber);
      if (!passportRes.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: passportRes.error || 'Geçersiz pasaport numarası.',
          path: ['idNumber'],
        });
      }
    } else {
      const tcknRes = validateTCKN(data.idNumber);
      if (!tcknRes.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: tcknRes.error || 'Geçersiz T.C. Kimlik Numarası.',
          path: ['idNumber'],
        });
      }
    }
  });

export type PassengerInput = z.infer<typeof passengerSchema>;

/**
 * Payment Details Schema with Luhn Modulo-10 & Future Expiration Validation
 */
export const paymentSchema = z
  .object({
    method: z.enum(['credit_card', 'debit_card', 'fast', 'bkm_express']).default('credit_card'),
    cardNumber: z
      .string({ message: 'Kart numarası gereklidir.' })
      .trim()
      .refine((val) => validateLuhn(val).isValid, {
        message: 'Geçersiz kredi/banka kartı numarası (Luhn algoritması doğrulanamadı).',
      }),
    cardHolder: z
      .string({ message: 'Kart üzerindeki isim gereklidir.' })
      .trim()
      .min(3, 'Kart üzerindeki isim en az 3 karakter olmalıdır.')
      .max(100, 'Kart üzerindeki isim en fazla 100 karakter olabilir.'),
    expiryMonth: z
      .string({ message: 'Son kullanma ayı gereklidir.' })
      .regex(/^(0[1-9]|1[0-2])$/, 'Ay 01-12 formatında olmalıdır.'),
    expiryYear: z
      .string({ message: 'Son kullanma yılı gereklidir.' })
      .regex(/^(20)?[2-3]\d$/, 'Geçerli bir son kullanma yılı giriniz (örn: 2026 veya 26).'),
    cvv: z
      .string({ message: 'Güvenlik kodu (CVV) gereklidir.' })
      .regex(/^\d{3,4}$/, 'CVV 3 veya 4 haneli sayı olmalıdır.'),
  })
  .superRefine((data, ctx) => {
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    const rawYear = data.expiryYear.replace(/\D/g, '');
    const expYear = parseInt(rawYear.slice(-2), 10);
    const expMonth = parseInt(data.expiryMonth, 10);

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kartın son kullanma tarihi geçmiş.',
        path: ['expiryMonth'],
      });
    }
  });

export type PaymentInput = z.infer<typeof paymentSchema>;

/**
 * Complete Booking Creation Schema
 */
export const createBookingSchema = z.object({
  routeId: z.string({ message: 'Sefer ID gereklidir.' }).min(1, 'Sefer ID boş olamaz.'),
  passengers: z
    .array(passengerSchema, { message: 'En az 1 yolcu bilgisi gereklidir.' })
    .min(1, 'En az 1 yolcu gereklidir.')
    .max(10, 'Tek seferde en fazla 10 bilet alınabilir.'),
  payment: paymentSchema,
  couponCode: z.string().trim().optional(),
  contactEmail: z.string().trim().email('Geçerli bir iletişim e-postası giriniz.').optional(),
  contactPhone: z.string().trim().optional(),
  addOns: z
    .object({
      luggageKg: z.number().int().nonnegative().default(0),
      insurance: z.boolean().default(false),
      smsNotification: z.boolean().optional().default(false),
    })
    .optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * PNR Lookup Parameter Schema
 */
export const pnrParamSchema = z.object({
  pnr: z
    .string({ message: 'PNR kodu gereklidir.' })
    .trim()
    .min(5, 'PNR kodu en az 5 karakter olmalıdır.')
    .max(15, 'PNR kodu en fazla 15 karakter olabilir.')
    .regex(/^[A-Z0-9-]+$/i, 'Geçersiz PNR formatı.'),
});

export type PnrParam = z.infer<typeof pnrParamSchema>;

/**
 * Booking Refund Request Schema
 */
export const refundBookingSchema = z.object({
  pnr: z
    .string({ message: 'PNR kodu gereklidir.' })
    .trim()
    .min(5, 'PNR kodu en az 5 karakter olmalıdır.')
    .max(15, 'PNR kodu en fazla 15 karakter olabilir.'),
  reason: z.string().trim().max(500, 'İade sebebi en fazla 500 karakter olabilir.').optional(),
});

export type RefundBookingInput = z.infer<typeof refundBookingSchema>;
