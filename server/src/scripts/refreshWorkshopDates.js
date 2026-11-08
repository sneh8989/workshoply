import mongoose from 'mongoose';
import { env } from '../config/env.js';

async function refreshDates() {
  await mongoose.connect(env.MONGODB_URI);
  const db = mongoose.connection.db;
  const now = new Date();
  const workshops = await db.collection('workshops').find({}).toArray();

  for (let i = 0; i < workshops.length; i++) {
    const w = workshops[i];
    const daysOffset = 5 + (i * 2);
    const start = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    const deadline = new Date(now.getTime() + (daysOffset - 1) * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 4 * 60 * 60 * 1000);
    await db.collection('workshops').updateOne(
      { _id: w._id },
      {
        $set: {
          startDateTime: start,
          registrationDeadline: deadline,
          endDateTime: end,
          bookedSeats: 0,
          reservedSeats: 0
        }
      }
    );
  }

  console.log(`✓ Refreshed ${workshops.length} workshop dates forward from ${now.toISOString()}`);
  await mongoose.disconnect();
}

refreshDates().catch(console.error);

