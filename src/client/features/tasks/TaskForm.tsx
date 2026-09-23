import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { taskInputSchema } from '../../../shared/schemas';
import type { Client, Task } from '../../../shared/types';
import { Button } from '../../components/ui/button';
import { ErrorAlert } from '../../components/ui/feedback';
import { describedBy, Field, Input, Select, Textarea } from '../../components/ui/form';
import { errorMessage, fieldErrors } from '../../lib/api';
import { useSaveTask } from '../../lib/queries';

type FormValues = z.input<typeof taskInputSchema>;
type TaskValues = z.output<typeof taskInputSchema>;
type FieldName = 'clientId' | 'title' | 'description' | 'links' | 'dueDate';
const FIELD_NAMES: FieldName[] = ['clientId', 'title', 'description', 'links', 'dueDate'];
const LINKS_HINT = 'One link per line. Write Label | URL to show a label instead of the address.';

interface TaskFormProps {
  clients: Client[];
  task?: Task;
  defaultClientId?: string;
  onSaved: (task: Task) => void;
  onCancel: () => void;
}

export function TaskForm({ clients, task, defaultClientId, onSaved, onCancel }: TaskFormProps) {
  const save = useSaveTask();
  const [serverError, setServerError] = useState('');
  const choices = clients.filter((c) => !c.archived || c.id === task?.clientId);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, TaskValues>({
    resolver: zodResolver(taskInputSchema),
    defaultValues: {
      id: task?.id,
      clientId: task?.clientId ?? defaultClientId ?? '',
      title: task?.title ?? '',
      description: task?.description ?? '',
      links: task?.links ?? '',
      dueDate: task?.dueDate ?? '',
    },
  });

  const onSubmit = async (values: TaskValues) => {
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-1 flex-col gap-4">
      <Field id="task-client" label="Client" error={err('clientId')}>
        <Select
          id="task-client"
          aria-invalid={Boolean(err('clientId'))}
          aria-describedby={describedBy('task-client', err('clientId'))}
          {...register('clientId')}
        >
          <option value="">Choose a client</option>
          {choices.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
              {client.archived ? ' (archived)' : ''}
            </option>
          ))}
        </Select>
      </Field>
      <Field id="task-title" label="Task title" error={err('title')}>
        <Input
          id="task-title"
          aria-invalid={Boolean(err('title'))}
          aria-describedby={describedBy('task-title', err('title'))}
          {...register('title')}
        />
      </Field>
      <Field id="task-description" label="Description" optional error={err('description')}>
        <Textarea
          id="task-description"
          rows={5}
          aria-invalid={Boolean(err('description'))}
          aria-describedby={describedBy('task-description', err('description'))}
          {...register('description')}
        />
      </Field>
      <Field id="task-links" label="Links" optional hint={LINKS_HINT} error={err('links')}>
        <Textarea
          id="task-links"
          rows={3}
          placeholder="Brief | https://docs.google.com/…"
          aria-invalid={Boolean(err('links'))}
          aria-describedby={describedBy('task-links', err('links'), LINKS_HINT)}
          {...register('links')}
        />
      </Field>
      <Field id="task-due" label="Due date" optional error={err('dueDate')}>
        <Input
          id="task-due"
          type="date"
          aria-invalid={Boolean(err('dueDate'))}
          aria-describedby={describedBy('task-due', err('dueDate'))}
          {...register('dueDate')}
        />
      </Field>
      <div className="mt-auto flex flex-col gap-3 pt-4">
        {serverError && <ErrorAlert>{serverError}</ErrorAlert>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : task ? 'Save changes' : 'Save task'}
          </Button>
        </div>
      </div>
    </form>
  );
}
