import { useMemo } from 'react';
import { doneStatusNames } from '../../shared/statuses';
import type { TaskContext } from '../../shared/tasks';
import type { Bootstrap } from '../../shared/types';

export function useTaskContext(bootstrap: Bootstrap): TaskContext {
  return useMemo(
    () => ({ today: bootstrap.today, doneStatuses: doneStatusNames(bootstrap.statuses) }),
    [bootstrap.today, bootstrap.statuses],
  );
}
