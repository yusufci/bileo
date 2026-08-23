// Bileo Milestone 1 Adversarial Empirical Stress Test Suite
// Authored to stress-test pure algorithmic validation and seat generation logic.

import { describe, it, expect } from './test_framework';
import {
  validateTCKN,
  validatePassport,
  validateLuhn,
  validateSeatGenderAdjacency,
  calculatePricing,
} from '../utils/validation';

import {
  generateBus2Plus1Seats,
  generateBus2Plus2Seats,
  generateAirplaneSeats,
  generateTrainSeats,
  generateFerrySeats,
} from '../data/mockData';

import type { SeatItem } from '../types';

// Helper for generating mathematically valid TCKN test vectors
function generateValidTCKN(): string {
  const d: number[] = [];
  d[0] = Math.floor(1 + Math.random() * 9); // 1-9
  for (let i = 1; i < 9; i++) {
    d[i] = Math.floor(Math.random() * 10);
  }
  const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
  const evenSum = d[1] + d[3] + d[5] + d[7];
  const raw10 = (oddSum * 7 - evenSum) % 10;
  d[9] = (raw10 + 10) % 10;
  const sum10 = d.slice(0, 10).reduce((a, b) => a + b, 0);
  d[10] = sum10 % 10;
  return d.join('');
}

// Helper for generating mathematically valid Luhn card numbers
function generateValidLuhn(prefix: string, targetLength: number): string {
  const digits: number[] = prefix.split('').map(Number);
  while (digits.length < targetLength - 1) {
    digits.push(Math.floor(Math.random() * 10));
  }

  // Calculate check digit
  let sum = 0;
  let shouldDouble = true; // because check digit will be at last position

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  digits.push(checkDigit);
  return digits.join('');
}

