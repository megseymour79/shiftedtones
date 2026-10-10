import { PublicLayout } from "@/components/PublicLayout";

export default function PrivacyPolicy() {
  return (
    <PublicLayout>
      <main className="mx-auto max-w-3xl px-4 py-8 text-neutral-800">
        <h1 className="mb-2 text-3xl font-bold">
          Privacy notice for ShiftedTone
        </h1>
        <p className="mb-6 text-sm text-neutral-500">
          Draft — not approved for production
        </p>

        <aside
          aria-label="Draft notice"
          className="mb-8 border-2 border-coral bg-card p-4 text-sm font-semibold"
        >
          This is a working draft, not a final privacy notice. The service
          operator must complete the bracketed items, verify all provider and
          retention details, and obtain qualified legal review before launch.
        </aside>

        <section className="space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="mb-2 text-xl font-semibold">Operator and contact</h2>
            <p>
              This service is operated by [LEGAL ENTITY AND ADDRESS]. For
              privacy requests or questions, contact [PRIVACY CONTACT AND
              PROCESS]. Effective date: [DATE APPROVED FOR PUBLICATION].
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">Information and use</h2>
            <p>
              The app uses account and authentication records to provide
              sign-in. When you use the app, it stores account-linked practice
              sessions, optional speech transcripts, practice measurements and
              scores, daily progress, drill attempts, coach notes, and reframe
              logs to provide the related features. Complete this list against
              the final production schema and any enabled integrations before
              publication.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">
              Microphone and speech
            </h2>
            <p>
              Microphone practice is captured in the browser. The current app
              creates a browser-local recording for playback and does not submit
              that recording blob to its Convex backend. Browser speech
              recognition may process speech separately under the browser or
              recognition provider's terms and privacy practices. Verify the
              behavior in supported production browsers before relying on this
              description.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">Service providers</h2>
            <p>
              The app uses Convex for application data and authentication. Email
              sign-in codes are sent through the configured VLY/Freebuff email
              endpoint. The reframe feature sends the trigger, reaction, goal,
              and generated response request to the configured VLY AI
              integration. The coaching feature may send practice measurements,
              scenario, and optional transcript to that integration. If
              configured, Plausible receives pageviews and named feature events.
              Identify the actual providers, their roles, locations, and
              retention/processing terms for production: [PROVIDER DISCLOSURES].
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">Analytics</h2>
            <p>
              Plausible analytics are not initialized unless
              VITE_PLAUSIBLE_DOMAIN is configured. When enabled, the app sends
              pageviews and feature events. Review deployed event properties and
              the applicable consent and opt-out requirements before enabling
              it.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">
              Retention and deletion
            </h2>
            <p>
              An authenticated user can use the in-app account deletion control.
              The current implementation deletes the user's app records, auth
              sessions and refresh tokens, verification codes, auth accounts,
              and user record in this Convex deployment. This does not establish
              deletion timelines for provider logs, backups, email, analytics,
              browser data, or third-party AI services. Set and disclose those
              periods: [RETENTION PERIODS AND BACKUP/PROVIDER PRACTICES].
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">
              Your choices and rights
            </h2>
            <p>
              Describe the access, correction, deletion, portability, objection,
              consent withdrawal, and complaint rights that apply where the
              service operates, and explain how to exercise them:
              [JURISDICTIONS, RIGHTS, AND REQUEST PROCESS].
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">
              Children and transfers
            </h2>
            <p>
              State the intended minimum age and whether the service is directed
              to children: [AGE AND CHILDREN'S PRIVACY REVIEW]. Describe
              international data transfers and applicable safeguards: [TRANSFER
              DETAILS].
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">Updates</h2>
            <p>
              Explain how material changes to this notice will be communicated:
              [UPDATE PROCESS].
            </p>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
