import * as workshopService from '../services/workshop.service.js';
import { Review } from '../models/Review.js';
import { Booking } from '../models/Booking.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';

export const getWorkshops = async (req, res, next) => {
  try {
    const result = await workshopService.listWorkshops(req.query, false);
    return sendSuccess(res, 200, 'Workshops retrieved', result.workshops, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const getFeaturedWorkshops = async (req, res, next) => {
  try {
    const result = await workshopService.listWorkshops(
      { sort: 'rating', limit: 6 },
      false
    );
    return sendSuccess(res, 200, 'Featured workshops retrieved', result.workshops);
  } catch (error) {
    next(error);
  }
};

export const getWorkshop = async (req, res, next) => {
  try {
    const workshop = await workshopService.getWorkshopBySlugOrId(req.params.identifier);
    return sendSuccess(res, 200, 'Workshop details retrieved', workshop);
  } catch (error) {
    next(error);
  }
};

export const getWorkshopAvailability = async (req, res, next) => {
  try {
    const availability = await workshopService.getWorkshopAvailability(req.params.identifier);
    return sendSuccess(res, 200, 'Workshop availability retrieved', availability);
  } catch (error) {
    next(error);
  }
};

export const getWorkshopReviews = async (req, res, next) => {
  try {
    const workshop = await workshopService.getWorkshopBySlugOrId(req.params.identifier);
    const reviews = await Review.find({ workshop: workshop._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Reviews retrieved', reviews);
  } catch (error) {
    next(error);
  }
};

export const addWorkshopReview = async (req, res, next) => {
  try {
    const workshop = await workshopService.getWorkshopBySlugOrId(req.params.identifier);
    const userId = req.user.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return sendError(res, 400, 'Rating must be between 1 and 5');
    }
    if (!comment || !comment.trim()) {
      return sendError(res, 400, 'Comment is required');
    }

    // Check if user has an existing confirmed booking for this workshop
    const booking = await Booking.findOne({
      user: userId,
      workshop: workshop._id,
      bookingStatus: 'CONFIRMED'
    });

    if (!booking && req.user.role !== 'ADMIN') {
      return sendError(res, 403, 'You can only review workshops you have confirmed bookings for');
    }

    const review = await Review.findOneAndUpdate(
      { workshop: workshop._id, user: userId },
      { rating, comment: comment.trim() },
      { upsert: true, new: true, runValidators: true }
    );

    return sendSuccess(res, 201, 'Review submitted successfully', review);
  } catch (error) {
    next(error);
  }
};
