import { NBBadge, NBButton, NBPanel } from "@/components/nb";
import { PublicLayout } from "@/components/PublicLayout";
import { PagePager } from "@/components/PagePager";
import { getAccessibleDailyChallenge } from "@/lib/daily";
import {
  Activity,
  ArrowRight,
  Brain,
  Mic,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router";

const STEPS = [
  {
    icon: Mic,
    title: "01 · Give it a try",
    body: "Pick a drill and answer the prompt as you might in a real conversation.",
    color: "bg-sun",
  },
  {
    icon: Activity,
    title: "02 · Get a read",
    body: "We'll look at your pitch, pace, and volume, then show you what we noticed.",
    color: "bg-mint",
  },
  {
    icon: Brain,
    title: "03 · Try something new",
    body: "You'll get a note about how you came across and one thing to try next time. A little practice can help new habits stick.",
    color: "bg-coral",
  },
];

export default function HowItWorks() {
  // Public page: model a brand-new user, matching the Drills page.
  const daily = getAccessibleDailyChallenge(() => false);

  return (
    <PublicLayout>
      {/* Header */}
      <section className="nb-grid-dots border-b-2 border-ink">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:py-16">
          <NBBadge className="bg-sun text-ink">A simple approach</NBBadge>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            How it <span className="italic text-coral">works</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Start by noticing what you tend to do. Then try a different
            response and see how it feels.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="nb-grid border-b-2 border-ink bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:py-16">
          <div className="grid gap-6 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.4, delay: i * 0.12 }}
                className="transition-transform duration-300 hover:-translate-y-1"
              >
                <NBPanel className="relative h-full overflow-hidden">
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -bottom-7 -right-1 font-display text-[7.5rem] leading-none text-ink/5"
                  >
                    0{i + 1}
                  </span>
                  <div
                    className={`flex items-center justify-between border-b-2 border-ink px-5 py-3 ${step.color}`}
                  >
                    <span className="font-display text-sm">{step.title}</span>
                    <step.icon className="size-5" />
                  </div>
                  <p className="p-5 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </NBPanel>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-md text-sm text-muted-foreground">
              That's it: try a drill, see what you notice, and give it another go.
            </p>
            <Link to="/auth">
              <NBButton variant="coral" className="px-6 py-3">
                Try it for yourself <ArrowRight className="size-4" />
              </NBButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Today's challenge teaser */}
      <section className="border-b-2 border-ink">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="nb flex flex-wrap items-center justify-between gap-4 bg-sun nb-shadow">
            <div className="flex items-center gap-4">
              <span className="nb flex size-12 shrink-0 items-center justify-center bg-card">
                <Sparkles className="size-6" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Today's challenge
                </p>
                <p className="font-display text-lg leading-tight sm:text-xl">
                  {daily.drill.name} — {daily.angle.toLowerCase()}
                </p>
              </div>
            </div>
            <Link to="/drills">
              <NBButton variant="ink" className="text-xs">
                Browse the drills <ArrowRight className="size-3.5" />
              </NBButton>
            </Link>
          </div>
        </div>
      </section>
      <PagePager />
    </PublicLayout>
  );
}
