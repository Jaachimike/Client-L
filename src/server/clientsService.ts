import { z } from 'zod';
import { AppError } from '../shared/result';
import { clientInputSchema } from '../shared/schemas';
import type { Client } from '../shared/types';
import { parseInput, type RequestContext } from './context';
import { clientToRow, rowToClient } from './records';

export function readClients(ctx: RequestContext): Client[] {
  return ctx
    .clients()
    .list()
    .map(rowToClient)
    .filter((client) => client.id !== '')
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function requireClient(ctx: RequestContext, id: string): Client {
  const row = ctx.clients().findById(id);
  if (!row) throw new AppError('NOT_FOUND', 'That client no longer exists. Reload and choose another client.');
  return rowToClient(row);
}

function saveClient(ctx: RequestContext, [input]: unknown[]): Client {
  const data = parseInput(clientInputSchema, input);
  return ctx.deps.withLock(() => {
    if (data.id) {
      const existing = requireClient(ctx, data.id);
      const client: Client = { ...existing, ...data, id: existing.id };
      ctx.clients().update(client.id, clientToRow(client));
      return client;
    }
    const client: Client = {
      ...data,
      id: ctx.deps.newId(),
      archived: false,
      created: ctx.deps.now(),
    };
    ctx.clients().insert(clientToRow(client));
    return client;
  });
}

const archiveArgs = z.tuple([z.string().trim().min(1, 'Missing client ID.'), z.boolean()]);

function setClientArchived(ctx: RequestContext, args: unknown[]): Client {
  const [id, archived] = parseInput(archiveArgs, args);
  return ctx.deps.withLock(() => {
    const client = { ...requireClient(ctx, id), archived };
    ctx.clients().update(id, { Archived: archived });
    return client;
  });
}

export const clientHandlers = {
  listClients: (ctx: RequestContext) => readClients(ctx),
  saveClient,
  setClientArchived,
};
