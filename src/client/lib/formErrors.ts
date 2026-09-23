import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { errorMessage, fieldErrors } from './api';

/** Puts server field errors next to their inputs and returns the message for the form alert. */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  fields: readonly Path<T>[],
  setError: UseFormSetError<T>,
): string {
  const byField = fieldErrors(error);
  for (const name of fields) {
    const message = byField[name];
    if (message) setError(name, { message });
  }
  return errorMessage(error);
}
