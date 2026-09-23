import { errorMessage } from '../../lib/api';
import { useSetTaskStatus } from '../../lib/queries';
import type { Task } from '../../../shared/types';

/** Saves a status change instantly and exposes a plain-language error if it fails. */
export function useStatusChange() {
  const mutation = useSetTaskStatus();
  return {
    change: (task: Task, status: string) => {
      if (status !== task.status) mutation.mutate({ id: task.id, status });
    },
    error: mutation.isError ? errorMessage(mutation.error) : '',
  };
}
