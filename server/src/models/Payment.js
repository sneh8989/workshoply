import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    razorpayOrderId: {
      type: String,
      required: true,
      index: true
    },
    razorpayPaymentId: {
      type: String,
      index: true
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    paymentStatus: {
      type: String,
      enum: ['CREATED', 'CAPTURED', 'FAILED', 'REFUNDED'],
      default: 'CREATED',
      index: true
    },
    signatureVerificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'FAILED'],
      default: 'PENDING'
    },
    method: {
      type: String,
      default: ''
    },
    webhookEventReference: {
      type: String,
      default: ''
    },
    refundReference: {
      type: String,
      default: ''
    },
    refundStatus: {
      type: String,
      default: ''
    },
    errorReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ razorpayOrderId: 1, razorpayPaymentId: 1 });
paymentSchema.index({ paymentStatus: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
