import mongoose, { Schema, type HydratedDocument } from 'mongoose';
import type { UserRole } from '../types/index.js';

const userSchema = new Schema(
  {
    telegramId: { type: Number, required: true, unique: true, index: true },
    username: { type: String, default: null },
    firstName: { type: String, required: true },
    lastName: { type: String, default: null },
    displayName: { type: String, default: null, trim: true, maxlength: 100 },
    photoUrl: { type: String, default: null },
    role: { type: String, enum: ['member', 'admin'] satisfies UserRole[], required: true },
    // Без default: null — иначе unique+sparse всё равно конфликтует на втором null
    calendarFeedToken: { type: String, unique: true, sparse: true },
  },
  { timestamps: true },
);

export type IUser = HydratedDocument<typeof userSchema extends Schema<infer T> ? T : never>;

export const User = mongoose.model('User', userSchema);
