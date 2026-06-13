# TaskForge

TaskForge is a modern React + Vite task management app built for teams and individual workflows. It includes workspace support, custom roles, task search, filters, and a polished dashboard for managing overdue, upcoming, and completed work.

**Author:** Uday Kiran darla - udaykirandarla2002@gma,,

## Features

- Add, edit, delete, and complete tasks
- Search tasks with live filtering
- Filter by assignee and priority
- Sort tasks by newest, oldest, or due date
- Overdue, upcoming, and completed task sections
- Delete individual tasks from task cards or task details modal
- Delete all completed tasks from the Completed section
- Team member management with predefined and custom roles
- User setup modal with role selection and sidebar role display
- Workspace management and JSON export/import support

## Installation

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

Open the local URL shown in the terminal to preview the app.

## Build

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Folder Structure

- `src/`
  - `components/` - reusable UI components like `Sidebar`, `TaskCard`, and `UserSetupModal`
  - `context/TaskContext.jsx` - app state management with reducer actions
  - `pages/` - application pages such as `Dashboard` and `Settings`
  - `utils/` - helper utilities
- `public/` - static assets
- `index.html` - application entry HTML
- `vite.config.js` - Vite configuration

## Built With

- React
- Vite
- Tailwind CSS
- React Router DOM
- Redux / React Redux

## Notes

- The app currently uses local state only and does not persist data beyond page refresh.
- The user setup modal requires name, email, and role before the app interface becomes available.
