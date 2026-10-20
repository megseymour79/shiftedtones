# Launch runbook

Use this with [`LAUNCH_READY.md`](../LAUNCH_READY.md) and [`LAUNCH_CHECKLIST.md`](../LAUNCH_CHECKLIST.md). Record the owner, date, evidence, and pass/fail result for each operational check in the team's approved launch tracker. Never paste credentials, OTPs, user data, or secret-bearing command output into issues, chat, or this repository.

## 0. Secret rotation and history purge

The dotenvx private key formerly committed as `.env.keys` is compromised. The file has been removed from the current tree, but only a complete history rewrite and remote cache cleanup address old commits.

### Rotate first

1. Identify which encrypted files and platform credentials the exposed key could unlock. Do not print or copy the old key into a terminal command, ticket, or support request.
2. Revoke/retire that key with dotenvx and replace every affected credential directly in its issuing service:
   - Convex production and development deployments: rotate auth/JWT signing material and all API/integration credentials stored there.
   - Vercel: replace production and preview secrets independently; remove stale values and trigger a fresh production deployment.
   - Email, analytics, domain/DNS, and any other provider: rotate credentials if the exposed key had access to them.
3. Confirm new credentials work from each provider's secret manager without displaying values. Confirm the old key cannot decrypt a disposable encrypted test fixture; do not test against or print production plaintext.
4. Remove the old key from local dotenvx files and make sure replacement keys are absent from `.env*`, shell history, build artifacts, and Git working trees. Store replacements only in provider secret managers.

### Rewrite Git history (destructive; coordinate before running)

Run as a repository administrator from a new mirror clone, after telling all collaborators to stop pushing. `git-filter-repo` must be installed separately and available in `PATH`.

```sh
git clone --mirror https://github.com/megseymour79/tone-realign.git tone-realign-purge.git
cd tone-realign-purge.git
git filter-repo --path .env.keys --invert-paths
```

Review the rewritten refs and the `git-filter-repo` report before publishing. The tool may remove the `origin` remote; verify it with `git remote -v` and re-add the canonical URL if necessary. Once the owner has approved the rewrite and all collaborators are ready:

```sh
git push --force --all origin
git push --force --tags origin
```

Do not use `--mirror` to push blindly: it may overwrite or delete remote refs that were not intended to be rewritten. If `.env.keys` had another path or was renamed, include every historical path in the filter. Protect any required branches/tags and repository automation settings before the change; branch protections may need a temporary, approved adjustment.

### Verify the purge and request cache clearing

On the rewritten mirror and a separate fresh clone, these checks must return no matches (the path, not secret contents, is the search target):

```sh
git log --all --full-history --name-only --format= -- .env.keys
git rev-list --objects --all | grep -F '.env.keys'
```

Also run `npm run check:tracked-secrets` in the fresh clone and review all branches and tags. Confirm the exposed key is revoked and does not decrypt the test fixture; history removal alone is not proof of rotation.

After force-push, repository administrators should open a GitHub Support request for **sensitive data removal / cached views**. Include the repository URL, affected path (`.env.keys`), completed rewrite status, and rewritten commit IDs as requested by Support—never include the key or any secret value. Follow Support's instructions to clear cached commit/blob views and confirm the affected URLs no longer render. GitHub cannot make copies outside GitHub disappear; contact other hosts or recipients if the value was copied.

### Collaborator coordination

1. Before rewriting: announce the window, ask contributors to stop pushes, inventory branches/tags and automated deploys, and confirm an administrator is available to restore required branch protection.
2. During rewrite: one designated administrator performs and verifies it; pause deploy jobs and bot pushes.
3. After rewrite: notify contributors that old commit IDs are invalid, have everyone discard old clones and clone again, and prohibit merging old branches. Reapply branch protection, secrets, webhooks, and deploy integrations; verify a clean push works.

## 1. Environment variables

`.env.example` documents the values used by this codebase. A `VITE_` variable is bundled into browser code and must never contain a credential.

