import { Task, TaskStatus } from '@/types/task';
import { apiClient } from './client';

export async function listTasks(status?: TaskStatus): Promise<Task[]> {
  const params = status ? { status } : undefined;
  const response = await apiClient.get<{ tasks: Task[] }>('/api/tasks', { params });
  return response.data.tasks ?? [];
}

export async function getTask(id: string): Promise<Task> {
  const response = await apiClient.get<{ task: Task }>(`/api/tasks/${id}`);
  return response.data.task;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const response = await apiClient.post<{ task: Task }>('/api/tasks', payload);
  return response.data.task;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export async function updateTask(
  id: string,
  payload: UpdateTaskPayload,
): Promise<Task> {
  const response = await apiClient.patch<{ task: Task }>(`/api/tasks/${id}`, payload);
  return response.data.task;
}

export async function deleteTask(id: string): Promise<{ id: string }> {
  await apiClient.delete(`/api/tasks/${id}`);
  return { id };
}

const MARK_TASK_DONE_MUTATION = `
  mutation MarkTaskDone($id: ID!) {
    markTaskDone(id: $id) {
      id
      title
      description
      status
      ownerId
      version
      doneAt
      doneBy
      createdAt
      updatedAt
    }
  }
`;

// The only task action that goes over GraphQL instead of REST — see backend/src/graphql.
export async function markTaskDone(id: string): Promise<Task> {
  const response = await apiClient.post<{ data: { markTaskDone: Task } }>('/graphql', {
    query: MARK_TASK_DONE_MUTATION,
    variables: { id },
  });
  return response.data.data.markTaskDone;
}
