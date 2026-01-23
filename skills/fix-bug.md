# Skill: Fix Bug

## Purpose
Diagnose and resolve bugs in the builder, widget runtime, or serverless APIs with minimal behavioral change.

## Inputs required
- Repro steps and expected vs actual behavior.
- Surface area (route/page, widget embed, API endpoint).
- Environment details (wallet connected, Supabase configured, embed host).

## Step-by-step procedure
1. Reproduce the issue in the exact surface (builder, widget embed, or API).
2. Trace state flow from `App.tsx` into the owning component in `components/`.
3. Inspect Supabase calls in `lib/supabase.ts` or direct usage in `components/Widget.tsx`.
4. If the issue is API-related, inspect the corresponding handler in `api/`.
5. Apply a focused fix, avoiding unrelated refactors.

## Validation checklist
- Re-run the original repro steps.
- Smoke test in `npm run dev` and confirm no regressions on adjacent pages.
- If embed-related, validate using `public/test-embed.html`.
- If API-related, call the endpoint directly and through UI flow.

## Common pitfalls
- Manual routing in `App.tsx` can mask the real page state.
- Supabase env errors throw early in `lib/supabase.ts`.
- Widget runtime styles are isolated; DOM changes in host won’t apply.

## Example file references
- `App.tsx`
- `components/Widget.tsx`
- `components/Dashboard.tsx`
- `lib/supabase.ts`
- `api/token-hold.ts`
- `api/nft-hold.ts`
- `widget-runtime.tsx`
