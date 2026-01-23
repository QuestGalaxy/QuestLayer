# Skill: Add Tests

## Purpose
Introduce or extend automated tests in a repo that currently has no test runner configured.

## Inputs required
- Target area (component, utility, API handler).
- Desired test type (unit, integration, smoke).
- Tolerance for adding new tooling.

## Step-by-step procedure
1. Confirm there is no existing `test` script in `package.json`.
2. Decide whether to add a test runner (keep scope minimal if adding).
3. Add tests near the code they cover (e.g., utilities under `lib/`, components under `components/`).
4. If using browser APIs, ensure the runner supports DOM usage.
5. Add a `test` script in `package.json` if a runner is introduced.

## Validation checklist
- Run the new test script locally.
- Run `npm run build` to confirm bundling unaffected.
- Spot-check any UI flows impacted by changes.

## Common pitfalls
- Adding a test runner without updating `package.json` scripts.
- Forgetting to mock `import.meta.env` or Supabase calls.
- Writing tests that require the Shadow DOM without proper setup.

## Example file references
- `package.json`
- `components/Widget.tsx`
- `lib/supabase.ts`
- `App.tsx`
