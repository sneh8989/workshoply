import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { logger } from './utils/logger.utils.js';
import { startReservationCleanupWorker, stopReservationCleanupWorker } from './jobs/reservationCleanup.job.js';

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      logger.info(`Workshoply Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      logger.info(`Health check accessible at http://localhost:${env.PORT}/api/health`);
      logger.info(`API endpoints available at http://localhost:${env.PORT}/api/v1`);
    });

    // Start background reservation cleanup job
    startReservationCleanupWorker(60000);

    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Gracefully shutting down...`);
      stopReservationCleanupWorker();
      server.close(async () => {
        logger.info('HTTP server closed.');
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
