# Verification System (Agent-Ready)

## Why
We are shipping features that depend on server state, auth tokens, and UI flows. Manual spot checks are slow and miss runtime errors or user-story gaps. We need a repeatable system that can validate the deployed app end-to-end with minimal human input and give fast, actionable failures.

## Goals
- Detect runtime errors (client + server) without manual browsing.
- Validate core user stories end-to-end against a deployed environment.
- Catch schema drift and migration gaps before users do.
- Produce a clear, machine-readable report for agents.

## Core Building Blocks

### 1) Local build + unit/integration tests
Run locally whenever changes touch routing, data flow, or UI logic.
- `npm run build`
- `npm test`

### 2) E2E smoke tests (Playwright)
Run against either local dev or a deployed URL.
- Uses `E2E_BASE_URL` when set (no local server needed).
- Captures `console.error` and `pageerror` to fail on runtime errors.

We added a family-network smoke test:
- Register a test user via `/api/auth/register`
- Inject auth token + sync state
- Create a family network as a parent via UI

### 3) Deployed system checks (Vercel/Neon)
We can automate these checks using non-interactive CLI tokens.

Vercel CLI (example commands):
- `npx vercel --token $VERCEL_TOKEN ls`
- `npx vercel --token $VERCEL_TOKEN deployments --json`
- `npx vercel --token $VERCEL_TOKEN logs $DEPLOYMENT_URL --since 10m`

Neon (optional):
- Use Neon console or API to verify migration table and schema status.

### 4) Migration hygiene
Every schema change must ship with an SQL migration in `drizzle/`. The deploy script runs migrations automatically.
- If the database already exists, only SQL migrations run.
- New tables or columns must be represented by a migration (no silent drift).

## Proposed Agent Workflow
1) Local sanity
- `npm run build`
- `npm test`

2) Deployed smoke
- `E2E_BASE_URL=https://<deployment-url> npm run test:e2e`

3) Deployed logs
- `npx vercel --token $VERCEL_TOKEN logs <deployment> --since 10m`

4) Report
- Summarize failures by user-story and error message.

## User Story Coverage Strategy
Define a short list of critical user stories and map each to at least one E2E test. Use IDs in test titles (e.g., `US-NET-01`). This enables agents to spot contradictions or missing coverage quickly.

Suggested initial stories:
- US-NET-01: Parent creates a family network.
- US-NET-02: Child joins a family network with invite code.
- US-SYNC-01: Same account usable across devices (register + login + full sync).

## Notes
- E2E tests intentionally leave test data behind; use a test-only deployment or cleanup strategy if needed.
- If tests run against production, ensure names are unique and harmless.
