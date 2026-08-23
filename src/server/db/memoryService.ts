// Bileo In-Memory Relational Database Service & Query Engine
// Pure TypeScript relational SQL execution engine with transaction snapshot isolation and OCC concurrency controls.

import {
  IDatabaseService,
  ITransactionClient,
  QueryResult,
  UserRow,
  CarrierRow,
  RouteRow,
  SeatRow,
  BookingRow,
  TicketRow,
  PaymentRow,
  SecurityAuditLogRow,
} from './types';
import { seedDatabase } from './seedLoader';

export class MemoryDatabaseService implements IDatabaseService {
  public readonly mode: 'memory' = 'memory';

  // Table stores indexed by primary key
  private tables = {
    users: new Map<string, UserRow>(),
    carriers: new Map<string, CarrierRow>(),
    routes: new Map<string, RouteRow>(),
    seats: new Map<string, SeatRow>(),
    bookings: new Map<string, BookingRow>(),
    tickets: new Map<string, TicketRow>(),
    payments: new Map<string, PaymentRow>(),
    security_audit_logs: new Map<string, SecurityAuditLogRow>(),
  };

  constructor() {
    this.initTables();
  }

  private initTables(): void {
    this.tables = {
      users: new Map<string, UserRow>(),
      carriers: new Map<string, CarrierRow>(),
      routes: new Map<string, RouteRow>(),
      seats: new Map<string, SeatRow>(),
      bookings: new Map<string, BookingRow>(),
      tickets: new Map<string, TicketRow>(),
      payments: new Map<string, PaymentRow>(),
      security_audit_logs: new Map<string, SecurityAuditLogRow>(),
    };
  }

  /**
   * Deep clone table stores for transaction snapshot isolation
   */
  private cloneTables(): typeof this.tables {
    const clone = {
      users: new Map<string, UserRow>(),
      carriers: new Map<string, CarrierRow>(),
      routes: new Map<string, RouteRow>(),
      seats: new Map<string, SeatRow>(),
      bookings: new Map<string, BookingRow>(),
      tickets: new Map<string, TicketRow>(),
      payments: new Map<string, PaymentRow>(),
      security_audit_logs: new Map<string, SecurityAuditLogRow>(),
    };

    for (const [key, map] of Object.entries(this.tables) as [keyof typeof this.tables, Map<string, any>][]) {
      for (const [id, row] of map.entries()) {
        clone[key].set(id, JSON.parse(JSON.stringify(row)));
      }
    }

    return clone;
  }

  /**
   * Execute a SQL query with parameter substitution
   */
  async query<T = any>(sqlText: string, params: any[] = []): Promise<QueryResult<T>> {
    return this.executeOnTables<T>(this.tables, sqlText, params);
  }

  /**
   * Execute callback in an atomic transaction with snapshot isolation
   */
  async transaction<T>(callback: (client: ITransactionClient) => Promise<T>): Promise<T> {
    // 1. Take transaction snapshot
    const snapshot = this.cloneTables();

    // 2. Wrap client operating on snapshot
    const trxClient: ITransactionClient = {
      query: async <R = any>(sqlText: string, params: any[] = []): Promise<QueryResult<R>> => {
        return this.executeOnTables<R>(snapshot, sqlText, params);
      },
    };

    try {
      const result = await callback(trxClient);
      // 3. Commit snapshot to live tables atomically
      this.tables = snapshot;
      return result;
    } catch (err) {
      // 4. Rollback: snapshot is discarded, live tables remain pristine
      throw err;
    }
  }

  /**
   * Health check returning status and latency
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; mode: string; latencyMs: number; error?: string }> {
    return {
      status: 'healthy',
      mode: 'memory',
      latencyMs: 0.05,
    };
  }

  /**
   * Reset / Initialize schema tables
   */
  async initSchema(): Promise<void> {
    this.initTables();
  }

  /**
   * Seed mock transport dataset
   */
  async seedData(): Promise<void> {
    await seedDatabase(this);
  }

  /**
   * Close / Clean up resources
   */
  async close(): Promise<void> {
    this.initTables();
  }

