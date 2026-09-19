import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import * as taskService from '../services/task.service';
import type { CreateTaskInput, UpdateTaskInput } from '../validators/task.validator';
import type { TaskStatus } from '../models/Task';

export async function listTasks(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const status = req.query.status as TaskStatus | undefined;
  const tasks = await taskService.listTasks(userId, status);
  res.json({ tasks });
}

export async function getTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const task = await taskService.getTaskById(req.params.id, userId);
  res.json({ task });
}

export async function createTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const { title, description } = req.body as CreateTaskInput;
  const task = await taskService.createTask(title, userId, description);
  res.status(201).json({ task });
}

export async function updateTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.sub;
  const updates = req.body as UpdateTaskInput;
  const task = await taskService.updateTask(req.params.id, userId, updates);
  res.json({ task });
}

export async function deleteTask(req: AuthenticatedRequest, res: Response): Promise<void> {
  const userId = req.user!.sub;
  await taskService.deleteTask(req.params.id, userId);
  res.status(204).send();
}

// Marking a task DONE is intentionally NOT exposed here — it's only reachable
// through the `markTaskDone` GraphQL mutation (see src/graphql), per the
// requirement that this specific action go through a resolver.
