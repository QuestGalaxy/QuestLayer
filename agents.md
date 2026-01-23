# Agent OS: QuestLayer

QuestLayer Builder Suite is a Vite + React workspace for building a gamified quest widget: a builder dashboard + live preview, plus an embeddable widget runtime with optional Supabase persistence and wallet-based identity.

## Coding principles (observed)
- Centralize shared data shape in `types.ts` and pass `AppState` through builder + widget.
- Use Tailwind utility classes for UI and theme variants defined in `constants.ts`.
- Keep page-level UI in `components/` and switch views in `App.tsx` without a router.
- Use Supabase helpers from `lib/supabase.ts` when possible; keep RPC/table names aligned with `supabase_schema.sql`.
- Keep widget styles scoped in `widget.css` and injected via Shadow DOM in `widget-runtime.tsx`.

## Security rules
- Never commit secrets or `.env*` files. Use `.env.local` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_REOWN_PROJECT_ID` as needed.
- Do not expose Supabase service role keys to the client. Serverless endpoints must read `process.env` only.
- Avoid logging sensitive env values or wallet signatures.

## Do / Don’t
Do:
- Follow the `AppState` shape in `types.ts` when adding UI or persistence.
- Update `constants.ts` for new themes/task defaults.
- Update `vite.config.ts` and `vercel.json` together when adding top-level routes.
- Use `apiBaseUrl` + `getApiUrl` for widget API calls in `components/Widget.tsx`.

Don’t:
- Add a new router or state library without need; routing is manual in `App.tsx`.
- Bypass `supabase_schema.sql` when changing data shape.
- Commit env keys or replace `import.meta.env` with hardcoded values.
- Modify widget styles outside `widget.css` when the change must be scoped to the embed.

## Required workflows
### Add a feature
1. Identify the UI surface in `components/` and the owning page in `App.tsx`.
2. Extend `AppState` and related types in `types.ts` if new data is needed.
3. Update defaults in `constants.ts` and initialize in `App.tsx`.
4. If persisted, update `lib/supabase.ts` + `supabase_schema.sql` with matching fields.
5. Validate in builder + widget preview, and in embed via `public/test-embed.html`.

### Fix a bug
1. Reproduce in the exact surface (builder, widget embed, or marketing page).
2. Trace state flow through `App.tsx`, `components/`, and `lib/supabase.ts`.
3. Patch minimally; keep `AppState` and API shapes stable.
4. Re-test the same scenario and run `npm run build` for regressions.

### Add a UI component
1. Create or update a file in `components/` (PascalCase naming).
2. Use Tailwind classes and theme tokens from `constants.ts`.
3. If it’s widget-only, confirm styles are in `widget.css` or inline class strings.
4. Render it from the owning page component or `App.tsx`.

### Add an API endpoint
1. Add a handler in `api/<name>.ts` with CORS + method checks.
2. Use `process.env` for secrets and connect to Supabase via service role if needed.
3. Call it from the UI using `getApiUrl` in `components/Widget.tsx` or a page component.
4. Validate locally with a direct fetch and in the UI.

## Commands
- install: `npm install`
- dev: `npm run dev`
- build: `npm run build`
- lint: not configured
- test: not configured

## References
- Repo audit: `docs/agent-os/repo-audit.md`
- Architecture: `docs/agent-os/architecture.md`
- Skills: `skills/add-feature.md`, `skills/fix-bug.md`, `skills/refactor-safely.md`, `skills/add-ui-component.md`, `skills/add-page-route.md`, `skills/add-api-endpoint.md`, `skills/add-db-change.md`, `skills/add-auth-rule.md`, `skills/add-tests.md`, `skills/release-deploy.md`
