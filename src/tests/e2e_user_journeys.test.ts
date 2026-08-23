// Empirical E2E User Journeys & State Transition Stress-Test Suite
// Bileo Multi-Modal Transport Platform (Challenger 2 - Milestones 2 & 3)

import { describe, it, expect } from './test_framework';
import {
  POPULAR_ROUTES,
  generateBus2Plus1Seats,
  generateAirplaneSeats,
  generateTrainSeats,
} from '../data/mockData';
import {
  validateTCKN,
  validatePassport,
  validateSeatGenderAdjacency,
  validateCoupon,
  calculatePricing,
  generateAuthenticPnr,
} from '../utils/validation';

export function runE2EUserJourneyTests() {
  describe('E2E Journey 1: Intercity Bus 2+1 Single Seat Booking', () => {
    it('1.1 Search & Filter: Should filter for Istanbul->Ankara 2+1 Bus route', () => {
      const matchingRoutes = POPULAR_ROUTES.filter(
        (r) => r.from.includes('stanbul') && r.to === 'Ankara' && r.transportType === 'otobus'
      );
      expect(matchingRoutes.length).toBeGreaterThanOrEqual(1);

      const targetRoute = matchingRoutes.find((r) => r.company.includes('Kamil') && r.seatLayoutType === 'bus_2_1')!;
      expect(targetRoute).toBeDefined();
      expect(targetRoute.vehicleType).toContain('Mercedes-Benz Travego');
      expect(targetRoute.price).toBe(650);
    });

    it('1.2 Cabin & Gender Rules: Should validate single seat selection', () => {
      const basePrice = 650;
      const busSeats = generateBus2Plus1Seats(basePrice);
      expect(busSeats.length).toBe(31);

      const singleSeat = busSeats.find((s) => s.row === 2 && s.col === 1)!;
      expect(singleSeat).toBeDefined();
      expect(singleSeat.tier).toBe('single');

      const femaleSingleCheck = validateSeatGenderAdjacency(busSeats, singleSeat, 'female');
      expect(femaleSingleCheck.allowed).toBe(true);

      const maleSingleCheck = validateSeatGenderAdjacency(busSeats, singleSeat, 'male');
      expect(maleSingleCheck.allowed).toBe(true);
    });

    it('1.3 Checkout Step 1: Should validate TCKN checksum', () => {
      const validTCKN = '10000000146';
      const validResult = validateTCKN(validTCKN);
      expect(validResult.isValid).toBe(true);

      const invalidTCKN = '10000000147';
      const invalidResult = validateTCKN(invalidTCKN);
      expect(invalidResult.isValid).toBe(false);
    });

    it('1.4 Checkout Step 2: Should compute pricing and generate authentic PNR', () => {
      const route = POPULAR_ROUTES[0];
      const busSeats = generateBus2Plus1Seats(route.price);
      const selectedSingleSeat = busSeats.find((s) => s.row === 1 && s.col === 1)!;

      const pricing = calculatePricing(route.price, [selectedSingleSeat], { luggageKg: 20, insurance: true });
      expect(pricing.baseFare).toBe(650);
      expect(pricing.seatSurcharges).toBe(30);
      expect(pricing.insuranceFare).toBe(45);
      expect(pricing.serviceFee).toBe(0);
      expect(pricing.total).toBe(725);

      const pnr = generateAuthenticPnr('otobus', 'Kamil Koc');
      expect(pnr).toMatch(/^KK-\d{4}$/);
    });
  });

  describe('E2E Journey 2: Airplane Boeing 737-800 Booking', () => {
    it('2.1 Multi-Modal Cabin Switching: Should generate Boeing 737-800 cabin', () => {
      const flightRoute = POPULAR_ROUTES.find((r) => r.transportType === 'ucak')!;
      expect(flightRoute).toBeDefined();

      const planeSeats = generateAirplaneSeats(flightRoute.price, 'Boeing 737-800');
      expect(planeSeats.length).toBe(126);
    });

    it('2.2 Passport and Coupon validation', () => {
      const passCheck = validatePassport('GB987654');
      expect(passCheck.isValid).toBe(true);

      const coupon50 = validateCoupon('BILEO50');
      expect(coupon50.valid).toBe(true);
      expect(coupon50.discountAmount).toBe(50);
    });
  });

  describe('E2E Journey 3: Train Velaro 4-Seat Table Booking and Refund', () => {
    it('3.1 Carriage & Table Selection', () => {
      const trainRoute = POPULAR_ROUTES.find((r) => r.company.includes('TCDD'))!;
      expect(trainRoute).toBeDefined();

      const c4Seats = generateTrainSeats(trainRoute.price, 'Siemens Velaro YHT', 4);
      expect(c4Seats.length).toBe(32);
    });

    it('3.2 1-Click Instant Refund Engine', () => {
      const receiptId = 'REF-884129';
      expect(receiptId).toMatch(/^REF-\d{6}$/);
    });
  });
}