import crypto from 'crypto';
import { razorpayInstance, verifyPaymentSignature, verifyWebhookSignature } from '../config/razorpay.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.utils.js';

export const createRazorpayOrder = async ({ amountInPaise, currency = 'INR', receipt, notes = {} }) => {
  // If razorpayInstance is configured with active keys, use official SDK
  if (razorpayInstance && !env.RAZORPAY_KEY_ID.includes('placeholder')) {
    try {
      const order = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency,
        receipt,
        notes
      });
      logger.info(`Razorpay order created via official SDK: ${order.id} for ₹${amountInPaise / 100}`);
      return order;
    } catch (error) {
      logger.warn(`Razorpay SDK order creation failed (${error.message}). Checking development simulator fallback...`);
      if (!env.ALLOW_TEST_PAYMENT_SIMULATOR) {
        throw error;
      }
    }
  }

  // Development / Test Simulator Fallback for local testing without external merchant secrets
  if (env.ALLOW_TEST_PAYMENT_SIMULATOR) {
    const mockOrderId = `order_${crypto.randomBytes(9).toString('hex')}`;
    logger.info(`[TEST MODE] Generated simulated Razorpay order: ${mockOrderId} (₹${amountInPaise / 100})`);
    return {
      id: mockOrderId,
      entity: 'order',
      amount: amountInPaise,
      amount_paid: 0,
      amount_due: amountInPaise,
      currency,
      receipt,
      status: 'created',
      attempts: 0,
      notes,
      created_at: Math.floor(Date.now() / 1000)
    };
  }

  throw new Error('Razorpay client not configured and test simulator is disabled.');
};

export const verifyPayment = ({ orderId, paymentId, signature }) => {
  // Check standard Razorpay HMAC SHA256 verification
  const isHmacValid = verifyPaymentSignature({ orderId, paymentId, signature });
  if (isHmacValid) {
    return true;
  }

  // In test simulator mode, accept development simulated signatures safely
  if (env.ALLOW_TEST_PAYMENT_SIMULATOR) {
    if (
      signature === 'simulated_dev_signature' ||
      signature.startsWith('sim_') ||
      paymentId.startsWith('pay_sim_')
    ) {
      logger.info(`[TEST MODE] Verified simulated payment signature for order ${orderId}`);
      return true;
    }
  }

  return false;
};

export const processRefund = async ({ paymentId, amountInPaise, notes = {} }) => {
  // If razorpayInstance is configured with active keys, attempt official SDK refund
  if (razorpayInstance && !env.RAZORPAY_KEY_ID.includes('placeholder')) {
    try {
      const refund = await razorpayInstance.payments.refund(paymentId, {
        amount: amountInPaise,
        notes
      });
      logger.info(`Razorpay refund processed via official SDK: ${refund.id} for payment ${paymentId} (₹${amountInPaise / 100})`);
      return {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status || 'processed',
        raw: refund
      };
    } catch (error) {
      logger.warn(`Razorpay SDK refund call failed (${error.message}). Checking development simulator fallback...`);
      if (!env.ALLOW_TEST_PAYMENT_SIMULATOR) {
        throw error;
      }
    }
  }

  // Development / Test Simulator Fallback for local testing and simulated transactions
  if (env.ALLOW_TEST_PAYMENT_SIMULATOR) {
    const mockRefundId = `rfnd_${crypto.randomBytes(9).toString('hex')}`;
    logger.info(`[TEST MODE] Generated simulated Razorpay refund: ${mockRefundId} for payment ${paymentId} (₹${amountInPaise / 100})`);
    return {
      refundId: mockRefundId,
      amount: amountInPaise,
      status: 'processed'
    };
  }

  throw new Error('Razorpay client not configured and test simulator is disabled.');
};

export { verifyWebhookSignature };
