import * as bookingService from '../services/booking.service.js';
import { env } from '../config/env.js';
import { sendSuccess } from '../utils/response.utils.js';

export const getPaymentConfig = (req, res) => {
  return sendSuccess(res, 200, 'Payment configuration retrieved', {
    keyId: env.RAZORPAY_KEY_ID,
    currency: 'INR',
    testMode: env.RAZORPAY_KEY_ID.startsWith('rzp_test_'),
    allowSimulator: Boolean(env.ALLOW_TEST_PAYMENT_SIMULATOR && !env.isProd),
    isProduction: env.isProd
  });
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { bookingRef, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    const result = await bookingService.verifyAndConfirmBooking({
      bookingRef,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      userId: req.user.id
    });

    return sendSuccess(res, 200, 'Payment verified and booking confirmed', result);
  } catch (error) {
    next(error);
  }
};
