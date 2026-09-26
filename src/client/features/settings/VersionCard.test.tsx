import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { APP_VERSION } from '../../../shared/version';
import { renderApp } from '../../testing/renderApp';
import { VersionCard } from './VersionCard';

describe('VersionCard', () => {
  it('shows the running version from package.json in Settings', async () => {
    renderApp({ hash: '/settings' });
    expect(await screen.findByText(APP_VERSION)).toBeInTheDocument();
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('warns when the page and the server code come from different releases', () => {
    render(<VersionCard serverVersion="0.9.0" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      `The page is version ${APP_VERSION} but the server code is version 0.9.0.`,
    );
  });
});
