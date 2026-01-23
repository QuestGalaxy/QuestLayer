# Skill: Add DB Change (Supabase)

## Purpose
Update Supabase schema and keep client code aligned with new tables/columns.

## Inputs required
- Table/column changes and desired data types.
- Read/write paths in the app or widget.
- RLS policy impact.

## Step-by-step procedure
1. Update `supabase_schema.sql` with new table/column definitions.
2. If needed, add or adjust RLS policies in the same file.
3. Update `lib/supabase.ts` to read/write the new fields (match snake_case names).
4. Update `types.ts` and any UI state initialization in `App.tsx`/`constants.ts`.
5. Update UI mapping logic in `components/Widget.tsx` or other components that read data.

## Validation checklist
- Apply the SQL changes in Supabase.
- Run `npm run dev` with Supabase envs set and exercise the flow.
- Verify RPCs and queries still return expected shapes.

## Common pitfalls
- Field name mismatches between Supabase (snake_case) and UI state (camelCase).
- Forgetting to update the task mapping in `syncProjectToSupabase`.
- RLS policies blocking insert/update after schema changes.

## Example file references
- `supabase_schema.sql`
- `lib/supabase.ts`
- `types.ts`
- `App.tsx`
- `components/Widget.tsx`
