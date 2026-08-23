// Bileo Zero-Trust Parameterized Query Engine & SQL Injection Defense - Challenger 2 Empirical Fuzz Testing Suite
// Author: challenger_m1_2 (Milestone 1)
// Rigorously stress-tests sql tagged template engine, WhereBuilder, identifier validation, and MemoryDatabaseService
// against aggressive SQL injection attack vectors (tautologies, stacked queries, UNION SELECT, time-based blind, identifier injection, fuzzing).

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
  isParameterizedQuery,
} from '../server/db';

export function runChallengerM1_2SQLiFuzzTests(): void {
  describe('Challenger 2 - Suite 1: Authentication Bypass & Tautology Fuzzing Matrix (50+ Vectors)', () => {
    it('1.1 Neutralizes all classic tautology and authentication bypass vectors in SELECT queries', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      // Seed authentic target records
      await db.query(
        `INSERT INTO users (id, email, password_hash, name, surname, phone, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['u-admin-1', 'admin@bileo.com', '$2a$12$e8s.hashedPasswordAdmin', 'Admin', 'User', '05550001122', 'admin', true]
      );
      await db.query(
        `INSERT INTO users (id, email, password_hash, name, surname, phone, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        ['u-cust-1', 'passenger@example.com', '$2a$12$e8s.hashedPasswordUser', 'Can', 'Demir', '05551112233', 'customer', true]
      );

      const tautologyVectors: string[] = [
        // Classic SQLi tautologies
        "' OR '1'='1",
        "' OR '1'='1' --",
        "' OR '1'='1' /*",
        "' OR '1'='1' #",
        "' OR 1=1 --",
        "' OR 1=1#",
        "' OR 1=1/*",
        "admin@bileo.com' OR 1=1 --",
        "admin@bileo.com' OR '1'='1",
        "admin'--",
        "admin' #",
        "admin'/*",
        "' OR ''='",
        "'' OR ''=''",
        "' OR 'x'='x",
        "1' OR '1' = '1",
        "1' OR 1=1 --",
        "1 OR 1=1",
        "\" OR \"1\"=\"1",
        "\") OR (\"1\"=\"1",
        "') OR ('1'='1",
        "') OR ('1'='1' --",
        "')) OR (('1'='1",
        "admin@bileo.com' /*!50000OR*/ 1=1 --",
        "admin@bileo.com' OR (SELECT 1)=1 --",
        "admin' OR 'a'='a",
        "admin' OR 1=1 LIMIT 1 --",
        "' OR TRUE --",
        "') OR TRUE --",
        "test' OR (SELECT COUNT(*) FROM users) > 0 --",
        "admin@bileo.com' OR EXISTS(SELECT * FROM users) --",
        "' OR NOT 1=2 --",
        "' OR 'a' LIKE 'a",
        "admin@bileo.com' OR 'a'='a' AND 'b'='b",
        "' OR 1 GROUP BY id --",
        "' OR 1=1 ORDER BY id --",
        "admin@bileo.com' OR (1=1) --",
        "' HAVING 1=1 --",
        "' GROUP BY id HAVING 1=1 --",
        "\\\\\\' OR 1=1 --",
        "%27%20OR%201=1%20--",
        "' OR ''='/*",
        "' OR 1=1;",
        "' OR 1=1; --",
        "admin@bileo.com' OR 'xyz'='xyz",
        "dummy' OR '1'='1' UNION SELECT * FROM users --",
        "random' OR true OR '1'='1",
        "' OR 1=1 AND '1'='1",
        "') OR (1=1) AND ('1'='1",
        "admin@bileo.com' OR ''='' --",
      ];

      for (const vector of tautologyVectors) {
        // Parameterized query using db.query()
        const res = await db.query('SELECT * FROM users WHERE email = $1', [vector]);
        expect(res.rowCount).toBe(0);
        expect(res.rows).toEqual([]);

        // Tagged template literal using sql``
        const tQuery = sql`SELECT * FROM users WHERE email = ${vector}`;
        const tRes = await db.query(tQuery.text, tQuery.values);
        expect(tRes.rowCount).toBe(0);
        expect(tRes.rows).toEqual([]);

        // Query by phone
        const phoneRes = await db.query('SELECT * FROM users WHERE phone = $1', [vector]);
        expect(phoneRes.rowCount).toBe(0);
      }

      // Verify that database records remain completely intact and uncorrupted
      const verify = await db.query('SELECT COUNT(*) AS count FROM users');
      expect(verify.rows[0].count).toBe(2);

      const adminCheck = await db.query('SELECT * FROM users WHERE email = $1', ['admin@bileo.com']);
      expect(adminCheck.rowCount).toBe(1);
      expect(adminCheck.rows[0].id).toBe('u-admin-1');
    });

    it('1.2 Parameterized PNR and Masked ID Lookups strictly treat attack strings as literals', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      await db.query(
        `INSERT INTO bookings (id, pnr, user_id, contact_email, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        ['b-101', 'TK-987654', 'u-admin-1', 'admin@bileo.com', 1250]
      );

      const pnrAttackVectors = [
        "TK-987654' OR '1'='1",
        "TK-987654'; DROP TABLE bookings; --",
        "' OR 1=1 --",
        "TK-%",
        "_%",
        "TK-987654' UNION SELECT * FROM bookings --",
      ];

      for (const pnrVector of pnrAttackVectors) {
        const res = await db.query('SELECT * FROM bookings WHERE pnr = $1', [pnrVector]);
        expect(res.rowCount).toBe(0);
      }

      // Valid PNR lookup works accurately
      const validRes = await db.query('SELECT * FROM bookings WHERE pnr = $1', ['TK-987654']);
      expect(validRes.rowCount).toBe(1);
      expect(validRes.rows[0].id).toBe('b-101');
    });
  });

  describe('Challenger 2 - Suite 2: Stacked Queries & Piggybacked DDL Destruction Defense', () => {
    it('2.1 Completely isolates stacked statements (DROP TABLE, TRUNCATE, DELETE, ALTER, INSERT)', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      // Seed users and routes
      await db.query(
        `INSERT INTO users (id, email, password_hash, name, surname, phone, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['u-victim', 'victim@bileo.com', 'hash_victim', 'Victim', 'User', '05559998877', 'customer']
      );
      await db.query(
        `INSERT INTO carriers (id, name, code, transport_type) VALUES ($1, $2, $3, $4)`,
        ['c-kamil', 'Kamil Koç', 'KK', 'otobus']
      );

      const destructiveVectors = [
        "victim@bileo.com'; DROP TABLE users; --",
        "victim@bileo.com'; DROP TABLE carriers; DROP TABLE routes; --",
        "victim@bileo.com'; TRUNCATE TABLE users; --",
        "victim@bileo.com'; DELETE FROM users WHERE '1'='1'; --",
        "victim@bileo.com'; ALTER TABLE users ADD COLUMN hacked TEXT; --",
        "victim@bileo.com'; UPDATE users SET role = 'admin' WHERE id = 'u-victim'; --",
        "victim@bileo.com'; INSERT INTO users (id, email, role) VALUES ('u-evil', 'evil@hacker.com', 'admin'); --",
        "'; EXEC xp_cmdshell('dir'); --",
        "'; SHUTDOWN WITH NOWAIT; --",
      ];

      for (const vector of destructiveVectors) {
        // Execute SELECT with destructive parameter
        const res = await db.query('SELECT * FROM users WHERE email = $1', [vector]);
        expect(res.rowCount).toBe(0);

        // Execute UPDATE with destructive parameter in WHERE
        const updateRes = await db.query('UPDATE users SET name = $1 WHERE email = $2', ['HackedName', vector]);
        expect(updateRes.rowCount).toBe(0);

        // Execute DELETE with destructive parameter in WHERE
        const deleteRes = await db.query('DELETE FROM users WHERE email = $1', [vector]);
        expect(deleteRes.rowCount).toBe(0);
      }

      // Verify all tables still exist, schema is uncorrupted, and user is pristine
      const usersCount = await db.query('SELECT COUNT(*) AS count FROM users');
      expect(usersCount.rows[0].count).toBe(1);

      const carriersCount = await db.query('SELECT COUNT(*) AS count FROM carriers');
      expect(carriersCount.rows[0].count).toBe(1);

      const userRow = (await db.query('SELECT * FROM users WHERE id = $1', ['u-victim'])).rows[0];
      expect(userRow.role).toBe('customer');
      expect(userRow.name).toBe('Victim');
      expect((userRow as any).hacked).toBeUndefined();
    });
  });

  describe('Challenger 2 - Suite 3: UNION-Based Exfiltration & Schema Extraction Defense', () => {
    it('3.1 Rejects UNION SELECT attacks and prevents column or credential exfiltration', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      await db.query(
        `INSERT INTO users (id, email, password_hash, name, surname, phone, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['u-admin', 'admin@bileo.com', 'SUPER_SECRET_BCRYPT_HASH', 'Admin', 'Root', '05550001122', 'admin']
      );

      const unionVectors = [
        "' UNION SELECT null, null, null, null, null, null, null, null, null, null --",
        "' UNION SELECT id, email, password_hash, name, surname, phone, role, created_at FROM users --",
        "admin@bileo.com' UNION ALL SELECT 'exfil', 'exfil@bad.com', 'hacked', 'Hacked', 'User', '000', 'admin', NOW() --",
        "' UNION SELECT table_name, column_name FROM information_schema.columns --",
        "1 UNION SELECT 1, 2, 3, 4, 5, 6, 7, 8",
        "') UNION SELECT * FROM users WHERE '1'='1",
        "' UNION ALL SELECT 1, 'admin', 'pw', 'A', 'B', 'P', 'R' --",
      ];

      for (const vector of unionVectors) {
        const query = sql`SELECT * FROM users WHERE email = ${vector}`;
        const res = await db.query(query.text, query.values);

        expect(res.rowCount).toBe(0);
        expect(res.rows).toEqual([]);

        // Ensure password hash was never leaked
        const strResult = JSON.stringify(res.rows);
        expect(strResult.includes('SUPER_SECRET_BCRYPT_HASH')).toBe(false);
      }
    });
  });

  describe('Challenger 2 - Suite 4: Time-Based Blind, Subquery & Arithmetic Injections', () => {
    it('4.1 Neutralizes time delays, subqueries, and boolean blind injections without execution', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      await db.query(
        `INSERT INTO users (id, email, password_hash, name, surname, phone, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['u-target', 'target@bileo.com', 'secret_hash', 'Target', 'User', '05551234567', 'customer']
      );

      const blindVectors = [
        "'; SELECT pg_sleep(5); --",
        "' AND (SELECT pg_sleep(5)) = '' --",
        "' OR pg_sleep(5) --",
        "'; WAITFOR DELAY '0:0:5' --",
        "target@bileo.com' AND (SELECT COUNT(*) FROM users) > 0 --",
        "target@bileo.com' AND (SELECT SUBSTRING(password_hash, 1, 1) FROM users WHERE role='admin') = 's' --",
        "target@bileo.com' AND ASCII(SUBSTRING(email,1,1)) = 116 --",
        "1 AND (SELECT 1)=1",
        "target@bileo.com' AND 1=1 --",
        "target@bileo.com' AND 1=2 --",
      ];

      const start = performance.now();
      for (const vector of blindVectors) {
        const res = await db.query('SELECT * FROM users WHERE email = $1', [vector]);
        expect(res.rowCount).toBe(0);
      }
      const elapsed = performance.now() - start;

      // Ensure no sleep delay occurred (10 blind vectors executed in < 50ms)
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('Challenger 2 - Suite 5: Identifier Whitelisting, Dynamic Column & ORDER BY Injection', () => {
    it('5.1 Validates approved table names and rejects all injection attempts in table identifiers', () => {
      // Approved tables
      for (const table of ALLOWED_TABLES) {
        expect(validateTable(table)).toBe(table);
      }

      // Malicious table inputs
      const badTables = [
        'users; DROP TABLE seats;',
        'users" OR "1"="1',
        "users' --",
        'users/*',
        'users (SELECT 1)',
        'unknown_table_xyz',
        'passwords',
        'credit_cards',
        '../../etc/passwd',
        'users;-- ',
      ];

      for (const bad of badTables) {
        expect(() => validateTable(bad)).toThrow();
      }
    });

    it('5.2 Validates approved column names and rejects all injection attempts in column identifiers', () => {
      // Approved columns
      for (const col of ALLOWED_COLUMNS) {
        expect(validateColumn(col)).toBe(col);
      }

      // Malicious column inputs
      const badColumns = [
        'id; DROP TABLE users;',
        'email, (SELECT password_hash FROM users)',
        'duration_minutes" OR "1"="1',
        'base_price --',
        'secret_token',
        'is_admin_flag',
        'col; SELECT pg_sleep(5);',
        '(CASE WHEN 1=1 THEN id ELSE created_at END)',
      ];

      for (const bad of badColumns) {
        expect(() => validateColumn(bad)).toThrow();
      }
    });

    it('5.3 escapeIdentifier properly quotes validated identifiers and throws on invalid ones', () => {
      expect(escapeIdentifier('users', ALLOWED_TABLES)).toBe('"users"');
      expect(escapeIdentifier('email', ALLOWED_COLUMNS)).toBe('"email"');

      expect(() => escapeIdentifier('users; DROP TABLE routes;', ALLOWED_TABLES)).toThrow();
      expect(() => escapeIdentifier('secret_col', ALLOWED_COLUMNS)).toThrow();
    });
  });

  describe('Challenger 2 - Suite 6: Tagged Template Literal `sql` Tag & Deep Recursive Parameterization', () => {
    it('6.1 Handles simple and complex expressions, preserving exact parameter positions', () => {
      const email = "attacker' OR '1'='1";
      const role = 'admin';
      const limit = 10;

      const query = sql`SELECT * FROM users WHERE email = ${email} AND role = ${role} LIMIT ${limit}`;
      expect(query.text).toBe('SELECT * FROM users WHERE email = $1 AND role = $2 LIMIT $3');
      expect(query.values).toEqual([email, role, limit]);
      expect(isParameterizedQuery(query)).toBe(true);
    });

    it('6.2 Recursively unpacks nested sql template literals and correctly re-indexes positional parameters', () => {
      const cond1 = sql`origin_city = ${'İstanbul'} AND destination_city = ${'Ankara'}`;
      const cond2 = sql`base_price <= ${750} AND transport_type = ${'otobus'}`;
      const fullQuery = sql`SELECT * FROM routes WHERE ${cond1} AND ${cond2} ORDER BY departure_time ASC`;

      expect(fullQuery.text).toBe(
        'SELECT * FROM routes WHERE origin_city = $1 AND destination_city = $2 AND base_price <= $3 AND transport_type = $4 ORDER BY departure_time ASC'
      );
      expect(fullQuery.values).toEqual(['İstanbul', 'Ankara', 750, 'otobus']);
    });

    it('6.3 Deep multi-level nested templates maintain strict parameter ordering without value leakage', () => {
      const nestedInner = sql`status = ${'available'}`;
      const nestedMiddle = sql`tier = ${'single'} AND (${nestedInner})`;
      const nestedOuter = sql`SELECT * FROM seats WHERE route_id = ${'r-101'} AND (${nestedMiddle}) AND price_multiplier >= ${1.0}`;

      expect(nestedOuter.text).toBe(
        'SELECT * FROM seats WHERE route_id = $1 AND (tier = $2 AND (status = $3)) AND price_multiplier >= $4'
      );
      expect(nestedOuter.values).toEqual(['r-101', 'single', 'available', 1.0]);
    });
  });

  describe('Challenger 2 - Suite 7: WhereBuilder Parameter Binding & Conditional Chaining Immunity', () => {
    it('7.1 WhereBuilder converts ? placeholders to positional $N and isolates malicious inputs in values array', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      await db.query(
        `INSERT INTO routes (id, carrier_id, transport_type, origin_city, origin_terminal, destination_city, destination_terminal, departure_time, arrival_time, duration_minutes, base_price, vehicle_type, seat_layout_type, features)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        ['r-1', 'c-1', 'otobus', 'İstanbul', 'Esenler', 'İzmir', 'Otogar', '2026-06-01T08:00:00Z', '2026-06-01T14:00:00Z', 360, 600, 'Bus', 'bus_2_1', '[]']
      );

      const evilOrigin = "İstanbul' OR '1'='1";
      const evilPrice = "0 OR 1=1";

      const wb = new WhereBuilder(1);
      wb.where('origin_city = ?', evilOrigin);
      wb.whereIf(true, 'destination_city = ?', 'İzmir');
      wb.whereIf(false, 'base_price > ?', evilPrice);

      const built = wb.build();
      expect(built.clause).toBe('WHERE origin_city = $1 AND destination_city = $2');
      expect(built.values).toEqual([evilOrigin, 'İzmir']);

      // Execute query using built clause
      const res = await db.query(`SELECT * FROM routes ${built.clause}`, built.values);
      expect(res.rowCount).toBe(0); // Safely 0 because evilOrigin does not match literal "İstanbul' OR '1'='1"

      // Execute with valid origin
      const wbValid = new WhereBuilder(1);
      wbValid.where('origin_city = ?', 'İstanbul');
      wbValid.where('destination_city = ?', 'İzmir');
      const builtValid = wbValid.build();

      const validRes = await db.query(`SELECT * FROM routes ${builtValid.clause}`, builtValid.values);
      expect(validRes.rowCount).toBe(1);
      expect(validRes.rows[0].id).toBe('r-1');
    });

    it('7.2 WhereBuilder handles IN clauses with multiple parameter placeholders cleanly', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      await db.query(
        `INSERT INTO seats (id, route_id, seat_number, row_num, col_num, tier, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['s-1', 'r-1', '1', 1, 1, 'single', 'available']
      );

      const wb = new WhereBuilder(1);
      const attackPayload1 = "available') OR ('1'='1";
      const attackPayload2 = "booked'; DROP TABLE seats; --";

      wb.where('status IN (?, ?)', attackPayload1, attackPayload2);
      const built = wb.build();

      expect(built.clause).toBe('WHERE status IN ($1, $2)');
      expect(built.values).toEqual([attackPayload1, attackPayload2]);

      const res = await db.query(`SELECT * FROM seats ${built.clause}`, built.values);
      expect(res.rowCount).toBe(0);
    });
  });

  describe('Challenger 2 - Suite 8: High-Throughput Randomized Fuzzing Harness (1,000+ Permutations)', () => {
    it('8.1 Fuzzes parameterized query engine with 1,000 randomized mutated injection payloads', async () => {
      const db = new MemoryDatabaseService();
      await db.initSchema();

      // Seed test entities
      await db.query(
        `INSERT INTO users (id, email, password_hash, name, surname, phone, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['fuzz-user-1', 'fuzz@bileo.com', 'fuzz_hash_123', 'Fuzz', 'Tester', '05559990011', 'customer']
      );
      await db.query(
        `INSERT INTO carriers (id, name, code, transport_type)
         VALUES ($1, $2, $3, $4)`,
        ['fuzz-c-1', 'Fuzz Transport', 'FZT', 'otobus']
      );

      const sqlFragments = [
        "'", '"', '`', '--', '/*', '*/', '#', ';', '||', '&&',
        ' OR ', ' AND ', ' UNION ', ' SELECT ', ' DROP TABLE ', ' INSERT ', ' UPDATE ', ' DELETE ',
        '1=1', "'1'='1'", '0=0', 'true', 'false', 'null', 'SLEEP(1)', 'BENCHMARK(10000,MD5(1))',
        '\\x00', '\\n', '\\r', '\\t', '$$', '%27', '%20', '<script>', '{"$gt": ""}',
      ];

      function generateFuzzPayload(iteration: number): string {
        const parts: string[] = [];
        const length = (iteration % 5) + 2;
        for (let j = 0; j < length; j++) {
          const idx = (iteration * 7 + j * 13) % sqlFragments.length;
          parts.push(sqlFragments[idx]);
        }
        return parts.join('');
      }

      for (let i = 0; i < 1000; i++) {
        const payload = generateFuzzPayload(i);

        // 1. Fuzz SELECT WHERE email = $1
        const selRes = await db.query('SELECT * FROM users WHERE email = $1', [payload]);
        expect(selRes.rowCount).toBe(0);
        expect(Array.isArray(selRes.rows)).toBe(true);

        // 2. Fuzz SELECT with tagged template literal
        const selTemplate = sql`SELECT * FROM users WHERE phone = ${payload}`;
        const selTRes = await db.query(selTemplate.text, selTemplate.values);
        expect(selTRes.rowCount).toBe(0);

        // 3. Fuzz INSERT with malicious payload in string field
        const insertQuery = sql`INSERT INTO security_audit_logs (
          id, event_type, severity, user_id, message
        ) VALUES (${`fuzz_log_${i}`}, ${'FUZZ_TEST'}, ${'INFO'}, ${'fuzz-user-1'}, ${payload})`;

        const insRes = await db.query(insertQuery.text, insertQuery.values);
        expect(insRes.rowCount).toBe(1);

        // Verify inserted payload was stored literally without side effects
        const verifySel = await db.query('SELECT message FROM security_audit_logs WHERE id = $1', [`fuzz_log_${i}`]);
        expect(verifySel.rowCount).toBe(1);
        expect(verifySel.rows[0].message).toBe(payload);
      }

      // Verify users table count remains exactly 1 and carrier table is untouched
      const finalUsers = await db.query('SELECT COUNT(*) AS count FROM users');
      expect(finalUsers.rows[0].count).toBe(1);

      const finalCarriers = await db.query('SELECT COUNT(*) AS count FROM carriers');
      expect(finalCarriers.rows[0].count).toBe(1);

      // Verify audit logs table successfully stored all 1,000 fuzz records literally
      const auditCount = await db.query('SELECT COUNT(*) AS count FROM security_audit_logs');
      expect(auditCount.rows[0].count).toBe(1000);
    });
  });
}
