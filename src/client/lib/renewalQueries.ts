import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { Defaults } from '../../shared/api';
import type { ContractInput, DefaultsInput, SubscriptionInput } from '../../shared/renewalSchemas';
import type { Bootstrap, Contract, Subscription } from '../../shared/types';
import { callServer } from './api';
import { queryKeys, upsert } from './queries';

export const renewalKeys = {
  contracts: ['contracts'] as const,
  subscriptions: ['subscriptions'] as const,
};

function storeContract(queryClient: QueryClient, contract: Contract): void {
  queryClient.setQueryData<Contract[]>(renewalKeys.contracts, (list) => upsert(list, contract));
}

function storeSubscription(queryClient: QueryClient, sub: Subscription): void {
  queryClient.setQueryData<Subscription[]>(renewalKeys.subscriptions, (list) => upsert(list, sub));
}

export function useContracts() {
  return useQuery({ queryKey: renewalKeys.contracts, queryFn: () => callServer('listContracts') });
}

export function useSubscriptions() {
  return useQuery({
    queryKey: renewalKeys.subscriptions,
    queryFn: () => callServer('listSubscriptions'),
  });
}

export function useSaveContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ContractInput) => callServer('saveContract', input),
    onSuccess: (contract) => storeContract(queryClient, contract),
  });
}

export function useRenewContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ oldId, input }: { oldId: string; input: ContractInput }) =>
      callServer('renewContract', oldId, input),
    onSuccess: ({ renewed, replacement }) => {
      storeContract(queryClient, renewed);
      storeContract(queryClient, replacement);
    },
  });
}

export function useSaveSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubscriptionInput) => callServer('saveSubscription', input),
    onSuccess: (sub) => storeSubscription(queryClient, sub),
  });
}

export function useMarkRenewed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, logPayment }: { id: string; logPayment: boolean }) =>
      callServer('markSubscriptionRenewed', id, logPayment),
    onSuccess: ({ subscription }) => storeSubscription(queryClient, subscription),
  });
}

export function useMarkCharged() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => callServer('markSubscriptionCharged', id),
    onSuccess: (sub) => storeSubscription(queryClient, sub),
  });
}

export function useSetCancelled() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, cancelled }: { id: string; cancelled: boolean }) =>
      callServer('setSubscriptionCancelled', id, cancelled),
    onSuccess: (sub) => storeSubscription(queryClient, sub),
  });
}

export function useSaveDefaults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DefaultsInput) => callServer('saveDefaults', input),
    onSuccess: (defaults: Defaults) => {
      queryClient.setQueryData<Bootstrap>(queryKeys.bootstrap, (b) => b && { ...b, ...defaults });
    },
  });
}
