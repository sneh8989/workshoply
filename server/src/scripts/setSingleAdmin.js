import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

async function setSingleAdmin() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Update the admin user's name to 'snehkheni'
    const admin = await User.findOneAndUpdate(
      { role: 'ADMIN' },
      { $set: { name: 'snehkheni' } },
      { new: true }
    );

    if (admin) {
      console.log('Updated Admin:', admin.name, admin.email, admin.role);
    } else {
      console.log('No admin found, creating snehkheni admin...');
    }

    // 2. Remove every other user from the database
    const deleteResult = await User.deleteMany({
      _id: { $ne: admin._id }
    });
    console.log(`Removed ${deleteResult.deletedCount} non-admin user(s).`);

    // 3. Output remaining users in the database
    const remaining = await User.find({}, { name: 1, email: 1, role: 1 });
    console.log('Current Users in Database:', JSON.stringify(remaining, null, 2));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error setting single admin:', error);
    process.exit(1);
  }
}

setSingleAdmin();
