<div align="center">
  <img width="1200" height="475" alt="QuestLayer banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# QuestLayer Builder Suite

QuestLayer Builder Suite is a Vite + React workspace for crafting a gamified AI widget. The app ships with a cinematic landing page, a multi-section builder dashboard, and live preview tooling so you can shape themes, tasks, and UI placement in one workspace.

This README goes deep on how the project fits together: the builder, the widget runtime, the Supabase-backed persistence layer, and how XP + level thresholds are calculated.

## What’s inside

- **Builder dashboard** for editing tasks, theme styling, and widget placement.
- **Live preview** with desktop/mobile modes and fullscreen support.
- **Profiles & settings** sections to round out the product surface.
- **Tailwind-powered UI** for rapid styling and iteration.
- **Widget runtime** build that can be embedded into any website.

## Tech stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Supabase (optional persistence)
- Reown AppKit (wallet connect)

## Getting started

### Prerequisites

- Node.js 18+ (recommended)
- npm

### Install & run

```bash
npm install
npm run dev
```

Open the app at `http://localhost:5173` (Vite default) or `http://localhost:3000` if you use the repo’s configured Vite dev server port.

### Common scripts

```bash
npm run dev       # start Vite dev server
npm run build     # build for production
npm run preview   # preview the production build
```

## Environment configuration

The project reads configuration from Vite-style environment variables (e.g. `.env.local`). These are loaded in `vite.config.ts` and injected for the runtime and widget build.

Create a `.env.local` file at the project root with the following keys as needed:

```bash
# Supabase (required to use persistence, global XP, or wallet-based profiles)
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Reown AppKit (wallet connection project ID)
VITE_REOWN_PROJECT_ID="your-appkit-project-id"

# Optional: Gemini API key exposed for any future AI services
GEMINI_API_KEY="your-gemini-api-key"
```

Notes:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required if you want anything beyond local/preview data. The app will throw if they are missing or left as placeholders (`lib/supabase.ts`).
- `VITE_REOWN_PROJECT_ID` powers wallet connect in the widget runtime (`appkit.tsx`). If it is missing, the runtime falls back to `YOUR_PROJECT_ID` which is not valid for production.
- `GEMINI_API_KEY` is injected into `process.env.GEMINI_API_KEY` and `process.env.API_KEY` via Vite (`vite.config.ts`). It is not used elsewhere yet but is exposed for future integration.

## How the app works

### High-level architecture

- **Builder UI** (`App.tsx`, `components/Editor.tsx`, `components/Dashboard.tsx`) manages the `AppState` object (project name, theme, tasks, XP, streaks).
- **Live preview + widget** (`components/Widget.tsx`) renders the same `AppState` with interactive questing, XP progression, and rank display.
- **Widget runtime** (`widget-runtime.tsx` + `widget-runtime.js`) is a dedicated entry point that can be embedded as a script on any site. It uses Shadow DOM + scoped styles for isolation.
- **Persistence layer** (`lib/supabase.ts`) syncs project configuration and user progress to Supabase when wallet connection is active.

### App state model

The shared shape lives in `types.ts` and is passed across the builder and widget:

- `projectName`, `accentColor`, `position`, `activeTheme`: configuration for display + placement.
- `tasks`: list of quest tasks, each with title, description, link, icon, and XP reward.
- `userXP`: per-user XP (local preview or fetched from Supabase).
- `currentStreak` + `dailyClaimed`: daily bonus tracking.

### Builder ↔ Preview flow

1. The builder initializes an `AppState` (seeded from `constants.ts`).
2. The editor updates tasks, theme, or placement with local state updates.
3. The preview panel renders `components/Widget.tsx` using the same `AppState` so you can see live changes.
4. If Supabase is configured and a wallet is connected, the builder can sync config to Supabase using `syncProjectToSupabase`.

### Widget runtime flow (embed mode)

The embeddable script is built as a separate entry point with `widget-runtime.js`:

