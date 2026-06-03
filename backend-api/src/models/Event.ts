import mongoose, { Schema, type HydratedDocument } from 'mongoose';

const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: null },
    startsAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: null, min: 1 },
    location: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deletedAt: { type: Date, default: null, index: true },
    telegramMessageId: { type: Number, default: null },
  },
  { timestamps: true },
);

eventSchema.index({ startsAt: 1, deletedAt: 1 });

export type IEvent = HydratedDocument<typeof eventSchema extends Schema<infer T> ? T : never>;

export const Event = mongoose.model('Event', eventSchema);
