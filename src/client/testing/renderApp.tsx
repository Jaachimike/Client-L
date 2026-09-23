import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../App';
import { setTransport } from '../lib/api';
import { createMockServer, type MockServer } from '../mocks/mockServer';

export const TODAY = '2026-10-01';

export function renderApp(options: { hash?: string; seed?: (server: MockServer) => void } = {}) {
  const server = createMockServer({ today: TODAY });
  options.seed?.(server);
  setTransport(server.transport);
  window.location.hash = options.hash ?? '/tasks';
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const user = userEvent.setup();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
  return { ...view, server, user };
}

export function created<T>(
  result: { ok: true; data: T } | { ok: false; error: { message: string } },
): T {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}

/** The desktop and phone layouts both render in jsdom; this returns the desktop primary button. */
export function primaryAction(name: string) {
  const [first] = screen.getAllByRole('button', { name });
  if (!first) throw new Error(`No ${name} button`);
  return first;
}
