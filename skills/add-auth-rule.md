# Skill: Add Auth Rule (Supabase RLS)

## Purpose
Adjust Supabase RLS policies without breaking builder or widget flows.

## Inputs required
- Target table(s) and access rules.
- Whether the change is for public access or wallet-based identity.
- Any serverless endpoints that need elevated access.

## Step-by-step procedure
1. Update RLS policies in `supabase_schema.sql` (create/alter policy).
2. Apply changes in Supabase and note which roles are affected (anon/authenticated).
3. Review client-side calls in `lib/supabase.ts` and `components/Widget.tsx` for compatibility.
4. If a serverless endpoint needs privileged access, ensure it uses server-side keys in `api/`.

## Validation checklist
- Run the affected flow with a wallet connected and with no wallet.
- Verify inserts/updates still succeed where intended.
- Confirm errors are surfaced cleanly in the UI.

## Common pitfalls
- Tightening policies that block public builder flows (current policies are permissive).
- Forgetting to update serverless endpoints that rely on service role access.
- Misaligning policy expectations with RPC functions in `supabase_schema.sql`.

## Example file references
- `supabase_schema.sql`
- `lib/supabase.ts`
- `components/Widget.tsx`
- `api/token-hold.ts`
- `api/nft-hold.ts`
