# Client Task Tracker

A lightweight web app for keeping track of clients and the tasks they send you. Everything is
stored in your own Google Sheet and runs under your own Google account, so there is no server to
host and nothing to pay for.

> Status: early development. Clients, tasks, contracts, subscriptions and settings work today.
> Cash flow and the dashboard are planned.

## What it does

- **Clients**: name, contact person, email, phone and notes. Archive clients you no longer work
  with; their history stays.
- **Tasks**: each task belongs to a client and has a title, description, links and an optional
  due date. Change status in one click; overdue tasks are flagged in red.
- **Filters**: by client, status and due date (overdue, due this week, no date), plus search.
- **Your own statuses**: start with To do, In progress and Delivered, then add your own (for
  example "Waiting on client"), pick colours, reorder or retire them.
- **Contracts**: retainers and maintenance agreements with their end dates. See what is expiring
  in the next 30, 60 or 90 days and renew in one step; the old contract stays in the history.
- **Subscriptions**: domains, hosting, email and licences you manage for clients, with renewal
  dates, who pays, and a reminder to charge the client when you rebill.
- **Private by default**: only the Google accounts you allow can open the app.

## Privacy

Each copy runs under its owner's Google account and stores data only in that owner's sheet.
Nothing is sent to the authors of this project or to any third party. The app asks only for access
to the one spreadsheet it is attached to and for your email address (to check it against the
allowlist). Never store passwords in the app; use notes to point to your password manager.

## Install (developer path)

You need Node.js 20 or later and a Google account.

1. Clone this repository and install dependencies:

   ```sh
   npm ci
   ```

2. Log in to Google's Apps Script command-line tool, then create a new sheet with a script
   attached:

   ```sh
   npx clasp login
   npx clasp create --type sheets --title "Client Task Tracker" --rootDir dist
   ```

   This writes `.clasp.json`, which is ignored by Git. If you already have a sheet, copy
   `.clasp.example.json` to `.clasp.json` and set `scriptId` instead.

3. Build and push the code:

   ```sh
   npm run push
   ```

4. Open the script (`npx clasp open-script`), choose `setup` in the function list and click
   **Run**. Approve the permissions. This creates the Clients, Tasks and Settings tabs and adds
   your email to the allowlist. Running it again only fills in anything missing.

5. Deploy: **Deploy > New deployment > Web app**. Set **Execute as** to _Me_ and **Who has
   access** to _Anyone with a Google account_. Open the web app URL and bookmark it.

> **"Sorry, unable to open the file at present"?** This is a Google bug that affects Apps Script
> web apps when the browser is signed in to more than one Google account. Open the app in a
> browser profile signed in only with the account that deployed it (or in a private window).

### Updating

Run `npm run push`, then **Deploy > Manage deployments > Edit > Version: New version > Deploy**.
The web app URL stays the same. If the update adds new tabs or settings, run `setup` once more in
the Apps Script editor; it only adds what is missing and never changes your data.

### Letting other people in

Add their email under **Settings > Access** (or in the `Allowed emails` row of the Settings tab).
It takes effect on their next page load; no redeploy is needed. Google does not always share the
email of personal Gmail accounts with an app run by someone else, so people outside your own
Google Workspace domain may still be denied.

## Using the sheet directly

You can read and edit the sheet yourself; the app picks up changes on the next load. Columns are
matched by their header, so you can reorder them or add your own. Records link to each other by
ID, so renaming a client never breaks its tasks.

## Development

| Task                                                  | Command                                                     |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| Run locally with fake data (no Google account needed) | `npm run dev`                                               |
| Tests                                                 | `npm test`                                                  |
| Lint, format check, type check                        | `npm run lint`, `npm run format:check`, `npm run typecheck` |
| Build `dist/`                                         | `npm run build`                                             |
| Everything CI runs                                    | `npm run check`                                             |

The front end is React and TypeScript, bundled by Vite into one HTML file. The back end is
Google Apps Script written in TypeScript. `npm run dev` runs the real server code against an
in-memory sheet, so you can work on the UI without deploying.
