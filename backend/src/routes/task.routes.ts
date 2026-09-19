import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { idParamSchema, createTaskSchema, updateTaskSchema } from '../validators/task.validator';
import { asyncHandler } from '../utils/asyncHandler';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';

const router = Router();

// All task routes require authentication
router.use(authMiddleware);

router.get('/',                           asyncHandler(listTasks));
router.get('/:id',  validate(idParamSchema, 'params'), asyncHandler(getTask));
router.post('/',    validate(createTaskSchema, 'body'), asyncHandler(createTask));
router.patch('/:id',
  validate(idParamSchema, 'params'),
  validate(updateTaskSchema, 'body'),
  asyncHandler(updateTask)
);
router.delete('/:id', validate(idParamSchema, 'params'), asyncHandler(deleteTask));
// Note: marking a task DONE is not a REST route — see /graphql's markTaskDone mutation.

export default router;
