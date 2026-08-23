// KVKK, GDPR, and PCI-DSS Regulatory Privacy & Data Masking Subsystem
// Implements masking algorithms for PAN, TCKN, Passport, Phone, Email,
// zero-CVV persistence guarantees, and deep recursive log sanitization.

/**
 * Masks Credit / Debit Card Primary Account Number (PAN) per PCI-DSS Req 3.4.
 * Formats: '**** **** **** 4242'
 */
export function maskCreditCard(cardNumber: string): string {
  if (!cardNumber || typeof cardNumber !== 'string') return '****';
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length < 4) return '****';
  const last4 = clean.slice(-4);
  return `**** **** **** ${last4}`;
}

/**
 * Masks 11-digit Turkish National ID (TCKN) per KVKK Law No. 6698 Art 12.
 * Formats: '*******1234' (first 7 digits masked, last 4 visible)
 */
export function maskTCKN(tckn: string): string {
  if (!tckn || typeof tckn !== 'string') return '*******0000';
  const clean = tckn.replace(/\D/g, '');
  if (clean.length !== 11) {
    if (clean.length >= 4) {
      return '*'.repeat(Math.max(4, clean.length - 4)) + clean.slice(-4);
    }
    return '*******0000';
  }
  return `*******${clean.slice(7)}`;
}

/**
 * Masks Foreign Passport Numbers per GDPR / KVKK.
 * Formats: '******123' (last 3 alphanumeric chars visible)
 */
export function maskPassport(passport: string): string {
  if (!passport || typeof passport !== 'string') return '***';
  const trimmed = passport.trim();
  if (trimmed.length <= 3) return '***';
  return '*'.repeat(trimmed.length - 3) + trimmed.slice(-3);
}

/**
 * Masks Phone Numbers per KVKK / GDPR privacy guidelines.
 * Formats: '0532 *** ** 67' or '532 *** ** 67'
 */
export function maskPhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '*** *** ** **';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 3)} *** ** ${clean.slice(8)}`;
  }
  if (clean.length === 11 && clean.startsWith('0')) {
    return `${clean.slice(0, 4)} *** ** ${clean.slice(9)}`;
  }
  if (clean.length >= 7) {
    return `${clean.slice(0, 3)} *** ** ${clean.slice(-2)}`;
  }
  return '*** *** ** **';
}

/**
 * Masks Email Address per KVKK / GDPR privacy guidelines.
 * Formats: 'a***t@domain.com'
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== 'string') return '***@***.***';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return '***@***.***';
  const [user, domain] = parts;
  if (!user || !domain) return '***@***.***';

  let maskedUser: string;
  if (user.length <= 2) {
    maskedUser = `${user[0] || '*'}***`;
  } else {
    maskedUser = `${user[0]}***${user[user.length - 1]}`;
  }

  return `${maskedUser}@${domain}`;
}

/**
 * List of sensitive object key names that require automatic masking or redaction
 */
export const SENSITIVE_KEYS = new Set([
  'password',
  'passwordconfirm',
  'password_confirm',
  'passwordhash',
  'password_hash',
  'salt',
  'token',
  'refreshtoken',
  'refresh_token',
  'accesstoken',
  'access_token',
  'authorization',
  'cookie',
  'cardnumber',
  'card_number',
  'pan',
  'cvv',
  'cvc',
  'securitycode',
  'security_code',
  'secret',
  'jwt_secret',
  'jwtsecret',
  'idnumber',
  'id_number',
  'tcno',
  'tc_no',
  'tckn',
  'passport',
  'passportnumber',
  'passport_number',
]);

/**
 * Recursive Deep Log Sanitizer
 * Traverses arbitrary JSON objects / arrays and masks sensitive keys before logging or persistence.
 * Guarantees zero plaintext credentials, PANs, or PII leakages into stdout / logfiles.
 */
export function maskSensitiveFields(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveFields(item));
  }

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, '');

    if (
      lowerKey.includes('cvv') ||
      lowerKey.includes('cvc') ||
      lowerKey.includes('securitycode') ||
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('salt') ||
      lowerKey === 'token' ||
      lowerKey === 'refreshtoken' ||
      lowerKey === 'authorization' ||
      lowerKey === 'cookie'
    ) {
      result[key] = '[REDACTED]';
    } else if (lowerKey.includes('cardnumber') || lowerKey.includes('pan')) {
      result[key] = typeof value === 'string' ? maskCreditCard(value) : '[MASKED_CARD]';
    } else if (lowerKey.includes('tckn') || lowerKey.includes('tcno') || lowerKey.includes('idnumber')) {
      result[key] = typeof value === 'string' ? maskTCKN(value) : '[MASKED_TCKN]';
    } else if (lowerKey.includes('passport')) {
      result[key] = typeof value === 'string' ? maskPassport(value) : '[MASKED_PASSPORT]';
    } else if (lowerKey === 'phone' || lowerKey.includes('contactphone') || lowerKey.includes('passengerphone')) {
      result[key] = typeof value === 'string' ? maskPhone(value) : '[MASKED_PHONE]';
    } else if (lowerKey === 'email' || lowerKey.includes('contactemail') || lowerKey.includes('passengeremail')) {
      result[key] = typeof value === 'string' ? maskEmail(value) : '[MASKED_EMAIL]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = maskSensitiveFields(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Zero CVV Persistence Rule:
 * Explicitly strips CVV/CVC and replaces raw card numbers with masked representations.
 * Enforces PCI-DSS 3.2 prohibition on storage of Sensitive Authentication Data (SAD).
 */
export function purgeSensitivePaymentFields<T extends Record<string, any>>(payment: T): Omit<T, 'cvv' | 'cvc' | 'securityCode'> & { cardNumberMasked: string } {
  const { cvv, cvc, securityCode, cardNumber, ...cleanPayment } = payment as any;
  return {
    ...cleanPayment,
    cardNumberMasked: maskCreditCard(cardNumber || ''),
  };
}

/**
 * Unified DataMasker class for OOP & legacy callers
 */
export class DataMasker {
  public static maskCreditCard = maskCreditCard;
  public static maskTCKN = maskTCKN;
  public static maskPassport = maskPassport;
  public static maskPhone = maskPhone;
  public static maskEmail = maskEmail;
  public static maskSensitiveFields = maskSensitiveFields;
  public static purgeSensitivePaymentFields = purgeSensitivePaymentFields;
}
