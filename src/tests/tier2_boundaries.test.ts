// Tier 2: Boundary & Corner Cases Test Suite (≥55 test cases)
// Bileo Multi-Modal Transport Platform

import { describe, it, expect } from './test_framework';
import {
  validateTCKN,
  validatePassport,
  validateLuhn,
  validateSeatGenderAdjacency,
  calculatePricing,
  validateCoupon,
} from '../utils/validation';
import { SeatItem } from '../types';

export function runTier2Tests() {
  describe('Tier 2 - BVA 1: TCKN Checksum Algorithmic & Input Boundary Cases', () => {
    // 15 exhaustive TCKN edge cases
    it('B1.1 should validate known mathematically verified TCKN: 10000000146', () => {
      expect(validateTCKN('10000000146').isValid).toBeTruthy();
    });

    it('B1.2 should validate known mathematically verified TCKN: 29837261828', () => {
      expect(validateTCKN('29837261828').isValid).toBeTruthy();
    });

    it('B1.3 should reject TCKN starting with 0: 00000000146', () => {
      const res = validateTCKN('00000000146');
      expect(res.isValid).toBeFalsy();
      expect(res.error).toContain('0 ile başlayamaz');
    });

    it('B1.4 should reject all zeros: 00000000000', () => {
      expect(validateTCKN('00000000000').isValid).toBeFalsy();
    });

    it('B1.5 should reject exactly 10 digits (lower boundary violation): 1000000014', () => {
      const res = validateTCKN('1000000014');
      expect(res.isValid).toBeFalsy();
      expect(res.error).toContain('11 haneli olmalıdır');
    });

    it('B1.6 should reject exactly 12 digits (upper boundary violation): 100000001460', () => {
      const res = validateTCKN('100000001460');
      expect(res.isValid).toBeFalsy();
      expect(res.error).toContain('11 haneli olmalıdır');
    });

    it('B1.7 should reject empty string and null-like inputs', () => {
      expect(validateTCKN('').isValid).toBeFalsy();
      expect(validateTCKN('           ').isValid).toBeFalsy();
    });

    it('B1.8 should reject TCKN with letters embedded: 1000000014A', () => {
      expect(validateTCKN('1000000014A').isValid).toBeFalsy();
    });

    it('B1.9 should reject TCKN with special characters: 10000@00146', () => {
      expect(validateTCKN('10000@00146').isValid).toBeFalsy();
    });

    it('B1.10 should properly compute negative modulo when (oddSum * 7 - evenSum) is negative', () => {
      // In JS, -1 % 10 is -1. TCKN algorithm handles positive modulo: (-1 + 10) % 10 = 9.
      // Constructed TCKN: 19191919190 (oddSum=5, evenSum=36 => 35-36=-1 => d10=9, d11=0)
      expect(validateTCKN('19191919190').isValid).toBeTruthy();
    });

    it('B1.11 should reject when 10th digit is off by +1', () => {
      // 10000000146 -> 10000000156
      expect(validateTCKN('10000000156').isValid).toBeFalsy();
    });

    it('B1.12 should reject when 11th digit is off by +1', () => {
      // 10000000146 -> 10000000147
      expect(validateTCKN('10000000147').isValid).toBeFalsy();
    });

    it('B1.13 should validate crafted repeating pattern: 11111111110', () => {
      // oddSum=5, evenSum=4, 5*7 - 4 = 31 % 10 = 1. d1..d10 sum = 10 % 10 = 0.
      expect(validateTCKN('11111111110').isValid).toBeTruthy();
    });

    it('B1.14 should reject corrupted repeating pattern: 11111111111', () => {
      expect(validateTCKN('11111111111').isValid).toBeFalsy();
    });

    it('B1.15 should reject 99999999999', () => {
      // oddSum=45, evenSum=36, 45*7 - 36 = 315 - 36 = 279 % 10 = 9 (d10 matches).
      // d1..d10 sum = 81 + 9 = 90 % 10 = 0 (d11 should be 0, not 9).
      expect(validateTCKN('99999999999').isValid).toBeFalsy();
    });
  });

  describe('Tier 2 - BVA 2: Passport Alphanumeric Length & Boundary Cases', () => {
    it('B2.1 should accept minimum boundary length of 6 characters: A12345', () => {
      expect(validatePassport('A12345').isValid).toBeTruthy();
    });

    it('B2.2 should accept maximum boundary length of 9 characters: AB1234567', () => {
      expect(validatePassport('AB1234567').isValid).toBeTruthy();
    });

    it('B2.3 should accept 7-character passport: TR12345', () => {
      expect(validatePassport('TR12345').isValid).toBeTruthy();
    });

    it('B2.4 should accept 8-character passport: USA12345', () => {
      expect(validatePassport('USA12345').isValid).toBeTruthy();
    });

    it('B2.5 should reject length 5 (1 below minimum): A1234', () => {
      const res = validatePassport('A1234');
      expect(res.isValid).toBeFalsy();
      expect(res.error).toContain('6-9 haneli');
    });

    it('B2.6 should reject length 10 (1 above maximum): AB12345678', () => {
      const res = validatePassport('AB12345678');
      expect(res.isValid).toBeFalsy();
      expect(res.error).toContain('6-9 haneli');
    });

    it('B2.7 should normalize lowercase characters automatically: u12345678', () => {
      expect(validatePassport('u12345678').isValid).toBeTruthy();
    });

    it('B2.8 should reject passports with spaces: U123 4567', () => {
      expect(validatePassport('U123 4567').isValid).toBeFalsy();
    });

    it('B2.9 should reject passports with punctuation or symbols: U123-4567', () => {
      expect(validatePassport('U123-4567').isValid).toBeFalsy();
    });

    it('B2.10 should reject empty passport input', () => {
      expect(validatePassport('').isValid).toBeFalsy();
    });
  });

  describe('Tier 2 - BVA 3: Payment Luhn Checksum & Card Length Boundaries', () => {
    it('B3.1 should validate 16-digit Visa card: 4539148803436467', () => {
      const res = validateLuhn('4539148803436467');
      expect(res.isValid).toBeTruthy();
      expect(res.brand).toBe('visa');
    });

    it('B3.2 should validate 13-digit Visa card (minimum length boundary): 4000000000006', () => {
      const res = validateLuhn('4000000000006');
      expect(res.isValid).toBeTruthy();
      expect(res.brand).toBe('visa');
    });

    it('B3.3 should validate 16-digit Mastercard starting with 51-55: 5555555555554444', () => {
      const res = validateLuhn('5555555555554444');
      expect(res.isValid).toBeTruthy();
      expect(res.brand).toBe('mastercard');
    });

    it('B3.4 should validate 16-digit Mastercard starting with 22-27 (2-series bin): 2221000000000009', () => {
      const res = validateLuhn('2221000000000009');
      expect(res.isValid).toBeTruthy();
      expect(res.brand).toBe('mastercard');
    });

    it('B3.5 should validate Troy card starting with 9792: 9792000000000011', () => {
      const res = validateLuhn('9792000000000011');
      expect(res.isValid).toBeTruthy();
      expect(res.brand).toBe('troy');
    });

    it('B3.6 should reject card numbers shorter than 13 digits: 453914880343', () => {
      expect(validateLuhn('453914880343').isValid).toBeFalsy();
    });

    it('B3.7 should reject card numbers longer than 19 digits: 45391488034364671234', () => {
      expect(validateLuhn('45391488034364671234').isValid).toBeFalsy();
    });

    it('B3.8 should reject invalid Luhn checksum with wrong parity digit: 4539148803436460', () => {
      expect(validateLuhn('4539148803436460').isValid).toBeFalsy();
    });

    it('B3.9 should handle card numbers with user spaces or dashes: 4539-1488 0343 6467', () => {
      const res = validateLuhn('4539-1488 0343 6467');
      expect(res.isValid).toBeTruthy();
      expect(res.formatted).toBe('4539 1488 0343 6467');
    });

    it('B3.10 should reject empty card string', () => {
      expect(validateLuhn('').isValid).toBeFalsy();
    });
  });

  describe('Tier 2 - BVA 4: Gender Adjacency Engine Complex Boundary Cases', () => {
    it('B4.1 should allow Male on single seat (col 1, tier single) with adjacent empty aisle', () => {
      const seats: SeatItem[] = [
        { id: 'b-1', number: 1, row: 1, col: 1, tier: 'single', status: 'empty', price: 630, gender: 'none' },
      ];
      expect(validateSeatGenderAdjacency(seats, seats[0], 'male').allowed).toBeTruthy();
    });

    it('B4.2 should allow Female on single seat (col 1, tier single) with adjacent empty aisle', () => {
      const seats: SeatItem[] = [
        { id: 'b-1', number: 1, row: 1, col: 1, tier: 'single', status: 'empty', price: 630, gender: 'none' },
      ];
      expect(validateSeatGenderAdjacency(seats, seats[0], 'female').allowed).toBeTruthy();
    });

    it('B4.3 should allow Male on paired double seat col 3 when col 4 is empty', () => {
      const seats: SeatItem[] = [
        { id: 'b-2', number: 2, row: 1, col: 3, tier: 'window', status: 'empty', price: 600, gender: 'none' },
        { id: 'b-3', number: 3, row: 1, col: 4, tier: 'aisle', status: 'empty', price: 600, gender: 'none' },
      ];
      expect(validateSeatGenderAdjacency(seats, seats[0], 'male').allowed).toBeTruthy();
    });

    it('B4.4 should allow Female on paired double seat col 4 when col 3 is empty', () => {
      const seats: SeatItem[] = [
        { id: 'b-2', number: 2, row: 1, col: 3, tier: 'window', status: 'empty', price: 600, gender: 'none' },
        { id: 'b-3', number: 3, row: 1, col: 4, tier: 'aisle', status: 'empty', price: 600, gender: 'none' },
      ];
      expect(validateSeatGenderAdjacency(seats, seats[1], 'female').allowed).toBeTruthy();
    });

    it('B4.5 should allow Male on paired double seat col 4 when col 3 is taken by male', () => {
      const seats: SeatItem[] = [
        { id: 'b-2', number: 2, row: 1, col: 3, tier: 'window', status: 'taken_male', price: 600, gender: 'male' },
        { id: 'b-3', number: 3, row: 1, col: 4, tier: 'aisle', status: 'empty', price: 600, gender: 'none' },
      ];
      expect(validateSeatGenderAdjacency(seats, seats[1], 'male').allowed).toBeTruthy();
    });

    it('B4.6 should block Female on paired double seat col 4 when col 3 is taken by male', () => {
      const seats: SeatItem[] = [
        { id: 'b-2', number: 2, row: 1, col: 3, tier: 'window', status: 'taken_male', price: 600, gender: 'male' },
        { id: 'b-3', number: 3, row: 1, col: 4, tier: 'aisle', status: 'empty', price: 600, gender: 'none' },
      ];
      const res = validateSeatGenderAdjacency(seats, seats[1], 'female');
      expect(res.allowed).toBeFalsy();
      expect(res.reason).toContain('Bay yolcu');
    });

    it('B4.7 should allow Female on paired double seat col 3 when col 4 is taken by female', () => {
      const seats: SeatItem[] = [
        { id: 'b-2', number: 2, row: 1, col: 3, tier: 'window', status: 'empty', price: 600, gender: 'none' },
        { id: 'b-3', number: 3, row: 1, col: 4, tier: 'aisle', status: 'taken_female', price: 600, gender: 'female' },
      ];
      expect(validateSeatGenderAdjacency(seats, seats[0], 'female').allowed).toBeTruthy();
    });

    it('B4.8 should block Male on paired double seat col 3 when col 4 is taken by female', () => {
      const seats: SeatItem[] = [
        { id: 'b-2', number: 2, row: 1, col: 3, tier: 'window', status: 'empty', price: 600, gender: 'none' },
        { id: 'b-3', number: 3, row: 1, col: 4, tier: 'aisle', status: 'taken_female', price: 600, gender: 'female' },
      ];
      const res = validateSeatGenderAdjacency(seats, seats[0], 'male');
      expect(res.allowed).toBeFalsy();
      expect(res.reason).toContain('Bayan yolcu');
    });

    it('B4.9 should permit mixed gender co-booking in paired seats when companion seat is selected in same cart', () => {
      const seats: SeatItem[] = [
        { id: 'b-2', number: 2, row: 1, col: 3, tier: 'window', status: 'empty', price: 600, gender: 'none' },
        { id: 'b-3', number: 3, row: 1, col: 4, tier: 'aisle', status: 'empty', price: 600, gender: 'none' },
      ];
      // Selecting seat 3 for female, where companion seat 2 is already selected in cart
      const check = validateSeatGenderAdjacency(seats, seats[1], 'female', ['b-2']);
      expect(check.allowed).toBeTruthy();
    });

    it('B4.10 should permit mixed gender co-booking using seat numbers in selection cart', () => {
      const seats: SeatItem[] = [
        { id: 'b-2', number: 2, row: 1, col: 3, tier: 'window', status: 'empty', price: 600, gender: 'none' },
        { id: 'b-3', number: 3, row: 1, col: 4, tier: 'aisle', status: 'empty', price: 600, gender: 'none' },
      ];
      const check = validateSeatGenderAdjacency(seats, seats[0], 'male', ['3']);
      expect(check.allowed).toBeTruthy();
    });
  });

  describe('Tier 2 - BVA 5: Dynamic Pricing & Coupon Extremes', () => {
    it('B5.1 should handle 0 TL seat surcharge and standard luggage', () => {
      const seat: SeatItem = {
        id: 's-1', number: 1, row: 1, col: 3, status: 'empty', tier: 'window', price: 400, gender: 'none',
      };
      const pricing = calculatePricing(400, [seat], { luggageKg: 15, insurance: false });
      expect(pricing.total).toBe(400);
      expect(pricing.discount).toBe(0);
      expect(pricing.serviceFee).toBe(0);
    });

    it('B5.2 should clamp coupon discount so total never becomes negative when discount exceeds subtotal', () => {
      const seat: SeatItem = {
        id: 's-1', number: 1, row: 1, col: 3, status: 'empty', tier: 'window', price: 30, gender: 'none',
      };
      // BILEO50 gives 50 TL discount, subtotal is 30 TL
      const pricing = calculatePricing(30, [seat], { luggageKg: 15, insurance: false }, 'BILEO50');
      expect(pricing.discount).toBe(30);
      expect(pricing.total).toBe(0);
    });

    it('B5.3 should ignore invalid coupon code without throwing errors', () => {
      const seat: SeatItem = {
        id: 's-1', number: 1, row: 1, col: 3, status: 'empty', tier: 'window', price: 500, gender: 'none',
      };
      const pricing = calculatePricing(500, [seat], { luggageKg: 15, insurance: false }, 'INVALID_CODE_999');
      expect(pricing.discount).toBe(0);
      expect(pricing.isCouponApplied).toBeFalsy();
      expect(pricing.total).toBe(500);
    });

    it('B5.4 should validate coupon discount percentages: PREMIUM20 (20%), YHT15 (15%), DENIZ25 (25%)', () => {
      expect(validateCoupon('PREMIUM20').discountPercent).toBe(20);
      expect(validateCoupon('YHT15').discountPercent).toBe(15);
      expect(validateCoupon('DENIZ25').discountPercent).toBe(25);
    });

    it('B5.5 should calculate multi-passenger multiplier correctly for 4 passengers with insurance', () => {
      const seats: SeatItem[] = [
        { id: 's-1', number: 1, row: 1, col: 1, tier: 'standard', status: 'empty', price: 200, gender: 'none' },
        { id: 's-2', number: 2, row: 1, col: 2, tier: 'standard', status: 'empty', price: 200, gender: 'none' },
        { id: 's-3', number: 3, row: 1, col: 3, tier: 'standard', status: 'empty', price: 200, gender: 'none' },
        { id: 's-4', number: 4, row: 1, col: 4, tier: 'standard', status: 'empty', price: 200, gender: 'none' },
      ];
      const pricing = calculatePricing(200, seats, { luggageKg: 15, insurance: true });
      expect(pricing.baseFare).toBe(800); // 4 * 200
      expect(pricing.insuranceFare).toBe(180); // 4 * 45
      expect(pricing.serviceFee).toBe(0);
      expect(pricing.total).toBe(980);
    });

    it('B5.6 should calculate coupon discount on train tickets using YHT15 coupon', () => {
      const seat: SeatItem = {
        id: 's-train', number: 1, row: 1, col: 1, status: 'empty', tier: 'business', price: 370, gender: 'none',
      };
      const pricing = calculatePricing(300, [seat], { luggageKg: 15, insurance: false }, 'YHT15');
      // Subtotal = 370. 15% discount = 56 TL. Total = 314 TL.
      expect(pricing.discount).toBe(56);
      expect(pricing.total).toBe(314);
    });

    it('B5.7 should calculate surcharge for airplane emergency exit row seats (+90 TL)', () => {
      const exitSeat: SeatItem = {
        id: 'plane-exit', number: '11A', row: 11, col: 1, status: 'empty', tier: 'exit_row', price: 1090, gender: 'none', isExitRow: true,
      };
      const pricing = calculatePricing(1000, [exitSeat], { luggageKg: 15, insurance: false });
      expect(pricing.seatSurcharges).toBe(90);
      expect(pricing.total).toBe(1090);
    });

    it('B5.8 should calculate surcharge for ferry panoramic upper deck seats (+60 TL)', () => {
      const upperSeat: SeatItem = {
        id: 'ferry-upper', number: 'U-1', row: 1, col: 1, status: 'empty', tier: 'vip_lounge', price: 350, gender: 'none', deck: 'upper',
      };
      const pricing = calculatePricing(290, [upperSeat], { luggageKg: 15, insurance: false });
      expect(pricing.seatSurcharges).toBe(60);
      expect(pricing.total).toBe(350);
    });
  });
}
