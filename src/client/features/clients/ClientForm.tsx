import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { clientInputSchema } from '../../../shared/schemas';
import type { Client } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { ErrorAlert } from '../../components/ui/feedback';
import { describedBy, Field, Input, Textarea } from '../../components/ui/form';
import { errorMessage, fieldErrors } from '../../lib/api';
import { useSaveClient } from '../../lib/queries';

type FormValues = z.input<typeof clientInputSchema>;
type ClientValues = z.output<typeof clientInputSchema>;
type FieldName = 'name' | 'contactPerson' | 'email' | 'phone' | 'notes';
const FIELD_NAMES: FieldName[] = ['name', 'contactPerson', 'email', 'phone', 'notes'];
const NOTES_HINT = 'Never store passwords here. Point to your password manager instead.';

interface ClientFormProps {
  client?: Client;
  onSaved: (client: Client) => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSaved, onCancel }: ClientFormProps) {
  const save = useSaveClient();
  const [serverError, setServerError] = useState('');
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, ClientValues>({
    resolver: zodResolver(clientInputSchema),
    defaultValues: {
      id: client?.id,
      name: client?.name ?? '',
      contactPerson: client?.contactPerson ?? '',
      email: client?.email ?? '',
      phone: client?.phone ?? '',
      notes: client?.notes ?? '',
    },
  });

  const onSubmit = async (values: ClientValues) => {
    setServerError('');
    try {
      onSaved(await save.mutateAsync(values));
    } catch (error) {
      const fields = fieldErrors(error);
      for (const name of FIELD_NAMES) {
        const message = fields[name];
        if (message) setError(name, { message });
      }
      setServerError(errorMessage(error));
    }
  };

  const err = (name: FieldName) => errors[name]?.message;
  const textField = (
    name: Exclude<FieldName, 'notes'>,
    label: string,
    type = 'text',
    optional = true,
  ) => {
    const id = `client-${name}`;
    return (
      <Field id={id} label={label} optional={optional} error={err(name)}>
        <Input
          id={id}
          type={type}
          aria-invalid={Boolean(err(name))}
          aria-describedby={describedBy(id, err(name))}
          {...register(name)}
        />
      </Field>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-1 flex-col gap-4">
      {textField('name', 'Name', 'text', false)}
      {textField('contactPerson', 'Contact person')}
      {textField('email', 'Email', 'email')}
      {textField('phone', 'Phone', 'tel')}
      <Field id="client-notes" label="Notes" optional hint={NOTES_HINT} error={err('notes')}>
        <Textarea
          id="client-notes"
          rows={4}
          aria-invalid={Boolean(err('notes'))}
          aria-describedby={describedBy('client-notes', err('notes'), NOTES_HINT)}
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
            {isSubmitting ? 'Saving…' : client ? 'Save changes' : 'Save client'}
          </Button>
        </div>
      </div>
    </form>
  );
}
