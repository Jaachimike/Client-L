import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { subscriptionInputSchema } from '../../../shared/renewalSchemas';
import { PAID_BY_OPTIONS } from '../../../shared/subscriptions';
import type { Client, Subscription } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { ErrorAlert } from '../../components/ui/feedback';
import { describedBy, Field, Input, Select, Textarea } from '../../components/ui/form';
import { applyServerErrors } from '../../lib/formErrors';
import { useSaveSubscription } from '../../lib/renewalQueries';
import {
  initialSubscriptionValues,
  SUBSCRIPTION_FIELDS,
  type SubscriptionFieldName,
  type SubscriptionFormValues,
} from './subscriptionFormValues';

type SubscriptionValues = z.output<typeof subscriptionInputSchema>;
type FieldName = SubscriptionFieldName;
const NOTES_HINT = 'Never store passwords here. Point to your password manager instead.';

interface SubscriptionFormProps {
  subscription?: Subscription;
  defaultClientId?: string;
  clients: Client[];
  currencies: string[];
  defaultCurrency: string;
  onSaved: (sub: Subscription) => void;
  onCancel: () => void;
}

export function SubscriptionForm({
  subscription: sub,
  defaultClientId,
  clients,
  currencies,
  defaultCurrency,
  onSaved,
  onCancel,
}: SubscriptionFormProps) {
  const save = useSaveSubscription();
  const [serverError, setServerError] = useState('');
  const choices = clients.filter((c) => !c.archived || c.id === sub?.clientId);
  const currencyChoices =
    !sub || currencies.includes(sub.currency) ? currencies : [...currencies, sub.currency];
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormValues, unknown, SubscriptionValues>({
    resolver: zodResolver(subscriptionInputSchema),
    defaultValues: initialSubscriptionValues(sub, defaultClientId, defaultCurrency),
  });

  const onSubmit = async (values: SubscriptionValues) => {
    setServerError('');
    try {
      onSaved(await save.mutateAsync(values));
    } catch (error) {
      setServerError(applyServerErrors(error, SUBSCRIPTION_FIELDS, setError));
    }
  };

  const err = (name: FieldName) => errors[name]?.message;
  const aria = (id: string, name: FieldName, hint?: string) => ({
    'aria-invalid': Boolean(err(name)),
    'aria-describedby': describedBy(id, err(name), hint),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-1 flex-col gap-4">
      <Field id="sub-client" label="Client" error={err('clientId')}>
        <Select id="sub-client" {...aria('sub-client', 'clientId')} {...register('clientId')}>
          <option value="">Choose a client</option>
          {choices.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="sub-service" label="Service" error={err('service')}>
        <Input
          id="sub-service"
          placeholder="Domain, hosting, email, SSL…"
          {...aria('sub-service', 'service')}
          {...register('service')}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field id="sub-provider" label="Provider" optional error={err('provider')}>
          <Input
            id="sub-provider"
            {...aria('sub-provider', 'provider')}
            {...register('provider')}
          />
        </Field>
        <Field id="sub-plan" label="Plan" optional error={err('plan')}>
          <Input id="sub-plan" {...aria('sub-plan', 'plan')} {...register('plan')} />
        </Field>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-3">
        <Field id="sub-cost" label="Cost" error={err('cost')}>
          <Input
            id="sub-cost"
            inputMode="decimal"
            className="font-mono"
            {...aria('sub-cost', 'cost')}
            {...register('cost')}
          />
        </Field>
        <Field id="sub-currency" label="Currency" error={err('currency')}>
          <Select id="sub-currency" {...aria('sub-currency', 'currency')} {...register('currency')}>
            {currencyChoices.map((code) => (
              <option key={code}>{code}</option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field id="sub-cycle" label="Billing cycle" error={err('billingCycle')}>
          <Select
            id="sub-cycle"
            {...aria('sub-cycle', 'billingCycle')}
            {...register('billingCycle')}
          >
            <option>Monthly</option>
            <option>Yearly</option>
          </Select>
        </Field>
        <Field id="sub-next" label="Next renewal" error={err('nextRenewal')}>
          <Input
            id="sub-next"
            type="date"
            {...aria('sub-next', 'nextRenewal')}
            {...register('nextRenewal')}
          />
        </Field>
      </div>
      <label className="flex min-h-10 items-center gap-2 text-[13px]">
        <input type="checkbox" className="size-4 accent-accent" {...register('autoRenew')} />
        Renews automatically with the provider
      </label>
      <Field id="sub-paid-by" label="Who pays" error={err('paidBy')}>
        <Select id="sub-paid-by" {...aria('sub-paid-by', 'paidBy')} {...register('paidBy')}>
          {PAID_BY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="sub-account" label="Account email" optional error={err('accountEmail')}>
        <Input
          id="sub-account"
          type="email"
          {...aria('sub-account', 'accountEmail')}
          {...register('accountEmail')}
        />
      </Field>
      <Field id="sub-notes" label="Notes" optional hint={NOTES_HINT} error={err('notes')}>
        <Textarea
          id="sub-notes"
          rows={3}
          {...aria('sub-notes', 'notes', NOTES_HINT)}
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
            {isSubmitting ? 'Saving…' : sub ? 'Save changes' : 'Save subscription'}
          </Button>
        </div>
      </div>
    </form>
  );
}
