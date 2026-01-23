# Skill: Refactor Safely

## Purpose
Improve structure or readability without changing behavior or data flow.

## Inputs required
- Scope of refactor and target files.
- Risk tolerance (low/medium/high).
- Any performance or readability goals.

## Step-by-step procedure
1. Use `rg` to map usage of the target symbols across the repo.
2. Identify state and prop contracts (especially `AppState` in `types.ts`).
3. Refactor in small, verifiable steps; preserve function signatures.
4. Keep Tailwind classes and theme tokens aligned with `constants.ts`.
5. Re-check behavior in builder and widget surfaces.

## Validation checklist
- Run `npm run dev` and spot-check affected pages.
- If widget code was touched, verify embed via `public/test-embed.html`.
- Run `npm run build` to confirm bundling still works.

## Common pitfalls
- Breaking manual routing or SEO tag updates in `App.tsx`.
- Modifying `components/Widget.tsx` behavior unintentionally (large file).
- Losing alignment between Supabase fields and UI state.

## Example file references
- `App.tsx`
- `components/Widget.tsx`
- `components/Editor.tsx`
- `lib/supabase.ts`
- `constants.ts`
