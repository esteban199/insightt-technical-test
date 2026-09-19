import mongoose, { Document, Schema } from 'mongoose';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'ARCHIVED';

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  // Cognito `sub` (UUID) of the owning user — there's no local User collection,
  // Cognito is the single source of truth for identity.
  ownerId: string;
  version: number;
  doneAt?: Date;
  doneBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      minlength: 1,
      maxlength: 120,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'DONE', 'ARCHIVED'],
      default: 'PENDING',
      required: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: Number,
      default: 0,
    },
    doneAt: {
      type: Date,
    },
    doneBy: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ ownerId: 1, status: 1 });
taskSchema.index({ ownerId: 1, createdAt: -1 });

export const Task = mongoose.model<ITask>('Task', taskSchema);
