import { WebhookEvent } from '../models/WebhookEvent.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';
import { confirmReservation, releaseReservation } from './reservation.service.js';
import { verifyWebhookSignature } from '../config/razorpay.js';
import { logger } from '../utils/logger.utils.js';

export const handleRazorpayWebhook = async ({ rawBody, signature, eventPayload }) => {
  // 1. Verify cryptographic webhook signature
  const isValid = verifyWebhookSignature({ rawBody, signature });
  if (!isValid) {
    logger.error('Razorpay Webhook signature verification failed');
    const error = new Error('Invalid webhook signature');
    error.statusCode = 400;
    throw error;
  }

  const eventId = eventPayload?.id || eventPayload?.event_id;
  const eventType = eventPayload?.event;

  if (!eventId || !eventType) {
    const error = new Error('Missing event id or event type in webhook payload');
    error.statusCode = 400;
    throw error;
  }

  // 2. Idempotency Check: Prevent duplicate processing of the same event
  const existingEvent = await WebhookEvent.findOne({ eventId });
  if (existingEvent) {
    logger.info(`Webhook event ${eventId} (${eventType}) was already processed. Skipping.`);
    return { status: 'ALREADY_PROCESSED' };
  }

  // 3. Process supported events
  try {
    switch (eventType) {
      case 'payment.captured': {
        const paymentEntity = eventPayload.payload?.payment?.entity;
        const orderId = paymentEntity?.order_id;
        const paymentId = paymentEntity?.id;

        if (orderId) {
          const booking = await Booking.findOne({ razorpayOrderId: orderId });
          if (booking && booking.bookingStatus !== 'CONFIRMED') {
            await confirmReservation({ bookingRef: booking.bookingRef });
            booking.bookingStatus = 'CONFIRMED';
            booking.paymentStatus = 'PAID';
            booking.razorpayPaymentId = paymentId;
            await booking.save();

            await Payment.findOneAndUpdate(
              { razorpayOrderId: orderId },
              {
                razorpayPaymentId: paymentId,
                paymentStatus: 'CAPTURED',
                signatureVerificationStatus: 'VERIFIED',
                webhookEventReference: eventId
              },
              { upsert: true }
            );
            logger.info(`Webhook successfully fulfilled booking ${booking.bookingRef} for captured payment ${paymentId}`);
          }
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = eventPayload.payload?.payment?.entity;
        const orderId = paymentEntity?.order_id;
        const reason = paymentEntity?.error_description || 'Payment failed';

        if (orderId) {
          const booking = await Booking.findOne({ razorpayOrderId: orderId });
          if (booking && booking.bookingStatus === 'PENDING_PAYMENT') {
            await releaseReservation({ bookingRef: booking.bookingRef });
            booking.paymentStatus = 'FAILED';
            booking.cancellationReason = `Payment failure: ${reason}`;
            await booking.save();

            await Payment.findOneAndUpdate(
              { razorpayOrderId: orderId },
              {
                paymentStatus: 'FAILED',
                errorReason: reason,
                webhookEventReference: eventId
              }
            );
            logger.info(`Webhook recorded payment failure for order ${orderId} and released held seats`);
          }
        }
        break;
      }

      default:
        logger.info(`Unhandled webhook event type: ${eventType}`);
    }

    // 4. Save processed event record
    await WebhookEvent.create({
      eventId,
      eventType,
      payload: eventPayload,
      status: 'PROCESSED'
    });

    return { status: 'PROCESSED', eventType };
  } catch (error) {
    await WebhookEvent.create({
      eventId,
      eventType,
      payload: eventPayload,
      status: 'FAILED',
      error: error.message
    });
    throw error;
  }
};
