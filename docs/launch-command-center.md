# ShiftedTones Launch Command Center
Repo: `megseymour79/shiftedtones`  
Date: `2026-10-21`  
Release commit SHA: `<sha>`  
Launch lead: `<name>`  
Rollback owner: `<name>`  
Status: `NOT STARTED | IN PROGRESS | GO | NO-GO | LAUNCHED | ROLLED BACK`

---

## 1) Hard Gate: Security Incident Remediation (REQUIRED)
> **Do not launch if any item is not complete.**

- [ ] Exposed dotenvx key revoked/retired.
- [ ] All potentially exposed credentials rotated (Convex, Vercel prod/preview, email, analytics, DNS/domain, other providers).
- [ ] Old key confirmed unusable (no plaintext exposure during verification).
- [ ] `.env.keys` purged from all Git history (all branches/tags) and force-push completed in coordinated window.
- [ ] GitHub cache-clear request submitted (and tracked).
- [ ] All collaborators re-cloned; old clones blocked from push.
- [ ] `npm run check:tracked-secrets` passes on release commit.
- [ ] Independent verifier sign-off recorded.

**Owner:** `<name>`  
**Independent verifier GitHub handle:** `<@handle>`  
**Evidence links:**  
- `<link>`  
- `<link>`  
**Result:** `PASS | FAIL`

---

## 2) Vercel Project Configuration
- [ ] Project linked to `megseymour79/shiftedtones`.
- [ ] Framework preset: **Vite**
- [ ] Install command: `npm ci`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] `vercel.json` settings confirmed (rewrite to `/index.html` for SPA).
- [ ] Node runtime version confirmed (LTS / matches repo policy).

**Owner:** `<name>`  
**Evidence:** `<vercel project/settings link>`  
**Result:** `PASS | FAIL`

---

## 3) Environment Variables Placement (No Secrets in Repo)
### Vercel
- [ ] Production env vars set (public `VITE_*` values only as intended).
- [ ] Preview env vars set separately.
- [ ] No server secrets placed in `VITE_*`.

### Convex
- [ ] Production backend secrets set.
- [ ] Auth/email/integration server-side credentials set only in provider secret manager.

### Controls
- [ ] No secrets in tracked files / PR text / issues / chat logs.
- [ ] Variable names and target environments checked by second reviewer.

**Owner:** `<name>`  
**Verifier:** `<name>`  
**Independent verifier GitHub handle:** `<@handle>`  
**Evidence:** `<links/screenshots with values redacted>`  
**Result:** `PASS | FAIL`

---

## 4) Domain, DNS, TLS, Canonical Routing
- [ ] Production domain added in Vercel.
- [ ] DNS records configured and propagated.
- [ ] TLS certificate issued and valid.
- [ ] Canonical domain redirect behavior verified (`www` ↔ apex).
- [ ] HTTPS-only behavior confirmed.

**Owner:** `<name>`  
**Evidence:** `<links>`  
**Result:** `PASS | FAIL`

---

## 5) Backend + Auth + CORS Readiness
- [ ] Convex production deployment completed.
- [ ] Frontend points to production backend URL (`VITE_CONVEX_URL`).
- [ ] Auth issuer/domain/callback URLs match production domain(s).
- [ ] CORS allowlist includes only intended origins.
- [ ] Negative CORS test (untrusted origin) fails as expected.

**Owner:** `<name>`  
**Evidence:** `<links/logs>`  
**Result:** `PASS | FAIL`

---

## 6) External Providers: Email + Analytics
### Email
- [ ] Sender/domain verification complete.
- [ ] SPF/DKIM/DMARC status acceptable.
- [ ] Bounce/complaint handling configured.
- [ ] Quotas/rate limits reviewed.
- [ ] Alerting enabled.

### Analytics (Plausible)
- [ ] Correct site/domain configured.
- [ ] Production events confirmed.
- [ ] Privacy disclosures reviewed.

**Owner:** `<name>`  
**Evidence:** `<links>`  
**Result:** `PASS | FAIL`

---

## 7) Legal/Policy Gate
- [ ] Privacy policy reviewed/approved by qualified counsel.
- [ ] Terms of service reviewed/approved by qualified counsel.
- [ ] Published policy pages contain final approved operator/provider details.
- [ ] Draft markers removed only after legal approval.

**Owner:** `<name>`  
**Evidence:** `<approval record links>`  
**Result:** `PASS | FAIL`

---

## 8) Pre-Deploy Quality Gate (Release Commit)
Run and paste outcomes:

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run validate:og
npm run check:tracked-secrets
```

- [ ] All commands passed.

**Executed by:** `<name>`  
**Timestamp:** `<UTC>`  
**Build/test logs:** `<link>`  
**Result:** `PASS | FAIL`

---

## 9) Deploy Execution
- [ ] Production deployment triggered from approved release commit.
- [ ] Deployment finished successfully.
- [ ] Deploy URL + commit SHA recorded.
- [ ] Build logs archived.

**Owner:** `<name>`  
**Deployment URL:** `<url>`  
**Commit SHA:** `<sha>`  
**Logs:** `<link>`  
**Result:** `PASS | FAIL`

---

## 10) Post-Deploy Verification
Run:

```bash
npm run smoke-test -- --url https://shiftedtones.com
```

Manual checks:
- [ ] User A/User B data isolation verified.
- [ ] Denied microphone permission UX verified.
- [ ] Offline/throttled behavior verified.
- [ ] CORS allow/deny behavior verified.
- [ ] Lighthouse mobile check completed.
- [ ] Real OG/Twitter social preview rendering verified.

**Owner:** `<name>`  
**Evidence:** `<links/screenshots>`  
**Result:** `PASS | FAIL`

---

## 11) Launch Decision
### GO / NO-GO Review
- [ ] All required sections above are PASS.
- [ ] No open P0/P1 incidents.
- [ ] Rollback plan validated and owner on standby.

**Decision:** `GO | NO-GO`  
**Decision time (UTC):** `<timestamp>`  
**Approvers:** `<name>, <name>`  
**Notes:** `<text>`

---

## 12) Rollback Plan (Ready Before Announcement)
Rollback triggers (any one):
- Auth failure
- Cross-user data isolation failure
- Secret exposure concern
- Severe CORS misconfiguration
- Major availability regression

Rollback actions:
1. Repoint traffic to previous known-good deployment.
2. Disable affected integrations if needed.
3. Announce incident status internally.
4. Open incident channel and assign IC.
5. Capture timeline and preserve logs.
6. Do not relaunch until corrective verification passes.

**Rollback owner:** `<name>`  
**Previous deployment reference:** `<url/id>`  
**Status page/internal comms links:** `<link>`

---

## 13) Launch-Day Monitoring (First 24 Hours)
- [ ] Vercel errors monitored
- [ ] Convex backend errors monitored
- [ ] Auth success/failure rates monitored
- [ ] Email delivery/bounce/complaint monitored
- [ ] Analytics sanity checked
- [ ] User-reported issue triage active

**On-call:** `<name>`  
**Monitoring dashboard links:**  
- `<link>`  
- `<link>`  
**Checkpoints (UTC):** `<times>`
