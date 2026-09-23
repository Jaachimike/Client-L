import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { hasAppsScript, setTransport } from './lib/api';
import './styles.css';

async function start(): Promise<void> {
  if (import.meta.env.DEV && !hasAppsScript()) {
    const { createMockServer } = await import('./mocks/mockServer');
    setTransport(createMockServer({ sample: true, delayMs: 250 }).transport);
  }
  const queryClient = new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
  });
  const root = document.getElementById('root');
  if (!root) throw new Error('Missing #root element');
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void start();
