import { useSyncExternalStore } from 'react';

export interface Route {
  path: string;
  segments: string[];
  params: URLSearchParams;
}

const DEFAULT_PATH = '/tasks';

function readHash(): string {
  return window.location.hash.replace(/^#/, '') || DEFAULT_PATH;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

export function parseRoute(hash: string): Route {
  const [pathPart = DEFAULT_PATH, query = ''] = hash.split('?');
  const segments = pathPart.split('/').filter(Boolean).map(decodeURIComponent);
  return { path: `/${segments.join('/')}`, segments, params: new URLSearchParams(query) };
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, readHash, readHash);
  return parseRoute(hash);
}

export function buildHref(path: string, params?: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) if (value) search.set(key, value);
  const query = search.toString();
  return `#${path}${query ? `?${query}` : ''}`;
}

export function navigate(path: string, params?: Record<string, string | undefined>): void {
  window.location.hash = buildHref(path, params).slice(1);
}
