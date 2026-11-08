import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    status: {
      type: String,
      enum: ['PROCESSED', 'FAILED', 'IGNORED'],
      default: 'PROCESSED'
    },
    processedAt: {
      type: Date,
      default: Date.now
    },
    error: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
