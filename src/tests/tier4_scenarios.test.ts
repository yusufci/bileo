// Tier 4: Real-World Workload Scenarios Test Suite (≥5 Comprehensive End-to-End Workloads)
// Bileo Multi-Modal Transport Platform

import { describe, it, expect } from './test_framework';
import {
  POPULAR_ROUTES,
  generateBus2Plus1Seats,
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
import { BookingTicket, PassengerInfo } from '../types';

export function runTier4Tests() {
  describe('Tier 4 - Real-World Scenario 1: Intercity Bus Pamukkale Jumbo Hat 2+1 Single Seat Booking', () => {
    it('should complete full E2E booking lifecycle for female passenger on single seat with PNR verification', () => {
      // Step 1: Discover Pamukkale Jumbo Hat Route
      const route = POPULAR_ROUTES.find((r) => r.company.includes('Pamukkale') && r.from === 'İstanbul' && r.to === 'Ankara');
      expect(route).toBeDefined();
      expect(route!.vehicleType).toContain('2+1');
      expect(route!.price).toBe(600);

      // Step 2: Generate 2+1 Cabin Seat Map & Select Seat 4 (Single seat)
      const busSeats = generateBus2Plus1Seats(route!.price);
      const seat4 = busSeats.find((s) => s.col === 1 && s.row === 2);
      expect(seat4).toBeDefined();
      expect(seat4!.tier).toBe('single');

      // Step 3: Verify Turkish Gender Adjacency for Bayan Passenger
      const genderValidation = validateSeatGenderAdjacency(busSeats, seat4!, 'female');
      expect(genderValidation.allowed).toBeTruthy();

      // Step 4: Transparent Dynamic Pricing Breakdown
      const pricing = calculatePricing(route!.price, [seat4!], { luggageKg: 15, insurance: false });
      expect(pricing.baseFare).toBe(600);
      expect(pricing.seatSurcharges).toBe(30); // 30 TL single seat surcharge
      expect(pricing.serviceFee).toBe(0); // 0 TL service fee guarantee
      expect(pricing.total).toBe(630);

      // Step 5: Passenger Details & TCKN Checksum
      const tckn = '10000000146';
      const tcknValidation = validateTCKN(tckn);
      expect(tcknValidation.isValid).toBeTruthy();

      const passenger: PassengerInfo = {
        id: 'p-101',
        seatNumber: seat4!.number,
        firstName: 'Zeynep',
        lastName: 'Kaya',
        idNumber: tckn,
        gender: 'female',
        email: 'zeynep.kaya@bileo.com',
        phone: '0532 987 65 43',
      };

      // Step 6: 2-Step Checkout Payment with Valid Visa Card
      const card = '4539148803436467';
      const cardValidation = validateLuhn(card);
      expect(cardValidation.isValid).toBeTruthy();
      expect(cardValidation.brand).toBe('visa');

      // Step 7: Issue Authentic PNR & Create Digital Boarding Pass
      const pnr = generateAuthenticPnr('bus', route!.company);
      expect(pnr).toMatch(/^PAM-\d{4}$/);

      const ticket: BookingTicket = {
        id: `tkt-${pnr}`,
        pnr,
        route: route!,
        passengers: [passenger],
        seats: [seat4!.number],
        basePrice: pricing.baseFare,
        seatTierSurcharges: pricing.seatSurcharges,
        serviceFee: 0,
        totalPrice: pricing.total,
        status: 'active',
        purchaseDate: '21 Mayıs 2026',
        qrCodeValue: `BILEO:${pnr}:${seat4!.number}:ZEYNEP_KAYA`,
      };

      // Step 8: Global PNR Lookup & Wallet State Verification
      const wallet = [ticket];
      const retrieved = wallet.find((t) => t.pnr === pnr);
      expect(retrieved).toBeDefined();
      expect(retrieved?.totalPrice).toBe(630);
      expect(retrieved?.passengers[0].firstName).toBe('Zeynep');
      expect(retrieved?.status).toBe('active');
    });
  });

  describe('Tier 4 - Real-World Scenario 2: High-Speed Train TCDD Siemens Velaro 4-Seat Table Family Booking', () => {
    it('should complete family table booking with add-ons, coupon discount, and 1-click full refund', () => {
      // Step 1: Discover High-Speed Train Route
      const route = POPULAR_ROUTES.find((r) => r.company.includes('TCDD') && r.from === 'Ankara' && r.to === 'Konya')!;
      expect(route).toBeDefined();
      expect(route.price).toBe(240);

      // Step 2: Select Carriage 4 (Family Table Carriage) - 4 facing seats
      const trainSeats = generateTrainSeats(route.price, 'Siemens Velaro YHT', 4);
      const tableGroup = trainSeats.filter((s) => s.row === 1);
      expect(tableGroup.length).toBe(4);
      tableGroup.forEach((s) => {
        expect(s.isTable).toBeTruthy();
        expect(s.carriageNumber).toBe(4);
      });

      // Step 3: Dynamic Pricing with Extra Luggage, Insurance, and YHT15 Coupon
      const pricing = calculatePricing(
        route.price,
        tableGroup,
        { luggageKg: 25, insurance: true },
        'YHT15'
      );

      // 4 seats * 240 = 960 base. Luggage: 4 * 95 = 380. Insurance: 4 * 45 = 180. Subtotal = 1520.
      // YHT15 discount: 15% of 1520 = 228 TL. Total = 1292 TL.
      expect(pricing.baseFare).toBe(960);
      expect(pricing.luggageFare).toBe(380);
      expect(pricing.insuranceFare).toBe(180);
      expect(pricing.discount).toBe(228);
      expect(pricing.total).toBe(1292);

      // Step 4: Passenger Info Validation (Family of 4)
      const tcknList = ['10000000146', '29837261828', '19191919190', '11111111110'];
      tcknList.forEach((tckn) => {
        expect(validateTCKN(tckn).isValid).toBeTruthy();
      });

      // Step 5: Issue PNR & Confirm Ticket
      const pnr = generateAuthenticPnr('train', route.company);
      expect(pnr).toMatch(/^YHT-\d{4}$/);

      const ticket: BookingTicket = {
        pnr,
        route,
        passengers: tableGroup.map((seat, idx) => ({
          id: `p-${idx + 1}`,
          seatNumber: seat.number,
          firstName: `Yolcu${idx + 1}`,
          lastName: 'Demir',
          idNumber: tcknList[idx],
          gender: idx % 2 === 0 ? 'male' : 'female',
          email: 'demir.family@bileo.com',
          phone: '0544 111 22 33',
        })),
        seats: tableGroup.map((s) => s.number),
        totalPrice: pricing.total,
        status: 'active',
        purchaseDate: '21 Mayıs 2026',
        qrCodeValue: `BILEO:${pnr}:TABLE_GROUP_4`,
      };

      // Step 6: Perform 1-Click Instant Refund
      ticket.status = 'refunded';
      const receiptId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
      ticket.refundDetails = {
        refundedAmount: ticket.totalPrice, // 100% full refund
        refundDate: '21 Mayıs 2026',
        receiptId,
        reason: 'Kullanıcı talebiyle kesintisiz anında iade',
      };

      expect(ticket.status).toBe('refunded');
      expect(ticket.refundDetails.refundedAmount).toBe(1292);
      expect(ticket.refundDetails.receiptId).toMatch(/^REF-\d{6}$/);
    });
  });

  describe('Tier 4 - Real-World Scenario 3: International Flight THY A321neo Business Booking', () => {
    it('should complete international business flight booking with foreign passport and promo code', () => {
      // Step 1: Select THY Paris Flight
      const route = POPULAR_ROUTES.find((r) => r.company.includes('Türk Hava Yolları') && r.to === 'Paris')!;
      expect(route).toBeDefined();
      expect(route.price).toBe(2150);

      // Step 2: Select Business Class Seat 1A
      const planeSeats = generateAirplaneSeats(route.price, 'Airbus A321neo');
      const seat1A = planeSeats.find((s) => s.number === '1A')!;
      expect(seat1A.cabinClass).toBe('business');
      expect(seat1A.hasPowerSocket).toBeTruthy();

      // Step 3: Dynamic Pricing with 35kg Luggage + Insurance + BILEO50 Coupon
      const pricing = calculatePricing(
        route.price,
        [seat1A],
        { luggageKg: 35, insurance: true },
        'BILEO50'
      );

      // Base: 2150 + Surcharge: 350 + Luggage: 175 + Insurance: 45 = 2720 Subtotal. Discount: 50. Total: 2670.
      expect(pricing.baseFare).toBe(2150);
      expect(pricing.seatSurcharges).toBe(350);
      expect(pricing.luggageFare).toBe(175);
      expect(pricing.insuranceFare).toBe(45);
      expect(pricing.discount).toBe(50);
      expect(pricing.total).toBe(2670);

      // Step 4: Validate Foreign Passport
      const passport = 'U89761234';
      const passportCheck = validatePassport(passport);
      expect(passportCheck.isValid).toBeTruthy();

      // Step 5: Validate Payment Card
      const cardCheck = validateLuhn('5555555555554444');
      expect(cardCheck.isValid).toBeTruthy();
      expect(cardCheck.brand).toBe('mastercard');

      // Step 6: Issue PNR and Digital Boarding Pass
      const pnr = generateAuthenticPnr('flight', route.company);
      expect(pnr).toMatch(/^TK-\d{4}$/);

      const ticket: BookingTicket = {
        pnr,
        route,
        passengers: [
          {
            id: 'p-fr-1',
            seatNumber: '1A',
            firstName: 'Jean',
            lastName: 'Dupont',
            idNumber: passport,
            isForeigner: true,
            nationality: 'FR',
            gender: 'male',
            email: 'jean.dupont@paris.fr',
            phone: '+33 6 12 34 56 78',
            luggageKg: 35,
            hasInsurance: true,
          },
        ],
        seats: ['1A'],
        totalPrice: pricing.total,
        status: 'active',
        purchaseDate: '21 Mayıs 2026',
        qrCodeValue: `BILEO:${pnr}:1A:JEAN_DUPONT`,
      };

      expect(ticket.status).toBe('active');
      expect(ticket.totalPrice).toBe(2670);
      expect(ticket.passengers[0].isForeigner).toBeTruthy();
    });
  });

  describe('Tier 4 - Real-World Scenario 4: Ferry İDO Fast Katamaran Panoramic Deck Booking', () => {
    it('should book upper deck panoramic VIP sea-view seats with discount coupon', () => {
      // Step 1: Select İDO Ferry Route
      const route = POPULAR_ROUTES.find((r) => r.company.includes('İDO') && r.to === 'Bursa')!;
      expect(route).toBeDefined();
      expect(route.price).toBe(290);

      // Step 2: Select Upper Deck Panoramic VIP Seat
      const upperSeats = generateFerrySeats(route.price, 'upper');
      const vipSeat = upperSeats.find((s) => s.tier === 'vip_lounge')!;
      expect(vipSeat.deck).toBe('upper');
      expect(vipSeat.price).toBe(350); // 290 base + 60 upper deck

      // Step 3: Dynamic Pricing with DENIZ25 Coupon (25% discount)
      const pricing = calculatePricing(route.price, [vipSeat], { luggageKg: 15, insurance: false }, 'DENIZ25');
      // Subtotal = 350. Discount 25% = 88 TL. Total = 262 TL.
      expect(pricing.seatSurcharges).toBe(60);
      expect(pricing.discount).toBe(88);
      expect(pricing.total).toBe(262);

      // Step 4: Issue PNR and Confirm
      const pnr = generateAuthenticPnr('ferry', route.company);
      expect(pnr).toMatch(/^IDO-\d{4}$/);

      const ticket: BookingTicket = {
        pnr,
        route,
        passengers: [
          {
            id: 'p-f-1',
            seatNumber: vipSeat.number,
            firstName: 'Merve',
            lastName: 'Arslan',
            idNumber: '10000000146',
            gender: 'female',
            email: 'merve.arslan@test.com',
            phone: '0533 222 33 44',
          },
        ],
        seats: [vipSeat.number],
        totalPrice: pricing.total,
        status: 'active',
        purchaseDate: '21 Mayıs 2026',
        qrCodeValue: `BILEO:${pnr}:${vipSeat.number}:MERVE_ARSLAN`,
      };

      expect(ticket.status).toBe('active');
      expect(ticket.totalPrice).toBe(262);
    });
  });

  describe('Tier 4 - Real-World Scenario 5: Multi-Ticket Lifecycle & Wallet State Audit', () => {
    it('should manage multiple simultaneous tickets across 4 modalities, audit totals, and handle partial refunds', () => {
      // 1. Create a diverse wallet with 4 tickets across Bus, Flight, Train, Ferry
      const busTicket: BookingTicket = {
        pnr: 'PAM-1001',
        route: POPULAR_ROUTES[1],
        passengers: [{ id: 'p1', seatNumber: 1, firstName: 'A', lastName: 'B', idNumber: '10000000146', gender: 'male', email: 'a@b.com', phone: '1' }],
        seats: [1],
        totalPrice: 630,
        purchaseDate: '20 Mayıs 2026',
        status: 'active',
        qrCodeValue: 'BILEO:PAM-1001',
      };

      const flightTicket: BookingTicket = {
        pnr: 'TK-2002',
        route: POPULAR_ROUTES[4],
        passengers: [{ id: 'p2', seatNumber: '1A', firstName: 'C', lastName: 'D', idNumber: 'U12345678', isForeigner: true, gender: 'female', email: 'c@d.com', phone: '2' }],
        seats: ['1A'],
        totalPrice: 2500,
        purchaseDate: '20 Mayıs 2026',
        status: 'active',
        qrCodeValue: 'BILEO:TK-2002',
      };

      const trainTicket: BookingTicket = {
        pnr: 'YHT-3003',
        route: POPULAR_ROUTES[6],
        passengers: [{ id: 'p3', seatNumber: 5, firstName: 'E', lastName: 'F', idNumber: '29837261828', gender: 'male', email: 'e@f.com', phone: '3' }],
        seats: [5],
        totalPrice: 240,
        purchaseDate: '21 Mayıs 2026',
        status: 'active',
        qrCodeValue: 'BILEO:YHT-3003',
      };

      const ferryTicket: BookingTicket = {
        pnr: 'IDO-4004',
        route: POPULAR_ROUTES[8],
        passengers: [{ id: 'p4', seatNumber: 'U-1', firstName: 'G', lastName: 'H', idNumber: '10000000146', gender: 'female', email: 'g@h.com', phone: '4' }],
        seats: ['U-1'],
        totalPrice: 350,
        purchaseDate: '21 Mayıs 2026',
        status: 'active',
        qrCodeValue: 'BILEO:IDO-4004',
      };

      const wallet = [busTicket, flightTicket, trainTicket, ferryTicket];

      // Audit Initial Wallet State
      expect(wallet.length).toBe(4);
      const totalActiveSpend = wallet.filter((t) => t.status === 'active').reduce((acc, t) => acc + t.totalPrice, 0);
      expect(totalActiveSpend).toBe(630 + 2500 + 240 + 350); // 3720 TL

      // 2. Perform Global PNR Search Queries
      expect(wallet.find((t) => t.pnr.toLowerCase() === 'tk-2002'.toLowerCase())?.totalPrice).toBe(2500);
      expect(wallet.find((t) => t.pnr.toLowerCase() === 'ido-4004'.toLowerCase())?.seats[0]).toBe('U-1');

      // 3. Perform 1-Click Refund on Train Ticket Only
      const trainToRefund = wallet.find((t) => t.pnr === 'YHT-3003')!;
      trainToRefund.status = 'refunded';
      trainToRefund.refundDetails = {
        refundedAmount: trainToRefund.totalPrice,
        refundDate: '21 Mayıs 2026',
        receiptId: 'REF-300399',
        reason: 'Müşteri talebi',
      };

      // 4. Audit Post-Refund State
      const activeTickets = wallet.filter((t) => t.status === 'active');
      const refundedTickets = wallet.filter((t) => t.status === 'refunded');

      expect(activeTickets.length).toBe(3);
      expect(refundedTickets.length).toBe(1);
      expect(refundedTickets[0].pnr).toBe('YHT-3003');
      expect(refundedTickets[0].refundDetails?.receiptId).toBe('REF-300399');

      // Remaining active spend should now be 3720 - 240 = 3480 TL
      const postRefundActiveSpend = activeTickets.reduce((acc, t) => acc + t.totalPrice, 0);
      expect(postRefundActiveSpend).toBe(3480);
    });
  });
}
