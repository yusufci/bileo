// Payment Processing & Gateway Status Controller for Bileo Platform
// Implements PCI-DSS compliant card processing, simulated gateway transactions, and payment status checks.

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { DatabaseManager } from '../db';
import { maskCreditCard } from '../middleware/privacyMasking';
import { validateLuhn } from '../../utils/validation';

export class PaymentController {
  /**
   * Process a direct card payment or digital transaction
   */
  public static async processPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body;
      const cardNumber = body.cardNumber ? String(body.cardNumber).trim() : '';

      // Validate Luhn
      const luhnResult = validateLuhn(cardNumber);
      if (!luhnResult.isValid) {
        res.status(400).json({
          success: false,
          error: 'Geçersiz kart numarası (Luhn doğrulanamadı).',
          code: 'INVALID_CARD_NUMBER',
        });
        return;
      }

      const amount = Number(body.amount) || 0;
      if (amount <= 0) {
        res.status(400).json({
          success: false,
          error: 'Geçerli bir ödeme tutarı belirtilmelidir.',
          code: 'INVALID_AMOUNT',
        });
        return;
      }

      const transactionId = `GTW_${Date.now()}_${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      const receiptId = `RCP-${Math.floor(100000 + Math.random() * 900000)}`;
      const maskedCard = maskCreditCard(cardNumber);

      res.status(200).json({
        success: true,
        message: 'Ödeme işlemi başarıyla tamamlandı.',
        transactionId,
        receiptId,
        amount,
        currency: body.currency || 'TRY',
        status: 'success',
        cardMasked: maskedCard,
        cardBrand: luhnResult.brand,
        processedAt: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment record status by payment ID or booking ID
   */
  public static async getPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const db = DatabaseManager.getInstance().getService();
      const id = req.params.id;

      const payRes = await db.query('SELECT * FROM payments WHERE id = $1 OR booking_id = $1', [id]);
      if (payRes.rowCount === 0) {
        res.status(404).json({
          success: false,
          error: 'Ödeme kaydı bulunamadı.',
          code: 'PAYMENT_NOT_FOUND',
        });
        return;
      }

      const p = payRes.rows[0];

      res.status(200).json({
        success: true,
        payment: {
          id: p.id,
          bookingId: p.booking_id,
          paymentMethod: p.payment_method,
          amount: Number(p.amount),
          currency: p.currency,
          status: p.status,
          cardHolderMasked: p.card_holder_masked,
          cardBin: p.card_bin,
          cardLast4: p.card_last4,
          cardBrand: p.card_brand,
          gatewayTransactionId: p.gateway_transaction_id,
          refundedAmount: Number(p.refunded_amount || 0),
          createdAt: p.created_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
