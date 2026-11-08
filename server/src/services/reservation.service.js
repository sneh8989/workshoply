import { Workshop } from '../models/Workshop.js';
import { Reservation } from '../models/Reservation.js';
import { Booking } from '../models/Booking.js';
import { logger } from '../utils/logger.utils.js';

export const reserveSeats = async ({ workshopId, userId, seatCount, bookingRef }) => {
  const workshop = await Workshop.findById(workshopId);
  if (!workshop) {
    const error = new Error('Workshop not found');
    error.statusCode = 404;
    throw error;
  }

  if (workshop.status !== 'PUBLISHED') {
    const error = new Error(`Workshop is not open for bookings (status: ${workshop.status})`);
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (workshop.registrationDeadline && now > workshop.registrationDeadline) {
    const error = new Error('Registration deadline for this workshop has passed');
    error.statusCode = 400;
    throw error;
  }

  // Atomic condition: capacity - (bookedSeats + reservedSeats) >= seatCount
  const updatedWorkshop = await Workshop.findOneAndUpdate(
    {
      _id: workshopId,
      status: 'PUBLISHED',
      $expr: {
        $gte: [
          { $subtract: ['$capacity', { $add: ['$bookedSeats', { $ifNull: ['$reservedSeats', 0] }] }] },
          seatCount
        ]
      }
    },
    {
      $inc: { reservedSeats: seatCount }
    },
    { new: true }
  );

  if (!updatedWorkshop) {
    const error = new Error('Not enough seats available to fulfill your booking request');
    error.statusCode = 409;
    throw error;
  }

  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes hold

  const reservation = await Reservation.create({
    bookingRef,
    workshopId,
    userId,
    seatCount,
    expiresAt,
    status: 'ACTIVE'
  });

  logger.info(`Reserved ${seatCount} seats for booking ${bookingRef} on workshop ${workshopId}`);
  return { reservation, expiresAt };
};

export const confirmReservation = async ({ bookingRef }) => {
  const reservation = await Reservation.findOne({ bookingRef, status: 'ACTIVE' });
  if (!reservation) {
    logger.warn(`No active reservation found to confirm for booking ${bookingRef}`);
    return null;
  }

  // Atomically convert reservedSeats to bookedSeats
  await Workshop.findByIdAndUpdate(reservation.workshopId, {
    $inc: {
      reservedSeats: -reservation.seatCount,
      bookedSeats: reservation.seatCount
    }
  });

  reservation.status = 'CONFIRMED';
  await reservation.save();

  logger.info(`Confirmed reservation for booking ${bookingRef}`);
  return reservation;
};

export const releaseReservation = async ({ bookingRef }) => {
  const reservation = await Reservation.findOne({ bookingRef, status: 'ACTIVE' });
  if (!reservation) {
    return null;
  }

  // Atomically release the held seats
  await Workshop.findByIdAndUpdate(reservation.workshopId, {
    $inc: { reservedSeats: -reservation.seatCount }
  });

  reservation.status = 'RELEASED';
  await reservation.save();

  logger.info(`Released held seats for booking ${bookingRef}`);
  return reservation;
};

export const cleanupExpiredReservations = async () => {
  const now = new Date();
  const expired = await Reservation.find({
    status: 'ACTIVE',
    expiresAt: { $lt: now }
  });

  let count = 0;
  for (const res of expired) {
    try {
      await Workshop.findByIdAndUpdate(res.workshopId, {
        $inc: { reservedSeats: -res.seatCount }
      });

      res.status = 'EXPIRED';
      await res.save();

      // Mark associated booking as expired if still pending
      await Booking.findOneAndUpdate(
        { bookingRef: res.bookingRef, bookingStatus: 'PENDING_PAYMENT' },
        { bookingStatus: 'EXPIRED', cancellationReason: 'Reservation payment window expired' }
      );
      count++;
    } catch (err) {
      logger.error(`Error cleaning up expired reservation ${res.bookingRef}:`, err.message);
    }
  }

  if (count > 0) {
    logger.info(`Cleaned up ${count} expired reservations`);
  }
  return count;
};
