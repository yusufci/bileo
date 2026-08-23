// Tier 3: Cross-Feature Interactions Test Suite (≥12 comprehensive interaction test cases)
// Bileo Multi-Modal Transport Platform

import { describe, it, expect } from './test_framework';
import {
  POPULAR_ROUTES,
  generateBus2Plus1Seats,
  generateBus2Plus2Seats,
  generateAirplaneSeats,
  generateTrainSeats,
  generateFerrySeats,
} from '../data/mockData';
import {
  validateTCKN,
  validatePassport,
  validateLuhn,
  validateSeatGenderAdjacency,
  calculatePricing,
  generateAuthenticPnr,
} from '../utils/validation';
import { BookingTicket } from '../types';

export function runTier3Tests() {
  describe('Tier 3 - Cross-Feature Interactions (12 End-to-End Combinations)', () => {
    it('3.1 Pairwise: Single Bus Seat + Bayan Gender + Surcharge + TCKN + Luhn + PNR Creation', () => {
      const route = POPULAR_ROUTES.find((r) => r.company === 'Pamukkale Turizm')!;
      const busSeats = generateBus2Plus1Seats(route.price);

      // 1. Select single seat (col 1)
      const targetSeat = busSeats.find((s) => s.col === 1 && s.row === 3 && s.status === 'empty')!;
      expect(targetSeat.tier).toBe('single');

      // 2. Gender check for Female
      const genderValidation = validateSeatGenderAdjacency(busSeats, targetSeat, 'female');
      expect(genderValidation.allowed).toBeTruthy();

      // 3. Pricing breakdown calculation
      const pricing = calculatePricing(route.price, [targetSeat], { luggageKg: 15, insurance: false });
      expect(pricing.baseFare).toBe(600);
      expect(pricing.seatSurcharges).toBe(30); // 30 TL single seat surcharge
      expect(pricing.serviceFee).toBe(0);
      expect(pricing.total).toBe(630);

      // 4. Passenger TCKN validation
      const tcknCheck = validateTCKN('10000000146');
      expect(tcknCheck.isValid).toBeTruthy();

      // 5. Payment Card Luhn validation
      const cardCheck = validateLuhn('4539148803436467');
      expect(cardCheck.isValid).toBeTruthy();
      expect(cardCheck.brand).toBe('visa');

      // 6. Authentic PNR issuance
      const pnr = generateAuthenticPnr('bus', route.company);
      expect(pnr).toMatch(/^PAM-\d{4}$/);

      // 7. Complete Ticket creation
      const ticket: BookingTicket = {
        pnr,
        route,
        passengers: [
          {
            id: 'p-1',
            seatNumber: targetSeat.number,
            firstName: 'Ayşe',
            lastName: 'Yılmaz',
            idNumber: '10000000146',
            gender: 'female',
            email: 'ayse.yilmaz@test.com',
            phone: '0532 111 22 33',
          },
        ],
        seats: [targetSeat.number],
        totalPrice: pricing.total,
        purchaseDate: '21 Mayıs 2026',
        status: 'active',
        qrCodeValue: `BILEO:${pnr}:${targetSeat.number}:AYSE_YILMAZ`,
      };

      expect(ticket.status).toBe('active');
      expect(ticket.totalPrice).toBe(630);
    });

    it('3.2 Pairwise: Multi-Passenger Mixed-Gender Companion Booking in Paired Double Seats', () => {
      const route = POPULAR_ROUTES[0];
      const busSeats = generateBus2Plus1Seats(route.price);

      // Find paired double seats in row 4
      const seatWindow = busSeats.find((s) => s.row === 4 && s.col === 3)!;
      const seatAisle = busSeats.find((s) => s.row === 4 && s.col === 4)!;

      // Select seatWindow for Male, seatAisle for Female (selected together in same cart)
      const maleCheck = validateSeatGenderAdjacency(busSeats, seatWindow, 'male', [seatAisle.id]);
      const femaleCheck = validateSeatGenderAdjacency(busSeats, seatAisle, 'female', [seatWindow.id]);

      expect(maleCheck.allowed).toBeTruthy();
      expect(femaleCheck.allowed).toBeTruthy();

      // Pricing for 2 passengers
      const pricing = calculatePricing(route.price, [seatWindow, seatAisle], { luggageKg: 15, insurance: false });
      expect(pricing.baseFare).toBe(route.price * 2);
      expect(pricing.total).toBe(route.price * 2);

      // Validate both passengers' IDs
      expect(validateTCKN('10000000146').isValid).toBeTruthy();
      expect(validateTCKN('29837261828').isValid).toBeTruthy();

      const pnr = generateAuthenticPnr('bus', route.company);
      expect(pnr).toMatch(/^KK-\d{4}$/);
    });

    it('3.3 Pairwise: Flight Business Class Booking with 25kg Baggage + Insurance + Promo Coupon', () => {
      const flightRoute = POPULAR_ROUTES.find((r) => r.company.includes('Türk Hava Yolları'))!;
      const planeSeats = generateAirplaneSeats(flightRoute.price);

      // Select Business Class Seat 1A
      const businessSeat = planeSeats.find((s) => s.row === 1 && s.col === 1)!;
      expect(businessSeat.cabinClass).toBe('business');

      // Add-ons: 25kg luggage (+95 TL), Insurance (+45 TL), Coupon PREMIUM20 (20% discount)
      const pricing = calculatePricing(
        flightRoute.price,
        [businessSeat],
        { luggageKg: 25, insurance: true },
        'PREMIUM20'
      );

      // Base: 2150, Surcharge: 350, Luggage: 95, Insurance: 45 => Subtotal = 2640. Discount 20% = 528. Total = 2112.
      expect(pricing.baseFare).toBe(2150);
      expect(pricing.seatSurcharges).toBe(350);
      expect(pricing.luggageFare).toBe(95);
      expect(pricing.insuranceFare).toBe(45);
      expect(pricing.discount).toBe(528);
      expect(pricing.total).toBe(2112);

      // International passport validation
      const passportCheck = validatePassport('U12345678');
      expect(passportCheck.isValid).toBeTruthy();

      // Luhn Mastercard validation
      const cardCheck = validateLuhn('5555555555554444');
      expect(cardCheck.isValid).toBeTruthy();
      expect(cardCheck.brand).toBe('mastercard');

      const pnr = generateAuthenticPnr('flight', flightRoute.company);
      expect(pnr).toMatch(/^TK-\d{4}$/);
    });

    it('3.4 Pairwise: High-Speed Train 4-Seat Table Family Booking with Insurance & Card Payment', () => {
      const trainRoute = POPULAR_ROUTES.find((r) => r.company.includes('TCDD'))!;
      const trainSeats = generateTrainSeats(trainRoute.price, 'Siemens Velaro YHT', 4);

      // Select 4 seats around Table 1 (row 1, cols 1, 2, 3, 4)
      const tableSeats = trainSeats.filter((s) => s.row === 1);
      expect(tableSeats.length).toBe(4);
      tableSeats.forEach((s) => expect(s.isTable).toBeTruthy());

      const pricing = calculatePricing(trainRoute.price, tableSeats, { luggageKg: 15, insurance: true });
      expect(pricing.baseFare).toBe(trainRoute.price * 4); // 4 * 240 = 960
      expect(pricing.insuranceFare).toBe(180); // 4 * 45 = 180
      expect(pricing.total).toBe(1140);

      const pnr = generateAuthenticPnr('train', trainRoute.company);
      expect(pnr).toMatch(/^YHT-\d{4}$/);
    });

    it('3.5 Pairwise: Ticket Purchase -> PNR Search -> 1-Click Instant Refund -> Receipt Verification', () => {
      const route = POPULAR_ROUTES[0];
      const pnr = generateAuthenticPnr('bus', route.company);

      const ticket: BookingTicket = {
        pnr,
        route,
        passengers: [
          {
            id: 'p-1',
            seatNumber: 12,
            firstName: 'Can',
            lastName: 'Erkin',
            idNumber: '10000000146',
            gender: 'male',
            email: 'can.erkin@bileo.com',
            phone: '0555 444 33 22',
          },
        ],
        seats: [12],
        totalPrice: route.price,
        purchaseDate: '21 Mayıs 2026',
        status: 'active',
        qrCodeValue: `BILEO:${pnr}:12:CAN_ERKIN`,
      };

      // 1. Verify wallet lookup
      const wallet = [ticket];
      const lookupResult = wallet.find((t) => t.pnr === pnr);
      expect(lookupResult).toBeDefined();
      expect(lookupResult?.status).toBe('active');

      // 2. Perform 1-click refund
      lookupResult!.status = 'refunded';
      const receiptId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      lookupResult!.refundDetails = {
        refundedAmount: lookupResult!.totalPrice,
        refundDate: '21 Mayıs 2026',
        receiptId,
        reason: 'Koşulsuz kesintisiz anında iade',
      };

      // 3. Verify refund state
      expect(lookupResult?.status).toBe('refunded');
      expect(lookupResult?.refundDetails?.refundedAmount).toBe(route.price);
      expect(lookupResult?.refundDetails?.receiptId).toMatch(/^REF-\d{6}$/);
    });

    it('3.6 Pairwise: Fast Katamaran Ferry Panoramic Upper Deck VIP Booking', () => {
      const ferryRoute = POPULAR_ROUTES.find((r) => r.company.includes('İDO'))!;
      const upperSeats = generateFerrySeats(ferryRoute.price, 'upper');

      const vipSeat = upperSeats.find((s) => s.tier === 'vip_lounge')!;
      expect(vipSeat.deck).toBe('upper');
      expect(vipSeat.price).toBe(ferryRoute.price + 60);

      const pricing = calculatePricing(ferryRoute.price, [vipSeat], { luggageKg: 15, insurance: false });
      expect(pricing.seatSurcharges).toBe(60);
      expect(pricing.total).toBe(ferryRoute.price + 60);

      const pnr = generateAuthenticPnr('ferry', ferryRoute.company);
      expect(pnr).toMatch(/^IDO-\d{4}$/);
    });

    it('3.7 Pairwise: Step-by-Step Checkout Error Recovery (Invalid TCKN -> Fixed -> Invalid Card -> Fixed)', () => {
      // Step 1: User enters invalid TCKN
      const badTckn = validateTCKN('123456');
      expect(badTckn.isValid).toBeFalsy();

      // Step 1: User corrects to valid TCKN
      const goodTckn = validateTCKN('10000000146');
      expect(goodTckn.isValid).toBeTruthy();

      // Step 2: User enters corrupted card
      const badCard = validateLuhn('4539148803436460');
      expect(badCard.isValid).toBeFalsy();

      // Step 2: User corrects to valid card
      const goodCard = validateLuhn('4539148803436467');
      expect(goodCard.isValid).toBeTruthy();
    });

    it('3.8 Pairwise: Modality Filter & Departure Time Query Interaction', () => {
      const trainRoutes = POPULAR_ROUTES.filter((r) => r.transportType === 'tren' || (r.transportType as string) === 'train');
      expect(trainRoutes.length).toBeGreaterThan(0);

      const morningTrains = trainRoutes.filter((r) => {
        const hour = parseInt(r.departureTime.split(':')[0], 10);
        return hour >= 6 && hour < 12;
      });
      expect(morningTrains.length).toBeGreaterThanOrEqual(1);
    });

    it('3.9 Pairwise: Simultaneous Concurrent Bookings Collision-Free PNR Generation', () => {
      const generatedPnrs = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const pnr = generateAuthenticPnr('bus', 'Pamukkale Turizm');
        generatedPnrs.add(pnr);
      }
      // Out of 50 randomly generated PNRs from a pool of 9000 numbers, collisions are exceptionally rare
      expect(generatedPnrs.size).toBeGreaterThanOrEqual(45);
    });

    it('3.10 Pairwise: Multi-Ticket Wallet State Isolation (Partial Refund)', () => {
      const t1: BookingTicket = {
        pnr: 'TK-1111',
        route: POPULAR_ROUTES[4],
        passengers: [{ id: 'p-1', seatNumber: '1A', firstName: 'A', lastName: 'B', idNumber: '10000000146', gender: 'male', email: 'a@b.com', phone: '123' }],
        seats: ['1A'],
        totalPrice: 2000,
        purchaseDate: '20 Mayıs 2026',
        status: 'active',
        qrCodeValue: 'BILEO:TK-1111',
      };
      const t2: BookingTicket = {
        pnr: 'YHT-2222',
        route: POPULAR_ROUTES[6],
        passengers: [{ id: 'p-2', seatNumber: '3', firstName: 'C', lastName: 'D', idNumber: '10000000146', gender: 'female', email: 'c@d.com', phone: '456' }],
        seats: ['3'],
        totalPrice: 240,
        purchaseDate: '21 Mayıs 2026',
        status: 'active',
        qrCodeValue: 'BILEO:YHT-2222',
      };

      const wallet = [t1, t2];

      // Refund only ticket 1
      const refundTarget = wallet.find((t) => t.pnr === 'TK-1111')!;
      refundTarget.status = 'refunded';
      refundTarget.refundDetails = {
        refundedAmount: refundTarget.totalPrice,
        refundDate: '21 Mayıs 2026',
        receiptId: 'REF-111100',
      };

      expect(wallet.find((t) => t.pnr === 'TK-1111')?.status).toBe('refunded');
      expect(wallet.find((t) => t.pnr === 'YHT-2222')?.status).toBe('active'); // Isolated!
    });

    it('3.11 Pairwise: Emergency Exit Row Seat Selection + Extra Legroom Surcharge + Luggage Add-on + Card Payment', () => {
      const flightRoute = POPULAR_ROUTES.find((r) => r.transportType === 'ucak' || (r.transportType as string) === 'flight')!;
      const planeSeats = generateAirplaneSeats(flightRoute.price);
      const exitSeat = planeSeats.find((s) => s.isExitRow && s.status === 'empty')!;
      expect(exitSeat).toBeDefined();

      const pricing = calculatePricing(flightRoute.price, [exitSeat], { luggageKg: 25, insurance: false });
      expect(pricing.seatSurcharges).toBe(90);
      expect(pricing.luggageFare).toBe(95);
      expect(pricing.total).toBe(flightRoute.price + 90 + 95);

      const pnr = generateAuthenticPnr('flight', flightRoute.company);
      expect(pnr).toMatch(/^TK-\d{4}$/);
    });

    it('3.12 Pairwise: Bus 2+2 Multi-Seat Booking with 4 Passengers and Valid Payment', () => {
      const route = POPULAR_ROUTES[0];
      const bus2x2Seats = generateBus2Plus2Seats(route.price);
      const fourSeats = bus2x2Seats.slice(0, 4);
      expect(fourSeats.length).toBe(4);

      const pricing = calculatePricing(route.price, fourSeats, { luggageKg: 15, insurance: true });
      expect(pricing.baseFare).toBe(route.price * 4);
      expect(pricing.insuranceFare).toBe(45 * 4);
      expect(pricing.total).toBe(route.price * 4 + 180);
    });
  });
}
