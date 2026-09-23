import type { ServerHandlers } from '../../shared/api';
import { createApi } from '../../server/api';
import { createMemoryDeps, type MemoryDeps } from '../../server/memoryDeps';
import { runSetup } from '../../server/setup';
import type { Transport } from '../lib/api';
import { seedSampleData } from './sampleData';

export const MOCK_EMAIL = 'you@example.com';

export interface MockServer {
  deps: MemoryDeps;
  api: ServerHandlers;
  transport: Transport;
}

/** The real server code running against an in-memory workbook. */
export function createMockServer(
  options: { today?: string; sample?: boolean; delayMs?: number } = {},
): MockServer {
  const deps = createMemoryDeps({
    email: MOCK_EMAIL,
    today: options.today ?? new Date().toISOString().slice(0, 10),
  });
  runSetup(deps, MOCK_EMAIL);
  const api = createApi(deps);
  if (options.sample) seedSampleData(api, deps.date);
  const delay = options.delayMs ?? 0;
  const transport: Transport = (name, args) => {
    const handler: ServerHandlers[typeof name] = api[name];
    const result = structuredClone(handler(...structuredClone(args)));
    return new Promise((resolve) => setTimeout(() => resolve(result), delay));
  };
  return { deps, api, transport };
}
