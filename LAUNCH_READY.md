# ShiftedTone launch readiness

This is the execution order for the launch. A checked-in guide cannot rotate provider credentials, rewrite the hosted repository, deploy the app, or perform legal review; those items remain explicit owner actions. **Do not launch while any blocker is open.**

## 1. Contain and purge the exposed key

1. Follow [§0 of the launch runbook](./docs/LAUNCH_RUNBOOK.md#0-secret-rotation-and-history-purge). Revoke the exposed dotenvx key and rotate anything it protected before attempting a history rewrite.
2. Coordinate a maintenance window with every collaborator. Rewrite all branches and tags, verify no reachable object contains `.env.keys`, then request GitHub Support to clear cached views.
3. Have collaborators re-clone; do not merge or push old clones.
4. Set replacement values only in the applicable provider secret managers. Run `npm run check:tracked-secrets`; this check covers tracked working-tree files, not past Git objects or provider settings.

**Hard gate:** record completion and independent verification of key revocation, replacement-secret rotation, history purge, GitHub cache request, and clean-clone verification before moving on.

## 2. Configure production

1. Copy the variables from [§1](./docs/LAUNCH_RUNBOOK.md#1-environment-variables) into the correct Vercel and Convex environments. `.env.example` is a names-and-purpose template, not a production secrets file.
2. Deploy the Convex production backend and confirm the frontend uses that deployment's `VITE_CONVEX_URL`; verify the auth issuer/domain configuration.
3. Configure the Vercel project, production domain, DNS, and TLS using [§2](./docs/LAUNCH_RUNBOOK.md#2-hosting-domain-and-dns).
4. Configure Plausible and confirm its event requests use the intended site/domain. Review privacy disclosures with counsel.
5. Verify email delivery limits, verification, quotas, bounce/complaint handling, and alerting in the email provider and integration-provider accounts. Application-side checks are not a substitute for provider abuse controls.
6. Obtain legal review and approval for the policy drafts before publishing them.

## 3. Verify the release candidate

Run from the release commit:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run validate:og
npm run check:tracked-secrets
```

After deployment, run:

```sh
npm run smoke-test -- --url https://shiftedtone.com
```

Then execute every manual test in [§3](./docs/LAUNCH_RUNBOOK.md#3-pre-launch-verification), including authenticated User A/User B isolation, denied microphone permission, offline/throttled conditions, CORS allow/deny origins, Lighthouse mobile, and real social preview rendering. The HTTP smoke test only checks reachable routes and static metadata; it does not authenticate, exercise browser behavior, or prove backend isolation.

## 4. Launch sequence

1. Confirm the hard gate and production checks above are signed off by named owners.
2. Announce the maintenance window and freeze pushes during the history rewrite; after the rewritten refs are pushed, ask all collaborators to clone afresh.
3. Deploy the reviewed frontend and Convex production changes. Validate the canonical domain, auth, email delivery, and smoke-test output before announcing availability.
4. Keep the previous deploy/rollback procedure available. If auth, data isolation, or secret exposure checks fail, stop launch, disable traffic or roll back, and investigate before reopening.
5. Follow [launch-day and post-launch monitoring](./docs/LAUNCH_RUNBOOK.md#4-launch-day-and-post-launch).

## Required sign-offs

- [ ] Security owner: key revoked/rotated, complete history purge and GitHub cache request verified.
- [ ] App owner: production deployment, domain, smoke tests, and manual test matrix passed.
- [ ] Operations owner: email abuse controls, alerting, rollback path, and support coverage confirmed.
- [ ] Legal reviewer: privacy policy and terms reviewed and approved.
