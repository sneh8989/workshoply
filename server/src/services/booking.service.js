import crypto from 'crypto';
import { Booking } from '../models/Booking.js';
import { Workshop } from '../models/Workshop.js';
import { Payment } from '../models/Payment.js';
import { reserveSeats, confirmReservation, releaseReservation } from './reservation.service.js';
import { createRazorpayOrder, verifyPayment, processRefund } from './payment.service.js';
import { razorpayInstance } from '../config/razorpay.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.utils.js';

export const createBooking = async ({ userId, userRole, workshopId, seatQuantity, attendeeDetails, notes }) => {
  if (userRole === 'ADMIN') {
    const error = new Error('Administrators are not permitted to book workshops. Only regular users can book workshops.');
    error.statusCode = 403;
    throw error;
  }

  const workshop = await Workshop.findById(workshopId);
  if (!workshop) {
    const error = new Error('Workshop not found');
    error.statusCode = 404;
    throw error;
  }

  // 1. Calculate price securely strictly from database state
  const unitPriceInPaise = workshop.priceInPaise;
  const totalAmountInPaise = unitPriceInPaise * seatQuantity;

  // 2. Generate unique booking reference
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const bookingRef = `WKL-${dateStr}-${randomSuffix}`;

  // 3. Atomically hold the requested seats
  const { expiresAt } = await reserveSeats({
    workshopId,
    userId,
    seatCount: seatQuantity,
    bookingRef
  });

  // Handle Free Workshops (₹0)
  if (totalAmountInPaise === 0) {
    const booking = await Booking.create({
      bookingRef,
      user: userId,
      workshop: workshopId,
      seatQuantity,
      unitPriceInPaise: 0,
      totalAmountInPaise: 0,
      currency: 'INR',
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      attendeeDetails,
      notes: notes || 'Free Workshop Registration'
    });

    await confirmReservation({ bookingRef });
    return { booking, isFree: true };
  }

  // 4. Create Razorpay order
  let razorpayOrder;
  try {
    razorpayOrder = await createRazorpayOrder({
      amountInPaise: totalAmountInPaise,
      currency: 'INR',
      receipt: bookingRef,
      notes: { bookingRef, workshopId: workshop._id.toString(), userId }
    });
  } catch (err) {
    // Release held seats if order creation completely fails
    await releaseReservation({ bookingRef });
    throw err;
  }

  // 5. Persist booking in pending state
  const booking = await Booking.create({
    bookingRef,
    user: userId,
    workshop: workshopId,
    seatQuantity,
    unitPriceInPaise,
    totalAmountInPaise,
    currency: 'INR',
    bookingStatus: 'PENDING_PAYMENT',
    paymentStatus: 'PENDING',
    razorpayOrderId: razorpayOrder.id,
    attendeeDetails,
    notes: notes || ''
  });

  // 6. Record audit payment entry
  await Payment.create({
    booking: booking._id,
    user: userId,
    razorpayOrderId: razorpayOrder.id,
    amountInPaise: totalAmountInPaise,
    currency: 'INR',
    paymentStatus: 'CREATED'
  });

  return {
    booking,
    razorpayOrder: {
      id: razorpayOrder.id,
      amount: totalAmountInPaise,
      currency: 'INR'
    },
    razorpayKeyId: env.RAZORPAY_KEY_ID,
    expiresAt
  };
};