| Variable | Where / purpose |
| --- | --- |
| `VITE_CONVEX_URL` | Required frontend setting; exact production Convex cloud URL. Public. |
| `CONVEX_DEPLOYMENT` | Convex CLI deployment selector; use the production deployment only for production operations. Not an app secret. |
| `CONVEX_SITE_URL` | Required by `src/convex/auth.config.ts`; production Convex HTTP/actions site URL expected by Convex Auth. |
| `SITE_URL` | Canonical app URL for platform integrations that consume it; use `https://shiftedtone.com` in production. Confirm provider-specific use during setup. |
| `JWT_PRIVATE_KEY`, `JWKS` | Server-side Convex Auth signing configuration if required by the deployment's Convex Auth setup. Set/generate only using the current Convex Auth procedure; do not invent or reuse exposed material. |
| `VLY_EMAIL_API_KEY` | Server-side key used by email OTP delivery in `src/convex/auth/emailOtp.ts`. |
| `VLY_INTEGRATION_KEY` | Server-side VLY integration key when the VLY integration client is enabled. |
| `VLY_APP_NAME` | Optional email sender display name. |
| `VLY_CONVEX_AUTH_ISSUER` | Optional federated-auth issuer override; defaults to `https://auth.freebuff.app`. |
| `VITE_PLAUSIBLE_DOMAIN` | Optional public Plausible site domain; analytics intentionally no-op if unset. |
| `VITE_PLAUSIBLE_API_HOST` | Optional public Plausible host; defaults to `https://plausible.io`. |

Set public build variables in Vercel for the production environment and deploy again after changing them. Set server-side auth/email/integration variables in the production Convex deployment's environment settings. Do not copy a real `.env.local` into Vercel, Convex, tickets, or Git. The example's localhost values are for local development only.

## 2. Hosting, domain, and DNS

### Vercel

`vercel.json` already configures the Vite build (`npm run build`, `dist`) and SPA fallback. Link the intended Git repository and production branch in Vercel, set build-time `VITE_*` values and the correct Convex URL, then deploy. Confirm the deployment uses the repository's lockfile and no preview-only variables are promoted accidentally.

### Convex production

1. Select or create the intended Convex production deployment using the project's documented Convex account and deployment workflow.
2. Deploy functions from the reviewed release commit; inspect function deployment output for errors without copying secrets.
3. Set server-only variables from §1 in that production deployment. Confirm `CONVEX_SITE_URL` matches the deployment's Convex site origin and `VITE_CONVEX_URL` matches its cloud origin.
4. Verify `src/convex/auth.config.ts` providers against the deployed issuer and production callback/domain setup. Do not switch the standard Convex Auth provider to `customJwt`.
5. In Convex/provider controls, allow the production app origin and required preview/development origins only as needed. Test an allowed production request and a preflight from an unrelated origin; the unrelated origin must not receive an allow-origin response.

### `shiftedtone.com`

- [ ] Add `shiftedtone.com` and `www.shiftedtone.com` in Vercel and use Vercel's displayed DNS targets (they may change; do not hard-code values from an old guide).
- [ ] At the authoritative DNS provider, create exactly the A/ALIAS/ANAME and CNAME records Vercel instructs. Remove conflicting records only after confirming their purpose.
- [ ] Wait for DNS propagation; verify both names resolve to the intended project and Vercel reports domain configuration valid.
- [ ] Confirm HTTPS certificates are active, HTTP redirects to HTTPS, and the preferred canonical host redirects consistently.
- [ ] Check `https://shiftedtone.com/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/og.png`, `/auth`, and `/dashboard` after deployment.
- [ ] Set production `SITE_URL` and any auth callback/origin allowlists to the canonical HTTPS origin.

### Plausible analytics

1. Create/configure the Plausible site for the exact production hostname and copy only the site domain into `VITE_PLAUSIBLE_DOMAIN`; configure `VITE_PLAUSIBLE_API_HOST` only for a self-hosted/custom host.
2. Deploy and verify the script loads from the configured host and pageview/custom events appear in Plausible. The code reports SPA pageviews and is a no-op when no domain is configured.
3. Review event names and properties for personal, sensitive, or user-entered content. Do not add emails, transcripts, or other identifiers to analytics events.
4. Have counsel confirm the privacy notice, consent requirements, and jurisdictional obligations before enabling analytics publicly.

### Email abuse controls

The app sends sign-in OTP requests via `VLY_EMAIL_API_KEY`; this does not prove provider-level abuse protection. Verify in Convex, VLY, and the upstream email-provider account:

