import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { transactionInputSchema } from '../../../shared/cashSchemas';
import type { Client, Contract, Transaction } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { ErrorAlert } from '../../components/ui/feedback';
import { describedBy, Field, Input, Select } from '../../components/ui/form';
import { applyServerErrors } from '../../lib/formErrors';
import { useSaveTransaction } from '../../lib/cashQueries';
import {
  ENTRY_FIELDS,
  initialEntryValues,
  type EntryFieldName,
  type EntryFormValues,
  type EntryValues,
} from './entryFormValues';

interface EntryFormProps {
  entry?: Transaction;
  clients: Client[];
  contracts: Contract[];
  currencies: string[];
  categories: string[];
  defaultCurrency: string;
  today: string;
  onSaved: (entry: Transaction) => void;
  onCancel: () => void;
}

export function EntryForm({
  entry,
  clients,
  contracts,
  currencies,
  categories,
  defaultCurrency,
  today,
  onSaved,
  onCancel,
}: EntryFormProps) {
  const save = useSaveTransaction();
  const [serverError, setServerError] = useState('');
  const choices = clients.filter((c) => !c.archived || c.id === entry?.clientId);
  const currencyChoices =
    !entry || currencies.includes(entry.currency) ? currencies : [...currencies, entry.currency];
  const openContracts = contracts.filter((c) => !c.renewedById);
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EntryFormValues, unknown, EntryValues>({
    resolver: zodResolver(transactionInputSchema),
    defaultValues: initialEntryValues(entry, today, defaultCurrency),
  });

  const fillFromContract = (id: string) => {
    const contract = openContracts.find((c) => c.id === id);
    if (!contract) return;
    setValue('type', 'Inflow');
    setValue('clientId', contract.clientId);
    setValue('amount', String(contract.fee));
    setValue('currency', contract.currency);
    setValue('category', 'Client payment');
    setValue('description', `${contract.name} payment`);
  };

  const onSubmit = async (values: EntryValues) => {
    setServerError('');
    try {
      onSaved(await save.mutateAsync(values));
    } catch (error) {
      setServerError(applyServerErrors(error, ENTRY_FIELDS, setError));
    }
  };

  const err = (name: EntryFieldName) => errors[name]?.message;
  const aria = (id: string, name: EntryFieldName, hint?: string) => ({
    'aria-invalid': Boolean(err(name)),
    'aria-describedby': describedBy(id, err(name), hint),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-1 flex-col gap-4">
      {!entry && openContracts.length > 0 && (
        <Field id="entry-contract" label="Fill from a contract" optional>
          <Select
            id="entry-contract"
            defaultValue=""
            onChange={(e) => fillFromContract(e.target.value)}
          >
            <option value="">Choose a contract</option>
            {openContracts.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >{`${c.name} (${clients.find((cl) => cl.id === c.clientId)?.name ?? 'Unknown client'})`}</option>
            ))}
          </Select>
        </Field>
      )}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-[13px] font-medium">Type</legend>
        <div className="flex gap-4">
          {(['Inflow', 'Outflow'] as const).map((type) => (
            <label key={type} className="flex min-h-10 items-center gap-2">
              <input
                type="radio"
                value={type}
                className="size-4 accent-accent"
                {...register('type')}
              />
              {type === 'Inflow' ? 'Money in' : 'Money out'}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
        <Field id="entry-amount" label="Amount" error={err('amount')}>
          <Input
            id="entry-amount"
            inputMode="decimal"
            className="font-mono"
            {...aria('entry-amount', 'amount')}
            {...register('amount')}
          />
        </Field>
        <Field id="entry-currency" label="Currency" error={err('currency')}>
          <Select
            id="entry-currency"
            {...aria('entry-currency', 'currency')}
            {...register('currency')}
          >
            {currencyChoices.map((code) => (
              <option key={code}>{code}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field id="entry-date" label="Date" optional error={err('date')}>
        <Input id="entry-date" type="date" {...aria('entry-date', 'date')} {...register('date')} />
      </Field>
      <Field id="entry-description" label="Description" error={err('description')}>
        <Input
          id="entry-description"
          {...aria('entry-description', 'description')}
          {...register('description')}
        />
      </Field>
      <Field id="entry-client" label="Client" optional error={err('clientId')}>
        <Select id="entry-client" {...aria('entry-client', 'clientId')} {...register('clientId')}>
          <option value="">No client</option>
          {choices.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="entry-category" label="Category" optional error={err('category')}>
        <Input
          id="entry-category"
          list="entry-categories"
          {...aria('entry-category', 'category')}
          {...register('category')}
        />
        <datalist id="entry-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field id="entry-reference" label="Reference or note" optional error={err('reference')}>
        <Input
          id="entry-reference"
          {...aria('entry-reference', 'reference')}
          {...register('reference')}
        />
      </Field>
      <div className="mt-auto flex flex-col gap-3 pt-4">
        {serverError && <ErrorAlert>{serverError}</ErrorAlert>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : entry ? 'Save changes' : 'Save entry'}
          </Button>
        </div>
      </div>
    </form>
  );
}