  // ==========================================================================
  // IN-MEMORY SQL RELATIONAL INTERPRETER
  // ==========================================================================

  private executeOnTables<T>(
    tables: typeof this.tables,
    sqlRaw: string,
    params: any[] = []
  ): QueryResult<T> {
    const rawTrimmed = sqlRaw.trim().replace(/;+$/, '');
    if (!rawTrimmed) {
      return { rows: [], rowCount: 0, command: 'EMPTY' };
    }

    // Replace $1, $2 with corresponding parameter values or internal tokens
    const command = rawTrimmed.split(/\s+/)[0].toUpperCase();

    if (command === 'SELECT') {
      return this.handleSelect<T>(tables, rawTrimmed, params);
    } else if (command === 'INSERT') {
      return this.handleInsert<T>(tables, rawTrimmed, params);
    } else if (command === 'UPDATE') {
      return this.handleUpdate<T>(tables, rawTrimmed, params);
    } else if (command === 'DELETE') {
      return this.handleDelete<T>(tables, rawTrimmed, params);
    } else if (command === 'CREATE' || command === 'DROP' || command === 'ALTER' || command === 'BEGIN' || command === 'COMMIT' || command === 'ROLLBACK') {
      return { rows: [], rowCount: 0, command };
    }

    throw new Error(`Unsupported SQL command: "${command}" in query: ${sqlRaw}`);
  }

  // --------------------------------------------------------------------------
  // 1. SELECT HANDLER
  // --------------------------------------------------------------------------

