import { PublicLayout } from "@/components/PublicLayout";

export default function TermsOfService() {
  return (
    <PublicLayout>
      <main className="mx-auto max-w-3xl px-4 py-8 text-neutral-800">
        <h1 className="mb-2 text-3xl font-bold">Terms of service for ShiftedTone</h1>
        <p className="mb-6 text-sm text-neutral-500">Draft — not approved for production</p>

        <aside
          aria-label="Draft terms"
          className="mb-8 border-2 border-coral bg-card p-4 text-sm font-semibold"
        >
          This working draft is not approved for publication or user acceptance.
          The service operator must complete the bracketed items and obtain
          qualified legal review before launch.
        </aside>

        <section className="space-y-6 text-sm leading-relaxed">
          <div>
            <h2 className="mb-2 text-xl font-semibold">Operator and effective date</h2>
            <p>
              Service operator: [LEGAL ENTITY AND ADDRESS]. Contact:
              [SUPPORT CONTACT]. Effective date: [DATE APPROVED FOR PUBLICATION].
              Governing law and venue: [COUNSEL TO COMPLETE].
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">Eligibility and accounts</h2>
            <p>
              Set the minimum age and geographic availability after reviewing
              applicable law: [ELIGIBILITY]. Explain account security, sign-in,
              and account closure procedures: [ACCOUNT TERMS].
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">Service and limitations</h2>
            <p>
              ShiftedTone provides educational communication practice,
              rehearsal, and software-generated feedback. It is not therapy,
              clinical diagnosis, counseling, or medical advice, and is not a
              substitute for professional care. Describe other product
              limitations and availability: [COUNSEL/OPERATOR REVIEW].
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">Acceptable use</h2>
            <p>
              Specify the prohibited uses, service protections, reporting
              process, and any suspension or appeal procedure:
              [ACCEPTABLE-USE TERMS].
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">Your content and audio</h2>
            <p>
              Define ownership and the limited rights needed to operate the
              service, including treatment of text submitted to AI features and
              browser-captured audio. Confirm the wording against the production
              app and privacy notice: [CONTENT LICENSE AND AUDIO TERMS].
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">Fees and changes</h2>
            <p>
              State whether the service is free or paid, including applicable
              charges, renewals, refunds, and notice of changes:
              [PRICING AND CHANGE TERMS].
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">Privacy and termination</h2>
            <p>
              Read the{" "}
              <a className="underline" href="/privacy">
                privacy notice draft
              </a>
              . Explain user/operator termination, effects on data, and
              complaint handling: [TERMINATION AND SUPPORT PROCESS].
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-xl font-semibold">Warranties, liability, and disputes</h2>
            <p>
              Have qualified counsel prepare warranty, liability, and dispute
              provisions that apply to the operator and jurisdictions, including
              any arbitration or class-action terms: [COUNSEL-APPROVED TERMS].
            </p>
          </div>
        </section>
      </main>
    </PublicLayout>
  );
}
