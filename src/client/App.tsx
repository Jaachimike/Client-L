import type { ReactNode } from 'react';
import { AppShell } from './components/AppShell';
import { ErrorState, LoadingState } from './components/ui/feedback';
import { ClientsPage } from './features/clients/ClientsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { TasksPage } from './features/tasks/TasksPage';
import { errorMessage } from './lib/api';
import { useBootstrap } from './lib/queries';
import { useRoute } from './lib/router';

export function App() {
  const route = useRoute();
  const bootstrap = useBootstrap();

  if (bootstrap.isPending) {
    return (
      <main className="p-6">
        <LoadingState label="Loading your workspace…" />
      </main>
    );
  }
  if (bootstrap.isError) {
    return (
      <main className="p-6">
        <ErrorState
          message={errorMessage(bootstrap.error)}
          onRetry={() => void bootstrap.refetch()}
        />
      </main>
    );
  }

  const data = bootstrap.data;
  const section = route.segments[0] ?? 'tasks';
  let page: ReactNode;
  if (section === 'clients') page = <ClientsPage bootstrap={data} route={route} />;
  else if (section === 'settings') page = <SettingsPage bootstrap={data} />;
  else page = <TasksPage key={route.path} bootstrap={data} route={route} />;

  return (
    <AppShell
      appName={data.appName}
      email={data.email}
      activePath={section === 'clients' || section === 'settings' ? `/${section}` : '/tasks'}
    >
      {page}
    </AppShell>
  );
}
