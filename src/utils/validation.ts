// Bileo Algorithmic Validation, Pricing Engine, and PNR Generator

import { SeatItem, TransportMode, TransportType, PricingBreakdown } from '../types';

/**
 * 11-digit Turkish Republic Citizen ID (TCKN) Algorithmic Checksum Validation.
 * Rules:
 * 1. Must be 11 numeric digits and cannot start with '0'.
 * 2. 10th digit = ((d1 + d3 + d5 + d7 + d9) * 7 - (d2 + d4 + d6 + d8)) % 10
 * 3. 11th digit = (d1 + d2 + d3 + d4 + d5 + d6 + d7 + d8 + d9 + d10) % 10
 */
export function validateTCKN(tckn: string): { isValid: boolean; error?: string } {
  if (!tckn || typeof tckn !== 'string') {
    return { isValid: false, error: 'T.C. Kimlik Numarası gereklidir.' };
  }

  const clean = tckn.replace(/\D/g, '');

  if (clean.length !== 11) {
    return { isValid: false, error: 'T.C. Kimlik Numarası 11 haneli olmalıdır.' };
  }

  if (clean[0] === '0') {
    return { isValid: false, error: 'T.C. Kimlik Numarası 0 ile başlayamaz.' };
  }

  const digits = clean.split('').map(Number);

  // Check 10th digit algorithm
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const rawDigit10 = (oddSum * 7 - evenSum) % 10;
  const computedDigit10 = (rawDigit10 + 10) % 10;

  if (computedDigit10 !== digits[9]) {
    return { isValid: false, error: 'Geçersiz T.C. Kimlik Numarası.' };
  }

  // Check 11th digit algorithm
  const first10Sum = digits.slice(0, 10).reduce((acc, curr) => acc + curr, 0);
  const computedDigit11 = first10Sum % 10;

  if (computedDigit11 !== digits[10]) {
    return { isValid: false, error: 'Geçersiz T.C. Kimlik Numarası.' };
  }

  return { isValid: true };
}

/**
 * Generates an algorithmically valid 11-digit Turkish Republic Citizen ID (TCKN) for demo/testing.
 */
export function generateValidTCKN(): string {
  const d1 = Math.floor(Math.random() * 9) + 1; // 1-9 (cannot be 0)
  const d2 = Math.floor(Math.random() * 10);
  const d3 = Math.floor(Math.random() * 10);
  const d4 = Math.floor(Math.random() * 10);
  const d5 = Math.floor(Math.random() * 10);
  const d6 = Math.floor(Math.random() * 10);
  const d7 = Math.floor(Math.random() * 10);
  const d8 = Math.floor(Math.random() * 10);
  const d9 = Math.floor(Math.random() * 10);

  const oddSum = d1 + d3 + d5 + d7 + d9;
  const evenSum = d2 + d4 + d6 + d8;
  const rawDigit10 = (oddSum * 7 - evenSum) % 10;
  const d10 = (rawDigit10 + 10) % 10;

  const first10Sum = d1 + d2 + d3 + d4 + d5 + d6 + d7 + d8 + d9 + d10;
  const d11 = first10Sum % 10;

  return `${d1}${d2}${d3}${d4}${d5}${d6}${d7}${d8}${d9}${d10}${d11}`;
}

/**
 * Foreign Passport Validation (Alphanumeric, 6 to 9 characters).
 */
export function validatePassport(passport: string): { isValid: boolean; error?: string } {
  if (!passport || typeof passport !== 'string') {
    return { isValid: false, error: 'Pasaport numarası gereklidir.' };
  }

  const trimmed = passport.trim().toUpperCase();

  if (passport.includes(' ') || passport.includes('-') || passport.includes('_')) {
    return { isValid: false, error: 'Pasaport numarası boşluk veya özel karakter içeremez.' };
  }

  if (!/^[A-Z0-9]{6,9}$/.test(trimmed)) {
    return { isValid: false, error: 'Pasaport numarası 6-9 haneli alfanümerik olmalıdır.' };
  }

  return { isValid: true };
}

/**
 * Luhn Algorithm Credit/Debit Card Checksum and Brand Detector.
 * Supports Visa, Mastercard, Troy, and standard Luhn verification.
 */
export function validateLuhn(cardNumber: string): {
  isValid: boolean;
  brand: 'visa' | 'mastercard' | 'troy' | 'unknown';
  formatted: string;
} {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return { isValid: false, brand: 'unknown', formatted: '' };
  }

  const clean = cardNumber.replace(/\D/g, '');
  let brand: 'visa' | 'mastercard' | 'troy' | 'unknown' = 'unknown';

  // Card Brand Detection
  if (/^4/.test(clean)) {
    brand = 'visa';
  } else if (/^(5[1-5]|2[2-7])/.test(clean)) {
    brand = 'mastercard';
  } else if (/^(9792|65|589004)/.test(clean)) {
    brand = 'troy';
  }

  // Format into 4-digit groups
  const formatted = clean.match(/.{1,4}/g)?.join(' ') || clean;

  if (clean.length < 13 || clean.length > 19) {
    return { isValid: false, brand, formatted };
  }

  // Luhn Checksum Calculation
  let sum = 0;
  let shouldDouble = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  const isValid = sum % 10 === 0;

  return {
    isValid,
    brand,
    formatted,
  };
}

