# cash-operations-system

A cash register ledger system for managing cash sessions, transactions, inventory movements, and reports.

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Dexie.js (IndexedDB)
- **PDF**: jspdf
- **Testing**: Vitest
- **Linting**: ESLint + Prettier
- **Git hooks**: Husky

## Features

- [ ] Manage cash sessions (open/close)
- [ ] Record transactions (sales, expenses, cash withdrawals)
- [ ] Track inventory movements between branches
- [ ] Generate PDF reports (daily, session, custom range)
- [ ] Mobile-first design

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## Project Structure

```
src/
├── components/    # React components
│   └── ui/       # shadcn/ui components
├── lib/           # Utilities and database
├── types/         # TypeScript interfaces
├── hooks/         # Custom React hooks
└── pages/         # Page components
```

## Scripts

| Command      | Description              |
| ------------ | ------------------------ |
| `pnpm dev`   | Start development server |
| `pnpm build` | Build for production     |
| `pnpm test`  | Run tests                |
| `pnpm lint`  | Lint code                |