export const verifyAndConfirmBooking = async ({ bookingRef, razorpayOrderId, razorpayPaymentId, razorpaySignature, userId }) => {
  const booking = await Booking.findOne({ bookingRef }).populate('workshop');
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  // Idempotency: If already confirmed, safely return existing confirmation
  if (booking.bookingStatus === 'CONFIRMED' && booking.paymentStatus === 'PAID') {
    logger.info(`Booking ${bookingRef} was already confirmed. Returning idempotently.`);
    return { booking, alreadyConfirmed: true };
  }

  // Verify order ID matches booking record
  if (booking.razorpayOrderId && booking.razorpayOrderId !== razorpayOrderId) {
    const error = new Error('Payment order mismatch with booking record');
    error.statusCode = 400;
    throw error;
  }

  // Cryptographic signature check
  const isValid = verifyPayment({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature
  });

  if (!isValid) {
    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      {
        paymentStatus: 'FAILED',
        signatureVerificationStatus: 'FAILED',
        errorReason: 'Cryptographic signature mismatch'
      }
    );
    const error = new Error('Payment signature verification failed. Unauthorized transaction.');
    error.statusCode = 400;
    throw error;
  }

  // Double-verify against Razorpay API when available and not a simulated test key
  if (razorpayInstance && !env.RAZORPAY_KEY_ID.includes('placeholder')) {
    try {
      if (razorpayPaymentId.startsWith('pay_') && !razorpayPaymentId.startsWith('pay_sim_')) {
        const fetchedPayment = await razorpayInstance.payments.fetch(razorpayPaymentId);
        if (fetchedPayment) {
          if (fetchedPayment.order_id && fetchedPayment.order_id !== razorpayOrderId) {
            const error = new Error('Payment order mismatch with Razorpay record');
            error.statusCode = 400;
            error.isCustomValidation = true;
            throw error;
          }
          if (fetchedPayment.amount && fetchedPayment.amount !== booking.totalAmountInPaise) {
            const error = new Error(`Payment amount mismatch: expected ${booking.totalAmountInPaise} paise, got ${fetchedPayment.amount}`);
            error.statusCode = 400;
            error.isCustomValidation = true;
            throw error;
          }
          if (fetchedPayment.currency && fetchedPayment.currency !== (booking.currency || 'INR')) {
            const error = new Error(`Payment currency mismatch: expected ${booking.currency || 'INR'}, got ${fetchedPayment.currency}`);
            error.statusCode = 400;
            error.isCustomValidation = true;
            throw error;
          }
          logger.info(`Reconciled payment ${razorpayPaymentId} with Razorpay API (Status: ${fetchedPayment.status}, Amount: ₹${fetchedPayment.amount / 100})`);
        }
      }
    } catch (fetchErr) {
      if (fetchErr.isCustomValidation) {
        throw fetchErr;
      }
      logger.warn(`Razorpay payment fetch check skipped or network unfulfilled: ${fetchErr.message}`);
    }
  }

  // Atomically convert reserved seat hold into booked seat inventory
  await confirmReservation({ bookingRef });

  booking.bookingStatus = 'CONFIRMED';
  booking.paymentStatus = 'PAID';
  booking.razorpayOrderId = razorpayOrderId;
  booking.razorpayPaymentId = razorpayPaymentId;
  booking.razorpaySignature = razorpaySignature;
  await booking.save();

  await Payment.findOneAndUpdate(
    { razorpayOrderId },
    {
      razorpayPaymentId,
      paymentStatus: 'CAPTURED',
      signatureVerificationStatus: 'VERIFIED'
    },
    { upsert: true, new: true }
  );

  logger.info(`Successfully confirmed booking ${bookingRef} with payment ${razorpayPaymentId}`);
  return { booking, alreadyConfirmed: false };
};