/**
 * Turkish Intercity Bus Gender Adjacency Seating Rule Engine.
 * Rules:
 * 1. Single seats (col 1 in 2+1 layout or tier 'single') are open to all genders.
 * 2. Paired double seats:
 *    - Next to male -> male only (females blocked).
 *    - Next to female -> female only (males blocked).
 * 3. Companion co-booking exemption: If the adjacent seat is currently selected in the same booking,
 *    mixed-gender co-booking is explicitly permitted.
 */
export function validateSeatGenderAdjacency(
  seats: SeatItem[],
  targetSeat: SeatItem,
  chosenGender: 'male' | 'female',
  currentSelectedSeatIds: string[] = []
): { allowed: boolean; reason?: string } {
  // 1. Single seats have zero adjacent restrictions
  if (targetSeat.tier === 'single' || targetSeat.type === 'single') {
    return { allowed: true };
  }

  // Determine paired adjacent column based on standard Turkish 2+1 or 2+2 layout
  let adjacentCol: number | null = null;
  if (targetSeat.col === 1) {
    adjacentCol = 2;
  } else if (targetSeat.col === 2) {
    adjacentCol = 1;
  } else if (targetSeat.col === 3) {
    adjacentCol = 4;
  } else if (targetSeat.col === 4) {
    adjacentCol = 3;
  }

  if (adjacentCol === null) {
    return { allowed: true };
  }

  // Find neighbor seat in the same row and carriage/deck
  const neighbor = seats.find(
    (s) =>
      s.row === targetSeat.row &&
      s.col === adjacentCol &&
      (s.carriageNumber === targetSeat.carriageNumber || (!s.carriageNumber && !targetSeat.carriageNumber)) &&
      (s.deck === targetSeat.deck || (!s.deck && !targetSeat.deck))
  );

  if (!neighbor) {
    return { allowed: true };
  }

  // 2. Companion Co-Booking Exemption: If neighbor seat is selected in current transaction, permit selection
  const isNeighborSelectedNow =
    currentSelectedSeatIds.includes(neighbor.id) ||
    currentSelectedSeatIds.includes(String(neighbor.number));

  if (isNeighborSelectedNow) {
    return { allowed: true };
  }

  // 3. Check neighbor occupancy status & gender
  const isNeighborMale = neighbor.status === 'taken_male' || neighbor.gender === 'male';
  const isNeighborFemale = neighbor.status === 'taken_female' || neighbor.gender === 'female';

  if (isNeighborMale && chosenGender === 'female') {
    return {
      allowed: false,
      reason: 'Bu koltuk Bay yolcu yanındadır. Taşıma kuralları gereği yalnızca erkek yolcular tarafından seçilebilir.',
    };
  }

  if (isNeighborFemale && chosenGender === 'male') {
    return {
      allowed: false,
      reason: 'Bu koltuk Bayan yolcu yanındadır. Taşıma kuralları gereği yalnızca kadın yolcular tarafından seçilebilir.',
    };
  }

  return { allowed: true };
}

/**
 * Validates promotional discount coupons.
 */
export function validateCoupon(code: string): {
  valid: boolean;
  discountPercent: number;
  discountAmount?: number;
  description: string;
} {
  if (!code || typeof code !== 'string') {
    return { valid: false, discountPercent: 0, description: 'Geçersiz kupon kodu.' };
  }

  const normalized = code.trim().toUpperCase();

  switch (normalized) {
    case 'BILEO50':
      return {
        valid: true,
        discountPercent: 0,
        discountAmount: 50,
        description: '50 TL Bileo Hoş Geldin İndirimi uygulandı.',
      };
    case 'YOLCULUK10':
      return {
        valid: true,
        discountPercent: 10,
        description: '%10 Bahar Seyahati İndirimi uygulandı.',
      };
    case 'PREMIUM20':
      return {
        valid: true,
        discountPercent: 20,
        description: '%20 Bileo Black VIP Yolcu İndirimi uygulandı.',
      };
    case 'YHT15':
      return {
        valid: true,
        discountPercent: 15,
        description: '%15 Yüksek Hızlı Tren Promosyonu uygulandı.',
      };
    case 'DENIZ25':
      return {
        valid: true,
        discountPercent: 25,
        description: '%25 İDO / BUDO Deniz Seferi İndirimi uygulandı.',
      };
    default:
      return {
        valid: false,
        discountPercent: 0,
        description: 'Girdiğiniz kupon kodu bulunamadı veya süresi dolmuş.',
      };
  }
}

