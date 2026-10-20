import { NBBadge, NBButton } from "@/components/nb";
import { PublicLayout } from "@/components/PublicLayout";
import { PagePager } from "@/components/PagePager";
import { WatchLearnSection } from "@/components/VideoCard";
import { WATCH_LIST } from "@/lib/watch-list";
import { ArrowRight, BookOpen } from "lucide-react";
import { Link } from "react-router";

/**
 * /watch — the full video gallery. One curated video per card, each
 * paired with the drill that lets you practice the idea out loud.
 * The home page carries only a teaser; this page is the whole shelf.
 */
export default function Watch() {
  return (
    <PublicLayout>
      <section className="nb-grid-dots border-b-2 border-ink">
        <div className="mx-auto max-w-6xl px-4 py-14 lg:py-16">
          <NBBadge className="bg-coral text-ink">Watch and learn</NBBadge>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-5xl">
            Learn more about <span className="italic text-sun">communication</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Browse videos about tone and communication from coaches and
            researchers. Each one includes a related practice drill.
          </p>
        </div>
      </section>

      <WatchLearnSection
        videos={WATCH_LIST}
        heading="Videos on tone and communication"
        subheading="Coaches and researchers share ideas about how we communicate."
      />

      {/* Cross-link: the research shelf lives in the library */}
      <section className="border-b-2 border-ink bg-secondary">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8">
          <div className="flex items-center gap-4">
            <span className="nb flex size-11 shrink-0 items-center justify-center bg-card">
              <BookOpen className="size-5" />
            </span>
            <div>
              <p className="font-display text-lg leading-tight">
                Prefer reading? Explore the books and research.
              </p>
              <p className="text-sm text-muted-foreground">
                Read more about the ideas behind these videos. Links go to
                their original sources.
              </p>
            </div>
          </div>
          <Link to="/library">
            <NBButton variant="ink" className="text-xs">
              Open the library <ArrowRight className="size-3.5" />
            </NBButton>
          </Link>
        </div>
      </section>
      <PagePager />
    </PublicLayout>
  );
}
