# Architecture (Current)

## High-level overview
QuestLayer is a Vite multi-page React app with a separate embeddable widget build. The builder and preview live in the main app, while the widget runtime is built from its own entry and mounted into a Shadow DOM.

```
[HTML entry] -> index.tsx -> AppKitProvider -> App.tsx -> page components
```

## Entry points
- Main app: `index.html` + `index.tsx` (see `index.html`, `index.tsx`).
- Additional pages: `browse.html`, `builder.html`, `dashboard.html`, `leaderboard.html` (see `vite.config.ts`).
- Embeddable runtime: `widget-runtime.tsx` compiled to `widget-runtime.js` (see `vite.widget.config.ts`, `widget-runtime.js`).

## Routing flow
Routing is manual and tied to `window.location.pathname`.

```
window.location.pathname
  -> App.tsx currentPage state
  -> window.history.pushState + SEO meta tags
  -> page component (Landing/Dashboard/Explore/Store/Leaderboard)
```

Primary switch is in `App.tsx` with page components in `components/`.

## Widget runtime flow (embed)
```
Host page -> widget-runtime.js -> initQuestLayer()
  -> widget-runtime.tsx (Shadow DOM mount)
  -> components/Widget.tsx (same logic as preview)
```

- Shadow DOM styles are injected via `widget.css` (inlined) and font links.
- Optional `apiBaseUrl` lets the widget call `/api/*` endpoints on a host domain.

## Auth flow (wallet-based)
- AppKit config + wagmi wiring: `appkit.tsx`.
- Widget uses `useAppKitAccount`, `useSignMessage`, and `useSwitchChain` to verify on-chain tasks (see `components/Widget.tsx`).
- No traditional username/password auth in the UI; wallet connection is the identity handle.

## Data flow (Supabase)
```
components/*
  -> lib/supabase.ts (client + RPC wrappers)
  -> Supabase tables + RPCs (supabase_schema.sql)
```

- Builder syncs `AppState` to Supabase via `syncProjectToSupabase`.
- Widget reads and writes user progress directly with the Supabase client when wallet is connected.

## API endpoints
Serverless handlers live in `api/` and are called by the app or widget:
- Metadata/OG image fetch for previews: `api/metadata.ts`, `api/og.ts`.
- On-chain task verification: `api/nft-hold.ts`, `api/token-hold.ts`.

These endpoints use `process.env` keys (including Supabase service role when provided) and return JSON.

## UI organization
- Page-level UI and major sections live in `components/` (e.g., `components/LandingPage.tsx`, `components/Dashboard.tsx`).
- Shared design tokens and themes live in `constants.ts` and are typed in `types.ts`.
- Global UI utilities and animations live in `index.css`; widget-specific styles live in `widget.css`.
