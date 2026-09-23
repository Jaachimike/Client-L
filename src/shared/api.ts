import type { ApiResult } from './result';
import type { ContractInput, DefaultsInput, SubscriptionInput } from './renewalSchemas';
import type { ClientInput, TaskInput } from './schemas';
import type {
  Bootstrap,
  Client,
  Contract,
  Status,
  Subscription,
  Task,
  TaskFilters,
  Transaction,
} from './types';

export type Defaults = Pick<Bootstrap, 'defaultCurrency' | 'currencies' | 'warningDays'>;

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
  saveDefaults(input: DefaultsInput): ApiResult<Defaults>;
  listContracts(): ApiResult<Contract[]>;
  saveContract(input: ContractInput): ApiResult<Contract>;
  renewContract(
    oldId: string,
    input: ContractInput,
  ): ApiResult<{ renewed: Contract; replacement: Contract }>;
  listSubscriptions(): ApiResult<Subscription[]>;
  saveSubscription(input: SubscriptionInput): ApiResult<Subscription>;
  markSubscriptionRenewed(
    id: string,
    logPayment: boolean,
  ): ApiResult<{ subscription: Subscription; transaction: Transaction | null }>;
  markSubscriptionCharged(id: string): ApiResult<Subscription>;
  setSubscriptionCancelled(id: string, cancelled: boolean): ApiResult<Subscription>;
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
  'saveDefaults',
  'listContracts',
  'saveContract',
  'renewContract',
  'listSubscriptions',
  'saveSubscription',
  'markSubscriptionRenewed',
  'markSubscriptionCharged',
  'setSubscriptionCancelled',
] as const satisfies readonly ServerFunctionName[];

/** Server side receives untrusted input, so every argument is `unknown` until validated. */
export type ServerHandlers = {
  [K in ServerFunctionName]: (...args: unknown[]) => ReturnType<ServerApi[K]>;
};
