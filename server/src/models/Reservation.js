import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    bookingRef: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    workshopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    seatCount: {
      type: Number,
      required: true,
      min: 1
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'CONFIRMED', 'EXPIRED', 'RELEASED'],
      default: 'ACTIVE',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// TTL index to automatically purge old completed/expired reservation records after 24h
reservationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export const Reservation = mongoose.model('Reservation', reservationSchema);
