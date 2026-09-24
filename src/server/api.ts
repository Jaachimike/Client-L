import type { ServerHandlers } from '../shared/api';
import { AppError, fail, ok, type ApiResult } from '../shared/result';
import { clientHandlers } from './clientsService';
import { contractHandlers } from './contractsService';
import { subscriptionHandlers } from './subscriptionsService';
import { transactionHandlers } from './transactionsService';
import { RequestContext } from './context';
import type { ServerDeps } from './deps';
import { addSampleData, clearSampleData } from './sampleService';
import { settingsHandlers } from './settingsService';
import { taskHandlers } from './tasksService';

type Handler<T> = (ctx: RequestContext, args: unknown[]) => T;

const UNEXPECTED_MESSAGE =
  'Something went wrong while talking to the sheet. Try again in a moment.';

/** Checks access on every call, then turns thrown errors into `{ ok: false, error }`. */
export function runHandler<T>(
  deps: ServerDeps,
  handler: Handler<T>,
  args: unknown[],
): ApiResult<T> {
  try {
    const ctx = new RequestContext(deps);
    ctx.checkAccess();
    return ok(handler(ctx, args));
  } catch (error) {
    if (error instanceof AppError) return fail(error.toApiError());
    deps.logError(error);
    return fail({ code: 'UNEXPECTED', message: UNEXPECTED_MESSAGE });
  }
}

export function createApi(deps: ServerDeps): ServerHandlers {
  const handlers = {
    ...clientHandlers,
    ...taskHandlers,
    ...settingsHandlers,
    ...contractHandlers,
    ...subscriptionHandlers,
    ...transactionHandlers,
  };
  return {
    getBootstrap: (...args) => runHandler(deps, handlers.getBootstrap, args),
    listClients: (...args) => runHandler(deps, handlers.listClients, args),
    saveClient: (...args) => runHandler(deps, handlers.saveClient, args),
    setClientArchived: (...args) => runHandler(deps, handlers.setClientArchived, args),
    listTasks: (...args) => runHandler(deps, handlers.listTasks, args),
    saveTask: (...args) => runHandler(deps, handlers.saveTask, args),
    setTaskStatus: (...args) => runHandler(deps, handlers.setTaskStatus, args),
    saveStatuses: (...args) => runHandler(deps, handlers.saveStatuses, args),
    saveAllowedEmails: (...args) => runHandler(deps, handlers.saveAllowedEmails, args),
    saveDefaults: (...args) => runHandler(deps, handlers.saveDefaults, args),
    listContracts: (...args) => runHandler(deps, handlers.listContracts, args),
    saveContract: (...args) => runHandler(deps, handlers.saveContract, args),
    renewContract: (...args) => runHandler(deps, handlers.renewContract, args),
    listSubscriptions: (...args) => runHandler(deps, handlers.listSubscriptions, args),
    saveSubscription: (...args) => runHandler(deps, handlers.saveSubscription, args),
    markSubscriptionRenewed: (...args) => runHandler(deps, handlers.markSubscriptionRenewed, args),
    markSubscriptionCharged: (...args) => runHandler(deps, handlers.markSubscriptionCharged, args),
    listTransactions: (...args) => runHandler(deps, handlers.listTransactions, args),
    saveTransaction: (...args) => runHandler(deps, handlers.saveTransaction, args),
    setTransactionVoided: (...args) => runHandler(deps, handlers.setTransactionVoided, args),
    importTransactions: (...args) => runHandler(deps, handlers.importTransactions, args),
    addSampleData: (...args) => runHandler(deps, () => addSampleData(deps), args),
    clearSampleData: (...args) => runHandler(deps, () => clearSampleData(deps), args),
    setSubscriptionCancelled: (...args) =>
      runHandler(deps, handlers.setSubscriptionCancelled, args),
  };
}
