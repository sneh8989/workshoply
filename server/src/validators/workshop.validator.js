import { z } from 'zod';

export const baseWorkshopSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  shortDescription: z.string().min(10, 'Short description must be at least 10 characters').max(300),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Category is required'),
  coverImage: z.string().min(1, 'Cover image is required'),
  instructor: z.object({
    name: z.string().min(2, 'Instructor name is required'),
    title: z.string().min(2, 'Instructor title is required'),
    bio: z.string().optional().default(''),
    avatar: z.string().optional().default('')
  }),
  priceInPaise: z.number().int().min(0, 'Price in paise cannot be negative'),
  currency: z.string().default('INR'),
  venue: z.object({
    type: z.enum(['ONLINE', 'PHYSICAL', 'HYBRID']).default('ONLINE'),
    address: z.string().optional().default(''),
    city: z.string().optional().default(''),
    meetingLink: z.string().optional().default('')
  }).optional().default({ type: 'ONLINE' }),
  deliveryMode: z.enum(['ONLINE', 'IN_PERSON', 'HYBRID']).default('ONLINE'),
  startDateTime: z.string().or(z.date()).transform((val) => new Date(val)),
  endDateTime: z.string().or(z.date()).transform((val) => new Date(val)),
  registrationDeadline: z.string().or(z.date()).transform((val) => new Date(val)),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'ALL_LEVELS']).default('ALL_LEVELS'),
  prerequisites: z.array(z.string()).optional().default([]),
  whatYouWillLearn: z.array(z.string()).optional().default([]),
  cancellationPolicy: z.string().optional().default('Free cancellation up to 48 hours before the workshop start time.'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED']).optional().default('PUBLISHED')
});

export const createWorkshopSchema = baseWorkshopSchema.refine((data) => data.endDateTime > data.startDateTime, {
  message: 'End date/time must be strictly after start date/time',
  path: ['endDateTime']
}).refine((data) => data.registrationDeadline <= data.startDateTime, {
  message: 'Registration deadline cannot be after workshop start time',
  path: ['registrationDeadline']
});

export const updateWorkshopSchema = baseWorkshopSchema.partial();

export const workshopFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  maxPrice: z.string().optional().transform((v) => (v ? parseInt(v, 10) : undefined)),
  city: z.string().optional(),
  deliveryMode: z.string().optional(),
  skillLevel: z.string().optional(),
  date: z.string().optional(),
  sort: z.enum(['date_asc', 'date_desc', 'price_asc', 'price_desc', 'rating', 'popular']).optional().default('date_asc'),
  page: z.string().optional().transform((v) => (v ? Math.max(1, parseInt(v, 10)) : 1)),
  limit: z.string().optional().transform((v) => (v ? Math.min(50, Math.max(1, parseInt(v, 10))) : 12))
});
