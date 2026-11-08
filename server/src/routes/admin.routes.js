import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createWorkshopSchema, updateWorkshopSchema } from '../validators/workshop.validator.js';
import { updateBookingStatusSchema } from '../validators/booking.validator.js';

const router = Router();

// Enforce authentication & administrator role on all admin routes
router.use(authenticate, requireAdmin);

router.get('/analytics/overview', adminController.getAnalyticsOverview);
router.get('/workshops', adminController.getAdminWorkshops);
router.post('/workshops', validateBody(createWorkshopSchema), adminController.createWorkshop);
router.patch('/workshops/:id', validateBody(updateWorkshopSchema), adminController.updateWorkshop);
router.patch('/workshops/:id/toggle-publish', adminController.toggleWorkshopPublish);
router.delete('/workshops/:id', adminController.cancelWorkshop);

router.get('/bookings', adminController.getAdminBookings);
router.patch('/bookings/:id/status', validateBody(updateBookingStatusSchema), adminController.updateBookingStatus);
router.get('/bookings/export-csv', adminController.exportBookingsCsv);
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.deleteUser);

export default router;
