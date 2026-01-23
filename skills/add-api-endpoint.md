# Skill: Add API Endpoint

## Purpose
Create a new serverless API handler under `api/` that can be called by the app or widget.

## Inputs required
- Endpoint name and HTTP method(s).
- Input/output schema.
- Required env vars or external services.

## Step-by-step procedure
1. Add `api/<name>.ts` with a default export handler.
2. Follow existing CORS + method guard patterns from `api/metadata.ts` or `api/token-hold.ts`.
3. Use `process.env` for secrets; avoid `import.meta.env` in serverless code.
4. If Supabase is required, create a client using `@supabase/supabase-js` and server-side keys.
5. Call the endpoint from the UI using `getApiUrl` in `components/Widget.tsx` or page components.

## Validation checklist
- Verify `OPTIONS` + method checks respond as expected.
- Call the endpoint directly (fetch/curl) and via the UI flow.
- Ensure failures return structured JSON errors.

## Common pitfalls
- Missing CORS headers (widget calls fail in embed mode).
- Leaking service role keys to the client bundle.
- Ignoring `apiBaseUrl` when calling from the widget.

## Example file references
- `api/metadata.ts`
- `api/og.ts`
- `api/nft-hold.ts`
- `api/token-hold.ts`
- `components/Widget.tsx`
