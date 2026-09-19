import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  markTaskDone,
  type CreateTaskPayload,
  type UpdateTaskPayload,
} from '@/api/tasks.api';
import { TaskStatus } from '@/types/task';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: { status?: TaskStatus }) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

export function useTasks(status?: TaskStatus) {
  return useQuery({
    queryKey: taskKeys.list({ status }),
    queryFn: () => listTasks(status),
    staleTime: 30_000,
    // Keep showing the previous filter's list while the new one loads instead
    // of dropping to empty/loading — each status tab is a separate query key.
    placeholderData: keepPreviousData,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => getTask(id),
    enabled: Boolean(id),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTaskPayload }) =>
      updateTask(id, payload),
    onSuccess: (updatedTask) => {
      qc.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      qc.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useMarkTaskDone() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => markTaskDone(id),
    onSuccess: (updatedTask) => {
      qc.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      qc.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}
