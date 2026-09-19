import { z } from 'zod';

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

export const idParamSchema = z.object({
  id: z.string().regex(objectIdPattern, 'Invalid task ID format'),
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120, 'Title must be at most 120 characters'),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
});

export const updateTaskSchema = createTaskSchema
  .partial()
  .extend({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'DONE', 'ARCHIVED']).optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field must be provided for update' }
  );

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