1. Host page loads the script and calls `window.QuestLayer.init(config)` (see `public/test-embed.html`).
2. `widget-runtime.tsx` merges the provided config with defaults and mounts the widget in a Shadow DOM host for style isolation.
3. The runtime injects font + widget styles into the Shadow DOM and keeps z-index rules for the wallet modal.
4. Widget logic is identical to the preview component, including XP accumulation and Supabase sync when connected.

## XP, levels, and rank thresholds

All XP logic lives in `components/Widget.tsx`.

### XP sources

- **Task completion**: each task grants `task.xp` and is removed from the list when completed.
- **Daily claim**: the daily button grants a bonus and advances the streak.

### Daily streaks

Daily bonus math:

```
bonus = 100 * 2^(currentStreak - 1)
```

- `currentStreak` cycles from 1 → 5 and then wraps (`(streak % 5) + 1`).
- `dailyClaimed` prevents multiple claims in the same day.
- If Supabase is connected, the daily claim updates `user_progress` (`xp`, `streak`, `last_claim_date`).

### Level thresholds

Levels are calculated from XP in `calculateLevel`:

- `xpPerLevel = 3000`
- `level = floor(effectiveXP / 3000) + 1`
- `progress = (effectiveXP % 3000) / 3000`
- `xpNeeded = (level * 3000) - effectiveXP`

The widget prefers **global XP** when connected to a wallet (`get_global_xp` RPC in Supabase). Otherwise it uses local `userXP` from the preview state.

### Rank labels

The rank name is derived from the current level:

- Level 1: **Pioneer**
- Levels 2–4: **Guardian**
- Level 5+: **Overlord**

## Supabase setup (optional)

Two SQL files are provided:

- `supabase_schema.sql` – defines tables, RPCs, and RLS.
- `supabase_reset_policies.sql` – resets RLS policies.

### Key tables

- `projects`: builder-level configuration (`name`, `theme`, `position`, `accent_color`).
- `tasks`: quests attached to a project (`xp_reward`, `icon_url`, etc.).
- `end_users` + `user_progress`: wallet-based user tracking.
- `task_completions`: joins users to completed tasks.

### Global XP

`get_global_xp(wallet_addr text)` sums XP across all projects for the same wallet. The widget uses this value to show a global rank when a wallet is connected.

## Embedding the widget

The runtime is built as `widget-runtime.js` (see `vite.config.ts` for the separate build entry). You can embed it with a script tag and config payload:

```html
<script src="/widget-runtime.js" data-config='{
  "projectName": "Vortex Protocol",
  "accentColor": "#6366f1",
  "position": "bottom-right",
  "activeTheme": "aura",
  "tasks": [
    {
      "id": 1,
      "title": "Visit Website",
      "desc": "Explore QuestGalaxy and discover the latest quests and galaxy rewards.",
      "link": "https://questgalaxy.com/",
      "icon": "https://www.google.com/s2/favicons?domain=questgalaxy.com&sz=128",
      "xp": 400
    }
  ]
}'></script>
```

The sample `public/test-embed.html` shows a full local embed using `http://localhost:3000/widget-embed.js` as the script URL in dev.

## Project structure

```
.
├── App.tsx                # App shell, routing between sections
├── appkit.tsx             # Reown AppKit setup (wallet connect)
├── components/            # Landing page, editor, widget, and UI sections
├── constants.ts           # Seed data for tasks and defaults
├── lib/supabase.ts        # Supabase client + sync helpers
├── types.ts               # Shared TypeScript types
├── widget-runtime.tsx     # Embeddable widget entry
├── widget-runtime.js      # Re-export for bundling
├── index.tsx              # App entry point
├── index.css              # Global styles
└── public/                # Static assets + test embed
```

## Notes

- This repo is structured for local development; no backend is required unless you want Supabase-backed persistence.
- Build output is written to `dist/` for production hosting.

## License

This project is provided as-is. Add a license file if you plan to distribute it.
