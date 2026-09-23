import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { contractInputSchema } from '../../../shared/renewalSchemas';
import type { Client, Contract } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { ErrorAlert } from '../../components/ui/feedback';
import { describedBy, Field, Input, Select, Textarea } from '../../components/ui/form';
import { applyServerErrors } from '../../lib/formErrors';
import { useRenewContract, useSaveContract } from '../../lib/renewalQueries';
import {
  FIELDS,
  initialValues,
  type ContractFormMode,
  type ContractValues,
  type FieldName,
  type FormValues,
} from './contractFormValues';

export type { ContractFormMode } from './contractFormValues';

interface ContractFormProps {
  mode: ContractFormMode;
  clients: Client[];
  currencies: string[];
  defaultCurrency: string;
  onSaved: (contract: Contract) => void;
  onCancel: () => void;
}

export function ContractForm({
  mode,
  clients,
  currencies,
  defaultCurrency,
  onSaved,
  onCancel,
}: ContractFormProps) {
  const save = useSaveContract();
  const renew = useRenewContract();
  const [serverError, setServerError] = useState('');
  const existingClientId = mode.kind === 'new' ? undefined : mode.contract.clientId;
  const choices = clients.filter((c) => !c.archived || c.id === existingClientId);
  const currencyChoices =
    mode.kind === 'new' || currencies.includes(mode.contract.currency)
      ? currencies
      : [...currencies, mode.contract.currency];
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, ContractValues>({
    resolver: zodResolver(contractInputSchema),
    defaultValues: initialValues(mode, defaultCurrency),
  });

  const onSubmit = async (values: ContractValues) => {
    setServerError('');
    try {
      if (mode.kind === 'renew') {
        onSaved((await renew.mutateAsync({ oldId: mode.contract.id, input: values })).replacement);
      } else {
        onSaved(await save.mutateAsync(values));
      }
    } catch (error) {
      setServerError(applyServerErrors(error, FIELDS, setError));
    }
  };

  const err = (name: FieldName) => errors[name]?.message;
  const aria = (id: string, name: FieldName) => ({
    'aria-invalid': Boolean(err(name)),
    'aria-describedby': describedBy(id, err(name)),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-1 flex-col gap-4">
      {mode.kind === 'renew' ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] font-medium">Client</p>
          <p>{clients.find((c) => c.id === mode.contract.clientId)?.name ?? 'Unknown client'}</p>
          <input type="hidden" {...register('clientId')} />
        </div>
      ) : (
        <Field id="contract-client" label="Client" error={err('clientId')}>
          <Select
            id="contract-client"
            {...aria('contract-client', 'clientId')}
            {...register('clientId')}
          >
            <option value="">Choose a client</option>
            {choices.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field id="contract-name" label="Contract name" error={err('name')}>
        <Input
          id="contract-name"
          placeholder="Website maintenance retainer"
          {...aria('contract-name', 'name')}
          {...register('name')}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="contract-start" label="Start date" error={err('startDate')}>
          <Input
            id="contract-start"
            type="date"
            {...aria('contract-start', 'startDate')}
            {...register('startDate')}
          />
        </Field>
        <Field id="contract-end" label="End date" error={err('endDate')}>
          <Input
            id="contract-end"
            type="date"
            {...aria('contract-end', 'endDate')}
            {...register('endDate')}
          />
        </Field>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
        <Field id="contract-fee" label="Fee" error={err('fee')}>
          <Input
            id="contract-fee"
            inputMode="decimal"
            className="font-mono"
            {...aria('contract-fee', 'fee')}
            {...register('fee')}
          />
        </Field>
        <Field id="contract-currency" label="Currency" error={err('currency')}>
          <Select
            id="contract-currency"
            {...aria('contract-currency', 'currency')}
            {...register('currency')}
          >
            {currencyChoices.map((code) => (
              <option key={code}>{code}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field id="contract-cycle" label="Billing cycle" error={err('billingCycle')}>
        <Select
          id="contract-cycle"
          {...aria('contract-cycle', 'billingCycle')}
          {...register('billingCycle')}
        >
          <option>Monthly</option>
          <option>Quarterly</option>
          <option>Yearly</option>
        </Select>
      </Field>
      <Field id="contract-notes" label="Notes" optional error={err('notes')}>
        <Textarea
          id="contract-notes"
          rows={3}
          {...aria('contract-notes', 'notes')}
          {...register('notes')}
        />
      </Field>
      <div className="mt-auto flex flex-col gap-3 pt-4">
        {serverError && <ErrorAlert>{serverError}</ErrorAlert>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? 'Saving…'
              : mode.kind === 'renew'
                ? 'Renew contract'
                : mode.kind === 'edit'
                  ? 'Save changes'
                  : 'Save contract'}
          </Button>
        </div>
      </div>
    </form>
  );
}
