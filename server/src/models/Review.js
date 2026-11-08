import mongoose from 'mongoose';
import { Workshop } from './Workshop.js';

const reviewSchema = new mongoose.Schema(
  {
    workshop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required (1-5)'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ workshop: 1, user: 1 }, { unique: true });

async function updateWorkshopRatings(workshopId) {
  const stats = await mongoose.model('Review').aggregate([
    { $match: { workshop: workshopId } },
    {
      $group: {
        _id: '$workshop',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Workshop.findByIdAndUpdate(workshopId, {
      ratingAverage: Math.round(stats[0].avgRating * 10) / 10,
      ratingCount: stats[0].totalReviews
    });
  } else {
    await Workshop.findByIdAndUpdate(workshopId, {
      ratingAverage: 0,
      ratingCount: 0
    });
  }
}

reviewSchema.post('save', async function () {
  await updateWorkshopRatings(this.workshop);
});

reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await updateWorkshopRatings(doc.workshop);
  }
});

export const Review = mongoose.model('Review', reviewSchema);