  private handleSelect<T>(tables: typeof this.tables, sql: string, params: any[]): QueryResult<T> {
    // Check for constant SELECT e.g. "SELECT 1 AS healthy, CURRENT_TIMESTAMP AS now"
    if (!/\bFROM\b/i.test(sql)) {
      const row: any = {};
      if (/1\s+AS\s+healthy/i.test(sql)) {
        row.healthy = 1;
      }
      if (/CURRENT_TIMESTAMP\s+AS\s+now/i.test(sql)) {
        row.now = new Date().toISOString();
      }
      return { rows: [row as T], rowCount: 1, command: 'SELECT' };
    }

    // Parse SELECT [cols] FROM [table] [WHERE ...] [ORDER BY ...] [LIMIT ...] [OFFSET ...]
    const fromMatch = sql.match(/\bFROM\s+([a-zA-Z0-9_]+)/i);
    if (!fromMatch) {
      throw new Error(`Malformed SELECT query, missing FROM: ${sql}`);
    }

    const tableName = fromMatch[1].toLowerCase() as keyof typeof tables;
    const tableMap = (tables as any)[tableName] as Map<string, any> | undefined;
    if (!tableMap) {
      throw new Error(`Unknown table in in-memory database: "${tableName}"`);
    }

    // Extract columns projection
    const selectMatch = sql.match(/^\s*SELECT\s+(.+?)\s+\bFROM\b/is);
    const colsString = selectMatch ? selectMatch[1].trim() : '*';

    // Get all rows
    let rows: any[] = [];
    tableMap.forEach((r) => rows.push(JSON.parse(JSON.stringify(r))));


    // Handle WHERE clause
    const whereMatch = sql.match(/\bWHERE\s+(.+?)(?=\s+\bORDER\s+BY\b|\s+\bLIMIT\b|\s+\bOFFSET\b|\s+\bFOR\s+UPDATE\b|$)/is);
    if (whereMatch) {
      const whereCondition = whereMatch[1].trim();
      rows = rows.filter((row) => this.evaluateWhere(whereCondition, row, params));
    }

    // Handle ORDER BY clause
    const orderMatch = sql.match(/\bORDER\s+BY\s+(.+?)(?=\s+\bLIMIT\b|\s+\bOFFSET\b|\s+\bFOR\s+UPDATE\b|$)/is);
    if (orderMatch) {
      const orderClauses = orderMatch[1].split(',').map((s) => s.trim());
      rows.sort((a, b) => {
        for (const clause of orderClauses) {
          const parts = clause.split(/\s+/);
          const colName = parts[0].toLowerCase();
          const direction = parts[1] && parts[1].toUpperCase() === 'DESC' ? -1 : 1;

          let valA = a[colName];
          let valB = b[colName];

          if (valA === undefined) valA = null;
          if (valB === undefined) valB = null;

          if (valA < valB) return -1 * direction;
          if (valA > valB) return 1 * direction;
        }
        return 0;
      });
    }

    // Handle OFFSET
    const offsetMatch = sql.match(/\bOFFSET\s+(\d+|\$\d+)/i);
    if (offsetMatch) {
      let offset = 0;
      if (offsetMatch[1].startsWith('$')) {
        const paramIdx = parseInt(offsetMatch[1].slice(1), 10) - 1;
        offset = parseInt(params[paramIdx], 10) || 0;
      } else {
        offset = parseInt(offsetMatch[1], 10) || 0;
      }
      rows = rows.slice(offset);
    }

    // Handle LIMIT
    const limitMatch = sql.match(/\bLIMIT\s+(\d+|\$\d+)/i);
    if (limitMatch) {
      let limit = rows.length;
      if (limitMatch[1].startsWith('$')) {
        const paramIdx = parseInt(limitMatch[1].slice(1), 10) - 1;
        limit = parseInt(params[paramIdx], 10);
      } else {
        limit = parseInt(limitMatch[1], 10);
      }
      rows = rows.slice(0, limit);
    }

    // Handle Aggregates e.g. COUNT(*)
    if (/^\s*COUNT\s*\(\s*(\*|[a-zA-Z0-9_]+)\s*\)\s*(AS\s+([a-zA-Z0-9_]+))?/i.test(colsString)) {
      const countMatch = colsString.match(/^\s*COUNT\s*\(\s*(\*|[a-zA-Z0-9_]+)\s*\)\s*(AS\s+([a-zA-Z0-9_]+))?/i);
      const alias = countMatch && countMatch[3] ? countMatch[3] : 'count';
      const aggRow: any = {};
      aggRow[alias] = rows.length;
      return { rows: [aggRow as T], rowCount: 1, command: 'SELECT' };
    }

    // Project columns
    if (colsString !== '*') {
      const projectionFields = colsString.split(',').map((c) => c.trim());
      rows = rows.map((row) => {
        const projected: any = {};
        for (const col of projectionFields) {
          const aliasMatch = col.match(/^(.+?)\s+AS\s+(.+)$/i);
          if (aliasMatch) {
            const rawCol = aliasMatch[1].trim().toLowerCase();
            const alias = aliasMatch[2].trim();
            projected[alias] = row[rawCol];
          } else {
            const colName = col.toLowerCase();
            projected[colName] = row[colName];
          }
        }
        return projected;
      });
    }

    return { rows: rows as T[], rowCount: rows.length, command: 'SELECT' };
  }

  // --------------------------------------------------------------------------
  // 2. INSERT HANDLER
  // --------------------------------------------------------------------------

