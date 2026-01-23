# Skill: Add Feature

## Purpose
Add a new capability to the builder, preview, or widget runtime while keeping `AppState` and Supabase mappings consistent.

## Inputs required
- Feature description + target surface (builder, widget runtime, landing, dashboard).
- Data needs (local-only vs Supabase-backed).
- Any new routes or API calls.

## Step-by-step procedure
1. Locate the owning page/component in `components/` and its entry point in `App.tsx`.
2. Extend shared types in `types.ts` if new data is required.
3. Update defaults in `constants.ts` and initial state in `App.tsx`.
4. Implement UI changes in the relevant component(s) under `components/`.
5. If persistence is needed, update `lib/supabase.ts` and align with `supabase_schema.sql` fields.
6. If the widget is impacted, update `widget-runtime.tsx` and `widget.css` for Shadow DOM styling.

## Validation checklist
- Run `npm run dev` and verify the new feature in the target surface.
- Confirm state changes propagate through preview and widget when applicable.
- If Supabase is used, validate reads/writes with configured envs.
- If embedded, test via `public/test-embed.html` or `public/widget-embed.js`.

## Common pitfalls
- Forgetting to update `AppState` in `types.ts` and initialization in `App.tsx`.
- Mismatched snake_case vs camelCase between Supabase and UI state.
- Styling widget changes outside `widget.css`, which won’t reach the Shadow DOM.

## Example file references
- `App.tsx`
- `types.ts`
- `constants.ts`
- `components/Editor.tsx`
- `components/Widget.tsx`
- `lib/supabase.ts`
- `widget-runtime.tsx`
- `widget.css`
