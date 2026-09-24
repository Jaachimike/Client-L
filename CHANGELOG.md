# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[semantic versioning](https://semver.org/).

## [Unreleased]

### Added

- Private access: only Google accounts on the allowlist in Settings can open the app or call it.
- Clients: add, edit, archive and unarchive clients, with a details view listing their tasks.
- Tasks: add and edit tasks linked to a client, with links, notes and an optional due date.
- Inline status changes; moving a task to a done status records its delivery date.
- Filters by client, status and due date (overdue, due this week, no date), plus text search.
- Overdue tasks are shown in red with a plain-language label.
- Settings: add, rename, recolour, reorder and retire task statuses; manage allowed emails.
- `setup()` creates the Clients, Tasks, Contracts, Subscriptions, Transactions and Settings tabs
  and can be run again safely.
- Contracts: track retainers with start and end dates, fee and billing cycle. States (Active,
  Expiring soon, Expired, Renewed) are worked out from the dates; filter by 30, 60 or 90 days,
  expired, or client. Renew creates the next contract with pre-filled dates and keeps the old one.
- Subscriptions: track domains, hosting, email and licences you manage for clients. Filter by
  7, 30 or 90 days, overdue, cancelled, client, provider or who pays. Mark renewed moves the date on
  one cycle (keeping the billing day) and can log the payment as an outflow. Rebilled items show a
  Charge client reminder until marked charged. Cancelled items stay in the history.
- Client pages list the client's contracts and subscriptions.
- Settings: choose your currencies, default currency and the warning window.
- Cash flow: log money in and out with date, amount, currency, category, client and reference.
  Monthly inflow, outflow and net per currency, a 6-month chart (also shown as a table), and
  filters by month, all time, no date, type, client and category. Entries can be edited or voided.
- Import CSV: bring in an existing Inflow/Outflow sheet with a preview first. It lists skipped rows
  and why, creates missing clients, suggests categories, and skips rows already imported.
- Phones get a More tab for Cash flow and Settings.
- Dashboard as the start page: overdue tasks, tasks due in the next 7 days, contracts ending and
  subscriptions renewing within the warning window (each opens the matching filter), a needs
  attention list, a coming up list and this month's cash flow. Phones get a Home tab.
- A Client Task Tracker menu in the spreadsheet to set up the sheet and add or clear sample data.
- Sample data: made-up records in every tab, removable in one click without touching your own.
- README with screenshots, a no-code install from a template copy, permissions explained, a
  troubleshooting table and how to use your own web address; LICENSE (MIT), CONTRIBUTING.md and
  issue templates.

### Permissions

- The app now also asks to show menus and alerts in its own spreadsheet, for the new menu.
