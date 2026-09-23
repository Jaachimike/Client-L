import type { ServerApi, ServerFunctionName } from '../../shared/api';
import type { ApiError } from '../../shared/result';

type Args<K extends ServerFunctionName> = Parameters<ServerApi[K]>;
type Result<K extends ServerFunctionName> = ReturnType<ServerApi[K]>;
type Data<K extends ServerFunctionName> = Extract<Result<K>, { ok: true }>['data'];

export type Transport = <K extends ServerFunctionName>(
  name: K,
  args: Args<K>,
) => Promise<Result<K>>;

export class ApiRequestError extends Error {
  constructor(readonly apiError: ApiError) {
    super(apiError.message);
    this.name = 'ApiRequestError';
  }
}

const NETWORK_MESSAGE = 'The app could not reach Google. Check your connection and try again.';

const appsScriptTransport: Transport = (name, args) =>
  new Promise((resolve, reject) => {
    const run = globalThis.google?.script?.run;
    if (!run) return reject(new ApiRequestError({ code: 'UNEXPECTED', message: NETWORK_MESSAGE }));
    run
      .withSuccessHandler(resolve)
      .withFailureHandler((error: Error) =>
        reject(
          new ApiRequestError({
            code: 'UNEXPECTED',
            message: `${NETWORK_MESSAGE} (${error.message})`,
          }),
        ),
      )
      [name](...args);
  });

let transport: Transport | null = null;

export function setTransport(next: Transport): void {
  transport = next;
}

export function hasAppsScript(): boolean {
  return globalThis.google?.script?.run !== undefined;
}

/** Calls a server function and returns its data, or throws an `ApiRequestError`. */
export async function callServer<K extends ServerFunctionName>(
  name: K,
  ...args: Args<K>
): Promise<Data<K>> {
  const active = transport ?? (hasAppsScript() ? appsScriptTransport : null);
  if (!active) throw new ApiRequestError({ code: 'UNEXPECTED', message: NETWORK_MESSAGE });
  const result = await active(name, args);
  if (!result.ok) throw new ApiRequestError(result.error);
  return result.data;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.apiError.message;
  return 'Something went wrong. Try again in a moment.';
}

export function fieldErrors(error: unknown): Record<string, string> {
  return error instanceof ApiRequestError ? (error.apiError.fields ?? {}) : {};
}
