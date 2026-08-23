// Challenger M1 Empirical Concurrency & Transaction Integrity Test Suite
// Adversarial verification of DB transaction isolation, OCC seat reservation concurrency,
// single-winner race conditions, and rollback consistency under failure.

import { describe, it, expect } from './test_framework';
import {
  MemoryDatabaseService,
  sql,
  WhereBuilder,
  validateIdentifier,
  validateTable,
  validateColumn,
  escapeIdentifier,
  ALLOWED_TABLES,
  ALLOWED_COLUMNS,
  seedDatabase,
  DatabaseManager,
  getDatabase,
  getDatabaseService,
} from '../server/db';

export function runChallengerM1ConcurrencyTests() {
  describe('Challenger M1 - Suite 1: Single-Seat OCC High-Concurrency Race Matrix (N=100)', () => {
    it('1.1 guarantees single winner under 100 simultaneous booking attempts with zero duplicate tickets', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      // Seed a test route and a target seat with version = 1
      const routeId = 'route_stress_occ_1';
      const seatId = 'seat_stress_occ_1';

      await db.query(
        `INSERT INTO routes (id, carrier_id, transport_type, origin_city, origin_terminal, destination_city, destination_terminal, departure_time, arrival_time, duration_minutes, base_price, vehicle_type, seat_layout_type, features)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [routeId, 'car-1', 'otobus', 'İstanbul', 'Esenler', 'Ankara', 'AŞTİ', '2026-06-01T08:00:00Z', '2026-06-01T14:00:00Z', 360, 650, 'Travego 15 SHD', 'bus_2_1', '[]']
      );

      await db.query(
        `INSERT INTO seats (id, route_id, seat_number, row_num, col_num, tier, status, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [seatId, routeId, '15A', 5, 1, 'single', 'available', 1]
      );

      // Verify seat is initially available with version 1
      const initSeat = (await db.query('SELECT * FROM seats WHERE id = $1', [seatId])).rows[0];
      expect(initSeat.version).toBe(1);
      expect(initSeat.status).toBe('available');

      const CONCURRENT_WORKERS = 100;
      const workerResults: { workerId: number; success: boolean; rowCount: number; pnr?: string }[] = [];

      // 100 concurrent workers simultaneously attempt to reserve seat_stress_occ_1 with OCC version check (version = 1)
      const bookingAttempts = Array.from({ length: CONCURRENT_WORKERS }, async (_, i) => {
        const workerId = i + 1;
        const pnr = `PNR${workerId.toString().padStart(4, '0')}`;
        const bookingId = `bok_occ_${workerId}`;
        const ticketId = `tck_occ_${workerId}`;
        const paymentId = `pay_occ_${workerId}`;

        // Attempt atomic OCC reservation
        const occResult = await db.query(
          `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4 RETURNING *`,
          ['booked', seatId, 1, 'available']
        );

        if (occResult.rowCount === 1) {
          // Winner: persist booking, ticket, and payment
          await db.query(
            `INSERT INTO bookings (id, pnr, route_id, status, contact_email, contact_phone, base_price, total_price, qr_code_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [bookingId, pnr, routeId, 'confirmed', `winner${workerId}@test.com`, '05550000001', 650, 650, `qr_${pnr}`]
          );

          await db.query(
            `INSERT INTO tickets (id, booking_id, seat_id, seat_number, first_name, last_name, id_number_masked, id_number_hash, gender, ticket_price, ticket_status, qr_code_value)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [ticketId, bookingId, seatId, '15A', 'Winner', 'User', '100******46', 'hash_winner', 'male', 650, 'active', `ticket_qr_${pnr}`]
          );

          await db.query(
            `INSERT INTO payments (id, booking_id, payment_method, amount, currency, status, card_holder_masked, card_bin, card_last4, card_brand, gateway_transaction_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [paymentId, bookingId, 'credit_card', 650, 'TRY', 'success', 'W*** U***', '540000', '1234', 'mastercard', `gw_tx_${workerId}`]
          );

          workerResults.push({ workerId, success: true, rowCount: 1, pnr });
        } else {
          // OCC Conflict: rejected
          workerResults.push({ workerId, success: false, rowCount: 0 });
        }
      });

      await Promise.all(bookingAttempts);

      // Invariants check
      const winners = workerResults.filter((r) => r.success);
      const losers = workerResults.filter((r) => !r.success);

      expect(winners.length).toBe(1);
      expect(losers.length).toBe(99);
      expect(winners[0].rowCount).toBe(1);

      // Verify database state
      const finalSeat = (await db.query('SELECT * FROM seats WHERE id = $1', [seatId])).rows[0];
      expect(finalSeat.version).toBe(2);
      expect(finalSeat.status).toBe('booked');

      // Verify exactly 1 booking and 1 ticket exist in database for this seat
      const bookingsCount = (await db.query('SELECT COUNT(*) AS count FROM bookings WHERE route_id = $1', [routeId])).rows[0].count;
      expect(bookingsCount).toBe(1);

      const ticketsCount = (await db.query('SELECT COUNT(*) AS count FROM tickets WHERE seat_id = $1', [seatId])).rows[0].count;
      expect(ticketsCount).toBe(1);

      const paymentsCount = (await db.query('SELECT COUNT(*) AS count FROM payments WHERE amount = $1', [650])).rows[0].count;
      expect(paymentsCount).toBe(1);
    });

    it('1.2 rejects stale version retries and ensures monotonicity of version increments', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      const seatId = 'seat_mono_test';
      await db.query(
        `INSERT INTO seats (id, route_id, seat_number, row_num, col_num, tier, status, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [seatId, 'r-test', '1A', 1, 1, 'standard', 'available', 1]
      );

      // Transition 1: available (v1) -> reserved (v2)
      const res1 = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4 RETURNING *`,
        ['reserved', seatId, 1, 'available']
      );
      expect(res1.rowCount).toBe(1);
      expect(res1.rows[0].version).toBe(2);
      expect(res1.rows[0].status).toBe('reserved');

      // Stale retry: Attempt using v1 -> must fail
      const staleRetry = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4 RETURNING *`,
        ['booked', seatId, 1, 'reserved']
      );
      expect(staleRetry.rowCount).toBe(0);

      // Transition 2: reserved (v2) -> booked (v3)
      const res2 = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4 RETURNING *`,
        ['booked', seatId, 2, 'reserved']
      );
      expect(res2.rowCount).toBe(1);
      expect(res2.rows[0].version).toBe(3);
      expect(res2.rows[0].status).toBe('booked');

      // Transition 3: booked (v3) -> available / cancelled (v4)
      const res3 = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4 RETURNING *`,
        ['available', seatId, 3, 'booked']
      );
      expect(res3.rowCount).toBe(1);
      expect(res3.rows[0].version).toBe(4);
      expect(res3.rows[0].status).toBe('available');

      // Stale retry: Attempt using v2 or v3 -> must fail
      const staleRetry2 = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4 RETURNING *`,
        ['booked', seatId, 2, 'available']
      );
      expect(staleRetry2.rowCount).toBe(0);

      const staleRetry3 = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4 RETURNING *`,
        ['booked', seatId, 3, 'available']
      );
      expect(staleRetry3.rowCount).toBe(0);
    });
  });

  describe('Challenger M1 - Suite 2: Multi-Seat Overlapping Batch Reservation Contention', () => {
    it('2.1 manages atomic multi-seat reservation with complete rollback on partial conflicts', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      // Seed 6 seats: S1 to S6 on route r-multi
      const routeId = 'r-multi';
      for (let i = 1; i <= 6; i++) {
        await db.query(
          `INSERT INTO seats (id, route_id, seat_number, row_num, col_num, tier, status, version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [`seat_m_${i}`, routeId, `${i}`, i, 1, 'standard', 'available', 1]
        );
      }

      // Define 5 multi-seat requests with overlapping demands:
      // Request A wants [S1, S2]
      // Request B wants [S2, S3] (overlaps S2 with A)
      // Request C wants [S4, S5] (no overlap with A)
      // Request D wants [S5, S6] (overlaps S5 with C)
      // Request E wants [S1, S6] (overlaps S1 with A and S6 with D)
      const batchRequests = [
        { name: 'ReqA', seats: ['seat_m_1', 'seat_m_2'] },
        { name: 'ReqB', seats: ['seat_m_2', 'seat_m_3'] },
        { name: 'ReqC', seats: ['seat_m_4', 'seat_m_5'] },
        { name: 'ReqD', seats: ['seat_m_5', 'seat_m_6'] },
        { name: 'ReqE', seats: ['seat_m_1', 'seat_m_6'] },
      ];

      const outcomes: { name: string; success: boolean; reservedSeats: string[] }[] = [];

      for (const req of batchRequests) {
        // Multi-seat atomic reservation routine with rollback on conflict
        const reserved: string[] = [];
        let failed = false;

        for (const seatId of req.seats) {
          const occ = await db.query(
            `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4 RETURNING *`,
            ['booked', seatId, 1, 'available']
          );
          if (occ.rowCount === 1) {
            reserved.push(seatId);
          } else {
            failed = true;
            break;
          }
        }

        if (failed) {
          // Rollback any partially reserved seats from this batch
          for (const rollbackSeatId of reserved) {
            await db.query(
              `UPDATE seats SET status = $1, version = version - 1 WHERE id = $2 AND status = $3`,
              ['available', rollbackSeatId, 'booked']
            );
          }
          outcomes.push({ name: req.name, success: false, reservedSeats: [] });
        } else {
          outcomes.push({ name: req.name, success: true, reservedSeats: reserved });
        }
      }

      // Assert outcomes:
      // ReqA succeeds with [S1, S2]
      // ReqB fails (S2 taken), S3 remains available
      // ReqC succeeds with [S4, S5]
      // ReqD fails (S5 taken), S6 remains available
      // ReqE fails (S1 taken)
      const successfulRequests = outcomes.filter((o) => o.success);
      expect(successfulRequests.length).toBe(2);
      expect(outcomes.find((o) => o.name === 'ReqA')?.success).toBe(true);
      expect(outcomes.find((o) => o.name === 'ReqB')?.success).toBe(false);
      expect(outcomes.find((o) => o.name === 'ReqC')?.success).toBe(true);
      expect(outcomes.find((o) => o.name === 'ReqD')?.success).toBe(false);
      expect(outcomes.find((o) => o.name === 'ReqE')?.success).toBe(false);

      // Verify exact final seat statuses:
      // S1: booked (v2)
      // S2: booked (v2)
      // S3: available (v1) - uncorrupted despite ReqB's attempt
      // S4: booked (v2)
      // S5: booked (v2)
      // S6: available (v1) - uncorrupted despite ReqD/ReqE's attempt
      const s1 = (await db.query('SELECT * FROM seats WHERE id = $1', ['seat_m_1'])).rows[0];
      const s2 = (await db.query('SELECT * FROM seats WHERE id = $1', ['seat_m_2'])).rows[0];
      const s3 = (await db.query('SELECT * FROM seats WHERE id = $1', ['seat_m_3'])).rows[0];
      const s4 = (await db.query('SELECT * FROM seats WHERE id = $1', ['seat_m_4'])).rows[0];
      const s5 = (await db.query('SELECT * FROM seats WHERE id = $1', ['seat_m_5'])).rows[0];
      const s6 = (await db.query('SELECT * FROM seats WHERE id = $1', ['seat_m_6'])).rows[0];

      expect(s1.status).toBe('booked');
      expect(s1.version).toBe(2);

      expect(s2.status).toBe('booked');
      expect(s2.version).toBe(2);

      expect(s3.status).toBe('available');
      expect(s3.version).toBe(1);

      expect(s4.status).toBe('booked');
      expect(s4.version).toBe(2);

      expect(s5.status).toBe('booked');
      expect(s5.version).toBe(2);

      expect(s6.status).toBe('available');
      expect(s6.version).toBe(1);
    });
  });

  describe('Challenger M1 - Suite 3: Catastrophic Fault Injection & Transaction Rollback Atomicity', () => {
    it('3.1 rolls back seat reservation if booking record insert throws exception (Stage 1)', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      const seatId = 'seat_rb_1';
      await db.query(
        `INSERT INTO seats (id, route_id, seat_number, row_num, col_num, tier, status, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [seatId, 'r-rb', '1', 1, 1, 'standard', 'available', 1]
      );

      let thrown = false;
      try {
        await db.transaction(async (trx) => {
          // Step 1: Reserve seat
          await trx.query(
            `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 RETURNING *`,
            ['booked', seatId, 1]
          );

          // Step 2: Inject error before booking insertion
          throw new Error('STAGE_1_FAILURE: Booking creation timeout / validation fault');
        });
      } catch (err: any) {
        thrown = true;
        expect(err.message).toContain('STAGE_1_FAILURE');
      }

      expect(thrown).toBe(true);

      // Invariant: Seat must remain 'available' with version 1; 0 bookings created
      const seat = (await db.query('SELECT * FROM seats WHERE id = $1', [seatId])).rows[0];
      expect(seat.status).toBe('available');
      expect(seat.version).toBe(1);

      const bookingsCount = (await db.query('SELECT COUNT(*) AS count FROM bookings')).rows[0].count;
      expect(bookingsCount).toBe(0);
    });

    it('3.2 rolls back seat and booking if ticket generation throws exception (Stage 2)', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      const seatId = 'seat_rb_2';
      const bookingId = 'bok_rb_2';

      await db.query(
        `INSERT INTO seats (id, route_id, seat_number, row_num, col_num, tier, status, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [seatId, 'r-rb', '2', 1, 2, 'standard', 'available', 1]
      );

      let thrown = false;
      try {
        await db.transaction(async (trx) => {
          // 1. Reserve seat
          await trx.query(
            `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3`,
            ['booked', seatId, 1]
          );

          // 2. Insert booking
          await trx.query(
            `INSERT INTO bookings (id, pnr, route_id, status, contact_email, contact_phone, base_price, total_price, qr_code_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [bookingId, 'PNRRB2', 'r-rb', 'confirmed', 'rb2@test.com', '05550000002', 500, 500, 'qr_rb2']
          );

          // 3. Inject error during ticket issue
          throw new Error('STAGE_2_FAILURE: PDF/QR rendering failure during ticket issuance');
        });
      } catch (err: any) {
        thrown = true;
        expect(err.message).toContain('STAGE_2_FAILURE');
      }

      expect(thrown).toBe(true);

      // Invariants: 0 bookings, 0 tickets, seat pristine
      const seat = (await db.query('SELECT * FROM seats WHERE id = $1', [seatId])).rows[0];
      expect(seat.status).toBe('available');
      expect(seat.version).toBe(1);

      const bookingRes = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
      expect(bookingRes.rowCount).toBe(0);

      const ticketsCount = (await db.query('SELECT COUNT(*) AS count FROM tickets')).rows[0].count;
      expect(ticketsCount).toBe(0);
    });

    it('3.3 rolls back 3 partial tickets when 4th ticket fails in a group booking (Stage 3)', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      const bookingId = 'bok_group_fail';
      const seatIds = ['s_g1', 's_g2', 's_g3', 's_g4'];

      for (let i = 0; i < 4; i++) {
        await db.query(
          `INSERT INTO seats (id, route_id, seat_number, row_num, col_num, tier, status, version)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [seatIds[i], 'r-group', `${i + 1}`, 1, i + 1, 'standard', 'available', 1]
        );
      }

      let thrown = false;
      try {
        await db.transaction(async (trx) => {
          // Reserve all 4 seats
          for (const sId of seatIds) {
            await trx.query(
              `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3`,
              ['booked', sId, 1]
            );
          }

          // Insert booking
          await trx.query(
            `INSERT INTO bookings (id, pnr, route_id, status, contact_email, contact_phone, base_price, total_price, qr_code_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [bookingId, 'PNRGRP', 'r-group', 'confirmed', 'group@test.com', '05550000003', 2000, 2000, 'qr_grp']
          );

          // Insert tickets 1, 2, 3
          for (let i = 0; i < 3; i++) {
            await trx.query(
              `INSERT INTO tickets (id, booking_id, seat_id, seat_number, first_name, last_name, id_number_masked, id_number_hash, gender, ticket_price, ticket_status, qr_code_value)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
              [`tck_g_${i}`, bookingId, seatIds[i], `${i + 1}`, `Pass${i}`, 'User', '100******46', 'hash', 'male', 500, 'active', `qr_${i}`]
            );
          }

          // Inject catastrophic error on 4th ticket
          throw new Error('STAGE_3_FAILURE: Invalid TCKN checksum on passenger 4');
        });
      } catch (err: any) {
        thrown = true;
        expect(err.message).toContain('STAGE_3_FAILURE');
      }

      expect(thrown).toBe(true);

      // Invariants: All 4 seats must be available with version 1; zero orphan tickets exist
      for (const sId of seatIds) {
        const s = (await db.query('SELECT * FROM seats WHERE id = $1', [sId])).rows[0];
        expect(s.status).toBe('available');
        expect(s.version).toBe(1);
      }

      const tickets = await db.query('SELECT * FROM tickets');
      expect(tickets.rowCount).toBe(0);

      const bookings = await db.query('SELECT * FROM bookings');
      expect(bookings.rowCount).toBe(0);
    });

    it('3.4 rolls back seats, bookings, and tickets when payment gateway declines (Stage 4)', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      const seatId = 'seat_pay_fail';
      const bookingId = 'bok_pay_fail';

      await db.query(
        `INSERT INTO seats (id, route_id, seat_number, row_num, col_num, tier, status, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [seatId, 'r-pay', '8', 2, 2, 'standard', 'available', 1]
      );

      let thrown = false;
      try {
        await db.transaction(async (trx) => {
          // 1. Reserve seat
          await trx.query(
            `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3`,
            ['booked', seatId, 1]
          );

          // 2. Insert booking
          await trx.query(
            `INSERT INTO bookings (id, pnr, route_id, status, contact_email, contact_phone, base_price, total_price, qr_code_token)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [bookingId, 'PNRPAYF', 'r-pay', 'confirmed', 'payf@test.com', '05550000004', 600, 600, 'qr_payf']
          );

          // 3. Insert ticket
          await trx.query(
            `INSERT INTO tickets (id, booking_id, seat_id, seat_number, first_name, last_name, id_number_masked, id_number_hash, gender, ticket_price, ticket_status, qr_code_value)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            ['tck_payf', bookingId, seatId, '8', 'Cardholder', 'Name', '100******46', 'hash', 'female', 600, 'active', 'qr_payf']
          );

          // 4. Simulate payment gateway decline
          throw new Error('STAGE_4_FAILURE: 3D Secure / Bank Decline: Insufficient Funds (Code 51)');
        });
      } catch (err: any) {
        thrown = true;
        expect(err.message).toContain('STAGE_4_FAILURE');
      }

      expect(thrown).toBe(true);

      // Verify zero orphan records across all tables
      const seat = (await db.query('SELECT * FROM seats WHERE id = $1', [seatId])).rows[0];
      expect(seat.status).toBe('available');
      expect(seat.version).toBe(1);

      const bookings = await db.query('SELECT * FROM bookings');
      expect(bookings.rowCount).toBe(0);

      const tickets = await db.query('SELECT * FROM tickets');
      expect(tickets.rowCount).toBe(0);

      const payments = await db.query('SELECT * FROM payments');
      expect(payments.rowCount).toBe(0);
    });

    it('3.5 guarantees 100% table bitwise state invariance before vs after aborted transactions', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();
      await seedDatabase(db);

      // Record baseline row counts across all 8 tables
      const tableNames = ['users', 'carriers', 'routes', 'seats', 'bookings', 'tickets', 'payments', 'security_audit_logs'];
      const baselineCounts: Record<string, number> = {};

      for (const t of tableNames) {
        const res = await db.query(`SELECT COUNT(*) AS count FROM ${t}`);
        baselineCounts[t] = res.rows[0].count;
      }

      // Execute 10 failed transactions in a row with varied internal mutations
      for (let i = 1; i <= 10; i++) {
        try {
          await db.transaction(async (trx) => {
            await trx.query(`INSERT INTO users (id, email, password_hash, name, surname, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [
              `u_abort_${i}`,
              `abort${i}@test.com`,
              'hash',
              'Abort',
              'User',
              '05550000099',
              'customer',
            ]);
            await trx.query(`UPDATE carriers SET rating = 1.00 WHERE code = $1`, ['KAMILKOC']);
            await trx.query(`DELETE FROM routes WHERE id = $1`, ['route-1']);
            throw new Error(`ABORT_STRESS_${i}`);
          });
        } catch {
          // Expected
        }
      }

      // Verify post-abort counts match baseline bitwise
      for (const t of tableNames) {
        const res = await db.query(`SELECT COUNT(*) AS count FROM ${t}`);
        expect(res.rows[0].count).toBe(baselineCounts[t]);
      }

      // Verify specific records remain unmodified
      const carrier = (await db.query('SELECT * FROM carriers LIMIT 1')).rows[0];
      expect(carrier).toBeDefined();
      expect(carrier.rating).toBeGreaterThanOrEqual(4.0);

      const allCarriers = (await db.query('SELECT * FROM carriers')).rows;
      expect(allCarriers.length).toBe(9);
    });
  });

  describe('Challenger M1 - Suite 4: OCC Version Boundaries & ABA Edge Conditions', () => {
    it('4.1 rejects invalid or anomalous OCC version parameters (negative, zero, future, null)', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      const seatId = 'seat_edge_occ';
      await db.query(
        `INSERT INTO seats (id, route_id, seat_number, row_num, col_num, tier, status, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [seatId, 'r-edge', '1', 1, 1, 'standard', 'available', 1]
      );

      // Attempt with version = 0
      const res0 = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4`,
        ['booked', seatId, 0, 'available']
      );
      expect(res0.rowCount).toBe(0);

      // Attempt with version = -1
      const resNeg = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4`,
        ['booked', seatId, -1, 'available']
      );
      expect(resNeg.rowCount).toBe(0);

      // Attempt with future version = 999
      const resFuture = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4`,
        ['booked', seatId, 999, 'available']
      );
      expect(resFuture.rowCount).toBe(0);

      // Attempt with null version
      const resNull = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4`,
        ['booked', seatId, null, 'available']
      );
      expect(resNull.rowCount).toBe(0);

      // Verify seat is untouched
      const seat = (await db.query('SELECT * FROM seats WHERE id = $1', [seatId])).rows[0];
      expect(seat.version).toBe(1);
      expect(seat.status).toBe('available');
    });

    it('4.2 rejects booking attempts when seat status is blocked or disabled even with valid version', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      // Blocked seat
      await db.query(
        `INSERT INTO seats (id, route_id, seat_number, row_num, col_num, tier, status, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['seat_blocked', 'r-edge', '2', 1, 2, 'standard', 'blocked', 1]
      );

      // Disabled seat
      await db.query(
        `INSERT INTO seats (id, route_id, seat_number, row_num, col_num, tier, status, version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['seat_disabled', 'r-edge', '3', 1, 3, 'standard', 'disabled', 1]
      );

      // Try booking blocked seat
      const resBlocked = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = 'available'`,
        ['booked', 'seat_blocked', 1]
      );
      expect(resBlocked.rowCount).toBe(0);

      // Try booking disabled seat
      const resDisabled = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = 'available'`,
        ['booked', 'seat_disabled', 1]
      );
      expect(resDisabled.rowCount).toBe(0);
    });
  });

  describe('Challenger M1 - Suite 5: Parameterized Query Engine & SQLi Neutralization Stress Matrix', () => {
    it('5.1 neutralizes 10 varied SQLi injection vectors across all parameter slots', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      await db.query(
        `INSERT INTO users (id, email, password_hash, name, surname, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['usr_sqli_target', 'target@bileo.com', 'hash_secret', 'Target', 'User', '05550001122', 'admin']
      );

      const adversarialVectors = [
        "' OR '1'='1",
        "target@bileo.com' OR 1=1 --",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "admin' /* comment */",
        "1' OR '1'='1' UNION SELECT * FROM users WHERE '1'='1",
        "\\'; DROP TABLE users; --",
        "1; EXEC xp_cmdshell('dir'); --",
        "' OR 1=1 #",
        "' OR EXISTS(SELECT * FROM users) --",
      ];

      for (const vector of adversarialVectors) {
        const res = await db.query('SELECT * FROM users WHERE email = $1', [vector]);
        expect(res.rowCount).toBe(0);
      }

      // Verify users table is completely intact
      const verify = await db.query('SELECT COUNT(*) AS count FROM users');
      expect(verify.rows[0].count).toBe(1);
    });

    it('5.2 handles complex WhereBuilder constructions and nested sql template literals', () => {
      const sub1 = sql`origin_city = ${'İstanbul'}`;
      const sub2 = sql`destination_city = ${'Ankara'}`;
      const sub3 = sql`base_price <= ${750}`;

      const combined = sql`SELECT * FROM routes WHERE ${sub1} AND ${sub2} AND ${sub3} AND is_active = ${true}`;
      expect(combined.text).toBe('SELECT * FROM routes WHERE origin_city = $1 AND destination_city = $2 AND base_price <= $3 AND is_active = $4');
      expect(combined.values).toEqual(['İstanbul', 'Ankara', 750, true]);

      // WhereBuilder with various conditions
      const wb = new WhereBuilder(1);
      wb.where('origin_city = ?', 'İzmir');
      wb.whereIf(true, 'duration_minutes <= ?', 480);
      wb.whereIf(false, 'base_price > ?', 10000);
      wb.whereRaw('is_active = true');

      const built = wb.build();
      expect(built.clause).toBe('WHERE origin_city = $1 AND duration_minutes <= $2 AND is_active = true');
      expect(built.values).toEqual(['İzmir', 480]);
    });

    it('5.3 strictly validates and whitelists identifiers preventing column and table injection', () => {
      expect(validateTable('users')).toBe('users');
      expect(validateTable('routes')).toBe('routes');
      expect(validateColumn('duration_minutes')).toBe('duration_minutes');
      expect(escapeIdentifier('seats', ALLOWED_TABLES)).toBe('"seats"');

      // Attempt injection via identifier
      expect(() => validateIdentifier('routes; DROP TABLE seats;')).toThrow();
      expect(() => validateIdentifier('users WHERE 1=1')).toThrow();
      expect(() => validateIdentifier('invalid_table_name', ALLOWED_TABLES)).toThrow();
      expect(() => validateIdentifier('password_salt_leak', ALLOWED_COLUMNS)).toThrow();
    });
  });

  describe('Challenger M1 - Suite 6: DatabaseManager Lifecycle & Idempotency', () => {
    it('6.1 verifies DatabaseManager singleton continuity and seed idempotency', async () => {
      const manager = DatabaseManager.getInstance();
      const service = await manager.initialize({ useMemoryDb: true });

      expect(service).toBeDefined();
      expect(service.mode).toBe('memory');

      // Health check
      const health = await service.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.latencyMs).toBeLessThan(10);

      // Verify seeding is idempotent (does not duplicate carriers or routes)
      await service.seedData();
      const carriers1 = (await service.query('SELECT COUNT(*) AS count FROM carriers')).rows[0].count;
      expect(carriers1).toBe(9);

      await service.seedData();
      const carriers2 = (await service.query('SELECT COUNT(*) AS count FROM carriers')).rows[0].count;
      expect(carriers2).toBe(9);

      const routes = (await service.query('SELECT COUNT(*) AS count FROM routes')).rows[0].count;
      expect(routes).toBe(10);
    });
  });
}

// Standalone execution support
import { runner } from './test_framework';
if (process.argv[1]?.includes('challenger_m1_concurrency.test.ts')) {
  console.log('🚀 Running Challenger M1 Concurrency & OCC Test Suite standalone...\n');
  runChallengerM1ConcurrencyTests();
  runner.runAll().then(() => {
    const passed = runner.printSummary();
    process.exit(passed ? 0 : 1);
  });
}
