import type { ServerHandlers } from '../shared/api';
import { AppError, fail, ok, type ApiResult } from '../shared/result';
import { clientHandlers } from './clientsService';
import { RequestContext } from './context';
import type { ServerDeps } from './deps';
import { settingsHandlers } from './settingsService';
import { taskHandlers } from './tasksService';

type Handler<T> = (ctx: RequestContext, args: unknown[]) => T;

const UNEXPECTED_MESSAGE = 'Something went wrong while talking to the sheet. Try again in a moment.';

/** Checks access on every call, then turns thrown errors into `{ ok: false, error }`. */
export function runHandler<T>(deps: ServerDeps, handler: Handler<T>, args: unknown[]): ApiResult<T> {
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
  const handlers = { ...clientHandlers, ...taskHandlers, ...settingsHandlers };
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
  };
}
