import { addDays, addMonths, daysBetween } from './dates';
import type { Contract, ContractState } from './types';

export interface RenewalContext {
  today: string;
  warningDays: number;
}

export function contractState(contract: Contract, ctx: RenewalContext): ContractState {
  if (contract.renewedById) return 'Renewed';
  const daysLeft = daysBetween(ctx.today, contract.endDate);
  if (daysLeft < 0) return 'Expired';
  return daysLeft <= ctx.warningDays ? 'Expiring soon' : 'Active';
}

/** A number of days, counted from today with the boundary day included. */
export type DayWindow = `${number}`;
export type ContractWindow = 'all' | 'expired' | DayWindow;

export function isDayWindow(value: string | null): value is DayWindow {
  return value !== null && /^[1-9]\d{0,2}$/.test(value);
}

/** The standard windows plus the Settings warning window, so dashboard links always match a chip. */
export function dayWindows(standard: number[], warningDays: number): DayWindow[] {
  return [...new Set([...standard, warningDays])].sort((a, b) => a - b).map((d) => `${d}` as const);
}

export interface ContractFilters {
  window?: ContractWindow;
  clientId?: string;
  state?: ContractState | '';
}

/** Window filters count from today to the boundary day inclusive, and skip renewed contracts. */
export function inContractWindow(
  contract: Contract,
  window: ContractWindow,
  ctx: RenewalContext,
): boolean {
  const state = contractState(contract, ctx);
  if (window === 'all') return true;
  if (window === 'expired') return state === 'Expired';
  if (state === 'Renewed') return false;
  const daysLeft = daysBetween(ctx.today, contract.endDate);
  return daysLeft >= 0 && daysLeft <= Number(window);
}

export function filterContracts(
  contracts: Contract[],
  filters: ContractFilters,
  ctx: RenewalContext,
): Contract[] {
  return contracts
    .filter(
      (c) =>
        inContractWindow(c, filters.window ?? 'all', ctx) &&
        (!filters.clientId || c.clientId === filters.clientId) &&
        (!filters.state || contractState(c, ctx) === filters.state),
    )
    .sort((a, b) => (a.endDate < b.endDate ? -1 : a.endDate > b.endDate ? 1 : 0));
}

export function canRenew(contract: Contract, ctx: RenewalContext): boolean {
  const state = contractState(contract, ctx);
  return state === 'Expiring soon' || state === 'Expired';
}

/** Whole months from start to the day after end, or null when the period is not whole months. */
function wholeMonths(start: string, end: string): number | null {
  const after = addDays(end, 1);
  for (let months = 1; months <= 120; months += 1) {
    const candidate = addMonths(start, months);
    if (candidate === after) return months;
    if (candidate > after) return null;
  }
  return null;
}

/** The replacement starts the day after the old one ends and runs for the same length. */
export function renewalDates(contract: Contract): { startDate: string; endDate: string } {
  const startDate = addDays(contract.endDate, 1);
  const months = wholeMonths(contract.startDate, contract.endDate);
  const endDate =
    months === null
      ? addDays(startDate, daysBetween(contract.startDate, contract.endDate))
      : addDays(addMonths(startDate, months), -1);
  return { startDate, endDate };
}

export function daysLeftLabel(endDate: string, today: string): string {
  const days = daysBetween(today, endDate);
  if (days === 0) return 'Ends today';
  if (days === 1) return '1 day left';
  if (days > 1) return `${days} days left`;
  return days === -1 ? 'Ended 1 day ago' : `Ended ${-days} days ago`;
}
