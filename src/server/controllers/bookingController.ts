// Booking, OCC Seat Locking & Ticket Lifecycle Controller for Bileo Platform
// Implements multi-step ACID transactions, Optimistic Concurrency Control (OCC) seat locking,
// privacy-compliant data masking (KVKK/GDPR), zero CVV persistence, and complete PNR refunds.

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { DatabaseManager, ITransactionClient } from '../db';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CreateBookingInput, PnrParam, RefundBookingInput } from '../schemas/bookingSchemas';
import { maskCreditCard, maskTCKN, maskPassport } from '../middleware/privacyMasking';
import { calculatePricing, generateAuthenticPnr, validateLuhn } from '../../utils/validation';
import { SeatItem } from '../../types';

export class BookingController {
  /**
   * Create ticket booking with atomic transaction and OCC seat locking.
   */
  public static async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = DatabaseManager.getInstance().getService();
      const authReq = req as AuthenticatedRequest;
      const body = req.body as CreateBookingInput;
      const userId = authReq.user?.sub || null;

      const result = await db.transaction(async (trx: ITransactionClient) => {
        // 1. Verify route existence
        const routeRes = await trx.query('SELECT * FROM routes WHERE id = $1', [body.routeId]);
        if (routeRes.rowCount === 0) {
          const err: any = new Error('Belirtilen sefer bulunamadı.');
          err.statusCode = 404;
          err.code = 'ROUTE_NOT_FOUND';
          throw err;
        }

        const route = routeRes.rows[0];
        const carrierRes = await trx.query('SELECT name FROM carriers WHERE id = $1', [route.carrier_id]);
        const carrierName = carrierRes.rows[0]?.name || 'Bileo';

        // 2. OCC Seat Locking: Query requested seats and verify availability
        const requestedSeatNumbers = body.passengers.map((p) => String(p.seatNumber));
        const seatsRes = await trx.query('SELECT * FROM seats WHERE route_id = $1', [body.routeId]);
        const allRouteSeats = seatsRes.rows;

        const targetSeats: any[] = [];
        for (const seatNum of requestedSeatNumbers) {
          const seat = allRouteSeats.find((s) => String(s.seat_number) === seatNum);
          if (!seat) {
            const err: any = new Error(`Koltuk ${seatNum} bu sefer için bulunamadı.`);
            err.statusCode = 400;
            err.code = 'SEAT_NOT_FOUND';
            throw err;
          }
          if (seat.status !== 'available') {
            const err: any = new Error(`Koltuk ${seatNum} müsait değil veya başka bir yolcu tarafından rezerve edildi.`);
            err.statusCode = 409;
            err.code = 'SEAT_ALREADY_BOOKED';
            throw err;
          }
          targetSeats.push(seat);
        }

        // 3. Atomically lock each seat using version-checked OCC
        for (const seat of targetSeats) {
          const lockRes = await trx.query(
            'UPDATE seats SET status = $1, version = version + 1 WHERE id = $2 AND version = $3',
            ['booked', seat.id, seat.version]
          );

          if (lockRes.rowCount === 0) {
            const err: any = new Error(`Koltuk ${seat.seat_number} seçiminde eşzamanlı işlem çakışması yaşandı. Lütfen tekrar deneyiniz.`);
            err.statusCode = 409;
            err.code = 'OCC_SEAT_CONFLICT';
            throw err;
          }
        }

        // 4. Calculate final pricing breakdown
        const basePrice = Number(route.base_price);
        const seatItems: SeatItem[] = targetSeats.map((s) => ({
          id: s.id,
          number: s.seat_number,
          price: Math.round(basePrice * Number(s.price_multiplier || 1.0) + Number(s.surcharge || 0)),
          status: 'available',
          type: s.seat_type || 'standard',
          tier: s.tier,
          row: s.row_num,
          col: s.col_num,
        }));

        const addOns = {
          luggageKg: body.addOns?.luggageKg || 0,
          insurance: body.addOns?.insurance || false,
        };

        const pricing = calculatePricing(basePrice, seatItems, addOns, body.couponCode);

        // 5. Generate identifiers
        const pnr = generateAuthenticPnr(route.transport_type, carrierName);
        const bookingId = `bok_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const qrCodeToken = `qr_${crypto.randomBytes(16).toString('hex')}`;

        const contactEmail = body.contactEmail || body.passengers[0]?.email || 'guest@bileo.com';
        const contactPhone = body.contactPhone || body.passengers[0]?.phone || '05555555555';

        // 6. Insert Booking record
        await trx.query(
          `INSERT INTO bookings (
            id, pnr, user_id, route_id, status, contact_email, contact_phone,
            base_price, seat_surcharges, luggage_surcharges, insurance_fee, service_fee,
            discount_amount, total_price, promo_code, qr_code_token
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            bookingId,
            pnr,
            userId,
            body.routeId,
            'confirmed',
            contactEmail.toLowerCase().trim(),
            contactPhone.trim(),
            pricing.baseFare,
            pricing.seatSurcharges,
            pricing.luggageFare,
            pricing.insuranceFare,
            pricing.serviceFee,
            pricing.discount,
            pricing.total,
            body.couponCode || null,
            qrCodeToken,
          ]
        );

        // 7. Insert Ticket records with KVKK-compliant data masking & SHA-256 ID hashing
        const createdTickets: any[] = [];
        for (let i = 0; i < body.passengers.length; i++) {
          const p = body.passengers[i];
          const seat = targetSeats[i];
          const ticketId = `tck_${Date.now()}_${i}_${crypto.randomBytes(3).toString('hex')}`;
          const seatPrice = seatItems[i].price;

          const isForeigner = Boolean(p.isForeigner);
          const maskedId = isForeigner ? maskPassport(p.idNumber) : maskTCKN(p.idNumber);
          const idHash = crypto.createHash('sha256').update(p.idNumber.trim()).digest('hex');
          const ticketQr = `BL-TCK-${pnr}-${seat.seat_number}-${crypto.randomBytes(4).toString('hex')}`;

          await trx.query(
            `INSERT INTO tickets (
              id, booking_id, seat_id, seat_number, first_name, last_name,
              id_number_masked, id_number_hash, is_foreigner, nationality,
              gender, birth_date, passenger_email, passenger_phone,
              luggage_kg, has_insurance, ticket_price, ticket_status, qr_code_value
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
            [
              ticketId,
              bookingId,
              seat.id,
              String(p.seatNumber),
              p.firstName.trim(),
              p.lastName.trim(),
              maskedId,
              idHash,
              isForeigner,
              isForeigner ? 'FOREIGN' : 'TR',
              p.gender,
              p.birthDate || null,
              p.email.toLowerCase().trim(),
              p.phone.trim(),
              p.luggageKg || 20,
              Boolean(p.hasInsurance || addOns.insurance),
              seatPrice,
              'active',
              ticketQr,
            ]
          );

          createdTickets.push({
            id: ticketId,
            seatNumber: String(p.seatNumber),
            firstName: p.firstName.trim(),
            lastName: p.lastName.trim(),
            idNumberMasked: maskedId,
            price: seatPrice,
            status: 'active',
            qrCodeValue: ticketQr,
          });
        }

        // 8. Record Payment with PCI-DSS compliance: PAN masked, zero CVV storage
        const paymentId = `pay_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const rawCard = body.payment.cardNumber.replace(/\D/g, '');
        const cardBin = rawCard.slice(0, 6);
        const cardLast4 = rawCard.slice(-4);
        const cardBrand = validateLuhn(body.payment.cardNumber).brand;
        const gatewayTxId = `GTW_${Date.now()}_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

        await trx.query(
          `INSERT INTO payments (
            id, booking_id, payment_method, amount, currency, status,
            card_holder_masked, card_bin, card_last4, card_brand, card_token,
            gateway_transaction_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            paymentId,
            bookingId,
            body.payment.method || 'credit_card',
            pricing.total,
            'TRY',
            'success',
            body.payment.cardHolder.trim(),
            cardBin,
            cardLast4,
            cardBrand,
            null,
            gatewayTxId,
          ]
        );

        // 9. Write Security Audit Log
        const auditLogId = `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        await trx.query(
          `INSERT INTO security_audit_logs (
            id, event_type, severity, user_id, ip_address, user_agent,
            endpoint, http_method, status_code, metadata, message
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            auditLogId,
            'BOOKING_CREATED',
            'INFO',
            userId,
            req.ip || '127.0.0.1',
            req.headers['user-agent'] || 'Bileo-Client',
            '/api/bookings',
            'POST',
            201,
            JSON.stringify({
              pnr,
              bookingId,
              routeId: body.routeId,
              passengerCount: body.passengers.length,
              totalPrice: pricing.total,
              cardLast4,
            }),
            `Booking ${pnr} successfully created for ${body.passengers.length} passenger(s).`,
          ]
        );

        return {
          booking: {
            id: bookingId,
            pnr,
            userId,
            routeId: body.routeId,
            status: 'confirmed',
            contactEmail,
            contactPhone,
            pricing,
            qrCodeToken,
            createdAt: new Date().toISOString(),
          },
          tickets: createdTickets,
          payment: {
            id: paymentId,
            gatewayTransactionId: gatewayTxId,
            amount: pricing.total,
            currency: 'TRY',
            status: 'success',
            cardBrand,
            cardLast4,
            cardMasked: maskCreditCard(body.payment.cardNumber),
          },
        };
      });

      res.status(201).json({
        success: true,
        message: 'Rezervasyon ve biletleriniz başarıyla oluşturuldu.',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retrieve complete booking details by authentic PNR code.
   */
  public static async getBookingByPnr(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = DatabaseManager.getInstance().getService();
      const { pnr } = req.params as unknown as PnrParam;

      // 1. Fetch booking record
      const bookingRes = await db.query('SELECT * FROM bookings WHERE UPPER(pnr) = $1', [pnr.trim().toUpperCase()]);
      if (bookingRes.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Belirtilen PNR koduna ait bilet veya rezervasyon bulunamadı.',
          code: 'BOOKING_NOT_FOUND',
        });
        return;
      }

      const booking = bookingRes.rows[0];

      // 2. Fetch associated route and carrier
      const routeRes = await db.query('SELECT * FROM routes WHERE id = $1', [booking.route_id]);
      const route = routeRes.rows[0] || null;

      let carrier = null;
      if (route) {
        const carrierRes = await db.query('SELECT * FROM carriers WHERE id = $1', [route.carrier_id]);
        carrier = carrierRes.rows[0] || null;
      }

      // 3. Fetch tickets
      const ticketsRes = await db.query('SELECT * FROM tickets WHERE booking_id = $1', [booking.id]);
      const tickets = ticketsRes.rows.map((t) => ({
        id: t.id,
        seatNumber: t.seat_number,
        firstName: t.first_name,
        lastName: t.last_name,
        idNumberMasked: t.id_number_masked,
        isForeigner: Boolean(t.is_foreigner),
        nationality: t.nationality,
        gender: t.gender,
        ticketPrice: Number(t.ticket_price),
        status: t.ticket_status,
        qrCodeValue: t.qr_code_value,
      }));

      // 4. Fetch payment summary
      const paymentRes = await db.query('SELECT * FROM payments WHERE booking_id = $1', [booking.id]);
      const payment = paymentRes.rows[0]
        ? {
            id: paymentRes.rows[0].id,
            amount: Number(paymentRes.rows[0].amount),
            currency: paymentRes.rows[0].currency,
            status: paymentRes.rows[0].status,
            cardBrand: paymentRes.rows[0].card_brand,
            cardLast4: paymentRes.rows[0].card_last4,
            gatewayTransactionId: paymentRes.rows[0].gateway_transaction_id,
            refundedAmount: Number(paymentRes.rows[0].refunded_amount || 0),
          }
        : null;

      res.status(200).json({
        success: true,
        booking: {
          ...booking,
          base_price: Number(booking.base_price),
          seat_surcharges: Number(booking.seat_surcharges),
          luggage_surcharges: Number(booking.luggage_surcharges),
          insurance_fee: Number(booking.insurance_fee),
          service_fee: Number(booking.service_fee),
          discount_amount: Number(booking.discount_amount),
          total_price: Number(booking.total_price),
        },
        route,
        carrier,
        tickets,
        payment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refund ticket and release reserved seats within atomic transaction.
   */
  public static async refundBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = DatabaseManager.getInstance().getService();
      const body = req.body as RefundBookingInput;
      const cleanPnr = body.pnr.trim().toUpperCase();

      const result = await db.transaction(async (trx: ITransactionClient) => {
        // 1. Fetch booking record
        const bookingRes = await trx.query('SELECT * FROM bookings WHERE UPPER(pnr) = $1', [cleanPnr]);
        if (bookingRes.rowCount === 0) {
          const err: any = new Error('Belirtilen PNR koduna ait bilet veya rezervasyon bulunamadı.');
          err.statusCode = 404;
          err.code = 'BOOKING_NOT_FOUND';
          throw err;
        }

        const booking = bookingRes.rows[0];

        if (booking.status === 'refunded' || booking.status === 'cancelled') {
          const err: any = new Error('Bu rezervasyon zaten iade edilmiş veya iptal edilmiştir.');
          err.statusCode = 400;
          err.code = 'ALREADY_REFUNDED';
          throw err;
        }

        const refundReason = body.reason || 'Kullanıcı talebi doğrultusunda kesintisiz iade.';
        const refundTxId = `REF_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // 2. Update booking status to refunded
        await trx.query(
          'UPDATE bookings SET status = $1, cancellation_reason = $2, cancelled_at = CURRENT_TIMESTAMP WHERE id = $3',
          ['refunded', refundReason, booking.id]
        );

        // 3. Update all tickets status to refunded
        await trx.query('UPDATE tickets SET ticket_status = $1 WHERE booking_id = $2', ['refunded', booking.id]);

        // 4. Update payment status to refunded
        await trx.query(
          `UPDATE payments SET status = $1, refunded_amount = amount, refund_reason = $2,
           refund_transaction_id = $3, refunded_at = CURRENT_TIMESTAMP WHERE booking_id = $4`,
          ['refunded', refundReason, refundTxId, booking.id]
        );

        // 5. Release and unlock seats back to 'available'
        const ticketsRes = await trx.query('SELECT seat_id FROM tickets WHERE booking_id = $1', [booking.id]);
        for (const t of ticketsRes.rows) {
          await trx.query("UPDATE seats SET status = 'available', version = version + 1 WHERE id = $1", [t.seat_id]);
        }

        // 6. Write Security Audit Log
        const auditLogId = `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        await trx.query(
          `INSERT INTO security_audit_logs (
            id, event_type, severity, user_id, ip_address, user_agent,
            endpoint, http_method, status_code, metadata, message
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            auditLogId,
            'BOOKING_REFUNDED',
            'INFO',
            booking.user_id,
            req.ip || '127.0.0.1',
            req.headers['user-agent'] || 'Bileo-Client',
            '/api/bookings/refund',
            'POST',
            200,
            JSON.stringify({
              pnr: cleanPnr,
              bookingId: booking.id,
              refundedAmount: Number(booking.total_price),
              refundTxId,
            }),
            `Booking ${cleanPnr} refunded (${booking.total_price} TRY).`,
          ]
        );

        return {
          pnr: cleanPnr,
          bookingId: booking.id,
          refundedAmount: Number(booking.total_price),
          refundTransactionId: refundTxId,
          status: 'refunded',
        };
      });

      res.status(200).json({
        success: true,
        message: 'Bilet bedeli kesintisiz olarak kartınıza iade edilmiştir.',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
