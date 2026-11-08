import { z } from 'zod';

export const createBookingSchema = z.object({
  workshopId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid workshop ID format'),
  seatQuantity: z.number().int().min(1, 'You must book at least 1 seat').max(10, 'Maximum 10 seats per booking'),
  attendeeDetails: z.array(
    z.object({
      name: z.string().min(2, 'Attendee name must be at least 2 characters'),
      email: z.string().email('Please enter a valid attendee email'),
      phone: z.string().optional().default('')
    })
  ).min(1, 'Attendee details are required'),
  notes: z.string().optional().default('')
});

export const verifyPaymentSchema = z.object({
  bookingRef: z.string().min(1, 'Booking reference is required'),
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required')
});

export const cancelBookingSchema = z.object({
  reason: z.string().max(300, 'Cancellation reason cannot exceed 300 characters').optional().default('Cancelled by user')
});

export const updateBookingStatusSchema = z.object({
  bookingStatus: z.enum(['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'EXPIRED']).optional(),
  paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
  cancellationReason: z.string().max(300, 'Cancellation reason cannot exceed 300 characters').optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
}).refine((data) => data.bookingStatus !== undefined || data.paymentStatus !== undefined, {
  message: 'At least one of bookingStatus or paymentStatus must be provided'
});

