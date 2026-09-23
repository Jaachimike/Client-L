import { AppError } from '../shared/result';

export const ACCESS_DENIED_MESSAGE =
  'Access denied. This Google account is not on the list of people allowed to use this app.';

export function isAllowed(email: string, allowedEmails: string[]): boolean {
  const normalised = email.trim().toLowerCase();
  return normalised !== '' && allowedEmails.includes(normalised);
}

export function requireAccess(email: string, allowedEmails: string[]): void {
  if (!isAllowed(email, allowedEmails)) throw new AppError('ACCESS_DENIED', ACCESS_DENIED_MESSAGE);
}
