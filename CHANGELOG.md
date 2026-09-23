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
- `setup()` creates the Clients, Tasks and Settings tabs and can be run again safely.
