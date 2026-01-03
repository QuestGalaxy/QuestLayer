<div align="center">
  <img width="1200" height="475" alt="QuestLayer banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# QuestLayer Builder Suite

QuestLayer Builder Suite is a Vite + React experience for crafting a gamified AI widget. The app ships with a cinematic landing page, a multi-section builder dashboard, and live preview tooling so you can shape themes, tasks, and UI placement in one workspace.

## What’s inside

- **Builder dashboard** for editing tasks, theme styling, and widget placement.
- **Live preview** with desktop/mobile modes and fullscreen support.
- **Profiles & settings** sections to round out the product surface.
- **Tailwind-powered UI** for rapid styling and iteration.

## Tech stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Lucide icons

## Getting started

### Prerequisites

- Node.js 18+ (recommended)
- npm

### Install & run

```bash
npm install
npm run dev
```

Open the app at `http://localhost:5173`.

## Common scripts

```bash
npm run dev       # start Vite dev server
npm run build     # build for production
npm run preview   # preview the production build
```

## Project structure

```
.
├── App.tsx                # App shell, routing between sections
├── components/            # Landing page, editor, widget, and UI sections
├── constants.ts           # Seed data for tasks and defaults
├── types.ts               # Shared TypeScript types
├── index.tsx              # App entry point
├── index.css              # Global styles
└── public/                # Static assets
```

## Notes

- This repo is structured for local development; no backend is required.
- Want to ship the widget? Build the project and use the `dist/` output.

## License

This project is provided as-is. Add a license file if you plan to distribute it.
