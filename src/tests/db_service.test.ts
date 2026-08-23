// Bileo Database Service Unit & Integration Test Suite (Milestone 1)
// Comprehensive testing for Relational DB, Dual-Mode Engine, Parameterized Queries, OCC Concurrency, and Transactions.

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
  initDatabase,
  closeDatabase,
  isParameterizedQuery,
} from '../server/db';

export function runDbServiceTests() {
  describe('Database Service: Initialization, Health Check & Schema Verification', () => {
    it('initializes in-memory database and verifies healthy status with low latency', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      const health = await db.healthCheck();
      expect(health.status).toBe('healthy');
      expect(health.mode).toBe('memory');
      expect(health.latencyMs).toBeLessThan(10);
    });

    it('verifies schema table isolation across all 8 relational tables', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      const tableNames = [
        'users',
        'carriers',
        'routes',
        'seats',
        'bookings',
        'tickets',
        'payments',
        'security_audit_logs',
      ];

      for (const table of tableNames) {
        const res = await db.query(`SELECT COUNT(*) AS count FROM ${table}`);
        expect(res.rowCount).toBe(1);
        expect(res.rows[0].count).toBe(0);
      }
    });

    it('verifies seed data population across all 8 tables', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();
      await seedDatabase(db);

      // 1. Users
      const usersRes = await db.query('SELECT * FROM users');
      expect(usersRes.rowCount).toBeGreaterThanOrEqual(4);
      const adminUser = usersRes.rows.find((u: any) => u.role === 'admin');
      expect(adminUser).toBeDefined();
      expect(adminUser.email).toBe('admin@bileo.com');

      // 2. Carriers
      const carriersRes = await db.query('SELECT * FROM carriers');
      expect(carriersRes.rowCount).toBe(9);

      // 3. Routes
      const routesRes = await db.query('SELECT * FROM routes');
      expect(routesRes.rowCount).toBe(10);

      // 4. Seats
      const seatsRes = await db.query('SELECT COUNT(*) AS count FROM seats');
      expect(seatsRes.rows[0].count).toBeGreaterThan(100);

      // 5. Bookings
      const bookingsRes = await db.query('SELECT * FROM bookings');
      expect(bookingsRes.rowCount).toBeGreaterThan(0);

      // 6. Tickets
      const ticketsRes = await db.query('SELECT * FROM tickets');
      expect(ticketsRes.rowCount).toBeGreaterThan(0);
      expect(ticketsRes.rows[0].id_number_masked).toBe('100******46');

      // 7. Payments
      const paymentsRes = await db.query('SELECT * FROM payments');
      expect(paymentsRes.rowCount).toBeGreaterThan(0);
      expect(paymentsRes.rows[0].status).toBe('success');

      // 8. Security Audit Logs - write a log and verify
      await db.query(
        `INSERT INTO security_audit_logs (
          id, event_type, severity, user_id, ip_address, endpoint, http_method, status_code, metadata, message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          'sec_init_1',
          'SYSTEM_INITIALIZED',
          'INFO',
          'usr-admin-1',
          '127.0.0.1',
          '/api/health',
          'GET',
          200,
          JSON.stringify({ mode: 'memory' }),
          'System initialized in test environment',
        ]
      );

      const logsRes = await db.query('SELECT * FROM security_audit_logs WHERE event_type = $1', ['SYSTEM_INITIALIZED']);
      expect(logsRes.rowCount).toBe(1);
      expect(logsRes.rows[0].id).toBe('sec_init_1');
    });
  });

  describe('Database Service: Parameterized Queries & Tagged SQL Builder', () => {
    it('constructs parameterized queries with positional $N parameters and values array', () => {
      const email = 'user@example.com';
      const role = 'customer';
      const query = sql`SELECT * FROM users WHERE email = ${email} AND role = ${role}`;

      expect(query.text).toBe('SELECT * FROM users WHERE email = $1 AND role = $2');
      expect(query.values).toEqual([email, role]);
      expect(isParameterizedQuery(query)).toBe(true);
    });

    it('correctly handles nested sql template interpolations', () => {
      const condition = sql`status = ${'available'} AND tier = ${'single'}`;
      const fullQuery = sql`SELECT * FROM seats WHERE ${condition} AND route_id = ${'r-101'}`;

      expect(fullQuery.text).toBe('SELECT * FROM seats WHERE status = $1 AND tier = $2 AND route_id = $3');
      expect(fullQuery.values).toEqual(['available', 'single', 'r-101']);
    });

    it('dynamically accumulates conditions with WhereBuilder and handles empty state', () => {
      const emptyWb = new WhereBuilder();
      expect(emptyWb.build()).toEqual({ clause: '', values: [] });

      const wb = new WhereBuilder(1);
      wb.where('origin_city = ?', 'İstanbul');
      wb.whereIf(true, 'transport_type = ?', 'otobus');
      wb.whereIf(false, 'base_price > ?', 5000);
      wb.whereRaw('is_active = true');

      const built = wb.build();
      expect(built.clause).toBe('WHERE origin_city = $1 AND transport_type = $2 AND is_active = true');
      expect(built.values).toEqual(['İstanbul', 'otobus']);
    });

    it('enforces strict identifier validation and escaping', () => {
      expect(validateTable('routes')).toBe('routes');
      expect(validateColumn('duration_minutes')).toBe('duration_minutes');
      expect(escapeIdentifier('users', ALLOWED_TABLES)).toBe('"users"');

      // Reject invalid chars
      expect(() => validateIdentifier('routes; DROP TABLE users;')).toThrow();
      expect(() => validateIdentifier('routes" OR "1"="1')).toThrow();
      expect(() => validateIdentifier('unknown_table_123', ALLOWED_TABLES)).toThrow();
      expect(() => validateIdentifier('secret_column', ALLOWED_COLUMNS)).toThrow();
    });

    it('neutralizes adversarial SQL injection vectors completely', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      await db.query(
        `INSERT INTO users (id, email, password_hash, name, surname, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['u-1', 'admin@bileo.com', 'admin_hash_999', 'Admin', 'User', '05550001122', 'admin']
      );

      const sqliVectors = [
        "' OR '1'='1",
        "admin@bileo.com' OR 1=1 --",
        "admin@bileo.com'; DROP TABLE users; --",
        "admin@bileo.com' UNION SELECT * FROM users --",
        "' OR ''='",
      ];

      for (const vector of sqliVectors) {
        const res = await db.query('SELECT * FROM users WHERE email = $1', [vector]);
        expect(res.rowCount).toBe(0);
        expect(res.rows).toEqual([]);
      }

      // Verify table is untouched
      const verify = await db.query('SELECT COUNT(*) AS count FROM users');
      expect(verify.rows[0].count).toBe(1);
    });
  });

  describe('Database Service: Transaction Isolation & Rollback Integrity', () => {
    it('commits multiple relational operations atomically', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      await db.transaction(async (trx) => {
        await trx.query(
          `INSERT INTO carriers (id, name, code, transport_type) VALUES ($1, $2, $3, $4)`,
          ['c-tx', 'Transaction Carrier', 'TXC', 'otobus']
        );
        await trx.query(
          `INSERT INTO routes (id, carrier_id, transport_type, origin_city, origin_terminal, destination_city, destination_terminal, departure_time, arrival_time, duration_minutes, base_price, vehicle_type, seat_layout_type, features)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          ['r-tx', 'c-tx', 'otobus', 'İstanbul', 'Esenler', 'Ankara', 'AŞTİ', '2026-05-24T10:00:00Z', '2026-05-24T15:00:00Z', 300, 500, 'Bus', 'bus_2_1', '[]']
        );
      });

      const carrierCheck = await db.query('SELECT * FROM carriers WHERE id = $1', ['c-tx']);
      expect(carrierCheck.rowCount).toBe(1);

      const routeCheck = await db.query('SELECT * FROM routes WHERE id = $1', ['r-tx']);
      expect(routeCheck.rowCount).toBe(1);
    });

    it('rolls back all changes when an exception is thrown in transaction', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      await db.query(
        `INSERT INTO users (id, email, password_hash, name, surname, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['u-existing', 'existing@bileo.com', 'h1', 'Existing', 'User', '05551112233', 'customer']
      );

      let caught = false;
      try {
        await db.transaction(async (trx) => {
          // 1. Insert new user
          await trx.query(
            `INSERT INTO users (id, email, password_hash, name, surname, phone, role) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            ['u-temp', 'temp@bileo.com', 'h2', 'Temp', 'User', '05554445566', 'customer']
          );

          // 2. Update existing user
          await trx.query('UPDATE users SET name = $1 WHERE id = $2', ['MODIFIED', 'u-existing']);

          // 3. Throw catastrophic error
          throw new Error('Simulated failure during checkout/payment step');
        });
      } catch (err: any) {
        caught = true;
        expect(err.message).toContain('Simulated failure');
      }

      expect(caught).toBe(true);

      // Verify temp user was NOT saved
      const tempCheck = await db.query('SELECT * FROM users WHERE id = $1', ['u-temp']);
      expect(tempCheck.rowCount).toBe(0);

      // Verify existing user was restored
      const existingCheck = await db.query('SELECT * FROM users WHERE id = $1', ['u-existing']);
      expect(existingCheck.rowCount).toBe(1);
      expect(existingCheck.rows[0].name).toBe('Existing');
    });
  });

  describe('Database Service: Optimistic Concurrency Control (OCC) & Row Locking', () => {
    it('prevents double booking via OCC version checking and increment', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      // Seed a seat with version = 1
      await db.query(
        `INSERT INTO seats (
          id, route_id, seat_number, row_num, col_num, tier, status, version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['seat_occ_test', 'route-1', '12', 3, 2, 'standard', 'available', 1]
      );

      // User 1 reads seat version = 1
      const seat = (await db.query('SELECT * FROM seats WHERE id = $1 FOR UPDATE', ['seat_occ_test'])).rows[0];
      expect(seat.version).toBe(1);
      expect(seat.status).toBe('available');

      // User 1 books seat with OCC update
      const book1 = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4 RETURNING *`,
        ['booked', seat.id, seat.version, 'available']
      );

      expect(book1.rowCount).toBe(1);
      expect(book1.rows[0].version).toBe(2);
      expect(book1.rows[0].status).toBe('booked');

      // User 2 tries to book seat with old version 1 or status 'available'
      const book2 = await db.query(
        `UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3 AND status = $4 RETURNING *`,
        ['booked', seat.id, 1, 'available']
      );

      // OCC conflict: 0 rows updated
      expect(book2.rowCount).toBe(0);

      // Final seat state
      const finalSeat = (await db.query('SELECT * FROM seats WHERE id = $1', ['seat_occ_test'])).rows[0];
      expect(finalSeat.version).toBe(2);
      expect(finalSeat.status).toBe('booked');
    });
  });

  describe('Database Service: DatabaseManager Singleton & Lifecyle', () => {
    it('retrieves singleton database service and performs auto-initialization', async () => {
      const manager = DatabaseManager.getInstance();
      const service = await manager.initialize({ useMemoryDb: true });

      expect(service).toBeDefined();
      expect(service.mode).toBe('memory');

      const service2 = manager.getService();
      expect(service2).toBe(service);

      const health = await service.healthCheck();
      expect(health.status).toBe('healthy');

      // Helper function test
      const dbInstance = await getDatabase();
      expect(dbInstance).toBe(service);

      await closeDatabase();
    });
  });
}
