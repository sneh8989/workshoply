import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from './env.js';
import { logger } from '../utils/logger.utils.js';

let razorpayInstance = null;

try {
  razorpayInstance = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET
  });
  logger.info(`Razorpay client initialized (Key: ${env.RAZORPAY_KEY_ID.substring(0, 8)}...)`);
} catch (error) {
  logger.warn('Failed to initialize Razorpay SDK:', error.message);
}

/**
 * Cryptographically verifies Razorpay checkout payment signature
 * HMAC SHA256 of order_id + "|" + razorpay_payment_id using key_secret
 */
export const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  if (!orderId || !paymentId || !signature) {
    return false;
  }
  try {
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const buf1 = Buffer.from(generatedSignature, 'utf-8');
    const buf2 = Buffer.from(signature, 'utf-8');

    if (buf1.length !== buf2.length) {
      return false;
    }

    return crypto.timingSafeEqual(buf1, buf2);
  } catch (error) {
    logger.error('Signature verification error:', error.message);
    return false;
  }
};

/**
 * Cryptographically verifies Razorpay webhook signature
 * HMAC SHA256 of raw request body using webhook secret
 */
export const verifyWebhookSignature = ({ rawBody, signature }) => {
  if (!rawBody || !signature) {
    return false;
  }
  try {
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf-8'),
      Buffer.from(signature, 'utf-8')
    );
  } catch (error) {
    logger.error('Webhook signature verification error:', error.message);
    return false;
  }
};

export { razorpayInstance };
