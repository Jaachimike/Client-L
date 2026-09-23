import type { ServerDeps } from './deps';
import { MemoryWorkbook } from './memoryStore';

export interface MemoryDeps extends ServerDeps {
  workbook: MemoryWorkbook;
  email: string;
  date: string;
}

/** Server dependencies backed by memory, for tests and the local mock server. */
export function createMemoryDeps(options: { email: string; today: string }): MemoryDeps {
  let tick = 0;
  const deps: MemoryDeps = {
    workbook: new MemoryWorkbook(),
    email: options.email,
    date: options.today,
    currentEmail: () => deps.email,
    withLock: (fn) => fn(),
    today: () => deps.date,
    now: () => {
      tick += 1;
      const seconds = String(tick % 60).padStart(2, '0');
      const minutes = String(Math.floor(tick / 60) % 60).padStart(2, '0');
      return `${deps.date} 09:${minutes}:${seconds}`;
    },
    newId: () => crypto.randomUUID(),
    logError: (error) => console.error(error),
  };
  return deps;
}
