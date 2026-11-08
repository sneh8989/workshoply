import { Workshop } from '../models/Workshop.js';
import { Booking } from '../models/Booking.js';
import { Payment } from '../models/Payment.js';

export const getOverviewMetrics = async () => {
  const now = new Date();

  const [
    totalWorkshops,
    publishedWorkshops,
    upcomingWorkshops,
    totalBookings,
    confirmedBookings,
    pendingPaymentsCount,
    revenueStats
  ] = await Promise.all([
    Workshop.countDocuments(),
    Workshop.countDocuments({ status: 'PUBLISHED' }),
    Workshop.countDocuments({ status: 'PUBLISHED', startDateTime: { $gt: now } }),
    Booking.countDocuments(),
    Booking.countDocuments({ bookingStatus: 'CONFIRMED' }),
    Booking.countDocuments({ paymentStatus: 'PENDING' }),
    // Aggregate ONLY captured/paid payments for financial metrics
    Payment.aggregate([
      { $match: { paymentStatus: 'CAPTURED' } },
      { $group: { _id: null, totalRevenuePaise: { $sum: '$amountInPaise' } } }
    ])
  ]);

  const totalRevenuePaise = revenueStats.length > 0 ? revenueStats[0].totalRevenuePaise : 0;

  // Booking trends over the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const bookingTrends = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
        bookingStatus: 'CONFIRMED'
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenuePaise: { $sum: '$totalAmountInPaise' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // Workshop seat utilization & popularity
  const workshops = await Workshop.find({ status: { $ne: 'DRAFT' } })
    .select('title category capacity bookedSeats priceInPaise status startDateTime')
    .sort({ bookedSeats: -1 })
    .limit(10);

  const workshopPerformance = workshops.map((w) => ({
    id: w._id,
    title: w.title,
    category: w.category,
    capacity: w.capacity,
    bookedSeats: w.bookedSeats,
    utilizationRate: Math.round((w.bookedSeats / (w.capacity || 1)) * 100),
    totalRevenueInPaise: w.bookedSeats * w.priceInPaise,
    status: w.status,
    startDateTime: w.startDateTime
  }));

  return {
    metrics: {
      totalWorkshops,
      publishedWorkshops,
      upcomingWorkshops,
      totalBookings,
      confirmedBookings,
      pendingPaymentsCount,
      totalRevenuePaise,
      totalRevenueRupees: totalRevenuePaise / 100
    },
    bookingTrends,
    workshopPerformance
  };
};

export const getRevenueReport = async () => {
  const verifiedPayments = await Payment.aggregate([
    { $match: { paymentStatus: 'CAPTURED' } },
    {
      $lookup: {
        from: 'bookings',
        localField: 'booking',
        foreignField: '_id',
        as: 'bookingDetails'
      }
    },
    { $unwind: { path: '$bookingDetails', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'workshops',
        localField: 'bookingDetails.workshop',
        foreignField: '_id',
        as: 'workshopDetails'
      }
    },
    { $unwind: { path: '$workshopDetails', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        razorpayOrderId: 1,
        razorpayPaymentId: 1,
        amountInPaise: 1,
        paymentStatus: 1,
        createdAt: 1,
        bookingRef: '$bookingDetails.bookingRef',
        workshopTitle: '$workshopDetails.title',
        workshopCategory: '$workshopDetails.category'
      }
    },
    { $sort: { createdAt: -1 } }
  ]);

  return verifiedPayments;
};
