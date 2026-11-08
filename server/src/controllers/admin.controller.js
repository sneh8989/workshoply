import * as analyticsService from '../services/analytics.service.js';
import * as workshopService from '../services/workshop.service.js';
import * as bookingService from '../services/booking.service.js';
import { Booking } from '../models/Booking.js';
import { Workshop } from '../models/Workshop.js';
import { User } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.utils.js';

export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const overview = await analyticsService.getOverviewMetrics();
    return sendSuccess(res, 200, 'Analytics overview retrieved', overview);
  } catch (error) {
    next(error);
  }
};

export const getAdminWorkshops = async (req, res, next) => {
  try {
    const result = await workshopService.listWorkshops(req.query, true);
    return sendSuccess(res, 200, 'Admin workshops retrieved', result.workshops, result.pagination);
  } catch (error) {
    next(error);
  }
};

export const createWorkshop = async (req, res, next) => {
  try {
    const workshop = await workshopService.createWorkshop(req.body);
    return sendSuccess(res, 201, 'Workshop created successfully', workshop);
  } catch (error) {
    next(error);
  }
};

export const updateWorkshop = async (req, res, next) => {
  try {
    const workshop = await workshopService.updateWorkshop(req.params.id, req.body);
    return sendSuccess(res, 200, 'Workshop updated successfully', workshop);
  } catch (error) {
    next(error);
  }
};

export const toggleWorkshopPublish = async (req, res, next) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return sendError(res, 404, 'Workshop not found');
    }

    workshop.status = workshop.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    await workshop.save();

    return sendSuccess(res, 200, `Workshop status set to ${workshop.status}`, workshop);
  } catch (error) {
    next(error);
  }
};

export const cancelWorkshop = async (req, res, next) => {
  try {
    const workshop = await workshopService.deleteWorkshop(req.params.id);
    return sendSuccess(res, 200, 'Workshop cancelled', workshop);
  } catch (error) {
    next(error);
  }
};

export const getAdminBookings = async (req, res, next) => {
  try {
    const { workshopId, bookingStatus, paymentStatus, search, page = 1, limit = 15 } = req.query;
    const query = {};

    if (workshopId) query.workshop = workshopId;
    if (bookingStatus) query.bookingStatus = bookingStatus;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (search && search.trim()) {
      query.$or = [
        { bookingRef: { $regex: search.trim(), $options: 'i' } },
        { razorpayOrderId: { $regex: search.trim(), $options: 'i' } },
        { razorpayPaymentId: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('workshop', 'title priceInPaise category')
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Booking.countDocuments(query)
    ]);

    return sendSuccess(res, 200, 'Admin bookings retrieved', bookings, {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      pages: Math.ceil(total / parseInt(limit, 10))
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const booking = await bookingService.updateBookingStatusByAdmin({
      bookingId: req.params.id,
      ...req.body,
      adminId: req.user._id
    });
    return sendSuccess(res, 200, 'Booking status updated successfully', booking);
  } catch (error) {
    next(error);
  }
};

export const exportBookingsCsv = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('workshop', 'title priceInPaise category startDateTime')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    const headers = [
      'Booking Reference',
      'Workshop Title',
      'Workshop Category',
      'User Name',
      'User Email',
      'Seats',
      'Total Amount (INR)',
      'Booking Status',
      'Payment Status',
      'Razorpay Order ID',
      'Razorpay Payment ID',
      'Created Date'
    ];

    const rows = bookings.map((b) => [
      b.bookingRef,
      `"${(b.workshop?.title || 'N/A').replace(/"/g, '""')}"`,
      b.workshop?.category || 'N/A',
      `"${(b.user?.name || 'N/A').replace(/"/g, '""')}"`,
      b.user?.email || 'N/A',
      b.seatQuantity,
      (b.totalAmountInPaise / 100).toFixed(2),
      b.bookingStatus,
      b.paymentStatus,
      b.razorpayOrderId || '',
      b.razorpayPaymentId || '',
      new Date(b.createdAt).toISOString()
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="workshoply-bookings-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('name email role phone createdAt').sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Users retrieved', users);
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent administrator from deleting their own account
    const currentAdminId = req.user?.id || req.user?._id;
    if (currentAdminId && currentAdminId.toString() === id.toString()) {
      return sendError(res, 400, 'Administrators cannot delete their own account.');
    }

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    await User.findByIdAndDelete(id);

    return sendSuccess(res, 200, `User "${user.name}" (${user.email}) deleted successfully.`, {
      deletedUserId: user._id
    });
  } catch (error) {
    next(error);
  }
};
