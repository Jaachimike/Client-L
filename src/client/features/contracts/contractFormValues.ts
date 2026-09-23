import type { z } from 'zod';
import { renewalDates } from '../../../shared/contracts';
import type { contractInputSchema } from '../../../shared/renewalSchemas';
import type { Contract } from '../../../shared/types';

export type FormValues = z.input<typeof contractInputSchema>;
export type ContractValues = z.output<typeof contractInputSchema>;
export type FieldName =
  'clientId' | 'name' | 'startDate' | 'endDate' | 'fee' | 'currency' | 'billingCycle' | 'notes';
export const FIELDS: FieldName[] = [
  'clientId',
  'name',
  'startDate',
  'endDate',
  'fee',
  'currency',
  'billingCycle',
  'notes',
];

export type ContractFormMode =
  | { kind: 'new'; clientId?: string }
  | { kind: 'edit'; contract: Contract }
  | { kind: 'renew'; contract: Contract };

export function initialValues(mode: ContractFormMode, defaultCurrency: string): FormValues {
  if (mode.kind === 'new') {
    return {
      clientId: mode.clientId ?? '',
      name: '',
      startDate: '',
      endDate: '',
      fee: '',
      currency: defaultCurrency,
      billingCycle: 'Monthly',
      notes: '',
    };
  }
  const { contract } = mode;
  const dates = mode.kind === 'renew' ? renewalDates(contract) : contract;
  return {
    id: mode.kind === 'edit' ? contract.id : undefined,
    clientId: contract.clientId,
    name: contract.name,
    startDate: dates.startDate,
    endDate: dates.endDate,
    fee: String(contract.fee),
    currency: contract.currency,
    billingCycle: contract.billingCycle,
    notes: mode.kind === 'edit' ? contract.notes : '',
  };
}
