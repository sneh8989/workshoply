import { Router } from 'express';
import * as workshopController from '../controllers/workshop.controller.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { workshopFilterSchema } from '../validators/workshop.validator.js';

const router = Router();

router.get('/', validateQuery(workshopFilterSchema), workshopController.getWorkshops);
router.get('/featured', workshopController.getFeaturedWorkshops);
router.get('/:identifier', workshopController.getWorkshop);
router.get('/:identifier/availability', workshopController.getWorkshopAvailability);
router.get('/:identifier/reviews', workshopController.getWorkshopReviews);
router.post('/:identifier/reviews', authenticate, workshopController.addWorkshopReview);

export default router;
