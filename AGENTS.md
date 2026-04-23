# AGENTS.md

## Commands

- `pnpm dev` - Start dev server
- `pnpm build` - Runs `tsc -b` (typecheck) then `vite build`. Both must pass.
- `pnpm lint` - ESLint
- `pnpm test` - Vitest (jsdom environment)

## Key Constraints

- **Database**: Dexie.js (IndexedDB). Tables: `branches`, `cashSessions`, `transactions`, `inventoryMovements`, `reports`. Defined in `src/lib/db.ts`.
- **PWA base path**: `/Cash-operations-app/` - affects routing and asset paths.
- **Tailwind v4**: Uses `@tailwindcss/vite` plugin, not the traditional PostCSS setup. Styles go in `src/index.css` via `@import "tailwindcss"`.
- **Path alias**: `@` maps to `src/`.

## Pre-commit Hook

`.husky/pre-commit` runs `lint-staged` which applies ESLint fix + Prettier write to staged `.ts`/`.tsx` files.

## Architecture Notes

- Entry: `src/main.tsx` renders `src/App.tsx` which currently renders only `SessionsPage`.
- shadcn/ui components live in `src/components/ui/`.
- Data access via repository pattern in `src/lib/repos/`.
- Custom hooks in `src/hooks/` for state management.

## Testing

- Vitest with jsdom environment
- Use `@testing-library/react` for component tests
