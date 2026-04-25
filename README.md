# MyTasks

MyTasks is a local-first desktop task manager built with Electron, better-sqlite3, and vanilla HTML/CSS/JavaScript. It stores all data in a SQLite database at Electron's `app.getPath('userData')/tasks.db`, so it works offline and keeps data permanently on the local machine.

## Features

- Native Electron desktop app with secure `contextBridge` IPC.
- Local SQLite persistence for tasks, team members, custom lists, and image attachments.
- First launch asks for your name, email, and role, then stores the profile locally.
- Saved user details appear in the left sidebar and can be clicked to edit.
- Sidebar search filters tasks by title and description.
- Microsoft To Do style sidebar sections, live counts, filters, task groups, overdue highlighting, and edit modals.
- Team management with member reassignment to `me` on delete.
- JSON full backup export/import and CSV task export through native Electron file dialogs.
- Light and dark mode via `prefers-color-scheme`.

## Setup

Open a terminal in this folder:

```bash
cd D:\Personal\Projects\my-task-manager\my-tasks
```

Install dependencies:

```bash
npm install
```

Run the desktop app:

```bash
npm start
```

On first launch, MyTasks asks for the user's name, email, and role. That profile is saved in the local SQLite database and also updates the built-in `Me` team member.

## Build

Create a Windows `.exe` installer:

```bash
npm run build
```

Create a macOS build:

```bash
npm run build:mac
```

Build output is written to `dist/`.

## Project Structure

```text
my-tasks/
├── package.json
├── main.js
├── preload.js
├── db.js
├── src/
│   ├── index.html
│   ├── style.css
│   └── renderer.js
└── README.md
```

## Data Model

The app initializes these SQLite tables on first launch:

- `tasks`
- `users`
- `team`
- `lists`

The `tasks` table includes an `attachments` column that stores image attachments as JSON-serialized base64 data URLs.
