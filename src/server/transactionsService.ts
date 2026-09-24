import { z } from 'zod';
import type { ImportResult } from '../shared/api';
import { duplicateKey } from '../shared/cashflow';
import { importRowsSchema, transactionInputSchema } from '../shared/cashSchemas';
import { AppError } from '../shared/result';
import type { Client, Transaction } from '../shared/types';
import { readClients, requireUsableClient } from './clientsService';
import { parseInput, type RequestContext } from './context';
import { requireCurrency } from './currency';
import { clientToRow } from './records';
import { rowToTransaction, transactionToRow } from './renewalRecords';
import { SETTING_KEYS } from './settings';

function readTransactions(ctx: RequestContext): Transaction[] {
  return ctx
    .transactions()
    .list()
    .map(rowToTransaction)
    .filter((t) => t.id !== '');
}

function requireTransaction(ctx: RequestContext, id: string): Transaction {
  const found = readTransactions(ctx).find((t) => t.id === id);
  if (!found) throw new AppError('NOT_FOUND', 'That entry no longer exists. Reload and try again.');
  return found;
}

/** New categories become suggestions for later entries. */
function rememberCategories(ctx: RequestContext, categories: string[]): void {
  const known = ctx.settings.categories();
  const added = categories.filter(
    (c) => c && !known.some((k) => k.toLowerCase() === c.toLowerCase()),
  );
  if (added.length > 0) {
    ctx.settings.set(SETTING_KEYS.categories, [...known, ...new Set(added)].join(', '));
  }
}

function saveTransaction(ctx: RequestContext, [input]: unknown[]): Transaction {
  const data = parseInput(transactionInputSchema, input);
  return ctx.deps.withLock(() => {
    const existing = data.id ? requireTransaction(ctx, data.id) : null;
    if (data.clientId) requireUsableClient(ctx, data.clientId, existing?.clientId);
    requireCurrency(ctx, data.currency, existing?.currency);
    const tx: Transaction = existing
      ? { ...existing, ...data, id: existing.id }
      : { ...data, id: ctx.deps.newId(), voided: false, created: ctx.deps.now() };
    if (existing) ctx.transactions().update(tx.id, transactionToRow(tx));
    else ctx.transactions().insert(transactionToRow(tx));
    rememberCategories(ctx, [tx.category]);
    return tx;
  });
}

function setTransactionVoided(ctx: RequestContext, args: unknown[]): Transaction {
  const [id, voided] = parseInput(
    z.tuple([z.string().trim().min(1, 'Missing entry ID.'), z.boolean()]),
    args,
  );
  return ctx.deps.withLock(() => {
    const tx = { ...requireTransaction(ctx, id), voided };
    ctx.transactions().update(id, { Voided: voided });
    return tx;
  });
}

/** Matches clients by name (ignoring case) and creates the missing ones in one batch. */
function resolveClients(
  ctx: RequestContext,
  names: string[],
): { ids: Map<string, string>; created: string[] } {
  const ids = new Map(readClients(ctx).map((c) => [c.name.trim().toLowerCase(), c.id]));
  const created: string[] = [];
  const rows = [];
  for (const name of names) {
    const key = name.trim().toLowerCase();
    if (!key || ids.has(key)) continue;
    const client: Client = {
      id: ctx.deps.newId(),
      name: name.trim(),
      contactPerson: '',
      email: '',
      phone: '',
      notes: '',
      archived: false,
      created: ctx.deps.now(),
    };
    ids.set(key, client.id);
    created.push(client.name);
    rows.push(clientToRow(client));
  }
  ctx.clients().insertMany(rows);
  return { ids, created };
}

/** Validates every row again on the server, skips duplicates, and writes the rest in one batch. */
function importTransactions(ctx: RequestContext, [input]: unknown[]): ImportResult {
  const rows = parseInput(importRowsSchema, input);
  return ctx.deps.withLock(() => {
    for (const code of new Set(rows.map((r) => r.currency))) requireCurrency(ctx, code);
    const seen = new Set(readTransactions(ctx).map(duplicateKey));
    const fresh = rows.filter((r) => !seen.has(duplicateKey(r)));
    const { ids, created } = resolveClients(
      ctx,
      fresh.map((r) => r.clientName),
    );
    const txs: Transaction[] = fresh.map((r) => ({
      id: ctx.deps.newId(),
      date: r.date,
      type: r.type,
      amount: r.amount,
      currency: r.currency,
      category: r.category,
      clientId: ids.get(r.clientName.trim().toLowerCase()) ?? '',
      description: r.description,
      reference: r.reference,
      voided: false,
      created: ctx.deps.now(),
    }));
    ctx.transactions().insertMany(txs.map(transactionToRow));
    rememberCategories(
      ctx,
      txs.map((t) => t.category),
    );
    return {
      imported: txs.length,
      duplicates: rows.length - fresh.length,
      clientsCreated: created,
    };
  });
}

export const transactionHandlers = {
  listTransactions: (ctx: RequestContext) => readTransactions(ctx),
  saveTransaction,
  setTransactionVoided,
  importTransactions,
};
