import * as bookingService from '../services/booking.service.js';
import { sendSuccess } from '../utils/response.utils.js';

export const createBooking = async (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      const error = new Error('Administrators are not permitted to book workshops. Only regular users can book workshops.');
      error.statusCode = 403;
      throw error;
    }

    const result = await bookingService.createBooking({
      userId: req.user.id,
      userRole: req.user.role,
      workshopId: req.body.workshopId,
      seatQuantity: req.body.seatQuantity,
      attendeeDetails: req.body.attendeeDetails,
      notes: req.body.notes
    });

    return sendSuccess(res, 201, 'Booking initiated', result);
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await bookingService.getUserBookings(req.user.id, {
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10
    });

    return sendSuccess(res, 200, 'User bookings retrieved', result.bookings, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getBookingByRef = async (req, res, next) => {
  try {
    const result = await bookingService.getBookingDetails(
      req.params.bookingRef,
      req.user.id,
      req.user.role
    );
    return sendSuccess(res, 200, 'Booking details retrieved', result);
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const result = await bookingService.cancelBooking(
      req.params.bookingRef,
      req.user.id,
      req.user.role,
      req.body.reason
    );
    return sendSuccess(res, 200, 'Booking cancelled successfully', result);
  } catch (error) {
    next(error);
  }
};