export const getUserBookings = async (userId, { status, page = 1, limit = 10 }) => {
  const query = { user: userId };
  if (status) {
    query.bookingStatus = status;
  }

  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate('workshop')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(query)
  ]);

  return {
    bookings,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getBookingDetails = async (bookingRef, userId, userRole) => {
  const query = { bookingRef };
  if (userRole !== 'ADMIN') {
    query.user = userId;
  }

  const booking = await Booking.findOne(query).populate('workshop').populate('user', 'name email phone');
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const payment = await Payment.findOne({ booking: booking._id });
  return { booking, payment };
};

export const cancelBooking = async (bookingRef, userId, userRole, reason = 'Cancelled by user') => {
  const query = { bookingRef };
  if (userRole !== 'ADMIN') {
    query.user = userId;
  }

  const booking = await Booking.findOne(query).populate('workshop');
  if (!booking) {
    const error = new Error('Booking not found or not authorized to cancel');
    error.statusCode = 404;
    throw error;
  }

  if (booking.bookingStatus === 'CANCELLED') {
    const error = new Error('Booking is already cancelled');
    error.statusCode = 400;
    throw error;
  }

  // Check workshop start date
  if (booking.workshop && new Date() >= new Date(booking.workshop.startDateTime)) {
    const error = new Error('Cannot cancel booking after workshop has started');
    error.statusCode = 400;
    throw error;
  }

  // Restore workshop inventory
  if (booking.bookingStatus === 'CONFIRMED') {
    await Workshop.findByIdAndUpdate(booking.workshop._id, {
      $inc: { bookedSeats: -booking.seatQuantity }
    });
  } else if (booking.bookingStatus === 'PENDING_PAYMENT') {
    await releaseReservation({ bookingRef });
  }

  // Process payment refund if ticket was paid
  let refundReference = '';
  if (booking.paymentStatus === 'PAID' && booking.totalAmountInPaise > 0) {
    try {
      const refundResult = await processRefund({
        paymentId: booking.razorpayPaymentId || `sim_pay_${booking.bookingRef}`,
        amountInPaise: booking.totalAmountInPaise,
        notes: {
          bookingRef: booking.bookingRef,
          cancellationReason: reason,
          cancelledBy: userId?.toString()
        }
      });
      refundReference = refundResult.refundId;
      booking.paymentStatus = 'REFUNDED';
      booking.refundReference = refundReference;

      // Update corresponding Payment document
      await Payment.findOneAndUpdate(
        { booking: booking._id },
        {
          paymentStatus: 'REFUNDED',
          refundReference,
          refundStatus: refundResult.status || 'PROCESSED'
        }
      );
      logger.info(`Refund processed for booking ${bookingRef}: Ref ${refundReference}, Amount ₹${booking.totalAmountInPaise / 100}`);
    } catch (refundErr) {
      logger.error(`Failed to process refund for booking ${bookingRef}: ${refundErr.message}`);
      const refundError = new Error(`Cancellation failed during refund processing: ${refundErr.message}`);
      refundError.statusCode = 502;
      throw refundError;
    }
  } else if (booking.totalAmountInPaise === 0) {
    booking.paymentStatus = 'REFUNDED';
    booking.refundReference = 'FREE_REGISTRATION';
  }

  booking.bookingStatus = 'CANCELLED';
  booking.cancellationReason = reason;
  booking.cancelledAt = new Date();
  await booking.save();

  logger.info(`Booking ${bookingRef} cancelled with refund status ${booking.paymentStatus} (Ref: ${booking.refundReference || 'N/A'}). Restored ${booking.seatQuantity} seats to workshop ${booking.workshop._id}`);
  return booking;
};

export const updateBookingStatusByAdmin = async ({
  bookingId,
  bookingStatus,
  paymentStatus,
  cancellationReason,
  notes,
  adminId
}) => {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(bookingId);
  const query = isObjectId ? { _id: bookingId } : { bookingRef: bookingId };

  const booking = await Booking.findOne(query).populate('workshop').populate('user', 'name email phone');
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const oldBookingStatus = booking.bookingStatus;
  const oldPaymentStatus = booking.paymentStatus;

  // 1. Inventory adjustments based on booking status transitions
  if (bookingStatus && bookingStatus !== oldBookingStatus) {
    // If was CONFIRMED and now moving to CANCELLED, EXPIRED, or PENDING_PAYMENT
    if (oldBookingStatus === 'CONFIRMED' && bookingStatus !== 'CONFIRMED') {
      if (booking.workshop) {
        await Workshop.findByIdAndUpdate(booking.workshop._id, {
          $inc: { bookedSeats: -booking.seatQuantity }
        });
      }
    }
    // If was NOT CONFIRMED and is now being marked CONFIRMED
    else if (oldBookingStatus !== 'CONFIRMED' && bookingStatus === 'CONFIRMED') {
      if (booking.workshop) {
        await Workshop.findByIdAndUpdate(booking.workshop._id, {
          $inc: { bookedSeats: booking.seatQuantity }
        });
      }
    }

    if (bookingStatus === 'CANCELLED') {
      booking.cancelledAt = new Date();
      booking.cancellationReason = cancellationReason || booking.cancellationReason || 'Status changed to Cancelled by admin';
    } else if (oldBookingStatus === 'CANCELLED' && bookingStatus !== 'CANCELLED') {
      booking.cancelledAt = undefined;
      booking.cancellationReason = '';
    }

    booking.bookingStatus = bookingStatus;
  }

  // 2. Payment status updates
  if (paymentStatus && paymentStatus !== oldPaymentStatus) {
    booking.paymentStatus = paymentStatus;

    if (paymentStatus === 'REFUNDED' && !booking.refundReference) {
      booking.refundReference = `admin_ref_${crypto.randomBytes(4).toString('hex')}`;
    }

    // Keep Payment document in sync if one exists
    await Payment.findOneAndUpdate(
      { booking: booking._id },
      {
        paymentStatus: paymentStatus === 'PAID' ? 'CAPTURED' : paymentStatus,
        ...(paymentStatus === 'REFUNDED' ? { refundReference: booking.refundReference, refundStatus: 'PROCESSED' } : {})
      }
    );
  }

  // 3. Notes update
  if (notes !== undefined) {
    booking.notes = notes;
  }

  await booking.save();

  logger.info(
    `Admin ${adminId} updated booking ${booking.bookingRef} [ID: ${booking._id}]: ` +
    `bookingStatus: ${oldBookingStatus} -> ${booking.bookingStatus}, ` +
    `paymentStatus: ${oldPaymentStatus} -> ${booking.paymentStatus}`
  );

  return booking;
};

