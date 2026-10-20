import { tourStops } from "@/lib/site-nav";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router";

/**
 * Back/forward pager for the public-site tour. Sits at the bottom of each
 * section page: ← the previous stop, next stop →, with scroll-to-top on
 * every move so each page starts clean.
 */
export function PagePager() {
  const { pathname } = useLocation();
  const { prev, next } = tourStops(pathname);

  // Every tour move lands at the top of the next page, not mid-scroll.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Tour pages"
      className="mx-auto flex max-w-6xl items-stretch justify-between gap-4 px-4 pb-12 pt-4"
    >
      {prev ? (
        <Link to={prev.to} className="group min-w-0 flex-1">
          <div className="nb nb-press flex h-full items-center gap-3 bg-card p-4">
            <ArrowLeft className="size-5 shrink-0 transition-transform group-hover:-translate-x-1" />
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Previous — {prev.blurb}
              </span>
              <span className="block truncate font-display text-lg leading-tight">
                {prev.label}
              </span>
            </span>
          </div>
        </Link>
      ) : (
        <span className="flex-1" aria-hidden />
      )}

      {next ? (
        <Link to={next.to} className="group min-w-0 flex-1">
          <div className="nb nb-press flex h-full items-center justify-end gap-3 bg-sun p-4 text-right">
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-ink/70">
                Next — {next.blurb}
              </span>
              <span className="block truncate font-display text-lg leading-tight">
                {next.label}
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      ) : (
        <Link to="/auth" className="group min-w-0 flex-1">
          <div className="nb nb-press flex h-full items-center justify-end gap-3 bg-coral p-4 text-right">
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-ink/70">
                Ready to practice?
              </span>
              <span className="block truncate font-display text-lg leading-tight">
                Get started
              </span>
            </span>
            <ArrowRight className="size-5 shrink-0 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      )}
    </nav>
  );
}
