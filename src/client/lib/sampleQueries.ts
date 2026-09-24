import { useMutation, useQueryClient } from '@tanstack/react-query';
import { callServer } from './api';

/** Sample data touches every tab, so every cached list is refreshed afterwards. */
export function useSampleData() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries();
  return {
    add: useMutation({ mutationFn: () => callServer('addSampleData'), onSuccess: refresh }),
    clear: useMutation({ mutationFn: () => callServer('clearSampleData'), onSuccess: refresh }),
  };
}
