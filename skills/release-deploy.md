# Skill: Release / Deploy

## Purpose
Build and validate a release for the Vite app + widget runtime.

## Inputs required
- Target environment (local, staging, production).
- Required env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_REOWN_PROJECT_ID`).
- Deployment platform (static hosting/Vercel).

## Step-by-step procedure
1. Ensure env vars are set (`.env.local` or host settings).
2. Run `npm run build` (runs SEO generation, app build, widget build, and build checks).
3. Verify `dist/` includes `widget-runtime.js` and app assets.
4. Confirm rewrites if deploying to Vercel (`vercel.json`).
5. Smoke test with `npm run preview` and `public/test-embed.html`.

## Validation checklist
- `npm run build` succeeds without Supabase placeholder errors.
- `dist/widget-runtime.js` is present.
- Key routes load (`/`, `/builder`, `/dashboard`, `/browse`, `/leaderboard`).

## Common pitfalls
- Missing envs triggers errors in `lib/supabase.ts`.
- SEO pages not generated (build script includes `scripts/generate-seo-pages.mjs`).
- Vercel rewrites out of sync with new pages.

## Example file references
- `package.json`
- `scripts/generate-seo-pages.mjs`
- `scripts/check-widget-build.cjs`
- `vite.config.ts`
- `vite.widget.config.ts`
- `vercel.json`
- `public/test-embed.html`
