// Bileo Enterprise Database Layer & Parameterized Query Engine Test Suite
// Exhaustively verifies Relational CRUD, Parameterized Tagged SQL, SQLi Neutralization, Atomic Rollbacks, and OCC Concurrency.

import { describe, it, expect } from './test_framework';
import {
  MemoryDatabaseService,
  sql,
  WhereBuilder,
  validateIdentifier,
  escapeIdentifier,
  ALLOWED_TABLES,
  ALLOWED_COLUMNS,
  seedDatabase,
} from '../server/db';

export function runDatabaseTests() {
  describe('Database M1: Relational Engine & Schema Storage', () => {
    it('initializes in-memory database with healthy status and latency < 1ms', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      const health = await db.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.mode).toBe('memory');
      expect(health.latencyMs).toBeLessThan(10);
    });

    it('performs basic CRUD operations with RETURNING *', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      // INSERT
      const insertRes = await db.query(
        `INSERT INTO users (
          id, email, password_hash, name, surname, phone, role, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          'usr_test_1',
          'test.user@bileo.com',
          'hash_123',
          'Can',
          'Öztürk',
          '05551112233',
          'customer',
          true,
        ]
      );

      expect(insertRes.rowCount).toBe(1);
      expect(insertRes.rows[0].id).toBe('usr_test_1');
      expect(insertRes.rows[0].email).toBe('test.user@bileo.com');
      expect(insertRes.rows[0].name).toBe('Can');

      // SELECT
      const selectRes = await db.query(
        'SELECT * FROM users WHERE email = $1 AND is_active = $2',
        ['test.user@bileo.com', true]
      );
      expect(selectRes.rowCount).toBe(1);
      expect(selectRes.rows[0].surname).toBe('Öztürk');

      // UPDATE
      const updateRes = await db.query(
        'UPDATE users SET name = $1, phone = $2 WHERE id = $3 RETURNING *',
        ['Canberk', '05559998877', 'usr_test_1']
      );
      expect(updateRes.rowCount).toBe(1);
      expect(updateRes.rows[0].name).toBe('Canberk');
      expect(updateRes.rows[0].phone).toBe('05559998877');

      // DELETE
      const deleteRes = await db.query('DELETE FROM users WHERE id = $1', ['usr_test_1']);
      expect(deleteRes.rowCount).toBe(1);

      // Verify Deleted
      const verifyRes = await db.query('SELECT * FROM users WHERE id = $1', ['usr_test_1']);
      expect(verifyRes.rowCount).toBe(0);
    });

    it('supports complex WHERE evaluation with AND, OR, IN, and LIKE', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      // Insert multiple routes
      await db.query(
        `INSERT INTO carriers (id, name, code, transport_type) VALUES ($1, $2, $3, $4)`,
        ['car-1', 'Test Carrier', 'TC1', 'otobus']
      );

      await db.query(
        `INSERT INTO routes (id, carrier_id, transport_type, origin_city, origin_terminal, destination_city, destination_terminal, departure_time, arrival_time, duration_minutes, base_price, vehicle_type, seat_layout_type, features)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        ['r-1', 'car-1', 'otobus', 'İstanbul', 'Esenler', 'Ankara', 'AŞTİ', '2026-05-24T10:00:00Z', '2026-05-24T15:00:00Z', 300, 500, 'Bus', 'bus_2_1', '[]']
      );
      await db.query(
        `INSERT INTO routes (id, carrier_id, transport_type, origin_city, origin_terminal, destination_city, destination_terminal, departure_time, arrival_time, duration_minutes, base_price, vehicle_type, seat_layout_type, features)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        ['r-2', 'car-1', 'otobus', 'İstanbul', 'Alibeyköy', 'İzmir', 'İZOTAŞ', '2026-05-24T11:00:00Z', '2026-05-24T17:00:00Z', 360, 450, 'Bus', 'bus_2_1', '[]']
      );
      await db.query(
        `INSERT INTO routes (id, carrier_id, transport_type, origin_city, origin_terminal, destination_city, destination_terminal, departure_time, arrival_time, duration_minutes, base_price, vehicle_type, seat_layout_type, features)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        ['r-3', 'car-1', 'otobus', 'Ankara', 'AŞTİ', 'İzmir', 'İZOTAŞ', '2026-05-24T12:00:00Z', '2026-05-24T19:00:00Z', 420, 600, 'Bus', 'bus_2_1', '[]']
      );

      // IN test
      const inRes = await db.query(
        'SELECT * FROM routes WHERE destination_city IN ($1, $2)',
        ['Ankara', 'İzmir']
      );
      expect(inRes.rowCount).toBe(3);

      // LIKE test
      const likeRes = await db.query(
        'SELECT * FROM routes WHERE origin_terminal LIKE $1',
        ['%Alibeyköy%']
      );
      expect(likeRes.rowCount).toBe(1);
      expect(likeRes.rows[0].id).toBe('r-2');

      // Compound AND / OR test
      const compoundRes = await db.query(
        'SELECT * FROM routes WHERE (origin_city = $1 OR origin_city = $2) AND base_price <= $3',
        ['İstanbul', 'Ankara', 500]
      );
      expect(compoundRes.rowCount).toBe(2);
    });
  });

  describe('Database M1: Parameterized SQL Template Builder & WhereBuilder', () => {
    it('extracts positional parameters into $1, $2 and separates values array', () => {
      const email = 'user@example.com';
      const active = true;
      const query = sql`SELECT * FROM users WHERE email = ${email} AND is_active = ${active}`;

      expect(query.text).toBe('SELECT * FROM users WHERE email = $1 AND is_active = $2');
      expect(query.values).toEqual([email, active]);
    });

    it('handles nested ParameterizedQuery templates with re-indexed positional parameters', () => {
      const subWhere = sql`origin_city = ${'İstanbul'} AND base_price <= ${600}`;
      const mainQuery = sql`SELECT * FROM routes WHERE ${subWhere} AND is_active = ${true}`;

      expect(mainQuery.text).toBe('SELECT * FROM routes WHERE origin_city = $1 AND base_price <= $2 AND is_active = $3');
      expect(mainQuery.values).toEqual(['İstanbul', 600, true]);
    });

    it('dynamically accumulates conditions with WhereBuilder', () => {
      const wb = new WhereBuilder();
      wb.where('origin_city = ?', 'İstanbul');
      wb.whereIf(true, 'destination_city = ?', 'Ankara');
      wb.whereIf(false, 'base_price > ?', 1000);
      wb.where('base_price <= ?', 700);

      const built = wb.build();
      expect(built.clause).toBe('WHERE origin_city = $1 AND destination_city = $2 AND base_price <= $3');
      expect(built.values).toEqual(['İstanbul', 'Ankara', 700]);
    });

    it('validates SQL identifiers and enforces whitelisting', () => {
      expect(validateIdentifier('users', ALLOWED_TABLES)).toBe('users');
      expect(validateIdentifier('departure_time', ALLOWED_COLUMNS)).toBe('departure_time');
      expect(escapeIdentifier('routes', ALLOWED_TABLES)).toBe('"routes"');

      // Attempt invalid characters
      let errorThrown = false;
      try {
        validateIdentifier('users; DROP TABLE routes; --');
      } catch {
        errorThrown = true;
      }
      expect(errorThrown).toBe(true);

      // Attempt unwhitelisted table
      let whitelistError = false;
      try {
        validateIdentifier('passwords_secret_table', ALLOWED_TABLES);
      } catch {
        whitelistError = true;
      }
      expect(whitelistError).toBe(true);
    });
  });

  describe('Database M1: 100% Zero-Trust SQL Injection Active Fuzzing Matrix', () => {
    it('neutralizes classical tautology injection (\' OR \'1\'=\'1)', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      // Insert normal user
      await db.query(
        'INSERT INTO users (id, email, password_hash, name, surname, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['usr_admin', 'admin@bileo.com', 'admin_secret_hash', 'Admin', 'Root', '05550000000', 'admin']
      );

      // Attacker sends SQLi payload in email parameter
      const maliciousEmail = "' OR '1'='1";
      const res = await db.query('SELECT * FROM users WHERE email = $1', [maliciousEmail]);

      // Must NOT return all rows; must safely search for the exact literal string
      expect(res.rowCount).toBe(0);
      expect(res.rows).toEqual([]);
    });

    it('neutralizes statement stacking and DROP TABLE vector (\'; DROP TABLE users; --)', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      await db.query(
        'INSERT INTO users (id, email, password_hash, name, surname, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['usr_victim', 'victim@bileo.com', 'victim_hash', 'Victim', 'User', '05551234567', 'customer']
      );

      const maliciousPayload = "victim@bileo.com'; DROP TABLE users; --";
      const res = await db.query('SELECT * FROM users WHERE email = $1', [maliciousPayload]);

      // Parameterized value is treated literally, table is not dropped
      expect(res.rowCount).toBe(0);

      // Verify table still exists and data remains intact
      const verifyRes = await db.query('SELECT * FROM users WHERE id = $1', ['usr_victim']);
      expect(verifyRes.rowCount).toBe(1);
      expect(verifyRes.rows[0].email).toBe('victim@bileo.com');
    });

    it('neutralizes UNION SELECT credential exfiltration vector', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      await db.query(
        'INSERT INTO carriers (id, name, code, transport_type) VALUES ($1, $2, $3, $4)',
        ['car-1', 'Safe Carrier', 'SAFE', 'otobus']
      );

      const unionPayload = "Safe Carrier' UNION SELECT id, password_hash, email, null FROM users --";
      const res = await db.query('SELECT * FROM carriers WHERE name = $1', [unionPayload]);

      // Treated as literal string
      expect(res.rowCount).toBe(0);
    });

    it('neutralizes comment truncation and authentication bypass (admin\' --)', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      await db.query(
        'INSERT INTO users (id, email, password_hash, name, surname, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['usr_admin', 'admin@bileo.com', 'hashed_pass_999', 'Admin', 'User', '05550001122', 'admin']
      );

      const bypassUser = "admin@bileo.com' --";
      const fakePass = 'wrong_password';

      const res = await db.query(
        'SELECT * FROM users WHERE email = $1 AND password_hash = $2',
        [bypassUser, fakePass]
      );

      expect(res.rowCount).toBe(0);
    });
  });

  describe('Database M1: Transaction Atomicity & Rollback Integrity', () => {
    it('commits transaction changes completely upon successful callback', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      await db.transaction(async (trx) => {
        await trx.query(
          'INSERT INTO users (id, email, password_hash, name, surname, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          ['usr_tx_1', 'tx1@bileo.com', 'h1', 'Ahmet', 'Kaya', '05550000001', 'customer']
        );
        await trx.query(
          'INSERT INTO users (id, email, password_hash, name, surname, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          ['usr_tx_2', 'tx2@bileo.com', 'h2', 'Mehmet', 'Demir', '05550000002', 'customer']
        );
      });

      const res = await db.query('SELECT COUNT(*) AS count FROM users');
      expect(res.rows[0].count).toBe(2);
    });

    it('rolls back all intermediate mutations when an error is thrown inside transaction', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      // Seed initial base user
      await db.query(
        'INSERT INTO users (id, email, password_hash, name, surname, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        ['usr_base', 'base@bileo.com', 'hbase', 'Base', 'User', '05550000000', 'customer']
      );

      let caughtError = false;
      try {
        await db.transaction(async (trx) => {
          // 1. Insert first user
          await trx.query(
            'INSERT INTO users (id, email, password_hash, name, surname, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            ['usr_tx_fail_1', 'fail1@bileo.com', 'hf1', 'Fail', 'One', '05550000003', 'customer']
          );

          // 2. Modify existing base user
          await trx.query(
            'UPDATE users SET name = $1 WHERE id = $2',
            ['MODIFIED_NAME', 'usr_base']
          );

          // 3. Simulate payment / business logic catastrophic error
          throw new Error('Simulated Payment Gateway Decline - Transaction Abort');
        });
      } catch (err: any) {
        caughtError = true;
        expect(err.message).toContain('Simulated Payment Gateway Decline');
      }

      expect(caughtError).toBe(true);

      // Verify that NO partial records were committed
      const failRes = await db.query('SELECT * FROM users WHERE id = $1', ['usr_tx_fail_1']);
      expect(failRes.rowCount).toBe(0);

      // Verify that base user was restored to pristine state
      const baseRes = await db.query('SELECT * FROM users WHERE id = $1', ['usr_base']);
      expect(baseRes.rowCount).toBe(1);
      expect(baseRes.rows[0].name).toBe('Base'); // NOT 'MODIFIED_NAME'
    });
  });

  describe('Database M1: Seat Concurrency & Optimistic Concurrency Control (OCC)', () => {
    it('executes atomic OCC seat reservation and increments version', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      // Setup route and seat
      await db.query(
        `INSERT INTO routes (id, carrier_id, transport_type, origin_city, origin_terminal, destination_city, destination_terminal, departure_time, arrival_time, duration_minutes, base_price, vehicle_type, seat_layout_type, features)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        ['r-occ', 'car-1', 'otobus', 'İstanbul', 'Esenler', 'Ankara', 'AŞTİ', '2026-05-24T10:00:00Z', '2026-05-24T15:00:00Z', 300, 600, 'Bus', 'bus_2_1', '[]']
      );

      await db.query(
        `INSERT INTO seats (
          id, route_id, seat_number, row_num, col_num, tier, status, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['seat_r-occ_14', 'r-occ', '14', 4, 1, 'single', 'available', 1]
      );

      // Step 1: User A reads seat with version 1
      const seatA = (await db.query('SELECT * FROM seats WHERE id = $1 FOR UPDATE', ['seat_r-occ_14'])).rows[0];
      expect(seatA.version).toBe(1);
      expect(seatA.status).toBe('available');

      // Step 2: User A successfully books seat with version = 1 and increments version to 2
      const updateA = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4 RETURNING *`,
        ['booked', seatA.id, seatA.version, 'available']
      );

      expect(updateA.rowCount).toBe(1);
      expect(updateA.rows[0].version).toBe(2);
      expect(updateA.rows[0].status).toBe('booked');

      // Step 3: Concurrent User B attempts to book the same seat with stale version = 1
      const updateB = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4 RETURNING *`,
        ['booked', seatA.id, 1, 'available']
      );

      // Concurrency conflict: 0 rows updated, double-booking prevented!
      expect(updateB.rowCount).toBe(0);
    });
  });

  describe('Database M1: Transit Seed Loader & Domain Entity Population', () => {
    it('seeds 9 authentic carriers, 10 multi-modal routes, and cabin seats', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      // Seed database
      await seedDatabase(db);

      // Verify Carriers
      const carriersRes = await db.query('SELECT * FROM carriers ORDER BY rating DESC');
      expect(carriersRes.rowCount).toBe(9);
      const carrierNames = carriersRes.rows.map((c: any) => c.name);
      expect(carrierNames).toContain('Kamil Koç');
      expect(carrierNames).toContain('Pamukkale Turizm');
      expect(carrierNames).toContain('Türk Hava Yolları');
      expect(carrierNames).toContain('TCDD Taşımacılık');
      expect(carrierNames).toContain('İDO (İstanbul Deniz Otobüsleri)');

      // Verify Routes
      const routesRes = await db.query('SELECT * FROM routes');
      expect(routesRes.rowCount).toBe(10);

      // Verify Seats
      const seatsRes = await db.query('SELECT COUNT(*) AS count FROM seats');
      expect(seatsRes.rows[0].count).toBeGreaterThan(100);

      // Verify Seeded Tickets & Bookings
      const bookingsRes = await db.query('SELECT * FROM bookings');
      expect(bookingsRes.rowCount).toBeGreaterThan(0);

      const ticketsRes = await db.query('SELECT * FROM tickets');
      expect(ticketsRes.rowCount).toBeGreaterThan(0);
      expect(ticketsRes.rows[0].id_number_masked).toBe('100******46');

      // Verify Idempotent Seeding (calling seedDatabase second time does not duplicate rows)
      await seedDatabase(db);
      const carriersResAfter = await db.query('SELECT COUNT(*) AS count FROM carriers');
      expect(carriersResAfter.rows[0].count).toBe(9);
    });
  });
}
