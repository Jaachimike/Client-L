import type { ServerFunctionName } from '../../shared/api';

type GoogleScriptRun = {
  /** Apps Script passes back whatever the server function returned; `ServerApi` defines its shape. */
  withSuccessHandler<T>(handler: (value: T) => void): GoogleScriptRun;
  withFailureHandler(handler: (error: Error) => void): GoogleScriptRun;
} & { [K in ServerFunctionName]: (...args: unknown[]) => void };

declare global {
  // Provided by Apps Script inside the served page; absent in local development.
  var google: { script?: { run?: GoogleScriptRun } } | undefined;
}