- [ ] Sender/domain authentication (SPF, DKIM, and DMARC) is verified and aligned.
- [ ] Provider-level per-recipient and account sending quotas/rate limits are enabled and known.
- [ ] OTP delivery has appropriate abuse/bot controls, suppression lists, bounce/complaint handling, and alerts.
- [ ] API key is scoped to required send operations, stored server-side, and rotated/tested.
- [ ] Alerts and an operator contact exist for sudden volume, spend, delivery failure, or complaint spikes.
- [ ] A controlled test confirms legitimate signup delivery and provider rejection/throttling behavior without sending bulk test mail.

If controls are not available or documented by the provider, treat email delivery as a launch blocker and ask the provider for confirmation.

## 3. Pre-launch verification

### Automated checks

From a clean checkout of the release candidate:

```sh
npm ci
npm run typecheck
npm test
npm run build
npm run validate:og
npm run check:tracked-secrets
```

After deploying, execute `npm run smoke-test -- --url https://shiftedtone.com`. It checks HTTP availability for the SPA/auth routes and public metadata/assets. It cannot establish a session or prove authenticated backend behavior.

### Manual release test matrix

Use disposable test accounts and non-sensitive test data. Capture pass/fail and build/deployment ID, not passwords, OTPs, or personal data.

| Area | Test | Pass condition |
| --- | --- | --- |
| Auth | Sign up with a test email, receive OTP, sign in, sign out, and sign in again. | Each state transition succeeds; failed/expired OTPs give a safe error. |
| Redirect | Open a protected route while signed out; complete auth from `returnTo`. Also try an external `returnTo`. | Returns to the requested same-origin route; external/open redirects are rejected. |
| Core app | Complete a drill, save a result, reload, and view progress. | Saved result persists and is visible only to its owner. |
| Isolation | With accounts A and B, attempt reads/writes for B's IDs while authenticated as A. | No cross-account data is returned or changed; include sessions, logs, and notes. |
| Microphone | Deny browser microphone permission and try capture. | Clear inline guidance; app stays usable and does not crash. |
| Network | Go offline during a read and write; separately test slow/throttled network. | Actionable failure state; no false success or silent data loss; retry is safe. |
| CORS | Make an allowed request from the canonical app origin and a preflight from an unrelated origin. | Production origin works; unrelated origin is not allowed. |
| Email | Request repeated OTPs at controlled low volume and observe provider controls. | Provider-side rate limiting/abuse response, quota, delivery and alert behavior are verified. |
| Ops tooling | Inspect production routes/bundles and function deployment for `/push-source`, `githubPush.ts`, `/source-zip`, `_sourceSnapshot.ts`. | No such tools or endpoints exist; this repo currently records them as absent. |
| Performance | Run Lighthouse against production mobile `/` on a clean profile. | Performance score is at least 90; archive report and investigate regressions. |
| OG/SEO | Inspect canonical, OG/Twitter title/image and preview via a social platform debugger or real share. | Correct production URL, title, description, and 1200×630 preview; no stale host. |
| Privacy | Review Plausible network/event payloads and policy disclosures. | No sensitive user content/identifiers sent; approved disclosures match deployed behavior. |

## 4. Launch day and post-launch

### Launch day

- [ ] Confirm hard security and legal sign-offs in `LAUNCH_READY.md`.
- [ ] Announce freeze, owner contacts, maintenance window, and rollback authority.
- [ ] Deploy Convex and frontend in the approved order; record immutable commit/deployment IDs.
- [ ] Run smoke tests, then the critical auth/email/core-app checks on production.
- [ ] Check DNS/TLS, analytics, logs, error reporting, email delivery, and provider quotas.
- [ ] Announce only after owners accept results; keep the rollback route available.
- [ ] If auth, data isolation, secret exposure, or data integrity fails, halt announcement, disable affected functionality or roll back, preserve safe diagnostics, and notify the incident owner.

### First 24–72 hours and ongoing

- [ ] Review error rates, latency, availability, Convex function failures, and frontend exceptions at launch and daily through the first week.
- [ ] Review OTP volume, provider throttling, bounces/complaints, quota/spend, and abuse alerts.
- [ ] Check user support reports and successful signup/core-action funnel without collecting unnecessary personal data.
- [ ] Review Lighthouse/real-user performance and Plausible data for unexpected regressions or sensitive properties.
- [ ] Confirm backups/export and restore/rollback owners and procedures; record any incidents and remedial actions.
- [ ] Revisit provider access, secret rotation schedule, DNS/TLS expiry, legal terms, and monitoring alert delivery monthly.

Record each alert owner and escalation contact in the team's private operations system, not in public documentation.
