// Bileo Zero-Trust Parameterized Query Engine & SQL Injection Defense Builder
// Eliminates dynamic string concatenation vulnerabilities through parameterization and identifier whitelisting.

export interface ParameterizedQuery {
  text: string;
  values: any[];
}

/**
 * Helper to check if a value is a ParameterizedQuery object
 */
export function isParameterizedQuery(val: any): val is ParameterizedQuery {
  return (
    val !== null &&
    typeof val === 'object' &&
    typeof (val as any).text === 'string' &&
    Array.isArray((val as any).values)
  );
}

/**
 * SQL Tagged Template Literal Builder.
 * Converts template literal strings and interpolated parameters into a safe parameterized query ($1, $2, ...).
 * Safely handles nested `sql` expressions by unpacking sub-queries and re-indexing positional parameters.
 *
 * Example:
 *   const query = sql`SELECT * FROM users WHERE email = ${email} AND is_active = ${true}`;
 *   // query.text -> "SELECT * FROM users WHERE email = $1 AND is_active = $2"
 *   // query.values -> [email, true]
 */
export function sql(strings: TemplateStringsArray, ...values: any[]): ParameterizedQuery {
  let text = '';
  const queryValues: any[] = [];

  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      const val = values[i];

      if (isParameterizedQuery(val)) {
        // Unpack nested ParameterizedQuery and re-index its parameters
        const subText = val.text.replace(/\$(\d+)/g, (_, num) => {
          const originalIdx = parseInt(num, 10) - 1;
          const subVal = val.values[originalIdx];
          queryValues.push(subVal);
          return `$${queryValues.length}`;
        });
        text += subText;
      } else {
        queryValues.push(val);
        text += `$${queryValues.length}`;
      }
    }
  }

  return { text: text.trim(), values: queryValues };
}

/**
 * Raw SQL token wrapper - for safe internal keywords only.
 */
export class RawSqlToken {
  constructor(public readonly rawText: string) {}
}

export function rawSql(raw: string): RawSqlToken {
  return new RawSqlToken(raw);
}

/**
 * Safe Dynamic WHERE Clause Builder.
 * Accumulates conditions and binds values with correct positional $N indices.
 */
export class WhereBuilder {
  private conditions: string[] = [];
  private values: any[] = [];
  private startIndex: number;

  constructor(startIndex = 1) {
    this.startIndex = startIndex;
  }

  /**
   * Adds a condition. Replaces '?' placeholders with positional $N parameters.
   */
  where(condition: string, ...values: any[]): this {
    if (!condition || !condition.trim()) {
      return this;
    }

    let currentIndex = this.startIndex + this.values.length;
    const formattedCondition = condition.replace(/\?/g, () => `$${currentIndex++}`);

    this.conditions.push(formattedCondition);
    this.values.push(...values);
    return this;
  }

  /**
   * Adds a condition conditionally if `clause` evaluates to true.
   */
  whereIf(clause: any, condition: string, ...values: any[]): this {
    if (Boolean(clause)) {
      this.where(condition, ...values);
    }
    return this;
  }

  /**
   * Adds a raw condition string without parameter binding (must not contain user input).
   */
  whereRaw(condition: string): this {
    if (condition && condition.trim()) {
      this.conditions.push(condition.trim());
    }
    return this;
  }

  /**
   * Builds the WHERE clause and combined parameter values array.
   */
  build(): { clause: string; values: any[] } {
    if (this.conditions.length === 0) {
      return { clause: '', values: [] };
    }
    return {
      clause: 'WHERE ' + this.conditions.join(' AND '),
      values: [...this.values],
    };
  }
}

// ============================================================================
// IDENTIFIER WHITELISTING & SANITIZATION ENGINE
// ============================================================================

export const ALLOWED_TABLES = new Set([
  'users',
  'carriers',
  'routes',
  'seats',
  'bookings',
  'tickets',
  'payments',
  'security_audit_logs',
]);

