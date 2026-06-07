import mongoose from 'mongoose';
import { config } from './config.js';
import { User } from './models/User.js';

export async function connectDb(): Promise<void> {
  await mongoose.connect(config.mongodbUri);
  await migrateUserCalendarFeedTokens();
}

/** Убирает calendarFeedToken: null — иначе E11000 при регистрации новых пользователей */
async function migrateUserCalendarFeedTokens(): Promise<void> {
  const result = await User.updateMany(
    { calendarFeedToken: null },
    { $unset: { calendarFeedToken: 1 } },
  );
  if (result.modifiedCount > 0) {
    console.log(`Users: unset calendarFeedToken on ${result.modifiedCount} document(s)`);
  }

  try {
    await User.syncIndexes();
  } catch (error) {
    console.error('Users: syncIndexes failed:', error);
  }
}
