import { cleanupExpiredReservations } from '../services/reservation.service.js';
import { logger } from '../utils/logger.utils.js';

let intervalId = null;

export const startReservationCleanupWorker = (intervalMs = 60000) => {
  if (intervalId) return;

  logger.info(`Starting reservation cleanup worker (interval: ${intervalMs / 1000}s)`);

  // Run initial cleanup
  cleanupExpiredReservations().catch((err) => {
    logger.error('Error during initial reservation cleanup:', err.message);
  });

  intervalId = setInterval(async () => {
    try {
      await cleanupExpiredReservations();
    } catch (err) {
      logger.error('Error during periodic reservation cleanup:', err.message);
    }
  }, intervalMs);
};

export const stopReservationCleanupWorker = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Reservation cleanup worker stopped.');
  }
};
