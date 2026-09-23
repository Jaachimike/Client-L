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
