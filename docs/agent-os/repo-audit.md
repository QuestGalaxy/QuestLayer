# Repo Audit

## Stack snapshot
- App framework: React 19 + TypeScript (see `package.json`, `index.tsx`, `tsconfig.json`).
- Build system: Vite 6 multi-page build (see `vite.config.ts`, `browse.html`, `builder.html`, `dashboard.html`, `leaderboard.html`, `index.html`).
- Widget build: separate Vite library build for `widget-runtime.js` (see `vite.widget.config.ts`, `widget-runtime.tsx`).
- UI system: Tailwind CSS 4 + custom CSS utilities/animations (see `tailwind.config.cjs`, `index.css`, `widget.css`, `components/`).
- Data layer: Supabase client + RPC usage (see `lib/supabase.ts`, `supabase_schema.sql`).
- Auth pattern: wallet-based via Reown AppKit + wagmi hooks (see `appkit.tsx`, `components/Widget.tsx`).
- API routes: serverless handlers in `api/` (metadata/OG, NFT/Token hold checks) (see `api/metadata.ts`, `api/og.ts`, `api/nft-hold.ts`, `api/token-hold.ts`).

## Router status
- Not a Next.js repo. Routing is a combination of Vite multi-page entries and manual path handling.
- `App.tsx` inspects `window.location.pathname` and updates history/meta for pages like `/browse`, `/builder`, `/dashboard`, `/leaderboard`.

## Tooling
- Linting/formatting: not configured (no `lint`/`format` scripts in `package.json`).
- Tests: not configured (no `test` script in `package.json`).
- Build pipeline: `npm run build` runs SEO generation, app build, widget build, and widget build check (see `package.json`, `scripts/generate-seo-pages.mjs`, `scripts/check-widget-build.cjs`).

## Env + config
- Vite runtime envs: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_REOWN_PROJECT_ID` (see `README.md`, `lib/supabase.ts`, `appkit.tsx`).
- Widget build injects envs at build time (see `vite.widget.config.ts`).
- Optional API key exposure: `GEMINI_API_KEY` is injected in `vite.config.ts` (see `README.md`, `vite.config.ts`).
