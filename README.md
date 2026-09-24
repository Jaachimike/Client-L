# Client Task Tracker

A private web app for freelancers and consultants: every client, task, maintenance contract,
subscription you manage for them, and payment in or out, in one place. Everything is stored in
your own Google Sheet and runs under your own Google account, so there is no server to host and
nothing to pay for.

![Dashboard showing overdue tasks, expiring contracts, renewals and this month's cash flow](docs/screenshots/dashboard.png)

## What it does

- **Dashboard**: overdue tasks, tasks due this week, contracts ending and subscriptions renewing
  soon, and this month's money in and out. Every number opens the matching list.
- **Tasks**: each task belongs to a client and has a title, description, links and an optional
  due date. Change status in one click; overdue tasks are flagged in red and in words.
- **Your own statuses**: start with To do, In progress and Delivered, then add your own (for
  example "Waiting on client"), pick colours, reorder or retire them.
- **Clients**: contact details, notes, and every task, contract and subscription for that client.
  Archive clients you no longer work with; their history stays.
- **Contracts**: retainers and maintenance agreements. See what ends in the next 30, 60 or 90 days
  and renew in one step; the old contract stays in the history.
- **Subscriptions**: domains, hosting, email and licences you manage for clients, with renewal
  dates, who pays, and a reminder to charge the client when you rebill.
- **Cash flow**: money in and out with monthly totals per currency and a 6-month chart. Import an
  existing sheet from a CSV file and see exactly what will be added before anything is saved.
- **Private by default**: only the Google accounts you allow can open the app. Works on phones.

| Tasks                                | Contracts                                    | Cash flow                                    |
| ------------------------------------ | -------------------------------------------- | -------------------------------------------- |
| ![Tasks](docs/screenshots/tasks.png) | ![Contracts](docs/screenshots/contracts.png) | ![Cash flow](docs/screenshots/cash-flow.png) |

| Clients                                  | Subscriptions                                        | On a phone                                     |
| ---------------------------------------- | ---------------------------------------------------- | ---------------------------------------------- |
| ![Clients](docs/screenshots/clients.png) | ![Subscriptions](docs/screenshots/subscriptions.png) | ![Phone](docs/screenshots/phone-dashboard.png) |

## Privacy

Each copy runs under its owner's Google account and stores data only in that owner's sheet.
**Nothing is sent to the authors of this project or to any third party.** The app never asks for,
stores or shows passwords; use the notes fields to point to your password manager.

When you first run it, Google asks you to allow three things:

| Permission                               | Why                                                          |
| ---------------------------------------- | ------------------------------------------------------------ |
| See and edit the spreadsheet it runs in  | Your data lives in this one sheet and nowhere else.          |
| See your email address                   | To check the person opening the app is on your allowed list. |
| Show menus and alerts in the spreadsheet | For the Client Task Tracker menu (set up, sample data).      |

## Install in about 10 minutes (no code)

1. Open the template and choose **Make a copy**: <!-- TEMPLATE_COPY_LINK --> _link added at
   release_. The copy is yours, in your own Google Drive.
2. In your copy, wait a few seconds for the **Client Task Tracker** menu to appear, then choose
   **Client Task Tracker > Set up this sheet**. Approve the permissions (see the table above).
   Google may warn that the app is unverified, because it is your own private copy: choose
   **Advanced > Go to Client Task Tracker**. Setup creates the tabs and adds your email to the
   allowed list.
3. Optional: **Client Task Tracker > Add sample data** to see how everything works. Remove it any
   time with **Clear sample data**; your own records are never touched.
4. Choose **Extensions > Apps Script**, then **Deploy > New deployment**. Pick the type **Web
   app**, set **Execute as** to _Me_ and **Who has access** to _Anyone with a Google account_,
   then **Deploy**. Open the web app URL and bookmark it.

> **"Sorry, unable to open the file at present"?** This is a Google bug that affects Apps Script
> web apps when the browser is signed in to more than one Google account. Open the app in a
> browser profile signed in only with the account that deployed it (or in a private window).

## Install from the code (for developers)

You need Node.js 22 or later and a Google account.

```sh
git clone <!-- REPOSITORY_URL --> client-task-tracker
cd client-task-tracker
npm ci
npx clasp login
npx clasp create --type sheets --title "Client Task Tracker" --rootDir dist
npm run push
```

`clasp create` writes `.clasp.json`, which Git ignores. To use an existing sheet instead, copy
`.clasp.example.json` to `.clasp.json` and set `scriptId`. Then open the sheet, run **Client Task
Tracker > Set up this sheet** and deploy as in step 4 above.

## Updating

- **Template copies:** your copy keeps working as it is. A new copy of the template starts empty, so
  it is not a way to update. To move an existing sheet to a new version, follow the developer steps
  against it (copy its script ID from **Extensions > Apps Script > Project settings** into
  `.clasp.json`).
- **Developers:** run `npm run push`, then **Deploy > Manage deployments > Edit > Version: New
  version > Deploy**. The web app URL stays the same. If the release notes mention new tabs or
  settings, run **Set up this sheet** again; it only adds what is missing.

## Letting other people in

Add their email under **Settings > Access** (or in the `Allowed emails` row of the Settings tab).
It takes effect on their next page load; no redeploy is needed. Google does not always share the
email of personal Gmail accounts with an app run by someone else, so people outside your own
Google Workspace domain may still be denied.

## Importing an existing sheet

In your old sheet choose **File > Download > Comma-separated values (.csv)**. In the app open
**Cash flow > Import CSV** and choose the file. The first row must hold column headers. The app
recognises Description, Inflow, Outflow (or Amount and Type), Project Name or Client, Date (day
first, such as 03/03/2025), Currency, Category and Comments. You will see how many entries will be
added, which rows are skipped and why (blank rows and TOTAL rows are always skipped), and which
clients will be created. Importing the same file twice does not add anything twice.

## Using the sheet directly

You can read and edit the sheet yourself; the app picks up changes on the next load. Columns are
matched by their header, so you can reorder them or add your own. Records link to each other by
ID, so renaming a client never breaks its tasks. Contract and subscription states are worked out
from the dates, so they are never out of date.

## Using your own web address

Google serves the app from a `script.google.com` address, and it cannot be moved to your own
domain. To give it a friendlier address, make a subdomain such as `tasks.example.com` redirect to
your web app URL. Most domain providers call this **URL forwarding** or a **redirect rule**; choose
a permanent (301) redirect to the full URL ending in `/exec`, and turn off forwarding the path
(an extra path on the end would break the link). Visitors still sign in with Google as usual, and
the address bar shows the Google address once the app opens. Embedding the app in a frame on your
own site is not supported, because Google's sign-in page will not load inside a frame.

## Troubleshooting

| You see                          | What to do                                                              |
| -------------------------------- | ----------------------------------------------------------------------- |
| "Setup needed"                   | Run **Client Task Tracker > Set up this sheet** in the spreadsheet.     |
| "Access denied" for yourself     | Check your email is in the `Allowed emails` row of the Settings tab.    |
| "Sorry, unable to open the file" | Use a browser profile signed in to only one Google account (see above). |
| The menu does not appear         | Reload the spreadsheet and wait a few seconds.                          |

## Development

| Task                                             | Command                                                     |
| ------------------------------------------------ | ----------------------------------------------------------- |
| Run locally with sample data (no Google account) | `npm run dev`                                               |
| Tests                                            | `npm test`                                                  |
| Lint, format check, type check                   | `npm run lint`, `npm run format:check`, `npm run typecheck` |
| Build `dist/`                                    | `npm run build`                                             |
| Everything CI runs                               | `npm run check`                                             |

The front end is React and TypeScript, bundled by Vite into one HTML file. The back end is
Google Apps Script written in TypeScript. `npm run dev` runs the real server code against an
in-memory sheet, so you can work on the UI without deploying. See
[CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

[MIT](LICENSE) © 2026 Jaachi Okafor
