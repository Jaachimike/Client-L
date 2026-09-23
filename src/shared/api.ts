import type { ApiResult } from './result';
import type { ClientInput, TaskInput } from './schemas';
import type { Bootstrap, Client, Status, Task, TaskFilters } from './types';

/** Functions the page can call on the server. Every one checks access first. */
export interface ServerApi {
  getBootstrap(): ApiResult<Bootstrap>;
  listClients(): ApiResult<Client[]>;
  saveClient(input: ClientInput): ApiResult<Client>;
  setClientArchived(id: string, archived: boolean): ApiResult<Client>;
  listTasks(filters?: TaskFilters): ApiResult<Task[]>;
  saveTask(input: TaskInput): ApiResult<Task>;
  setTaskStatus(id: string, status: string): ApiResult<Task>;
  saveStatuses(statuses: Status[]): ApiResult<Status[]>;
  saveAllowedEmails(emails: string[]): ApiResult<string[]>;
}

export type ServerFunctionName = keyof ServerApi;

export const SERVER_FUNCTIONS = [
  'getBootstrap',
  'listClients',
  'saveClient',
  'setClientArchived',
  'listTasks',
  'saveTask',
  'setTaskStatus',
  'saveStatuses',
  'saveAllowedEmails',
] as const satisfies readonly ServerFunctionName[];

/** Server side receives untrusted input, so every argument is `unknown` until validated. */
export type ServerHandlers = {
  [K in ServerFunctionName]: (...args: unknown[]) => ReturnType<ServerApi[K]>;
};
