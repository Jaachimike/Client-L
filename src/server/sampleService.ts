import type { SampleSummary } from '../shared/api';
import { AppError } from '../shared/result';
import { clientHandlers } from './clientsService';
import { RequestContext } from './context';
import { contractHandlers } from './contractsService';
import type { ServerDeps } from './deps';
import { cellText } from './records';
import type { Repository, Row } from './repository';
import {
  SAMPLE_CLIENTS,
  sampleContracts,
  sampleSubscriptions,
  sampleTasks,
  sampleTransactions,
  type SampleClientKey,
} from './sampleRecords';
import { subscriptionHandlers } from './subscriptionsService';
import { taskHandlers } from './tasksService';
import { transactionHandlers } from './transactionsService';

export const SAMPLE_PREFIX = 'sample-';

const isSample = (row: Row) => cellText(row['ID']).startsWith(SAMPLE_PREFIX);

export function hasSampleData(ctx: RequestContext): boolean {
  return ctx.clients().list().some(isSample);
}

/** Adds demo records whose IDs start with "sample-", so they can be removed cleanly later. */
export function addSampleData(deps: ServerDeps): SampleSummary {
  return deps.withLock(() => {
    const ctx = new RequestContext({
      ...deps,
      newId: () => `${SAMPLE_PREFIX}${deps.newId()}`,
      withLock: (fn) => fn(),
    });
    if (hasSampleData(ctx)) {
      throw new AppError(
        'CONFLICT',
        'Sample data is already in the sheet. Clear it first if you want a fresh set.',
      );
    }
    const today = deps.today();
    const currency = ctx.settings.defaultCurrency();
    const keys: SampleClientKey[] = ['northwind', 'harbour', 'lumen', 'oldMill'];
    const clients = keys.map((key) => clientHandlers.saveClient(ctx, [SAMPLE_CLIENTS[key]]));
    const [northwind, harbour, lumen, oldMill] = clients.map((c) => c.id);
    const ids: Record<SampleClientKey, string> = {
      northwind: northwind ?? '',
      harbour: harbour ?? '',
      lumen: lumen ?? '',
      oldMill: oldMill ?? '',
    };
    const tasks = sampleTasks(today, ids);
    for (const { status, ...task } of tasks) {
      const saved = taskHandlers.saveTask(ctx, [task]);
      if (status) taskHandlers.setTaskStatus(ctx, [saved.id, status]);
    }
    const contracts = sampleContracts(today, ids, currency);
    for (const contract of contracts) contractHandlers.saveContract(ctx, [contract]);
    const subs = sampleSubscriptions(today, ids, currency);
    for (const sub of subs) subscriptionHandlers.saveSubscription(ctx, [sub]);
    const txs = sampleTransactions(today, ids, currency);
    for (const tx of txs) transactionHandlers.saveTransaction(ctx, [tx]);
    clientHandlers.setClientArchived(ctx, [ids.oldMill, true]);
    return {
      clients: clients.length,
      tasks: tasks.length,
      contracts: contracts.length,
      subscriptions: subs.length,
      transactions: txs.length,
    };
  });
}

/** Deletes only "sample-" rows. Sample clients your own records point at are kept. */
export function clearSampleData(deps: ServerDeps): SampleSummary {
  return deps.withLock(() => {
    const ctx = new RequestContext(deps);
    const dependents: Repository[] = [
      ctx.tasks(),
      ctx.contracts(),
      ctx.subscriptions(),
      ctx.transactions(),
    ];
    const [tasks = 0, contracts = 0, subscriptions = 0, transactions = 0] = dependents.map((repo) =>
      repo.removeWhere(isSample),
    );
    const stillUsed = new Set(
      dependents.flatMap((repo) => repo.list().map((row) => cellText(row['Client ID']))),
    );
    const clients = ctx
      .clients()
      .removeWhere((row) => isSample(row) && !stillUsed.has(cellText(row['ID'])));
    return { clients, tasks, contracts, subscriptions, transactions };
  });
}
