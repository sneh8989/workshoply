import mongoose from 'mongoose';
import slugify from 'slugify';

const instructorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    bio: { type: String, default: '' },
    avatar: { type: String, default: '' }
  },
  { _id: false }
);

const venueSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['ONLINE', 'PHYSICAL', 'HYBRID'],
      default: 'ONLINE'
    },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    meetingLink: { type: String, default: '' }
  },
  { _id: false }
);

const workshopSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Workshop title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      maxlength: [300, 'Short description cannot exceed 300 characters']
    },
    description: {
      type: String,
      required: [true, 'Full description is required']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true
    },
    coverImage: {
      type: String,
      required: [true, 'Cover image URL is required']
    },
    instructor: {
      type: instructorSchema,
      required: [true, 'Instructor details are required']
    },
    priceInPaise: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price in paise cannot be negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    venue: {
      type: venueSchema,
      default: () => ({})
    },
    deliveryMode: {
      type: String,
      enum: ['ONLINE', 'IN_PERSON', 'HYBRID'],
      default: 'ONLINE',
      index: true
    },
    startDateTime: {
      type: Date,
      required: [true, 'Start date & time is required'],
      index: true
    },
    endDateTime: {
      type: Date,
      required: [true, 'End date & time is required']
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required']
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1 seat']
    },
    bookedSeats: {
      type: Number,
      default: 0,
      min: 0
    },
    reservedSeats: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
      default: 'PUBLISHED',
      index: true
    },
    skillLevel: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS'],
      default: 'ALL_LEVELS',
      index: true
    },
    prerequisites: {
      type: [String],
      default: []
    },
    whatYouWillLearn: {
      type: [String],
      default: []
    },
    cancellationPolicy: {
      type: String,
      default: 'Free cancellation up to 48 hours before the workshop start time.'
    },
    ratingAverage: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

workshopSchema.index({ title: 'text', shortDescription: 'text', description: 'text' });
workshopSchema.index({ category: 1, status: 1, startDateTime: 1 });
workshopSchema.index({ priceInPaise: 1, ratingAverage: -1 });

workshopSchema.virtual('availableSeats').get(function () {
  const available = this.capacity - (this.bookedSeats + (this.reservedSeats || 0));
  return Math.max(0, available);
});

workshopSchema.virtual('availabilityState').get(function () {
  if (this.status === 'CANCELLED') return 'CANCELLED';
  const now = new Date();
  if (this.registrationDeadline && now > this.registrationDeadline) return 'REGISTRATION_CLOSED';
  const available = this.capacity - (this.bookedSeats + (this.reservedSeats || 0));
  if (available <= 0) return 'SOLD_OUT';
  if (available <= Math.max(3, Math.floor(this.capacity * 0.2))) return 'FILLING_FAST';
  return 'AVAILABLE';
});

workshopSchema.pre('validate', function (next) {
  if (this.title && (!this.slug || this.isModified('title'))) {
    this.slug = slugify(this.title, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 7);
  }
  next();
});

export const Workshop = mongoose.model('Workshop', workshopSchema);
