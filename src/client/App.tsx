import type { ReactNode } from 'react';
import { AppShell } from './components/AppShell';
import { ErrorState, LoadingState } from './components/ui/feedback';
import { ClientsPage } from './features/clients/ClientsPage';
import { CashFlowPage } from './features/cashflow/CashFlowPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ContractsPage } from './features/contracts/ContractsPage';
import { MorePage } from './features/more/MorePage';
import { SubscriptionsPage } from './features/subscriptions/SubscriptionsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { TasksPage } from './features/tasks/TasksPage';
import { errorMessage } from './lib/api';
import { useBootstrap } from './lib/queries';
import { useRoute } from './lib/router';

const SECTIONS = [
  'dashboard',
  'tasks',
  'clients',
  'contracts',
  'subscriptions',
  'cashflow',
  'more',
  'settings',
];

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
  const section = route.segments[0] ?? 'dashboard';
  let page: ReactNode;
  if (section === 'clients') page = <ClientsPage bootstrap={data} route={route} />;
  else if (section === 'contracts') page = <ContractsPage bootstrap={data} route={route} />;
  else if (section === 'subscriptions') page = <SubscriptionsPage bootstrap={data} route={route} />;
  else if (section === 'cashflow') page = <CashFlowPage bootstrap={data} route={route} />;
  else if (section === 'more') page = <MorePage />;
  else if (section === 'settings') page = <SettingsPage bootstrap={data} />;
  else if (section === 'tasks')
    page = <TasksPage key={route.path} bootstrap={data} route={route} />;
  else page = <DashboardPage bootstrap={data} />;

  return (
    <AppShell
      appName={data.appName}
      email={data.email}
      activePath={SECTIONS.includes(section) ? `/${section}` : '/dashboard'}
    >
      {page}
    </AppShell>
  );
}
