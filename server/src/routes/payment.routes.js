import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { verifyPaymentSchema } from '../validators/booking.validator.js';

const router = Router();

router.get('/config', paymentController.getPaymentConfig);
router.post('/verify', authenticate, validateBody(verifyPaymentSchema), paymentController.verifyPayment);

export default router;
