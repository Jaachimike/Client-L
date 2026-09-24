import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { ImportRowInput, TransactionInput } from '../../shared/cashSchemas';
import type { Bootstrap, Transaction } from '../../shared/types';
import { callServer } from './api';
import { queryKeys, upsert } from './queries';

export const cashKeys = { transactions: ['transactions'] as const };

function storeTransaction(queryClient: QueryClient, tx: Transaction): void {
  queryClient.setQueryData<Transaction[]>(cashKeys.transactions, (list) => upsert(list, tx));
  if (tx.category) {
    queryClient.setQueryData<Bootstrap>(queryKeys.bootstrap, (b) =>
      b && !b.categories.includes(tx.category)
        ? { ...b, categories: [...b.categories, tx.category] }
        : b,
    );
  }
}

export function useTransactions() {
  return useQuery({
    queryKey: cashKeys.transactions,
    queryFn: () => callServer('listTransactions'),
  });
}

export function useSaveTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TransactionInput) => callServer('saveTransaction', input),
    onSuccess: (tx) => storeTransaction(queryClient, tx),
  });
}

export function useSetVoided() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, voided }: { id: string; voided: boolean }) =>
      callServer('setTransactionVoided', id, voided),
    onSuccess: (tx) => storeTransaction(queryClient, tx),
  });
}

export function useImportTransactions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: ImportRowInput[]) => callServer('importTransactions', rows),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: cashKeys.transactions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.clients }),
        queryClient.invalidateQueries({ queryKey: queryKeys.bootstrap }),
      ]),
  });
}
