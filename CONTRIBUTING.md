# Contributing

Thanks for helping improve Client-L. Bug reports, ideas and pull requests are all
welcome.

## Before you start

- For anything bigger than a small fix, open an issue first so we can agree on the approach.
- Never include real client data, emails or financial records in issues, screenshots, tests or
  sample files. Use made-up examples.
- Report security problems privately to the maintainer rather than in a public issue.

## Setting up

You need Node.js 22 or later.

```sh
npm ci
npm run dev     # the app with sample data, no Google account needed
npm run check   # lint, format check, type check, tests and build, exactly as CI runs them
```

To try your change in a real sheet, follow "Install from the code" in the README with a test
Google account.

## How the code is organised

| Path                | What lives there                                                            |
| ------------------- | --------------------------------------------------------------------------- |
| `src/shared/`       | Types, validation schemas and business rules, used by page and server       |
| `src/server/`       | Apps Script back end: access check, API, sheet repositories, `setup()`      |
| `src/client/`       | React app: one folder per screen in `features/`, shared UI in `components/` |
| `src/client/mocks/` | The in-memory server used by `npm run dev` and the tests                    |

## Rules every change follows

- TypeScript in strict mode; no `any` and no type casts.
- Business rules are pure functions in `src/shared` with unit tests.
- The server validates every input with the shared schemas and checks the allowlist on every call.
- Read each sheet tab once per request and write in batches; wrap writes in the lock.
- Columns are found by header name; records link by ID; records are archived, not deleted.
- Render user text as text (no `dangerouslySetInnerHTML`) and allow only `http` and `https` links.
- Use the design tokens for colours; every screen has loading, empty and error states, works at
  375 px wide and with a keyboard.
- Keep files under about 200 lines, and ask before adding a dependency.

## Pull requests

1. Branch from `main` and keep the change small and focused.
2. Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`).
3. Add or update tests for what you changed.
4. Update `README.md` and the `Unreleased` section of `CHANGELOG.md` for anything users will notice.
5. Make sure `npm run check` passes; CI runs the same steps.
