import mongoose from 'mongoose';
import { env } from '../config/env.js';

async function clearData() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;

  await db.collection('bookings').deleteMany({});
  await db.collection('payments').deleteMany({});
  await db.collection('reservations').deleteMany({});
  await db.collection('users').deleteMany({ role: { $ne: 'ADMIN' } });
  await db.collection('workshops').updateMany({}, { $set: { bookedSeats: 0, reservedSeats: 0 } });

  const remainingUsers = await db.collection('users').find({}).toArray();
  const bookingsCount = await db.collection('bookings').countDocuments();
  const paymentsCount = await db.collection('payments').countDocuments();

  console.log('✓ Clean state verified:');
  console.log('  Users:', remainingUsers.map(u => `${u.name} (${u.role})`));
  console.log('  Bookings:', bookingsCount);
  console.log('  Payments:', paymentsCount);

  await mongoose.disconnect();
}

clearData().catch(console.error);