  private handleInsert<T>(tables: typeof this.tables, sql: string, params: any[]): QueryResult<T> {
    // Parse INSERT INTO [table] (cols...) VALUES (vals...) [RETURNING *]
    const match = sql.match(/^\s*INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\((.+?)\)\s*VALUES\s*\((.+?)\)(?:\s+RETURNING\s+(.+))?$/is);
    if (!match) {
      throw new Error(`Malformed INSERT statement: ${sql}`);
    }

    const tableName = match[1].toLowerCase() as keyof typeof tables;
    const tableMap = (tables as any)[tableName] as Map<string, any> | undefined;
    if (!tableMap) {
      throw new Error(`Unknown table in in-memory database: "${tableName}"`);
    }

    const cols = match[2].split(',').map((c) => c.trim().toLowerCase());
    const valPlaceholders = match[3].split(',').map((v) => v.trim());
    const returningClause = match[4]?.trim();

    const newRow: any = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (tableName === 'seats') {
      newRow.version = 1;
    }

    for (let i = 0; i < cols.length; i++) {
      const colName = cols[i];
      const placeholder = valPlaceholders[i];

      if (!placeholder) continue;

      let value: any;
      if (placeholder.startsWith('$')) {
        const paramIndex = parseInt(placeholder.slice(1), 10) - 1;
        value = params[paramIndex];
      } else if (/^'.*'$/.test(placeholder)) {
        value = placeholder.slice(1, -1).replace(/''/g, "'");
      } else if (/^-?\d+(\.\d+)?$/.test(placeholder)) {
        value = Number(placeholder);
      } else if (/^true$/i.test(placeholder)) {
        value = true;
      } else if (/^false$/i.test(placeholder)) {
        value = false;
      } else if (/^null$/i.test(placeholder)) {
        value = null;
      } else if (/^CURRENT_TIMESTAMP$/i.test(placeholder) || /^NOW\(\)$/i.test(placeholder)) {
        value = new Date().toISOString();
      } else {
        value = placeholder;
      }

      newRow[colName] = value;
    }

    if (!newRow.id) {
      newRow.id = `${tableName}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    tableMap.set(newRow.id, newRow);

    const insertedRows = returningClause ? [JSON.parse(JSON.stringify(newRow))] : [];
    return { rows: insertedRows as T[], rowCount: 1, command: 'INSERT' };
  }

  // --------------------------------------------------------------------------
  // 3. UPDATE HANDLER
  // --------------------------------------------------------------------------

  private handleUpdate<T>(tables: typeof this.tables, sql: string, params: any[]): QueryResult<T> {
    // Parse UPDATE [table] SET col1 = val1, col2 = val2 ... [WHERE ...] [RETURNING ...]
    const match = sql.match(/^\s*UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+?))?(?:\s+RETURNING\s+(.+))?$/is);
    if (!match) {
      throw new Error(`Malformed UPDATE statement: ${sql}`);
    }

    const tableName = match[1].toLowerCase() as keyof typeof tables;
    const tableMap = (tables as any)[tableName] as Map<string, any> | undefined;
    if (!tableMap) {
      throw new Error(`Unknown table in in-memory database: "${tableName}"`);
    }

    const setClauses = match[2].split(',').map((s) => s.trim());
    const whereCondition = match[3]?.trim();
    const returningClause = match[4]?.trim();

    // Find candidate rows
    const allRows: any[] = [];
    tableMap.forEach((r) => allRows.push(r));
    const matchedRows = whereCondition
      ? allRows.filter((r) => this.evaluateWhere(whereCondition, r, params))
      : allRows;

    const updatedRows: any[] = [];

    for (const row of matchedRows) {
      const updated = { ...row };

      for (const setClause of setClauses) {
        const setMatch = setClause.match(/^([a-zA-Z0-9_]+)\s*=\s*(.+)$/);
        if (!setMatch) continue;

        const colName = setMatch[1].toLowerCase();
        const expr = setMatch[2].trim();

        let val: any;
        if (expr.startsWith('$')) {
          const paramIdx = parseInt(expr.slice(1), 10) - 1;
          val = params[paramIdx];
        } else if (/^version\s*\+\s*1$/i.test(expr)) {
          val = ((row as any).version || 1) + 1;
        } else if (/^CURRENT_TIMESTAMP$/i.test(expr) || /^NOW\(\)$/i.test(expr)) {
          val = new Date().toISOString();
        } else if (/^'.*'$/.test(expr)) {
          val = expr.slice(1, -1).replace(/''/g, "'");
        } else if (/^-?\d+(\.\d+)?$/.test(expr)) {
          val = Number(expr);
        } else if (/^true$/i.test(expr)) {
          val = true;
        } else if (/^false$/i.test(expr)) {
          val = false;
        } else if (/^null$/i.test(expr)) {
          val = null;
        } else {
          val = expr;
        }

        (updated as any)[colName] = val;
      }

      (updated as any).updated_at = new Date().toISOString();
      tableMap.set(updated.id, updated);
      updatedRows.push(JSON.parse(JSON.stringify(updated)));
    }

    const resultRows = returningClause ? updatedRows : [];
    return { rows: resultRows as T[], rowCount: updatedRows.length, command: 'UPDATE' };
  }

  // --------------------------------------------------------------------------
  // 4. DELETE HANDLER
  // --------------------------------------------------------------------------

  private handleDelete<T>(tables: typeof this.tables, sql: string, params: any[]): QueryResult<T> {
    const match = sql.match(/^\s*DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+(.+?))?(?:\s+RETURNING\s+(.+))?$/is);
    if (!match) {
      throw new Error(`Malformed DELETE statement: ${sql}`);
    }

    const tableName = match[1].toLowerCase() as keyof typeof tables;
    const tableMap = (tables as any)[tableName] as Map<string, any> | undefined;
    if (!tableMap) {
      throw new Error(`Unknown table in in-memory database: "${tableName}"`);
    }

    const whereCondition = match[2]?.trim();
    const returningClause = match[3]?.trim();

    const allRows: any[] = [];
    tableMap.forEach((r) => allRows.push(r));
    const matchedRows = whereCondition
      ? allRows.filter((r) => this.evaluateWhere(whereCondition, r, params))
      : allRows;

    for (const row of matchedRows) {
      tableMap.delete(row.id);
    }

    const resultRows = returningClause ? matchedRows.map((r) => JSON.parse(JSON.stringify(r))) : [];
    return { rows: resultRows as T[], rowCount: matchedRows.length, command: 'DELETE' };
  }

  // --------------------------------------------------------------------------
  // 5. WHERE CLAUSE EVALUATOR (Supports AND, OR, =, !=, >, <, IN, LIKE, IS NULL)
  // --------------------------------------------------------------------------

  private evaluateWhere(condition: string, row: any, params: any[]): boolean {
    const trimmed = condition.trim();
    if (!trimmed) return true;

    // Split top-level OR terms (not inside parentheses)
    const orClauses = this.splitTopLevel(trimmed, /\bOR\b/i);
    if (orClauses.length > 1) {
      return orClauses.some((clause) => this.evaluateWhere(clause, row, params));
    }

    // Split top-level AND terms (not inside parentheses)
    const andClauses = this.splitTopLevel(trimmed, /\bAND\b/i);
    if (andClauses.length > 1) {
      return andClauses.every((clause) => this.evaluateWhere(clause, row, params));
    }

    // Strip outer parentheses if enclosing entire condition
    if (trimmed.startsWith('(') && trimmed.endsWith(')') && this.isBalanced(trimmed.slice(1, -1))) {
      return this.evaluateWhere(trimmed.slice(1, -1), row, params);
    }

    return this.evaluateAtomicCondition(trimmed, row, params);
  }

  private evaluateAtomicCondition(cond: string, row: any, params: any[]): boolean {
    const trimmed = cond.trim();

    // 1. IS NULL / IS NOT NULL
    const isNullMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+IS\s+NULL$/i);
    if (isNullMatch) {
      const val = row[isNullMatch[1].toLowerCase()];
      return val === null || val === undefined;
    }

    const isNotNullMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+IS\s+NOT\s+NULL$/i);
    if (isNotNullMatch) {
      const val = row[isNotNullMatch[1].toLowerCase()];
      return val !== null && val !== undefined;
    }

    // 2. IN (val1, val2, ...) / NOT IN
    const inMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+(NOT\s+)?IN\s*\((.+?)\)$/i);
    if (inMatch) {
      const colName = inMatch[1].toLowerCase();
      const isNot = Boolean(inMatch[2]);
      const rawInValues = inMatch[3].split(',').map((s) => s.trim());
      const inValues = rawInValues.map((v) => {
        if (v.startsWith('$')) {
          const idx = parseInt(v.slice(1), 10) - 1;
          return params[idx];
        }
        if (/^'.*'$/.test(v)) return v.slice(1, -1);
        if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
        return v;
      });

      const actualVal = row[colName];
      const contains = inValues.includes(actualVal);
      return isNot ? !contains : contains;
    }

    // 3. LIKE / ILIKE
    const likeMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s+(I?LIKE)\s+(.+)$/i);
    if (likeMatch) {
      const colName = likeMatch[1].toLowerCase();
      const isCaseInsensitive = likeMatch[2].toUpperCase() === 'ILIKE';
      let pattern = likeMatch[3].trim();

      if (pattern.startsWith('$')) {
        const idx = parseInt(pattern.slice(1), 10) - 1;
        pattern = String(params[idx]);
      } else if (/^'.*'$/.test(pattern)) {
        pattern = pattern.slice(1, -1);
      }

      const regexStr = '^' + pattern.replace(/%/g, '.*').replace(/_/g, '.') + '$';
      const regex = new RegExp(regexStr, isCaseInsensitive ? 'i' : '');
      const actualVal = String(row[colName] ?? '');
      return regex.test(actualVal);
    }

    // 4. LOWER(col) = $1 or UPPER(col) = $1
    const funcMatch = trimmed.match(/^(LOWER|UPPER)\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*(=|!=|<>)\s*(.+)$/i);
    if (funcMatch) {
      const fn = funcMatch[1].toUpperCase();
      const colName = funcMatch[2].toLowerCase();
      const op = funcMatch[3];
      const rightSide = funcMatch[4].trim();

      let targetVal = this.resolveValue(rightSide, params);
      if (typeof targetVal === 'string') {
        targetVal = fn === 'LOWER' ? targetVal.toLowerCase() : targetVal.toUpperCase();
      }

      let actualVal = row[colName];
      if (typeof actualVal === 'string') {
        actualVal = fn === 'LOWER' ? actualVal.toLowerCase() : actualVal.toUpperCase();
      }

      return op === '=' ? actualVal === targetVal : actualVal !== targetVal;
    }

    // 5. Standard comparisons: =, !=, <>, >=, <=, >, <
    const compMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/);
    if (compMatch) {
      const colName = compMatch[1].toLowerCase();
      const op = compMatch[2];
      const rightSide = compMatch[3].trim();
      const targetVal = this.resolveValue(rightSide, params);
      const actualVal = row[colName];

      switch (op) {
        case '=':
          return actualVal == targetVal; // loose equality handles numeric string vs number
        case '!=':
        case '<>':
          return actualVal != targetVal;
        case '>':
          return actualVal > targetVal;
        case '>=':
          return actualVal >= targetVal;
        case '<':
          return actualVal < targetVal;
        case '<=':
          return actualVal <= targetVal;
      }
    }

    return true;
  }

  private resolveValue(expr: string, params: any[]): any {
    if (expr.startsWith('$')) {
      const idx = parseInt(expr.slice(1), 10) - 1;
      return params[idx];
    }
    if (/^'.*'$/.test(expr)) {
      return expr.slice(1, -1).replace(/''/g, "'");
    }
    if (/^-?\d+(\.\d+)?$/.test(expr)) {
      return Number(expr);
    }
    if (/^true$/i.test(expr)) return true;
    if (/^false$/i.test(expr)) return false;
    if (/^null$/i.test(expr)) return null;
    return expr;
  }

  /**
   * Helper to split by regex only at top-level parentheses depth
   */
  private splitTopLevel(input: string, delimiterRegex: RegExp): string[] {
    const results: string[] = [];
    let depth = 0;
    let lastIndex = 0;

    for (let i = 0; i < input.length; i++) {
      const char = input[i];
      if (char === '(') depth++;
      else if (char === ')') depth--;
      else if (depth === 0) {
        const sub = input.slice(i);
        const match = sub.match(delimiterRegex);
        if (match && match.index === 0) {
          results.push(input.slice(lastIndex, i).trim());
          i += match[0].length - 1;
          lastIndex = i + 1;
        }
      }
    }

    if (lastIndex < input.length) {
      results.push(input.slice(lastIndex).trim());
    }

    return results.filter(Boolean);
  }

  private isBalanced(s: string): boolean {
    let depth = 0;
    for (const c of s) {
      if (c === '(') depth++;
      if (c === ')') depth--;
      if (depth < 0) return false;
    }
    return depth === 0;
  }
}