export const ALLOWED_COLUMNS = new Set([
  // users
  'id',
  'email',
  'password_hash',
  'name',
  'surname',
  'phone',
  'tc_no_masked',
  'tc_no_hash',
  'gender',
  'role',
  'avatar_initials',
  'is_active',
  'created_at',
  'updated_at',

  // carriers
  'code',
  'transport_type',
  'logo_url',
  'rating',
  'review_count',
  'support_phone',
  'support_email',

  // routes
  'carrier_id',
  'origin_city',
  'origin_terminal',
  'destination_city',
  'destination_terminal',
  'departure_time',
  'arrival_time',
  'duration_minutes',
  'base_price',
  'original_price',
  'vehicle_type',
  'seat_layout_type',
  'service_class',
  'gate_or_platform',
  'badge',
  'features',

  // seats
  'route_id',
  'seat_number',
  'row_num',
  'col_num',
  'tier',
  'seat_type',
  'price_multiplier',
  'surcharge',
  'status',
  'gender_restriction',
  'cabin_class',
  'deck',
  'is_exit_row',
  'is_table_seat',
  'facing_direction',
  'has_power_socket',
  'version',

  // bookings
  'pnr',
  'user_id',
  'contact_email',
  'contact_phone',
  'seat_surcharges',
  'luggage_surcharges',
  'insurance_fee',
  'service_fee',
  'discount_amount',
  'total_price',
  'promo_code',
  'qr_code_token',
  'cancellation_reason',
  'cancellation_fee',
  'cancelled_at',

  // tickets
  'booking_id',
  'seat_id',
  'first_name',
  'last_name',
  'id_number_masked',
  'id_number_hash',
  'is_foreigner',
  'nationality',
  'birth_date',
  'passenger_email',
  'passenger_phone',
  'luggage_kg',
  'has_insurance',
  'ticket_price',
  'ticket_status',
  'qr_code_value',

  // payments
  'payment_method',
  'amount',
  'currency',
  'card_holder_masked',
  'card_bin',
  'card_last4',
  'card_brand',
  'card_token',
  'gateway_transaction_id',
  'error_code',
  'error_message',
  'refunded_amount',
  'refund_transaction_id',
  'refund_reason',
  'refunded_at',

  // security_audit_logs
  'timestamp',
  'event_type',
  'severity',
  'ip_address',
  'user_agent',
  'endpoint',
  'http_method',
  'status_code',
  'metadata',
  'message',
]);

/**
 * Validates and sanitizes a SQL identifier (table name or column name).
 * Rejects any identifier with invalid characters (quotes, dashes, spaces, semicolons, SQL keywords).
 */
export function sanitizeIdentifier(identifier: string): string {
  if (typeof identifier !== 'string') {
    throw new Error('Identifier must be a string');
  }

  const trimmed = identifier.trim();
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    throw new Error(`Invalid SQL identifier: "${identifier}"`);
  }

  return trimmed;
}

/**
 * Validates a SQL identifier against syntax rules and an optional whitelist Set.
 */
export function validateIdentifier(name: string, allowedSet?: Set<string>): string {
  const sanitized = sanitizeIdentifier(name);
  if (allowedSet && !allowedSet.has(sanitized.toLowerCase())) {
    throw new Error(`Disallowed SQL identifier: "${name}" is not in the approved whitelist`);
  }
  return sanitized;
}

/**
 * Validates table name against the explicit whitelist.
 */
export function validateTable(tableName: string): string {
  return validateIdentifier(tableName, ALLOWED_TABLES).toLowerCase();
}

/**
 * Validates column name against the explicit whitelist.
 */
export function validateColumn(columnName: string): string {
  return validateIdentifier(columnName, ALLOWED_COLUMNS).toLowerCase();
}

/**
 * Escapes an identifier by wrapping it in double quotes after strict validation.
 */
export function escapeIdentifier(identifier: string, allowedSet?: Set<string>): string {
  const sanitized = validateIdentifier(identifier, allowedSet);
  return `"${sanitized.replace(/"/g, '""')}"`;
}
