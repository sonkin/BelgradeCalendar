import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import type { RsvpStatus } from '../types/index.js';

const eventParticipantSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['going', 'maybe', 'not_going'] satisfies RsvpStatus[],
      required: true,
    },
  },
  { timestamps: { createdAt: false, updatedAt: true } },
);

eventParticipantSchema.index({ eventId: 1, userId: 1 }, { unique: true });
eventParticipantSchema.index({ eventId: 1, status: 1 });

export type IEventParticipant = HydratedDocument<
  typeof eventParticipantSchema extends Schema<infer T> ? T : never
>;

export const EventParticipant = mongoose.model('EventParticipant', eventParticipantSchema);
