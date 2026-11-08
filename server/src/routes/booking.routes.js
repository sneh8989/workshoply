import { Router } from 'express';
import * as bookingController from '../controllers/booking.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { bookingLimiter } from '../middleware/rateLimiter.middleware.js';
import { createBookingSchema, cancelBookingSchema } from '../validators/booking.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', bookingLimiter, validateBody(createBookingSchema), bookingController.createBooking);
router.get('/my', bookingController.getMyBookings);
router.get('/:bookingRef', bookingController.getBookingByRef);
router.post('/:bookingRef/cancel', validateBody(cancelBookingSchema), bookingController.cancelBooking);

export default router;
