import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { ClientInput, TaskInput } from '../../shared/schemas';
import type { Bootstrap, Client, Status, Task } from '../../shared/types';
import { callServer } from './api';

export const queryKeys = {
  bootstrap: ['bootstrap'] as const,
  clients: ['clients'] as const,
  tasks: ['tasks'] as const,
};

export function upsert<T extends { id: string }>(list: T[] | undefined, item: T): T[] {
  const current = list ?? [];
  return current.some((x) => x.id === item.id)
    ? current.map((x) => (x.id === item.id ? item : x))
    : [...current, item];
}

export function useBootstrap() {
  return useQuery({ queryKey: queryKeys.bootstrap, queryFn: () => callServer('getBootstrap') });
}

export function useClients() {
  return useQuery({ queryKey: queryKeys.clients, queryFn: () => callServer('listClients') });
}

export function useTasks() {
  return useQuery({ queryKey: queryKeys.tasks, queryFn: () => callServer('listTasks') });
}

function storeClient(queryClient: QueryClient, client: Client): void {
  queryClient.setQueryData<Client[]>(queryKeys.clients, (list) =>
    upsert(list, client).sort((a, b) => a.name.localeCompare(b.name)),
  );
}

function storeTask(queryClient: QueryClient, task: Task): void {
  queryClient.setQueryData<Task[]>(queryKeys.tasks, (list) => upsert(list, task));
}

export function useSaveClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClientInput) => callServer('saveClient', input),
    onSuccess: (client) => storeClient(queryClient, client),
  });
}

export function useSetClientArchived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      callServer('setClientArchived', id, archived),
    onSuccess: (client) => storeClient(queryClient, client),
  });
}

export function useSaveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) => callServer('saveTask', input),
    onSuccess: (task) => storeTask(queryClient, task),
  });
}

export function useSetTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      callServer('setTaskStatus', id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks });
      const previous = queryClient.getQueryData<Task[]>(queryKeys.tasks);
      queryClient.setQueryData<Task[]>(queryKeys.tasks, (list) =>
        list?.map((t) => (t.id === id ? { ...t, status } : t)),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(queryKeys.tasks, context?.previous);
    },
    onSuccess: (task) => storeTask(queryClient, task),
  });
}

export function useSaveStatuses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (statuses: Status[]) => callServer('saveStatuses', statuses),
    onSuccess: (statuses) => {
      queryClient.setQueryData<Bootstrap>(queryKeys.bootstrap, (b) => b && { ...b, statuses });
      return queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });
}

export function useSaveAllowedEmails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (emails: string[]) => callServer('saveAllowedEmails', emails),
    onSuccess: (allowedEmails) => {
      queryClient.setQueryData<Bootstrap>(queryKeys.bootstrap, (b) => b && { ...b, allowedEmails });
    },
  });
}
