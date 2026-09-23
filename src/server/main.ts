import { AppError } from '../shared/result';
import { isAllowed } from './auth';
import { accessDeniedPage, setupNeededPage } from './accessPages';
import type { ServerDeps } from './deps';
import { SettingsStore } from './settings';

export type PageDecision =
  | { kind: 'app'; appName: string }
  | { kind: 'denied'; html: string }
  | { kind: 'setup'; html: string };

/** Decides what `doGet()` serves; reads only the Settings tab. */
export function decidePage(deps: ServerDeps): PageDecision {
  try {
    const settings = new SettingsStore(deps.workbook);
    const email = deps.currentEmail();
    if (!isAllowed(email, settings.allowedEmails())) return { kind: 'denied', html: accessDeniedPage(email) };
    return { kind: 'app', appName: settings.appName() };
  } catch (error) {
    if (error instanceof AppError && error.code === 'SETUP') {
      return { kind: 'setup', html: setupNeededPage(error.message) };
    }
    throw error;
  }
}
