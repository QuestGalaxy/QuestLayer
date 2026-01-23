# Skill: Add Page Route

## Purpose
Add a new top-level page that participates in the Vite multi-page build and manual routing.

## Inputs required
- Path (e.g., `/new-page`).
- Page component name and content requirements.
- SEO metadata (title/description/image).

## Step-by-step procedure
1. Create a new HTML entry in the repo root (follow `builder.html` or `browse.html`).
2. Add the new entry to `vite.config.ts` under `build.rollupOptions.input`.
3. Add a rewrite for the path in `vercel.json` to the new HTML file.
4. Add a new page component in `components/` and wire it into `App.tsx`.
5. Update the `currentPage` checks + SEO meta logic in `App.tsx` for the new path.

## Validation checklist
- Run `npm run dev` and navigate to the new route directly.
- Use back/forward to verify `popstate` handling in `App.tsx`.
- Run `npm run build` to ensure the new entry is bundled.

## Common pitfalls
- Missing the `vite.config.ts` input entry (page won’t build).
- Missing `vercel.json` rewrite (page 404s in production).
- Forgetting SEO metadata updates in `App.tsx`.

## Example file references
- `App.tsx`
- `vite.config.ts`
- `vercel.json`
- `builder.html`
- `browse.html`
- `components/ExplorePage.tsx`
