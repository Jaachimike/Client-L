import type { ApiResult } from '../shared/result';
import { createApi } from './api';
import { createMemoryDeps } from './memoryDeps';
import { runSetup } from './setup';

export const OWNER = 'owner@example.com';

export function freshApp(today = '2026-10-01') {
  const deps = createMemoryDeps({ email: OWNER, today });
  runSetup(deps, OWNER);
  return { deps, api: createApi(deps) };
}

export function unwrap<T>(result: ApiResult<T>): T {
  if (!result.ok)
    throw new Error(`Expected success but got ${result.error.code}: ${result.error.message}`);
  return result.data;
}

export function tab(deps: ReturnType<typeof freshApp>['deps'], name: string) {
  const table = deps.workbook.getTable(name);
  if (!table) throw new Error(`Missing tab ${name}`);
  return table;
}
