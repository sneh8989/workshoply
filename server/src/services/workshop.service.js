import { Workshop } from '../models/Workshop.js';
import mongoose from 'mongoose';

export const listWorkshops = async (filters = {}, isAdmin = false) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    city,
    deliveryMode,
    skillLevel,
    date,
    sort = 'date_asc',
    page = 1,
    limit = 12
  } = filters;

  const query = {};

  if (!isAdmin) {
    query.status = 'PUBLISHED';
  } else if (filters.status) {
    query.status = filters.status;
  }

  if (category && category !== 'All') {
    query.category = category;
  }

  if (deliveryMode && deliveryMode !== 'ALL') {
    query.deliveryMode = deliveryMode;
  }

  if (skillLevel && skillLevel !== 'ALL_LEVELS') {
    query.skillLevel = skillLevel;
  }

  if (city) {
    query['venue.city'] = new RegExp(city, 'i');
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.priceInPaise = {};
    if (minPrice !== undefined) query.priceInPaise.$gte = minPrice * 100;
    if (maxPrice !== undefined) query.priceInPaise.$lte = maxPrice * 100;
  }

  if (date) {
    const selectedDate = new Date(date);
    if (!isNaN(selectedDate.getTime())) {
      query.startDateTime = { $gte: selectedDate };
    }
  }

  if (search && search.trim()) {
    const cleanSearch = search.trim();
    query.$or = [
      { title: { $regex: cleanSearch, $options: 'i' } },
      { shortDescription: { $regex: cleanSearch, $options: 'i' } },
      { 'instructor.name': { $regex: cleanSearch, $options: 'i' } },
      { category: { $regex: cleanSearch, $options: 'i' } }
    ];
  }

  let sortOption = { startDateTime: 1 };
  if (sort === 'date_desc') sortOption = { startDateTime: -1 };
  else if (sort === 'price_asc') sortOption = { priceInPaise: 1 };
  else if (sort === 'price_desc') sortOption = { priceInPaise: -1 };
  else if (sort === 'rating') sortOption = { ratingAverage: -1, ratingCount: -1 };
  else if (sort === 'popular') sortOption = { bookedSeats: -1 };

  const skip = (page - 1) * limit;

  const [workshops, total] = await Promise.all([
    Workshop.find(query).sort(sortOption).skip(skip).limit(limit),
    Workshop.countDocuments(query)
  ]);

  return {
    workshops,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getWorkshopBySlugOrId = async (identifier) => {
  let query = { slug: identifier };
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    query = { $or: [{ _id: identifier }, { slug: identifier }] };
  }

  const workshop = await Workshop.findOne(query);
  if (!workshop) {
    const error = new Error('Workshop not found');
    error.statusCode = 404;
    throw error;
  }
  return workshop;
};

export const getWorkshopAvailability = async (identifier) => {
  const workshop = await getWorkshopBySlugOrId(identifier);
  return {
    id: workshop._id,
    title: workshop.title,
    capacity: workshop.capacity,
    bookedSeats: workshop.bookedSeats,
    reservedSeats: workshop.reservedSeats || 0,
    availableSeats: workshop.availableSeats,
    availabilityState: workshop.availabilityState,
    status: workshop.status,
    registrationDeadline: workshop.registrationDeadline
  };
};

export const createWorkshop = async (data) => {
  return Workshop.create(data);
};

export const updateWorkshop = async (id, data) => {
  const workshop = await Workshop.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
  if (!workshop) {
    const error = new Error('Workshop not found');
    error.statusCode = 404;
    throw error;
  }
  return workshop;
};

export const deleteWorkshop = async (id) => {
  const workshop = await Workshop.findByIdAndUpdate(id, { status: 'CANCELLED' }, { new: true });
  if (!workshop) {
    const error = new Error('Workshop not found');
    error.statusCode = 404;
    throw error;
  }
  return workshop;
};
