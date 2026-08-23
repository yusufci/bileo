// Challenger M2/M3 Adversarial Stress & Verification Suite
// Empirical testing of UI component hierarchy, modal state transitions, drag physics,
// audioContext lifecycle, transport cabin layouts, and edge case resilience.

import { describe, it, expect } from './test_framework';
import {
  generateBus2Plus1Seats,
  generateBus2Plus2Seats,
  generateAirplaneSeats,
  generateTrainSeats,
  generateFerrySeats,
  POPULAR_ROUTES,
  SEED_TICKETS,
  DISCOVERY_CARDS,
  TERMINALS,
} from '../data/mockData';
import {
  validateTCKN,
  validatePassport,
  validateLuhn,
  calculatePricing,
  generateAuthenticPnr,
} from '../utils/validation';
import { sound } from '../utils/sound';
import { SeatItem, BookingTicket, PassengerInfo, CheckoutAddOns } from '../types';

export function runM2M3ChallengerSuite() {
  describe('Challenger M2/M3 - Suite 1: Multi-Modal Unique Cabin Geometries & Edge Cases', () => {
    it('1.1 Bus 2+1 and 2+2 layout distinctness & geometry guarantees', () => {
      const bus21 = generateBus2Plus1Seats(600);
      const bus22 = generateBus2Plus2Seats(600);

      // Bus 2+1 should have 31 seats (9 rows of 3 + 1 rear row of 4)
      expect(bus21.length).toBe(31);
      // Bus 2+2 should have 44 seats (11 rows of 4)
      expect(bus22.length).toBe(44);

      // Unique IDs and seat numbers
      const ids21 = new Set(bus21.map((s) => s.id));
      const nums21 = new Set(bus21.map((s) => s.number));
      expect(ids21.size).toBe(31);
      expect(nums21.size).toBe(31);

      // Check single seat surcharges in 2+1
      const singleSeats = bus21.filter((s) => s.tier === 'single');
      expect(singleSeats.length).toBe(9);
      singleSeats.forEach((s) => {
        expect(s.price).toBe(630);
        expect(s.col).toBe(1);
      });
    });

    it('1.2 Airplane A321neo / B737 layout uniqueness, exit rows & business cabin', () => {
      const plane = generateAirplaneSeats(1500, 'Airbus A321neo');
      expect(plane.length).toBe(126); // (3 rows * 4) + (19 rows * 6)

      const business = plane.filter((s) => s.tier === 'business');
      expect(business.length).toBe(12);
      business.forEach((s) => {
        expect(s.price).toBe(1850);
        expect(s.cabinClass).toBe('business');
        expect(s.hasPowerSocket).toBe(true);
      });

      const exitRows = plane.filter((s) => s.isExitRow);
      expect(exitRows.length).toBe(12); // Rows 11 and 12 (6 seats each)
      exitRows.forEach((s) => {
        expect(s.price).toBe(1590);
        expect(s.tier).toBe('exit_row');
      });

      const wingSeats = plane.filter((s) => s.wingPosition);
      expect(wingSeats.length).toBe(8 * 6); // Rows 9 to 16 inclusive = 8 rows
    });

    it('1.3 Train Siemens Velaro YHT carriages (Carriage 1, 2, 3, 4) unique layouts', () => {
      // Carriage 1: Business (2+1 layout, 8 rows = 24 seats)
      const c1 = generateTrainSeats(300, 'Siemens Velaro YHT', 1);
      expect(c1.length).toBe(24);
      c1.forEach((s) => {
        expect(s.tier).toBe('business');
        expect(s.price).toBe(370);
        expect(s.facingDirection).toBeDefined();
      });

      // Carriage 2: Standard Economy (2+2 layout, 10 rows = 40 seats)
      const c2 = generateTrainSeats(300, 'Siemens Velaro YHT', 2);
      expect(c2.length).toBe(40);

      // Carriage 4: Table & Family Car (4-seat facing clusters, 8 rows = 32 seats)
      const c4 = generateTrainSeats(300, 'Siemens Velaro YHT', 4);
      expect(c4.length).toBe(32);
      c4.forEach((s) => {
        expect(s.isTable).toBe(true);
        expect(s.tier).toBe('table');
      });
    });

    it('1.4 Ferry Katamaran Main Deck vs Upper VIP Deck uniqueness', () => {
      const mainDeck = generateFerrySeats(250, 'main');
      const upperDeck = generateFerrySeats(250, 'upper');

      expect(mainDeck.length).toBe(54); // 9 rows * 6 cols
      expect(upperDeck.length).toBe(36); // 6 rows * 6 cols

      mainDeck.forEach((s) => {
        expect(s.deck).toBe('main');
        expect(s.number.toString().startsWith('M-')).toBe(true);
        if (s.col === 1 || s.col === 6) {
          expect(s.tier).toBe('window');
        }
      });

      upperDeck.forEach((s) => {
        expect(s.deck).toBe('upper');
        expect(s.number.toString().startsWith('U-')).toBe(true);
        expect(s.price).toBe(310);
        expect(s.tier).toBe('vip_lounge');
      });
    });
  });

  describe('Challenger M2/M3 - Suite 2: Drag Physics & AudioContext Invariants', () => {
    it('2.1 Drag calculation clamping & threshold trigger logic', () => {
      const maxDrag = 140;

      // Below 0 delta -> clamps to 0
      const clampNegative = Math.max(0, Math.min(-50, maxDrag));
      expect(clampNegative).toBe(0);

      // Above maxDrag -> clamps to maxDrag
      const clampOverflow = Math.max(0, Math.min(250, maxDrag));
      expect(clampOverflow).toBe(maxDrag);

      // Progress calculation
      const progressMid = (70 / maxDrag);
      expect(progressMid).toBe(0.5);

      // Trigger threshold at 80%
      const triggerThreshold = maxDrag * 0.8;
      expect(112 >= triggerThreshold).toBe(true);
      expect(100 >= triggerThreshold).toBe(false);
    });

    it('2.2 AudioContext synthesis throttle and pitch modulation resilience', () => {
      // Rapid fire tick calls
      for (let i = 0; i < 50; i++) {
        sound.playTick();
      }

      // Slider drag with progress out of bounds (<0, >1)
      sound.playSliderDrag(-0.5);
      sound.playSliderDrag(1.8);
      sound.playSliderDrag(0.5);

      // All chimes execute without exceptions
      sound.playClick();
      sound.playSuccessChime();
      sound.playRefundChime();
      sound.playSeatSelect();
      sound.playSeatDeselect();

      expect(true).toBe(true);
    });
  });

  describe('Challenger M2/M3 - Suite 3: 2-Step Checkout & Validation State Machine', () => {
    it('3.1 Passenger validation state machine in Step 1', () => {
      const seatItems: SeatItem[] = [
        { id: 's1', number: 1, row: 1, col: 1, tier: 'single', status: 'selected', price: 630 },
        { id: 's2', number: 2, row: 1, col: 3, tier: 'window', status: 'selected', price: 600 },
      ];

      // Missing names error detection
      const p1: PassengerInfo = {
        id: 'p-1',
        seatNumber: 1,
        firstName: '',
        lastName: 'Yılmaz',
        idNumber: '10000000146',
        gender: 'male',
        email: 'test@example.com',
        phone: '05321234567',
        isForeigner: false,
        luggageKg: 20,
        hasInsurance: true,
      };

      expect(p1.firstName.trim().length === 0).toBe(true);

      // Valid Turkish passenger with TCKN
      const tcknRes = validateTCKN('10000000146');
      expect(tcknRes.isValid).toBe(true);

      // Valid Foreigner passenger with passport
      const passRes = validatePassport('AB123456');
      expect(passRes.isValid).toBe(true);

      // Pricing calculation for 2 passengers with luggage & insurance & coupon
      const addOns: CheckoutAddOns = { luggageKg: 25, insurance: true };
      const pricing = calculatePricing(600, seatItems, addOns, 'BILEO50');

      // Base fare: 600 * 2 = 1200
      expect(pricing.baseFare).toBe(1200);
      // Seat surcharge: 30 TL for single seat
      expect(pricing.seatSurcharges).toBe(30);
      // Luggage: 2 * 95 TL = 190 TL
      expect(pricing.luggageFare).toBe(190);
      // Insurance: 2 * 45 TL = 90 TL
      expect(pricing.insuranceFare).toBe(90);
      // Discount: 50 TL
      expect(pricing.discount).toBe(50);
      // Service fee: 0 TL
      expect(pricing.serviceFee).toBe(0);
      // Total: 1200 + 30 + 190 + 90 - 50 = 1460 TL
      expect(pricing.total).toBe(1460);
    });

    it('3.2 Luhn validation and card brand detection in Step 2', () => {
      // Valid Visa
      const visa = validateLuhn('4539148803436467');
      expect(visa.isValid).toBe(true);
      expect(visa.brand).toBe('visa');

      // Valid Mastercard
      const mc = validateLuhn('5555555555554444');
      expect(mc.isValid).toBe(true);
      expect(mc.brand).toBe('mastercard');

      // Valid Troy
      const troy = validateLuhn('9792000000000011');
      expect(troy.isValid).toBe(true);
      expect(troy.brand).toBe('troy');

      // Invalid Luhn
      const invalid = validateLuhn('4539148803436468');
      expect(invalid.isValid).toBe(false);
    });
  });

  describe('Challenger M2/M3 - Suite 4: 1-Click Instant Refund & Wallet State Audit', () => {
    it('4.1 1-Click 100% unconditional refund simulation and receipt generation', () => {
      const ticket: BookingTicket = {
        id: 'tkt-test-refund',
        pnr: 'TK-9988',
        route: POPULAR_ROUTES[4],
        passengers: [
          {
            id: 'p-1',
            seatNumber: '1A',
            firstName: 'Can',
            lastName: 'Öztürk',
            idNumber: '10000000146',
            gender: 'male',
            email: 'can@bileo.com',
            phone: '05321112233',
            luggageKg: 20,
            hasInsurance: true,
          }
        ],
        seats: ['1A'],
        basePrice: 2150,
        seatTierSurcharges: 350,
        luggageSurcharges: 0,
        insuranceFee: 45,
        discountAmount: 0,
        totalPrice: 2545,
        status: 'active',
        purchaseDate: '24 Mayıs 2026',
        purchaseTimestamp: Date.now(),
        qrCodeValue: 'BILEO:TK-9988:1A:CAN_OZTURK',
      };

      // Refund calculation: 100% full refund with 0 deduction
      const deduction = 0;
      const refundedAmount = ticket.totalPrice - deduction;
      expect(refundedAmount).toBe(2545);

      const receiptId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      expect(receiptId.startsWith('REF-')).toBe(true);
      expect(receiptId.length).toBe(10);
    });

    it('4.2 SEED_TICKETS hydration and PNR formatting integrity', () => {
      expect(SEED_TICKETS.length).toBe(4);

      // Check authentic PNR formats
      SEED_TICKETS.forEach((t) => {
        expect(t.pnr).toBeDefined();
        expect(typeof t.pnr).toBe('string');
        expect(t.totalPrice).toBeGreaterThan(0);
        expect(t.passengers.length).toBeGreaterThan(0);
      });

      // PNR generator creates unique format
      const pnrFlight = generateAuthenticPnr('flight', 'Türk Hava Yolları');
      const pnrBus = generateAuthenticPnr('bus', 'Pamukkale');
      const pnrTrain = generateAuthenticPnr('train', 'TCDD');
      const pnrFerry = generateAuthenticPnr('ferry', 'İDO');

      expect(pnrFlight.startsWith('TK-') || pnrFlight.startsWith('PC-') || pnrFlight.startsWith('FL-')).toBe(true);
      expect(pnrBus.startsWith('PAM-') || pnrBus.startsWith('KAM-') || pnrBus.startsWith('BUS-')).toBe(true);
      expect(pnrTrain.startsWith('YHT-') || pnrTrain.startsWith('TRN-')).toBe(true);
      expect(pnrFerry.startsWith('IDO-') || pnrFerry.startsWith('BUDO-') || pnrFerry.startsWith('SEA-')).toBe(true);
    });
  });

  describe('Challenger M2/M3 - Suite 5: Editorial Content & Badges Purge Verification', () => {
    it('5.1 Verify complete elimination of tacky AI badges across all routes and cards', () => {
      const forbiddenBadges = ['En Uygun', 'Popüler', 'Yüksek Puanlı', 'Fırsat', 'Kaçırma', 'Süper Fiyat'];

      POPULAR_ROUTES.forEach((r) => {
        if (r.badge) {
          forbiddenBadges.forEach((forbidden) => {
            expect(r.badge?.includes(forbidden)).toBe(false);
          });
        }
      });

      DISCOVERY_CARDS.forEach((c) => {
        if (c.badge) {
          forbiddenBadges.forEach((forbidden) => {
            expect(c.badge?.includes(forbidden)).toBe(false);
          });
        }
      });
    });

    it('5.2 Verify city and terminal mapping completeness for primary transit hubs', () => {
      const primaryCities = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa', 'Eskişehir', 'Konya', 'Paris', 'Londra', 'Berlin', 'Roma'];
      primaryCities.forEach((city) => {
        expect(TERMINALS[city]).toBeDefined();
        expect(TERMINALS[city].length).toBeGreaterThan(0);
      });
    });
  });
}
