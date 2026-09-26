import { ErrorAlert } from '../../components/ui/feedback';
import { APP_VERSION } from '../../../shared/version';

const RELEASES_URL = 'https://github.com/Jaachimike/Client-L/releases';

/**
 * Shows which version is running. A manual update replaces the page and the server code
 * separately, so a mismatch means one of the two files was not pasted in.
 */
export function VersionCard({ serverVersion }: { serverVersion: string }) {
  const mismatch = serverVersion !== APP_VERSION;
  return (
    <section
      aria-labelledby="version-heading"
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-5 sm:p-6"
    >
      <h2 id="version-heading" className="font-heading text-2xl font-semibold">
        About
      </h2>
      <p>
        Client-L version <span className="font-mono">{APP_VERSION}</span>
      </p>
      {mismatch && (
        <ErrorAlert>
          The page is version {APP_VERSION} but the server code is version {serverVersion}. Paste
          both Code and index from the same release, then deploy a new version.
        </ErrorAlert>
      )}
      <p className="text-[13px] text-text-muted">
        New versions and update instructions are on the{' '}
        <a
          href={RELEASES_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          releases page
        </a>
        . Updating never changes your data.
      </p>
    </section>
  );
}
