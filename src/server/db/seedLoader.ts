// Seed Data Loader for Bileo Transportation Ticketing Platform
// Populates carriers, multimodal routes, authentic seat layouts, and demo tickets from mock dataset.

import { IDatabaseService } from './types';
import { POPULAR_ROUTES, SEED_TICKETS, generateCabinSeats } from '../../data/mockData';

export async function seedDatabase(db: IDatabaseService): Promise<void> {
  // 1. Seed Demo Users
  const demoUsers = [
    {
      id: 'usr-admin-1',
      email: 'admin@bileo.com',
      password_hash: '$2b$12$K8yG.pL8vT1fVzW/Xy0RFeu1w7u/9X1O6p7s8t9u0v1w2x3y4z5a6', // bcrypt work factor 12
      name: 'Bileo',
      surname: 'Yönetici',
      phone: '0555 000 00 00',
      tc_no_masked: '*******1234',
      tc_no_hash: 'hash-admin-tc',
      gender: 'male',
      role: 'admin',
      avatar_initials: 'BY',
      is_active: true,
    },
    {
      id: 'usr-cust-1',
      email: 'ahmet.kaya@bileo.com',
      password_hash: '$2b$12$K8yG.pL8vT1fVzW/Xy0RFeu1w7u/9X1O6p7s8t9u0v1w2x3y4z5a6',
      name: 'Ahmet',
      surname: 'Kaya',
      phone: '0555 987 65 43',
      tc_no_masked: '*******0146',
      tc_no_hash: 'hash-ahmet-tc',
      gender: 'male',
      role: 'customer',
      avatar_initials: 'AK',
      is_active: true,
    },
    {
      id: 'usr-cust-2',
      email: 'selin.demir@bileo.com',
      password_hash: '$2b$12$K8yG.pL8vT1fVzW/Xy0RFeu1w7u/9X1O6p7s8t9u0v1w2x3y4z5a6',
      name: 'Selin',
      surname: 'Demir',
      phone: '0544 321 98 76',
      tc_no_masked: '*******0146',
      tc_no_hash: 'hash-selin-tc',
      gender: 'female',
      role: 'customer',
      avatar_initials: 'SD',
      is_active: true,
    },
    {
      id: 'usr-auditor-1',
      email: 'auditor@bileo.com',
      password_hash: '$2b$12$K8yG.pL8vT1fVzW/Xy0RFeu1w7u/9X1O6p7s8t9u0v1w2x3y4z5a6',
      name: 'Denetim',
      surname: 'Uzmanı',
      phone: '0532 999 88 77',
      tc_no_masked: '*******9999',
      tc_no_hash: 'hash-auditor-tc',
      gender: 'other',
      role: 'auditor',
      avatar_initials: 'DU',
      is_active: true,
    },
  ];

  for (const u of demoUsers) {
    await db.query(
      `INSERT INTO users (id, email, password_hash, name, surname, phone, tc_no_masked, tc_no_hash, gender, role, avatar_initials, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        u.id,
        u.email,
        u.password_hash,
        u.name,
        u.surname,
        u.phone,
        u.tc_no_masked,
        u.tc_no_hash,
        u.gender,
        u.role,
        u.avatar_initials,
        u.is_active,
      ]
    ).catch(() => {});
  }

  // 2. Seed Distinct Carriers
  const carrierMap = new Map<string, { id: string; name: string; code: string; transportType: string }>();

  for (const r of POPULAR_ROUTES) {
    if (!carrierMap.has(r.company)) {
      const code = r.company.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || 'CARRIER';
      const id = `carr-${code.toLowerCase()}`;
      carrierMap.set(r.company, {
        id,
        name: r.company,
        code,
        transportType: r.transportType,
      });

      await db.query(
        `INSERT INTO carriers (id, name, code, transport_type, rating, review_count, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [id, r.company, code, r.transportType, r.rating || 4.8, r.reviewCount || 1000, true]
      ).catch(() => {});
    }
  }

  // 3. Seed Routes and Generated Seats
  for (const r of POPULAR_ROUTES) {
    const carrier = carrierMap.get(r.company);
    const carrierId = carrier ? carrier.id : 'carr-default';

    // Parse duration "5s 30dk" -> 330 mins
    let durationMins = 300;
    const durMatch = r.duration.match(/(\d+)\s*s(?:\s*(\d+)\s*dk)?/);
    if (durMatch) {
      const hrs = parseInt(durMatch[1], 10);
      const mins = durMatch[2] ? parseInt(durMatch[2], 10) : 0;
      durationMins = hrs * 60 + mins;
    }

    await db.query(
      `INSERT INTO routes (
        id, carrier_id, transport_type, origin_city, origin_terminal,
        destination_city, destination_terminal, departure_time, arrival_time,
        duration_minutes, base_price, original_price, vehicle_type,
        seat_layout_type, service_class, gate_or_platform, badge, features, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        r.id,
        carrierId,
        r.transportType,
        r.from,
        r.fromTerminal,
        r.to,
        r.toTerminal,
        r.departureTime,
        r.arrivalTime,
        durationMins,
        r.price,
        r.originalPrice || null,
        r.vehicleType,
        r.seatLayoutType,
        r.serviceClass || 'standard',
        r.gateOrPlatform || null,
        r.badge || null,
        JSON.stringify(r.features || []),
        true,
      ]
    ).catch(() => {});

    // Generate and Insert Seats for this route
    const seats = generateCabinSeats(r.transportType, r.seatLayoutType, r.price);
    for (const s of seats) {
      const seatId = `${r.id}-${s.seatNumber}`;
      const surcharge = s.price ? Math.max(0, s.price - r.price) : 0;
      const isBooked = s.status === 'booked' || s.status === 'taken_male' || s.status === 'taken_female';
      const status = isBooked ? 'booked' : 'available';
      const genderRestriction = s.gender === 'male' || s.gender === 'female' ? s.gender : 'none';

      await db.query(
        `INSERT INTO seats (
          id, route_id, seat_number, row_num, col_num, tier, seat_type,
          price_multiplier, surcharge, status, gender_restriction,
          cabin_class, deck, is_exit_row, is_table_seat, facing_direction,
          has_power_socket, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          seatId,
          r.id,
          s.seatNumber,
          s.row || 1,
          s.col || 1,
          s.tier || 'standard',
          s.type || 'standard',
          1.0,
          surcharge,
          status,
          genderRestriction,
          s.cabinClass || 'economy',
          s.deck || 'main',
          Boolean(s.isExitRow),
          Boolean(s.isTableSeat || s.isTable),
          s.facingDirection || 'forward',
          Boolean(s.hasPowerSocket ?? true),
          1,
        ]
      ).catch(() => {});
    }
  }

  // 4. Seed Existing Mock Bookings & Tickets for PNR Lookup
  for (const tkt of SEED_TICKETS) {
    const bookingId = `book-${tkt.pnr.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const firstPassenger = tkt.passengers[0];

    await db.query(
      `INSERT INTO bookings (
        id, pnr, user_id, route_id, status, contact_email, contact_phone,
        base_price, seat_surcharges, luggage_surcharges, insurance_fee,
        service_fee, discount_amount, total_price, promo_code, qr_code_token
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        bookingId,
        tkt.pnr,
        null,
        tkt.route.id,
        tkt.status === 'refunded' ? 'refunded' : tkt.status === 'completed' ? 'completed' : 'confirmed',
        firstPassenger?.email || 'customer@bileo.com',
        firstPassenger?.phone || '0555 123 45 67',
        tkt.basePrice,
        tkt.seatTierSurcharges || 0,
        tkt.luggageSurcharges || 0,
        tkt.insuranceFee || 0,
        0,
        tkt.discountAmount || 0,
        tkt.totalPrice,
        tkt.promoCode || null,
        tkt.qrCodeValue,
      ]
    ).catch(() => {});

    // Insert Tickets
    for (const p of tkt.passengers) {
      const ticketId = `tkt-${tkt.pnr.toLowerCase()}-${String(p.seatNumber).toLowerCase()}`;
      const seatId = `${tkt.route.id}-${p.seatNumber}`;

      await db.query(
        `INSERT INTO tickets (
          id, booking_id, seat_id, seat_number, first_name, last_name,
          id_number_masked, id_number_hash, is_foreigner, nationality,
          gender, luggage_kg, has_insurance, ticket_price, ticket_status, qr_code_value
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          ticketId,
          bookingId,
          seatId,
          String(p.seatNumber),
          p.firstName,
          p.lastName,
          p.idNumber
            ? p.isForeigner
              ? `${p.idNumber.slice(0, 2)}****${p.idNumber.slice(-2)}`
              : p.idNumber.length === 11
              ? `${p.idNumber.slice(0, 3)}******${p.idNumber.slice(-2)}`
              : `*******${p.idNumber.slice(-4)}`
            : '100******46',
          'hash-seed-tckn',
          false,
          'TR',
          p.gender || 'none',
          p.luggageKg || 0,
          Boolean(p.hasInsurance),
          tkt.totalPrice,
          tkt.status === 'refunded' ? 'refunded' : 'active',
          tkt.qrCodeValue,
        ]
      ).catch(() => {});
    }

    // Insert Payment Record
    const paymentId = `pay-${bookingId}`;
    await db.query(
      `INSERT INTO payments (
        id, booking_id, payment_method, amount, currency, status,
        card_holder_masked, card_bin, card_last4, card_brand,
        gateway_transaction_id, refunded_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        paymentId,
        bookingId,
        tkt.paymentMethod === 'fast' ? 'fast' : 'credit_card',
        tkt.totalPrice,
        'TRY',
        tkt.status === 'refunded' ? 'refunded' : 'success',
        firstPassenger ? `${firstPassenger.firstName} ${firstPassenger.lastName}` : 'KART SAHIBI',
        '491200',
        tkt.cardMasked ? tkt.cardMasked.replace(/[^0-9]/g, '').slice(-4) || '4242' : '4242',
        'mastercard',
        `TX-${tkt.pnr}`,
        tkt.refundDetails ? tkt.refundDetails.refundedAmount : 0,
      ]
    ).catch(() => {});
  }
}
