import mongoose from 'mongoose';
import { Task } from '../models/Task';
import { AppError } from '../utils/AppError';
import type { ITask, TaskStatus } from '../models/Task';

// `.lean()` returns a plain object, not a mongoose.Document (no .save() etc.),
// which is all the controllers actually need since they just JSON-serialize it.
export type TaskLean = Omit<ITask, keyof mongoose.Document> & {
  _id: mongoose.Types.ObjectId;
};

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['IN_PROGRESS'],
  IN_PROGRESS: ['DONE'],
  DONE: ['ARCHIVED'],
  ARCHIVED: [],
};

export function assertTransition(from: TaskStatus, to: TaskStatus): void {
  const allowed = STATUS_TRANSITIONS[from];
  if (!allowed || !allowed.includes(to)) {
    throw new AppError(
      400,
      'INVALID_TRANSITION',
      `Cannot transition from ${from} to ${to}`
    );
  }
}

export function assertOwnership(task: { ownerId: string }, userId: string): void {
  if (task.ownerId !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You do not own this task');
  }
}

export async function listTasks(
  ownerId: string,
  status?: TaskStatus
): Promise<TaskLean[]> {
  const filter: Record<string, unknown> = { ownerId };
  if (status) {
    filter.status = status;
  }
  return Task.find(filter).sort({ createdAt: -1 }).lean();
}

export async function getTaskById(
  id: string,
  ownerId: string
): Promise<TaskLean> {
  const task = await Task.findOne({
    _id: new mongoose.Types.ObjectId(id),
    ownerId,
  }).lean();

  if (!task) {
    throw new AppError(404, 'NOT_FOUND', 'Task not found');
  }
  return task;
}

export async function createTask(
  title: string,
  ownerId: string,
  description?: string
): Promise<TaskLean> {
  const task = await Task.create({
    title,
    description: description ?? undefined,
    status: 'PENDING',
    ownerId,
  });
  return task.toObject();
}

// Owner-only, edit-locked when DONE (title fixes still allowed), and status
// changes have to follow STATUS_TRANSITIONS.
export async function updateTask(
  id: string,
  userId: string,
  updates: { title?: string; description?: string; status?: TaskStatus }
): Promise<TaskLean> {
  const task = await Task.findById(id).lean();
  if (!task) {
    throw new AppError(404, 'NOT_FOUND', 'Task not found');
  }

  assertOwnership(task, userId);

  if (task.status === 'DONE') {
    if (updates.description !== undefined) {
      throw new AppError(400, 'EDIT_LOCKED', 'Cannot update description on a DONE task');
    }
    if (updates.status !== undefined) {
      throw new AppError(400, 'EDIT_LOCKED', 'Cannot update status on a DONE task');
    }
  }

  if (updates.status !== undefined && updates.status !== task.status) {
    assertTransition(task.status as TaskStatus, updates.status);
  }

  const updated = await Task.findByIdAndUpdate(
    id,
    {
      $set: {
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.status !== undefined && { status: updates.status }),
      },
      $inc: { version: 1 },
    },
    { new: true, runValidators: true }
  ).lean();

  if (!updated) {
    throw new AppError(404, 'NOT_FOUND', 'Task not found');
  }

  return updated;
}

export async function deleteTask(id: string, userId: string): Promise<void> {
  const task = await Task.findById(id).lean();
  if (!task) {
    throw new AppError(404, 'NOT_FOUND', 'Task not found');
  }

  assertOwnership(task, userId);

  await Task.findByIdAndDelete(id);
}