/**
 * Calculates complete live dynamic pricing with seat tier surcharges, luggage fees, insurance, and coupons.
 */
export function calculatePricing(
  basePrice: number,
  seats: SeatItem[],
  addOns: { luggageKg: number; insurance: boolean },
  couponCode?: string
): PricingBreakdown {
  const seatCount = seats.length > 0 ? seats.length : 1;
  const baseFare = basePrice * seatCount;

  // Seat surcharges: sum of individual seat premiums above base price
  let seatSurcharges = 0;
  seats.forEach((seat) => {
    if (seat.price > basePrice) {
      seatSurcharges += (seat.price - basePrice);
    } else if (seat.tier === 'single') {
      seatSurcharges += 30;
    } else if (seat.tier === 'business') {
      seatSurcharges += 350;
    } else if (seat.tier === 'extra_legroom' || seat.tier === 'exit_row') {
      seatSurcharges += 90;
    } else if (seat.tier === 'vip_lounge') {
      seatSurcharges += 60;
    }
  });

  // Luggage fare: 15kg/20kg standard included (0 TL), 25kg (+95 TL), 35kg (+175 TL)
  let luggageFarePerPerson = 0;
  if (addOns.luggageKg === 25) {
    luggageFarePerPerson = 95;
  } else if (addOns.luggageKg === 35) {
    luggageFarePerPerson = 175;
  } else if (addOns.luggageKg > 20) {
    luggageFarePerPerson = 95;
  }
  const luggageFare = luggageFarePerPerson * seatCount;

  // Travel insurance fare: +45 TL per passenger
  const insuranceFare = addOns.insurance ? 45 * seatCount : 0;

  // Transparent service fee (Bileo 0.00 TL guarantee)
  const serviceFee = 0;

  const subtotal = baseFare + seatSurcharges + luggageFare + insuranceFare + serviceFee;

  // Coupon discount calculation
  let discount = 0;
  let isCouponApplied = false;

  if (couponCode) {
    const coupon = validateCoupon(couponCode);
    if (coupon.valid) {
      isCouponApplied = true;
      if (coupon.discountAmount) {
        discount = Math.min(subtotal, coupon.discountAmount);
      } else if (coupon.discountPercent) {
        discount = Math.round((subtotal * coupon.discountPercent) / 100);
      }
    }
  }

  const total = Math.max(0, subtotal - discount);

  return {
    baseFare,
    seatSurcharges,
    luggageFare,
    insuranceFare,
    discount,
    serviceFee,
    total,
    isCouponApplied,
  };
}

/**
 * Generates authentic realistic carrier PNR codes.
 * Formats:
 * - Airline: TK-4928, PC-8192, AJ-3310
 * - Bus: PAM-7124, KK-9841, VRN-3910, AOU-5120
 * - Train: YHT-8192, TCDD-3189
 * - Ferry: IDO-3310, BUDO-4412
 */
export function generateAuthenticPnr(
  mode: TransportMode | TransportType,
  carrier: string = ''
): string {
  const normCarrier = carrier.toLowerCase();
  const randNum = Math.floor(1000 + Math.random() * 9000);

  // Carrier-specific prefix
  if (normCarrier.includes('türk hava') || normCarrier.includes('thy')) return `TK-${randNum}`;
  if (normCarrier.includes('pegasus')) return `PC-${randNum}`;
  if (normCarrier.includes('anadolu') || normCarrier.includes('ajet')) return `AJ-${randNum}`;
  if (normCarrier.includes('pamukkale')) return `PAM-${randNum}`;
  if (normCarrier.includes('kamil koç') || normCarrier.includes('kamil')) return `KK-${randNum}`;
  if (normCarrier.includes('varan')) return `VRN-${randNum}`;
  if (normCarrier.includes('ulusoy') || normCarrier.includes('ali osman')) return `AOU-${randNum}`;
  if (normCarrier.includes('tcdd')) return `YHT-${randNum}`;
  if (normCarrier.includes('ido') || normCarrier.includes('i̇do')) return `IDO-${randNum}`;
  if (normCarrier.includes('budo')) return `BUDO-${randNum}`;

  // Mode-specific fallback
  const normMode = mode.toLowerCase();
  if (normMode === 'flight' || normMode === 'ucak') {
    return `TK-${randNum}`;
  }
  if (normMode === 'bus' || normMode === 'otobus') {
    return `PAM-${randNum}`;
  }
  if (normMode === 'train' || normMode === 'tren') {
    return `YHT-${randNum}`;
  }
  if (normMode === 'ferry' || normMode === 'feribot') {
    return `IDO-${randNum}`;
  }

  return `BL-${randNum}`;
}
