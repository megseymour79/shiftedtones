import { NBBadge, NBButton, NBPanel } from "@/components/nb";
import { getDrill } from "@/lib/drills";
import { videoThumb, type WatchVideo } from "@/lib/watch-list";
import { ArrowRight, ArrowUpRight, Mic, Play } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router";

/**
 * The video's front face, two flavors:
 *  - "card" (default): the whole face lives inside an outer link, so the
 *    play affordance and fallback are non-interactive spans — no nested
 *    buttons inside the anchor.
 *  - "inline": a real button plays the video right there via an
 *    embedded YouTube iframe.
 * The YouTube CDN image is the default surface; if it can't load
 * (blocked network, ad-blocker, offline preview) a designed fallback
 * takes its place so the card never shows a broken box.
 */
export function VideoThumb({
  video,
  mode = "card",
  playing = false,
  onPlay,
}: {
  video: WatchVideo;
  /** "card" = decorative face inside an outer link; "inline" = button. */
  mode?: "card" | "inline";
  playing?: boolean;
  onPlay?: () => void;
}) {
  const [broken, setBroken] = useState(false);

  if (playing) {
    return (
      <div className="aspect-video w-full border-b-2 border-ink bg-ink">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="size-full"
        />
      </div>
    );
  }

  const playFace =
    mode === "inline" ? (
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Play ${video.title}`}
        className="absolute inset-0 flex items-center justify-center bg-ink/30 transition-colors hover:bg-ink/10"
      >
        <span className="nb flex size-12 items-center justify-center bg-sun text-ink nb-shadow-sm transition-transform duration-300 group-hover:scale-110">
          <Play className="size-5 fill-ink" />
        </span>
      </button>
    ) : (
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center bg-ink/30 transition-colors group-hover:bg-ink/10"
      >
        <span className="nb flex size-12 items-center justify-center bg-sun text-ink nb-shadow-sm transition-transform duration-300 group-hover:scale-110">
          <Play className="size-5 fill-ink" />
        </span>
      </span>
    );

  if (broken) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 border-b-2 border-ink bg-ink px-6 text-paper">
        {playFace}
        <span className="text-center font-display text-sm leading-snug">
          {video.title}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-sun">
          {mode === "inline" ? "Play video" : "Watch on YouTube"}
        </span>
      </div>
    );
  }

  return (
    <div className="relative border-b-2 border-ink">
      <img
        src={videoThumb(video.id)}
        alt={video.title}
        loading="lazy"
        onError={() => setBroken(true)}
        className="aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
      />
      {playFace}
      {video.minutes != null && (
        <span className="nb absolute bottom-2 right-2 bg-ink px-1.5 py-0.5 text-[10px] font-bold text-paper">
          {video.minutes} min
        </span>
      )}
    </div>
  );
}

/**
 * One curated video card: thumbnail → play, meta, and — when the video
 * maps to a drill — the "Train it" bridge into the app.
 *
 * `playInline` turns the thumbnail into a real player: clicking plays
 * the video right there instead of leaving for YouTube. The
 * "Watch on YouTube" link stays for full-page viewing either way.
 */
export function VideoCard({
  video,
  playInline = false,
  autoPlay = false,
}: {
  video: WatchVideo;
  /** Clicking plays inline instead of navigating to YouTube. */
  playInline?: boolean;
  /** Start in playing state (used when a teaser swap requests it). */
  autoPlay?: boolean;
}) {
  const drill = getDrill(video.practice);
  const [playing, setPlaying] = useState(autoPlay);

  return (
    <div className="flex flex-col">
      {playInline ? (
        <motion.div whileHover={{ y: -4 }} className="group block">
          <NBPanel className="overflow-hidden border-paper bg-ink text-paper">
            <VideoThumb
              video={video}
              mode="inline"
              playing={playing}
              onPlay={() => setPlaying(true)}
            />
            <CardBody video={video} linkOut />
          </NBPanel>
        </motion.div>
      ) : (
        <motion.a
          href={`https://youtu.be/${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ y: -4 }}
          className="group block"
        >
          <NBPanel className="overflow-hidden border-paper bg-ink text-paper">
            <VideoThumb video={video} mode="card" />
            <CardBody video={video} />
          </NBPanel>
        </motion.a>
      )}

      {drill && (
        <Link
          to="/auth"
          className="group/link mt-3 flex items-center justify-between gap-2 border-2 border-paper/25 bg-paper/5 px-3 py-2.5 text-paper transition-colors hover:border-sun hover:bg-sun hover:text-ink"
        >
          <span className="flex items-center gap-2">
            <Mic className="size-4 shrink-0" />
            <span className="text-left text-[10px] font-bold uppercase tracking-widest">
              Practice: {drill.name}
            </span>
          </span>
          <ArrowRight className="size-3.5 shrink-0 transition-transform duration-300 group-hover/link:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

/**
 * Title + meta + watch link. In card mode the whole card is already an
 * anchor, so the watch-line is decorative (nested anchors are invalid);
 * in inline mode it's a real link out to YouTube.
 */
function CardBody({ video, linkOut = false }: { video: WatchVideo; linkOut?: boolean }) {
  return (
    <div className="flex flex-1 flex-col p-4">
      <div className={`mb-2 h-1.5 w-10 ${video.color}`} />
      <h2 className="font-display text-sm leading-snug">{video.title}</h2>
      <p className="mt-2 flex-1 text-xs leading-relaxed text-paper/60">
        {video.meta}
      </p>
      {linkOut ? (
        <a
          href={`https://youtu.be/${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-sun hover:underline"
        >
          Watch on YouTube
          <ArrowUpRight className="size-3.5" />
        </a>
      ) : (
        <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-sun">
          Watch on YouTube
          <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </span>
      )}
    </div>
  );
}

/**
 * The full "Watch & learn" videos section: dark strip, staggered card
 * entrance, one "See all N videos" link pointing deeper into the site.
 * Used by the Watch page (all videos) and reusable anywhere.
 */
export function WatchLearnSection({
  videos,
  heading = "Watch and learn",
  subheading = "Coaches and researchers share what they've learned about communication. Each video comes with a short drill.",
  seeAll,
}: {
  videos: WatchVideo[];
  /** Section title (default "Watch & learn"). */
  heading?: string;
  /** Standfirst paragraph (default covers the technique + drill pairing). */
  subheading?: string;
  /** Renders a "See all" button — shown only where it leads somewhere new. */
  seeAll?: { to: string; label: string };
}) {
  return (
    <section className="nb-stripes border-b-2 border-ink bg-ink text-paper">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <NBBadge className="bg-coral text-ink">Video</NBBadge>
            <h2 className="mt-4 font-display text-3xl leading-tight sm:text-4xl">
              {heading}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-paper/60">
            {subheading}
          </p>
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video, i) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <VideoCard video={video} playInline />
            </motion.div>
          ))}
        </div>

        {seeAll && (
          <div className="mt-8 flex justify-center">
            <Link to={seeAll.to}>
              <NBButton variant="paper" className="px-6 py-3 text-base">
                {seeAll.label} <ArrowRight className="size-4" />
              </NBButton>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