export function runAdversarialTests() {
  describe('Adversarial Stress - Suite 1: TCKN Checksum Oracle & Mutation Fuzzing', () => {
    it('1.1 Oracle Ground Truth: 10,000 mathematically valid TCKN vectors', () => {
      let validPassed = 0;
      for (let i = 0; i < 10000; i++) {
        const tckn = generateValidTCKN();
        if (validateTCKN(tckn).isValid) {
          validPassed++;
        }
      }
      expect(validPassed).toBe(10000);
    });

    it('1.2 Single-digit Mutation Fuzzing: 10,000 mutated TCKN candidates correctly verified against oracle', () => {
      let mutationDetected = 0;
      let falseAccepts = 0;
      for (let i = 0; i < 10000; i++) {
        const valid = generateValidTCKN();
        const pos = Math.floor(Math.random() * 11);
        const originalDigit = parseInt(valid[pos], 10);
        const newDigit = (originalDigit + Math.floor(1 + Math.random() * 9)) % 10;
        const mutated = valid.slice(0, pos) + newDigit + valid.slice(pos + 1);

        const res = validateTCKN(mutated);
        const d = mutated.split('').map(Number);
        const isLeadingZero = d[0] === 0;
        const oddSum = d[0] + d[2] + d[4] + d[6] + d[8];
        const evenSum = d[1] + d[3] + d[5] + d[7];
        const raw10 = (oddSum * 7 - evenSum) % 10;
        const d10Expected = (raw10 + 10) % 10;
        const sum10 = d.slice(0, 10).reduce((a, b) => a + b, 0);
        const d11Expected = sum10 % 10;

        const isMathematicallyValid = !isLeadingZero && d[9] === d10Expected && d[10] === d11Expected;

        if (res.isValid === isMathematicallyValid) {
          mutationDetected++;
        } else {
          falseAccepts++;
        }
      }
      expect(falseAccepts).toBe(0);
      expect(mutationDetected).toBe(10000);
    });

    it('1.3 Leading Zero Rejection: 10,000 TCKNs with leading zeros', () => {
      let zeroRejected = 0;
      for (let i = 0; i < 10000; i++) {
        const candidate = '0' + Math.floor(1000000000 + Math.random() * 9000000000);
        if (!validateTCKN(candidate).isValid) {
          zeroRejected++;
        }
      }
      expect(zeroRejected).toBe(10000);
    });

    it('1.4 Invalid length boundary rejection (0-10 and 12-15 digits)', () => {
      const lengths = [0, 1, 5, 10, 12, 13, 15];
      lengths.forEach((len) => {
        const str = '1'.repeat(len);
        expect(validateTCKN(str).isValid).toBeFalsy();
      });
    });

    it('1.5 Defect Check: Hardcoded invalid TCKN bypass 29837261822 is properly rejected', () => {
      const bypassRes = validateTCKN('29837261822');
      expect(bypassRes.isValid).toBeFalsy();
    });
  });

  describe('Adversarial Stress - Suite 2: Foreign Passport Algorithmic Boundaries', () => {
    it('2.1 5,000 valid 6-9 char alphanumeric passports', () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let validCount = 0;
      for (let i = 0; i < 5000; i++) {
        const len = Math.floor(6 + Math.random() * 4);
        let pass = '';
        for (let j = 0; j < len; j++) {
          pass += chars[Math.floor(Math.random() * chars.length)];
        }
        if (validatePassport(pass).isValid) {
          validCount++;
        }
      }
      expect(validCount).toBe(5000);
    });

    it('2.2 Boundary P12345 (6 chars) is accepted without magic false rejection', () => {
      const p12345Res = validatePassport('P12345');
      expect(p12345Res.isValid).toBeTruthy();
    });

    it('2.3 Punctuation, space, and boundary length rejection', () => {
      expect(validatePassport('A123 456').isValid).toBeFalsy();
      expect(validatePassport('A123-456').isValid).toBeFalsy();
      expect(validatePassport('A123_456').isValid).toBeFalsy();
      expect(validatePassport('A1234').isValid).toBeFalsy();
      expect(validatePassport('A1234567890').isValid).toBeFalsy();
    });
  });

  describe('Adversarial Stress - Suite 3: Luhn Credit Card Checksum & Multi-Brand Oracle', () => {
    it('3.1 5,000 valid Visa cards (13 & 16 digits)', () => {
      let visaValid = 0;
      for (let i = 0; i < 5000; i++) {
        const len = Math.random() > 0.5 ? 16 : 13;
        const card = generateValidLuhn('4', len);
        const res = validateLuhn(card);
        if (res.isValid && res.brand === 'visa') visaValid++;
      }
      expect(visaValid).toBe(5000);
    });

    it('3.2 5,000 valid Mastercard cards (51-55 & 22-27 bins)', () => {
      let mcValid = 0;
      for (let i = 0; i < 5000; i++) {
        const prefix = Math.random() > 0.5 ? String(Math.floor(51 + Math.random() * 5)) : String(Math.floor(2221 + Math.random() * 500));
        const card = generateValidLuhn(prefix, 16);
        const res = validateLuhn(card);
        if (res.isValid && res.brand === 'mastercard') mcValid++;
      }
      expect(mcValid).toBe(5000);
    });

    it('3.3 3,000 valid Troy cards (9792, 65, 589004)', () => {
      let troyValid = 0;
      const prefixes = ['9792', '65', '589004'];
      for (let i = 0; i < 3000; i++) {
        const pfx = prefixes[i % prefixes.length];
        const card = generateValidLuhn(pfx, 16);
        const res = validateLuhn(card);
        if (res.isValid && res.brand === 'troy') troyValid++;
      }
      expect(troyValid).toBe(3000);
    });

    it('3.4 Defect Check: Hardcoded invalid Luhn numbers are properly rejected', () => {
      const bypassCards = ['4012888888888', '2221000000000010', '9792000000000016'];
      const falseAccepts = bypassCards.filter((c) => validateLuhn(c).isValid);
      expect(falseAccepts.length).toBe(0);
    });
  });

  describe('Adversarial Stress - Suite 4: Gender Adjacency Engine Permutations', () => {
    it('4.1 Single seats (col 1) open to both genders', () => {
      const busSeats = generateBus2Plus1Seats(500);
      const singleSeats = busSeats.filter((s) => s.tier === 'single');
      let singleViolations = 0;
      singleSeats.forEach((s) => {
        if (!validateSeatGenderAdjacency(busSeats, s, 'male').allowed) singleViolations++;
        if (!validateSeatGenderAdjacency(busSeats, s, 'female').allowed) singleViolations++;
      });
      expect(singleViolations).toBe(0);
    });

    it('4.2 Paired double seats rule matrix (male next to male, female next to female, blocking cross-gender)', () => {
      const row1Seats: SeatItem[] = [
        { id: 't-1', number: 1, row: 1, col: 3, tier: 'window', status: 'taken_male', gender: 'male', price: 500 },
        { id: 't-2', number: 2, row: 1, col: 4, tier: 'aisle', status: 'empty', gender: 'none', price: 500 },
        { id: 't-3', number: 3, row: 2, col: 3, tier: 'window', status: 'taken_female', gender: 'female', price: 500 },
        { id: 't-4', number: 4, row: 2, col: 4, tier: 'aisle', status: 'empty', gender: 'none', price: 500 },
      ];

      const mNextToM = validateSeatGenderAdjacency(row1Seats, row1Seats[1], 'male').allowed;
      const fNextToM = validateSeatGenderAdjacency(row1Seats, row1Seats[1], 'female').allowed;
      const fNextToF = validateSeatGenderAdjacency(row1Seats, row1Seats[3], 'female').allowed;
      const mNextToF = validateSeatGenderAdjacency(row1Seats, row1Seats[3], 'male').allowed;

      expect(mNextToM).toBeTruthy();
      expect(fNextToM).toBeFalsy();
      expect(fNextToF).toBeTruthy();
      expect(mNextToF).toBeFalsy();
    });

    it('4.3 Co-booking exemption allows mixed gender in same transaction', () => {
      const row1Seats: SeatItem[] = [
        { id: 't-1', number: 1, row: 1, col: 3, tier: 'window', status: 'taken_male', gender: 'male', price: 500 },
        { id: 't-2', number: 2, row: 1, col: 4, tier: 'aisle', status: 'empty', gender: 'none', price: 500 },
        { id: 't-3', number: 3, row: 2, col: 3, tier: 'window', status: 'taken_female', gender: 'female', price: 500 },
        { id: 't-4', number: 4, row: 2, col: 4, tier: 'aisle', status: 'empty', gender: 'none', price: 500 },
      ];
      const coBookingF = validateSeatGenderAdjacency(row1Seats, row1Seats[1], 'female', ['t-1']).allowed;
      const coBookingM = validateSeatGenderAdjacency(row1Seats, row1Seats[3], 'male', ['t-3']).allowed;
      expect(coBookingF && coBookingM).toBeTruthy();
    });
  });

  describe('Adversarial Stress - Suite 5: Dynamic Pricing Invariant Verification', () => {
    it('5.1 5,000 dynamic pricing randomized combinations invariant verification', () => {
      let invariantsPassed = 0;
      const coupons = ['BILEO50', 'YOLCULUK10', 'PREMIUM20', 'YHT15', 'DENIZ25', 'INVALID', ''];
      const seatTiers: SeatItem['tier'][] = ['standard', 'single', 'business', 'exit_row', 'vip_lounge', 'table'];

      for (let i = 0; i < 5000; i++) {
        const basePrice = Math.floor(Math.random() * 2000);
        const count = Math.floor(1 + Math.random() * 6);
        const tier = seatTiers[Math.floor(Math.random() * seatTiers.length)];
        const seats: SeatItem[] = Array.from({ length: count }, (_, idx) => ({
          id: `s-${idx}`,
          number: idx + 1,
          row: 1,
          col: idx + 1,
          tier,
          price: basePrice,
          status: 'empty',
          gender: 'none',
        }));

        const luggageKg = [0, 10, 15, 20, 25, 35][Math.floor(Math.random() * 6)];
        const insurance = Math.random() > 0.5;
        const coupon = coupons[Math.floor(Math.random() * coupons.length)];

        const p = calculatePricing(basePrice, seats, { luggageKg, insurance }, coupon);

        const nonNegative = p.total >= 0 && p.baseFare >= 0 && p.discount >= 0;
        const zeroServiceFee = p.serviceFee === 0;
        const mathConsistent = p.total === Math.max(0, p.baseFare + p.seatSurcharges + p.luggageFare + p.insuranceFare + p.serviceFee - p.discount);

        if (nonNegative && zeroServiceFee && mathConsistent) {
          invariantsPassed++;
        }
      }
      expect(invariantsPassed).toBe(5000);
    });
  });

  describe('Adversarial Stress - Suite 6: Procedural Cabin Seat Map Geometry & Capacity', () => {
    it('6.1 Bus 2+1 unique seat IDs and >=30 seats', () => {
      const b21 = generateBus2Plus1Seats(600);
      const b21Ids = new Set(b21.map((s) => s.id));
      expect(b21Ids.size).toBe(b21.length);
      expect(b21.length).toBeGreaterThanOrEqual(30);
    });

    it('6.2 Bus 2+2 unique seat IDs (44 seats)', () => {
      const b22 = generateBus2Plus2Seats(450);
      const b22Ids = new Set(b22.map((s) => s.id));
      expect(b22Ids.size).toBe(44);
      expect(b22.length).toBe(44);
    });

    it('6.3 Airplane Exit Row tags and Business class separation', () => {
      const plane = generateAirplaneSeats(1500, 'Boeing 737-800');
      const exitSeats = plane.filter((s) => s.isExitRow);
      expect(exitSeats.length).toBe(12);
      expect(plane.some((s) => s.cabinClass === 'business')).toBeTruthy();
    });

    it('6.4 Train Carriage 1 (Business) and Carriage 4 (Table seats)', () => {
      const trainC1 = generateTrainSeats(300, 'Siemens Velaro', 1);
      const trainC4 = generateTrainSeats(300, 'Siemens Velaro', 4);
      expect(trainC1.length).toBe(24);
      expect(trainC4.some((s) => s.isTable)).toBeTruthy();
    });

    it('6.5 Ferry Main Deck (54 seats) and Upper VIP Deck (36 seats)', () => {
      const ferryMain = generateFerrySeats(250, 'main');
      const ferryUpper = generateFerrySeats(250, 'upper');
      expect(ferryMain.length).toBe(54);
      expect(ferryUpper.length).toBe(36);
    });
  });
}

// Standalone execution support
async function runStandalone() {
  const isDirect = process.argv[1]?.includes('adversarial_m1_stress');
  if (isDirect) {
    const { runner: r } = await import('./test_framework');
    console.log('--- STARTING ADVERSARIAL EMPIRICAL STRESS TESTS ---');
    runAdversarialTests();
    await r.runAll();
    const passed = r.printSummary();
    process.exit(passed ? 0 : 1);
  }
}

runStandalone().catch((err) => {
  console.error(err);
  process.exit(1);
});
