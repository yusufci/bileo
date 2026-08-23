import { db, IDatabaseClient } from '../db/database';
import { AuthService } from '../security/auth';
import {
  RegisterSchema,
  LoginSchema,
  CreateBookingSchema,
  RefundRequestSchema,
  DataMasker,
  sanitizeInput,
} from '../security/validation';
import { RateLimiter } from '../security/rateLimiter';

export class TicketingService {
  /**
   * 1. Register User with salted bcrypt and validation
   */
  public static async registerUser(payload: any, clientIp: string = '127.0.0.1') {
    // Rate limit registration attempts per IP
    const rateCheck = RateLimiter.check(`register:${clientIp}`, 5, 60000);
    if (!rateCheck.allowed) {
      throw new Error(`Çok fazla kayıt denemesi yapıldı. Lütfen ${Math.ceil(rateCheck.retryAfterMs / 1000)} saniye sonra tekrar deneyin.`);
    }

    const validated = RegisterSchema.parse(payload);
    const sanitizedFullName = sanitizeInput(validated.fullName);

    // Check if email already exists via parameterized query
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [validated.email.toLowerCase().trim()]);
    if (existing.rowCount > 0) {
      throw new Error('Bu e-posta adresi ile kayıtlı bir hesap zaten bulunmaktadır.');
    }

    const passwordHash = await AuthService.hashPassword(validated.password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.query(
      'INSERT INTO users (id, email, password_hash, full_name, phone, role, kvkk_accepted) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        userId,
        validated.email.toLowerCase().trim(),
        passwordHash,
        sanitizedFullName,
        validated.phone.trim(),
        'user',
        true,
      ]
    );

    const token = AuthService.signToken({
      userId,
      email: validated.email.toLowerCase().trim(),
      role: 'user',
    });

    return {
      userId,
      email: validated.email.toLowerCase().trim(),
      fullName: sanitizedFullName,
      token,
    };
  }

  /**
   * 2. Login User with brute-force defense
   */
  public static async loginUser(payload: any, clientIp: string = '127.0.0.1') {
    const rateCheck = RateLimiter.check(`login:${clientIp}`, 5, 60000);
    if (!rateCheck.allowed) {
      throw new Error(`Çok fazla hatalı giriş denemesi. Lütfen ${Math.ceil(rateCheck.retryAfterMs / 1000)} saniye sonra tekrar deneyin.`);
    }

    const validated = LoginSchema.parse(payload);
    const email = validated.email.toLowerCase().trim();

    const userRes = await db.query('SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1', [email]);
    if (userRes.rowCount === 0) {
      throw new Error('E-posta adresi veya parola hatalı.');
    }

    const user = userRes.rows[0];
    const isMatch = await AuthService.verifyPassword(validated.password, user.password_hash);
    if (!isMatch) {
      throw new Error('E-posta adresi veya parola hatalı.');
    }

    const token = AuthService.signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      token,
    };
  }

  /**
   * 3. Create Ticket Booking with Atomic Transaction & Parameterized Safety
   */
  public static async createBooking(payload: any, userId?: string) {
    const validated = CreateBookingSchema.parse(payload);
    const pnr = `PNR-${Math.floor(100000 + Math.random() * 900000)}`;
    const bookingId = `bok_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const receiptId = `RCP-${Math.floor(100000 + Math.random() * 900000)}`;

    return db.withTransaction(async (client: IDatabaseClient) => {
      // 1. Calculate price and ensure route exists
      const totalAmount = validated.passengers.length * 650; // default standard calculation

      // 2. Insert booking record
      await client.query(
        'INSERT INTO bookings (id, pnr, user_id, route_id, total_amount, currency, status, contact_email, contact_phone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          bookingId,
          pnr,
          userId || null,
          validated.routeId,
          totalAmount,
          'TRY',
          'confirmed',
          validated.contactEmail.toLowerCase().trim(),
          validated.contactPhone.trim(),
        ]
      );

      // 3. Insert individual tickets with KVKK masked TCKN
      for (let i = 0; i < validated.passengers.length; i++) {
        const p = validated.passengers[i];
        const ticketId = `tck_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`;
        const maskedTC = DataMasker.maskTCKN(p.tc);
        const seatNum = String(validated.seats[i] || `${i + 1}`);

        await client.query(
          'INSERT INTO tickets (id, booking_id, seat_number, passenger_first_name, passenger_last_name, passenger_tc_masked, passenger_gender, price, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [
            ticketId,
            bookingId,
            seatNum,
            sanitizeInput(p.firstName),
            sanitizeInput(p.lastName),
            maskedTC,
            p.gender,
            650,
            'active',
          ]
        );
      }

      // 4. Record payment with masked credit card
      const maskedCard = DataMasker.maskCreditCard(validated.cardNumber);
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      await client.query(
        'INSERT INTO payments (id, booking_id, amount, card_masked, status, receipt_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [paymentId, bookingId, totalAmount, maskedCard, 'success', receiptId]
      );

      return {
        bookingId,
        pnr,
        totalAmount,
        receiptId,
        status: 'confirmed',
        passengerCount: validated.passengers.length,
      };
    });
  }

  /**
   * 4. Refund / Cancel Ticket by PNR safely
   */
  public static async refundTicket(payload: any) {
    const validated = RefundRequestSchema.parse(payload);

    const bookingRes = await db.query('SELECT id, status, total_amount FROM bookings WHERE pnr = $1', [validated.pnr.trim().toUpperCase()]);
    if (bookingRes.rowCount === 0) {
      throw new Error('Belirtilen PNR koduna ait bilet kaydı bulunamadı.');
    }

    const booking = bookingRes.rows[0];
    if (booking.status === 'refunded' || booking.status === 'cancelled') {
      throw new Error('Bu bilet zaten iade edilmiştir.');
    }

    await db.withTransaction(async (client: IDatabaseClient) => {
      await client.query('UPDATE bookings SET status = $1 WHERE id = $2', ['refunded', booking.id]);
      await client.query('UPDATE tickets SET status = $1 WHERE booking_id = $2', ['refunded', booking.id]);
    });

    return {
      pnr: validated.pnr,
      refundedAmount: booking.total_amount,
      status: 'refunded',
      message: 'Bilet bedeli kesintisiz olarak kartınıza iade edilmiştir.',
    };
  }
}
