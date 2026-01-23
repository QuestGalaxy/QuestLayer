# Skill: Add UI Component

## Purpose
Add or update a UI component in the builder or widget, consistent with existing Tailwind + theme patterns.

## Inputs required
- Component purpose and target page.
- Theme or style requirements.
- Data dependencies and state ownership.

## Step-by-step procedure
1. Create a new component file in `components/` (PascalCase naming).
2. Use Tailwind utility classes and theme tokens from `constants.ts`.
3. If it’s widget-only, ensure styles are in `widget.css` or inline class strings.
4. Wire the component into its parent page in `App.tsx` or the relevant `components/*` file.
5. If the component needs new data, update `types.ts` and defaults.

## Validation checklist
- View the component in `npm run dev`.
- Check both light/dark themes where relevant (see `constants.ts`).
- If it renders in the widget, confirm in embed via `public/test-embed.html`.

## Common pitfalls
- Adding CSS in `index.css` when the component only renders in the widget Shadow DOM.
- Ignoring the theme classes defined in `constants.ts`.
- Forgetting to import the component where it’s used.

## Example file references
- `components/UnifiedHeader.tsx`
- `components/GlobalFooter.tsx`
- `components/Widget.tsx`
- `constants.ts`
- `index.css`
- `widget.css`
