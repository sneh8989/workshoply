import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.utils.js';

const bootstrapAdmin = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    logger.info('Connected to MongoDB for admin bootstrapping...');

    const email = process.env.ADMIN_BOOTSTRAP_EMAIL || 'admin@workshoply.dev';
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || 'Admin@Workshoply2026';
    const name = process.env.ADMIN_BOOTSTRAP_NAME || 'snehkheni';

    let admin = await User.findOne({ email: email.toLowerCase() });

    if (admin) {
      admin.role = 'ADMIN';
      const salt = await bcrypt.genSalt(10);
      admin.passwordHash = await bcrypt.hash(password, salt);
      await admin.save();
      logger.info(`Existing user ${email} promoted to ADMIN and password updated.`);
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      admin = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: 'ADMIN',
        bio: 'Chief Operations Administrator for Workshoply.'
      });
      logger.info(`New administrator created: ${email}`);
    }

    logger.info('-----------------------------------------');
    logger.info('Admin Credentials:');
    logger.info(`Email: ${email}`);
    logger.info(`Password: ${password}`);
    logger.info('-----------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Failed to bootstrap administrator:', error.message);
    process.exit(1);
  }
};

bootstrapAdmin();
