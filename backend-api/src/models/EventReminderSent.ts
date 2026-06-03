import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import type { ReminderOffset } from '../utils/reminderOffsets.js';

const eventReminderSentSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    offset: { type: String, required: true },
    sentAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: false },
);

eventReminderSentSchema.index({ eventId: 1, offset: 1 }, { unique: true });

export type IEventReminderSent = HydratedDocument<
  typeof eventReminderSentSchema extends Schema<infer T> ? T : never
>;

export const EventReminderSent = mongoose.model('EventReminderSent', eventReminderSentSchema);

export type { ReminderOffset };
