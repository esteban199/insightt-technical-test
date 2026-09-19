import mongoose from 'mongoose';
import { Task } from '../models/Task';
import { AppError } from '../utils/AppError';
import type { TaskLean } from './task.service';

// Marks a task DONE in a single atomic update (filter on status != DONE) so two
// concurrent requests can't both succeed — the loser hits the `!result` branch below
// and gets a 409 instead of silently overwriting doneAt/doneBy.
export async function markAsDone(
  taskId: string,
  ownerId: string
): Promise<TaskLean> {
  const result = await Task.findOneAndUpdate(
    {
      _id: new mongoose.Types.ObjectId(taskId),
      status: { $ne: 'DONE' },
      ownerId,
    },
    {
      $set: {
        status: 'DONE',
        doneAt: new Date(),
        doneBy: ownerId,
      },
      $inc: { version: 1 },
    },
    { new: true, runValidators: true }
  ).lean();

  if (!result) {
    // Distinguish "already done" from "not found" by probing existence
    const exists = await Task.findOne({
      _id: new mongoose.Types.ObjectId(taskId),
      ownerId,
    }).lean();

    if (exists) {
      throw new AppError(409, 'ALREADY_DONE', 'Task is already marked as DONE');
    }
    throw new AppError(404, 'NOT_FOUND', 'Task not found');
  }

  return result;
}
