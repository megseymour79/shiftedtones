import { NBButton, NBPanel } from "@/components/nb";
import { PublicLayout } from "@/components/PublicLayout";
import { PagePager } from "@/components/PagePager";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";

const START_OPTIONS = [
  {
    to: "/tone-check",
    title: "Check in",
    body: "Take a few minutes to think about how you respond under pressure.",
  },
  {
    to: "/drills",
    title: "Try a practice",
    body: "Work through everyday conversations at your own pace.",
  },
  {
    to: "/watch",
    title: "Learn a little",
    body: "Browse short videos about tone and communication.",
  },
];

export default function Home() {
  return (
    <PublicLayout>
      <section className="nb-grid-dots border-b-2 border-ink">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:py-28">
          <p className="nb inline-flex bg-mint px-3 py-1 text-[11px] font-bold uppercase tracking-widest nb-shadow-sm">
            A little practice for everyday conversations
          </p>
          <h1 className="mt-6 max-w-3xl font-display text-5xl leading-[1.05] sm:text-6xl">
            Say what you mean, in a way that feels like you.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            ShiftedTone gives you a low-pressure place to notice your tone and
            try a different response, one small step at a time.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/tone-check">
              <NBButton variant="sun" className="px-5 py-3">
                Try a tone check <ArrowRight className="size-4" />
              </NBButton>
            </Link>
            <Link to="/how" className="text-sm font-bold underline underline-offset-4">
              See how it works
            </Link>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            No microphone needed to get started.
          </p>
        </div>
      </section>

      <section className="border-b-2 border-ink bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-6 max-w-xl">
            <h2 className="font-display text-2xl sm:text-3xl">Start wherever you like</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              There’s no set order. Pick the thing that feels useful today.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {START_OPTIONS.map((option) => (
              <Link key={option.to} to={option.to} className="group">
                <NBPanel className="flex h-full flex-col p-5 transition-transform duration-200 group-hover:-translate-y-1">
                  <span className="font-display text-lg">{option.title}</span>
                  <span className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {option.body}
                  </span>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-coral">
                    Take a look <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </NBPanel>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <PagePager />
    </PublicLayout>
  );
}
