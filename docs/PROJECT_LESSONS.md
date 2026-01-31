# Project Lessons (Generic)

This document captures general lessons learned that are portable to other projects. It also includes a lightweight "engineering playbook" based on the current stack and workflows so it can be reused as a starting point.

## What We Learned (Generic)

1. **Ship the core loop before the extras**
   - Identify the smallest loop that proves value (capture → practice → feedback).
   - Build supporting features only when they improve that loop.

2. **Offline-first needs explicit sync boundaries**
   - Treat local data as the source of truth and make sync a background concern.
   - Model sync as a deterministic change log with explicit conflict handling.
   - Validate sync assumptions with small test datasets first.

3. **UX clarity prevents support debt**
   - Users prefer a single, obvious “next step” rather than multiple competing CTAs.
   - “Recoverability” (login/transfer/backup) should be visible, not hidden.

4. **Security and ergonomics can coexist**
   - Short, readable codes reduce errors without weakening security.
   - Rate limiting + CSRF checks + sensible token expiry are cheap wins.

5. **Typed interfaces reduce long-term cost**
   - Shared types between client and server catch drift early.
   - Enforcing input validation (Zod, schemas) prevents subtle bugs.

6. **Avoid one-off workflows**
   - If a task is repeated (e.g., DB migrations), automate it.
   - Prefer “one command” or “runs automatically on deploy.”

7. **Make success measurable**
   - Add basic telemetry or progress stats early.
   - Use UX feedback (empty states, confirmations) to reduce confusion.

8. **Tests should target the brittle points**
   - Focus on sync, migration, and auth flows first.
   - Add tests when a data shape changes (e.g., nullable fields).

## Current Baseline (What We Use Today)

This is the living snapshot of the stack and practices used in this repo. It is intentionally concise and copyable.

### Stack

- **Frontend**: Next.js App Router, React, TypeScript, Tailwind CSS
- **State**: Zustand for client state, Zod for input validation
- **Offline data**: Dexie + IndexedDB (client-side DB)
- **Server DB**: Neon (Postgres) via Drizzle ORM
- **i18n**: next-intl
- **PWA**: Serwist
- **Testing**: Vitest (unit/integration), Playwright (E2E)

### Architectural Patterns

- **Offline-first with background sync**
  - Local IndexedDB is the primary store.
  - Server sync is a change-log push/pull model.
  - Full sync exists for new devices.

- **Pluggable providers**
  - OCR providers are injectable and can be swapped.
  - The default path stays offline-capable.

- **Minimal auth surfaces**
  - Short-lived, explicit transfer flow for device migration.
  - Recovery login with a user code when transfer is unavailable.

### Data Model Notes

- **Book-level (unsorted) items**
  - Section/chapter fields are nullable in the server schema.
  - Sync and copy flows must accept null section/chapter IDs.

- **Client/server alignment**
  - Changes in shared shapes require schema + sync + tests updates together.

### Testing Setup

- **IndexedDB is mocked** using `fake-indexeddb`.
- **Core tests** target sync, fuzzy matching, scheduling, and DB integrity.
- **When schema changes**, add tests for new nullability or invariants.

## Engineering Playbook (Based on Current Workflow)

### Local Development

1. Install dependencies: `npm install`
2. Configure `.env.local` (at minimum `DATABASE_URL` and `JWT_SECRET`)
3. Run migrations: `npm run db:migrate`
4. Start dev server: `npm run dev`

### Deployments

- **Vercel production deploys** run migrations automatically via `vercel-build`.
- **Preview deploys** do **not** run migrations (reduces schema drift across previews).
- **Migrations are idempotent** and tracked in `schema_migrations`.

### Operational Guardrails

- **Fail fast in production** if required secrets are missing.
- **Keep migration files small** and descriptive.
- **Avoid manual DB changes** unless you also record them as migrations.

### When You Change the Data Model

1. Update types (`src/lib/db/schema.ts`).
2. Update server schema (`src/lib/db/server-schema.ts`).
3. Add a migration in `drizzle/`.
4. Update sync push/pull/full (if needed).
5. Add/adjust tests for the new shape.

## Vercel + Neon Best Practices (Reusable)

These practices are derived from real project friction and are meant to be drop-in defaults for future projects.

### Deployment

- **Run migrations automatically on production deploys**
  - Prefer a `vercel-build` script that runs migrations before `next build`.
  - Gate by `VERCEL_ENV === 'production'` to avoid preview/branch DB churn.

- **Track applied migrations**
  - Create a `schema_migrations` table and record each applied file.
  - Make migrations idempotent so redeploys are safe.

- **Keep preview environments read-only**
  - If you don’t need preview DB writes, skip migrations in preview builds.
  - This avoids accidental schema drift across branch environments.

### Configuration

- **Use `DATABASE_URL` exclusively**
  - Keep a single env var for DB connectivity; avoid duplicating configs.
  - Ensure `DATABASE_URL` is set in Vercel’s production environment.

- **Require secrets in production**
  - Fail fast if `JWT_SECRET` is missing in production.

### Reliability

- **Prefer serverless-friendly drivers**
  - Use the Neon HTTP driver for serverless Next.js routes.
  - Avoid long-lived connections in serverless runtimes.

- **Keep migrations small and targeted**
  - One change per migration file.
  - Avoid “bundle” migrations that are hard to debug or roll back.

### Operational hygiene

- **Document the migration flow**
  - Include a short “how it works” section in README or docs.
  - The goal is zero guesswork for new maintainers.

- **Test before deploy**
  - Unit tests for sync + schema changes.
  - A quick smoke test of critical flows (auth, sync, migration).

## Vercel/Neon Automation Pattern (Drop-In)

Use this pattern if you want "no thought" deployments:

1. `vercel-build` runs `db:migrate` and then builds the app.
2. `db:migrate`:
   - Connects via `DATABASE_URL`
   - Creates `schema_migrations` if missing
   - Applies new SQL files exactly once
   - Skips in preview environments

This keeps production schema in sync without any manual steps.
