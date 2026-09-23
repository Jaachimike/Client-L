import { z } from 'zod';
import { contractInputSchema } from '../shared/renewalSchemas';
import { AppError } from '../shared/result';
import type { Contract } from '../shared/types';
import { requireUsableClient } from './clientsService';
import { parseInput, type RequestContext } from './context';
import { requireCurrency } from './currency';
import { contractToRow, rowToContract } from './renewalRecords';

function readContracts(ctx: RequestContext): Contract[] {
  return ctx
    .contracts()
    .list()
    .map(rowToContract)
    .filter((c) => c.id !== '');
}

function requireContract(ctx: RequestContext, id: string): Contract {
  const row = ctx.contracts().findById(id);
  if (!row)
    throw new AppError('NOT_FOUND', 'That contract no longer exists. Reload and try again.');
  return rowToContract(row);
}

function saveContract(ctx: RequestContext, [input]: unknown[]): Contract {
  const data = parseInput(contractInputSchema, input);
  return ctx.deps.withLock(() => {
    if (data.id) {
      const existing = requireContract(ctx, data.id);
      requireUsableClient(ctx, data.clientId, existing.clientId);
      requireCurrency(ctx, data.currency, existing.currency);
      const contract: Contract = { ...existing, ...data, id: existing.id };
      ctx.contracts().update(contract.id, contractToRow(contract));
      return contract;
    }
    requireUsableClient(ctx, data.clientId);
    requireCurrency(ctx, data.currency);
    const contract: Contract = {
      ...data,
      id: ctx.deps.newId(),
      renewedById: '',
      created: ctx.deps.now(),
    };
    ctx.contracts().insert(contractToRow(contract));
    return contract;
  });
}

const renewArgs = z.tuple([z.string().trim().min(1, 'Missing contract ID.'), z.unknown()]);

/** Creates the replacement and marks the old contract Renewed, so both stay in the history. */
function renewContract(
  ctx: RequestContext,
  args: unknown[],
): { renewed: Contract; replacement: Contract } {
  const [oldId, input] = parseInput(renewArgs, args);
  const data = parseInput(contractInputSchema, input);
  return ctx.deps.withLock(() => {
    const old = requireContract(ctx, oldId);
    if (old.renewedById) {
      throw new AppError(
        'CONFLICT',
        `"${old.name}" has already been renewed. Reload to see its replacement.`,
      );
    }
    requireUsableClient(ctx, old.clientId);
    requireCurrency(ctx, data.currency, old.currency);
    const replacement: Contract = {
      ...data,
      id: ctx.deps.newId(),
      clientId: old.clientId,
      renewedById: '',
      created: ctx.deps.now(),
    };
    ctx.contracts().insert(contractToRow(replacement));
    ctx.contracts().update(old.id, { 'Renewed by ID': replacement.id });
    return { renewed: { ...old, renewedById: replacement.id }, replacement };
  });
}

export const contractHandlers = {
  listContracts: (ctx: RequestContext) => readContracts(ctx),
  saveContract,
  renewContract,
};
