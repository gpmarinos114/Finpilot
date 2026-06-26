# FinPilot - Agent Guidelines

## Project Overview
AI-powered financial planner with persistent memory, historical snapshots, and multi-device sync.
Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Prisma/SQLite.

## Code Conventions

### Styling
- **Tailwind CSS only** — no CSS modules, no styled-components, no component libraries
- **Dark theme** — hardcoded gray-800/900/950 backgrounds, white/gray-400 text, blue-600 accents
- All components are `"use client"` — no server components beyond the layout

### Database
- **Always use `getDb()`** (async) from `src/lib/db.ts` — never import `prisma` directly in new code
- `getDb()` returns a PrismaClient that supports both local SQLite and Turso cloud
- DB backend is configured via `db-config.json` (gitignored)

### API Routes
- Each route handler must call `const prisma = await getDb()` at the top
- Pattern: GET (list), POST (create), PUT (update), DELETE (delete via `?id=`)
- Financial mutations trigger auto-snapshots via `refreshAndSnapshot` in Dashboard

### Components
- Financial cards use inline table editing pattern (not separate forms)
- CollapsibleCard wrapper provides collapse/expand behavior
- Memory files are stored in DB (MemoryFile model), not filesystem

### Known Lint Issues (pre-existing, do not "fix")
- `react-hooks/set-state-in-effect` — `useEffect` calling `fetchAll()` is intentional data-fetching
- `react-hooks/exhaustive-deps` — `[]` deps on mount-only effects is intentional
- `prefer-const` on `toolCalls` in chat route — pre-existing

## Key Architecture Decisions
- Memory files in DB, not filesystem — enables cross-device sync
- Snapshots auto-capture daily (dedup) — no manual trigger needed
- `db-config.json` for Turso credentials (not in DB) — avoids chicken-and-egg problem
- Settings stored in both DB (API keys) and file (DB config)

## Before Committing
- Run `npx tsc --noEmit` — must pass with no errors in `src/`
- Run `npx eslint src/` — no new errors (pre-existing warnings are OK)
- Never commit: `dev.db`, `db-config.json`, `.env*`, `memory/plans/`, `memory/simulations/`

## Debugging Rules
- **Never assume** what a provider supports or doesn't support — check the actual behavior
- **Add debug logging** (`console.log("[DEBUG] ...")`) to trace issues before making changes
- **Read the terminal output** to see what's actually happening, not what you think is happening
- **Revert first** if a change doesn't fix the issue — don't stack speculative fixes
- **Test with the actual provider** the user is using before declaring something works
- When debugging streaming issues, log: chunk count, content length, thinking length, tool calls, finish reason
- Debug logs use `[DEBUG]` prefix — remove them after the issue is resolved
