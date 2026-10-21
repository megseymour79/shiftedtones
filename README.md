## Overview

This project uses the following tech stack:
- Vite
- TypeScript
- React Router v7 (all imports from `react-router`)
- React 19
- Tailwind v4
- shadcn/ui
- Lucide Icons
- Convex
- Convex Auth
- Framer Motion

All relevant application files live in `src`.

## Setup

Install the exact locked dependencies with npm:

```bash
npm ci
```

Start the dev server:

```bash
npm run dev
```

## Environment variables

Copy `.env.example` to `.env.local` for local development and provide real values through your hosting provider for production.

Key variables:
- `VITE_CONVEX_URL`
- `CONVEX_DEPLOYMENT`
- `SITE_URL`
- `CONVEX_SITE_URL`
- `JWKS`
- `JWT_PRIVATE_KEY`
- `VLY_EMAIL_API_KEY`
- `VITE_PLAUSIBLE_DOMAIN`
- `VITE_PLAUSIBLE_API_HOST`

## Launch notes

- Review `./LAUNCH_CHECKLIST.md` before production deployment.
- Never commit real credentials or secret files. The exposed `.env.keys` file
  was removed from the current tree, but removal does not purge Git history.
  Complete the coordinated history purge in `docs/LAUNCH_RUNBOOK.md` before
  launch.
- The in-app Terms and Privacy pages are drafts requiring operator completion
  and qualified legal review; do not present them as approved policies.

## CI and release automation

- **CI** (`.github/workflows/ci.yml`): on every push and pull request, runs `npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `npm run validate:og`, and `npm run check:tracked-secrets`.
- **Release Gate** (`.github/workflows/release-gate.yml`): manual check of a release commit. Runs the same gates, stops at the first failure, and reports which command failed.

To trigger it: GitHub → Actions → **Release Gate** → **Run workflow**, then enter the release commit SHA (or `gh workflow run release-gate.yml -f sha=<sha>`).

Results: the per-gate pass/fail table, repository, SHA and run URL appear in the run's **Summary** page; the logs are in the `release-gate-logs` artifact at the bottom of that page.
