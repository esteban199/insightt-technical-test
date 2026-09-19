import mongoose from 'mongoose';
import {
  assertTransition,
  assertOwnership,
  STATUS_TRANSITIONS,
} from '../../src/services/task.service';
import { AppError } from '../../src/utils/AppError';
import type { TaskStatus } from '../../src/models/Task';

// Mock the Task model
jest.mock('../../src/models/Task', () => ({
  Task: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    create: jest.fn(),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Task } = require('../../src/models/Task');

interface MockTask {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: string;
  ownerId: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const makeTask = (overrides: Partial<MockTask> = {}): MockTask => ({
  _id: new mongoose.Types.ObjectId(),
  title: 'Test Task',
  description: 'Description',
  status: 'PENDING',
  ownerId: new mongoose.Types.ObjectId().toString(),
  version: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const OWNER_ID = new mongoose.Types.ObjectId().toString();
const OTHER_ID = new mongoose.Types.ObjectId().toString();

beforeEach(() => jest.clearAllMocks());

describe('STATUS_TRANSITIONS map', () => {
  it('PENDING allows only IN_PROGRESS', () => {
    expect(STATUS_TRANSITIONS['PENDING']).toEqual(['IN_PROGRESS']);
  });

  it('IN_PROGRESS allows only DONE', () => {
    expect(STATUS_TRANSITIONS['IN_PROGRESS']).toEqual(['DONE']);
  });

  it('DONE allows only ARCHIVED', () => {
    expect(STATUS_TRANSITIONS['DONE']).toEqual(['ARCHIVED']);
  });

  it('ARCHIVED allows no transitions', () => {
    expect(STATUS_TRANSITIONS['ARCHIVED']).toEqual([]);
  });
});

describe('assertTransition', () => {
  it('PENDING → IN_PROGRESS is allowed', () => {
    expect(() => assertTransition('PENDING', 'IN_PROGRESS')).not.toThrow();
  });

  it('IN_PROGRESS → DONE is allowed', () => {
    expect(() => assertTransition('IN_PROGRESS', 'DONE')).not.toThrow();
  });

  it('PENDING → DONE throws INVALID_TRANSITION', () => {
    expect(() => assertTransition('PENDING', 'DONE')).toThrow(AppError);
    try {
      assertTransition('PENDING', 'DONE');
    } catch (err) {
      expect((err as AppError).code).toBe('INVALID_TRANSITION');
      expect((err as AppError).status).toBe(400);
    }
  });

  it('DONE → PENDING throws INVALID_TRANSITION', () => {
    expect(() => assertTransition('DONE', 'PENDING')).toThrow(AppError);
  });
});

describe('assertOwnership', () => {
  it('owner match does not throw', () => {
    const task = makeTask({ ownerId: OWNER_ID });
    expect(() => assertOwnership(task, OWNER_ID)).not.toThrow();
  });

  it('non-owner throws 403', () => {
    const task = makeTask({ ownerId: OTHER_ID });
    expect(() => assertOwnership(task, OWNER_ID)).toThrow(AppError);
    try {
      assertOwnership(task, OWNER_ID);
    } catch (err) {
      expect((err as AppError).status).toBe(403);
      expect((err as AppError).code).toBe('FORBIDDEN');
    }
  });
});

describe('updateTask service', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { updateTask } = require('../../src/services/task.service');

  it('valid transition PENDING → IN_PROGRESS succeeds', async () => {
    const taskId = new mongoose.Types.ObjectId();
    const ownerId = new mongoose.Types.ObjectId().toString();
    const task = makeTask({ _id: taskId, ownerId: ownerId, status: 'PENDING' });
    const updated = { ...task, status: 'IN_PROGRESS', version: 1 };

    (Task.findById as jest.Mock).mockReturnValueOnce({ lean: () => Promise.resolve(task) });
    (Task.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({ lean: () => Promise.resolve(updated) });

    const result = await updateTask(taskId.toString(), ownerId, { status: 'IN_PROGRESS' });
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('invalid transition PENDING → DONE throws', async () => {
    const taskId = new mongoose.Types.ObjectId();
    const ownerId = new mongoose.Types.ObjectId().toString();
    const task = makeTask({ _id: taskId, ownerId: ownerId, status: 'PENDING' });

    (Task.findById as jest.Mock).mockReturnValueOnce({ lean: () => Promise.resolve(task) });

    await expect(updateTask(taskId.toString(), ownerId, { status: 'DONE' })).rejects.toThrow(AppError);
  });

  it('non-owner update throws 403', async () => {
    const taskId = new mongoose.Types.ObjectId();
    const ownerId = new mongoose.Types.ObjectId().toString();
    const otherId = new mongoose.Types.ObjectId().toString();
    const task = makeTask({ _id: taskId, ownerId: otherId, status: 'PENDING' });

    // Mocked (not "Once") — this test calls updateTask twice below, both need the mock.
    (Task.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(task) });

    await expect(updateTask(taskId.toString(), ownerId, { title: 'New title' })).rejects.toThrow(AppError);
    try {
      await updateTask(taskId.toString(), ownerId, { title: 'New title' });
    } catch (err) {
      expect((err as AppError).status).toBe(403);
    }
  });

  it('update on DONE task: title edit is allowed', async () => {
    const taskId = new mongoose.Types.ObjectId();
    const ownerId = new mongoose.Types.ObjectId().toString();
    const task = makeTask({ _id: taskId, ownerId: ownerId, status: 'DONE' });
    const updated = { ...task, title: 'Fixed typo', version: 1 };

    (Task.findById as jest.Mock).mockReturnValueOnce({ lean: () => Promise.resolve(task) });
    (Task.findByIdAndUpdate as jest.Mock).mockReturnValueOnce({ lean: () => Promise.resolve(updated) });

    const result = await updateTask(taskId.toString(), ownerId, { title: 'Fixed typo' });
    expect(result.title).toBe('Fixed typo');
  });

  it('update on DONE task: description edit throws', async () => {
    const taskId = new mongoose.Types.ObjectId();
    const ownerId = new mongoose.Types.ObjectId().toString();
    const task = makeTask({ _id: taskId, ownerId: ownerId, status: 'DONE' });

    // Mocked (not "Once") — this test calls updateTask twice below, both need the mock.
    (Task.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(task) });

    await expect(
      updateTask(taskId.toString(), ownerId, { description: 'New desc' })
    ).rejects.toThrow(AppError);
    try {
      await updateTask(taskId.toString(), ownerId, { description: 'New desc' });
    } catch (err) {
      expect((err as AppError).code).toBe('EDIT_LOCKED');
    }
  });

  it('update on DONE task: status change throws', async () => {
    const taskId = new mongoose.Types.ObjectId();
    const ownerId = new mongoose.Types.ObjectId().toString();
    const task = makeTask({ _id: taskId, ownerId: ownerId, status: 'DONE' });

    // Mocked (not "Once") — this test calls updateTask twice below, both need the mock.
    (Task.findById as jest.Mock).mockReturnValue({ lean: () => Promise.resolve(task) });

    await expect(
      updateTask(taskId.toString(), ownerId, { status: 'ARCHIVED' })
    ).rejects.toThrow(AppError);
    try {
      await updateTask(taskId.toString(), ownerId, { status: 'ARCHIVED' });
    } catch (err) {
      expect((err as AppError).code).toBe('EDIT_LOCKED');
    }
  });
});
