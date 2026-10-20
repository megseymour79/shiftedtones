import { NBButton, NBPanel } from "@/components/nb";
import { AppShell } from "@/components/AppShell";
import { GroundingKit } from "@/components/GroundingKit";
import { GROUNDING_EXERCISES } from "@/lib/grounding";
import { api } from "@/convex/_generated/api";
import {
  ArrowRight,
  MessagesSquare,
  Shuffle,
} from "lucide-react";
import { useQuery } from "convex/react";
import { Link } from "react-router";

/**
 * /calm — the low-arousal side of training. The full grounding kit
 * (six exercises) plus the two no-mic practices. Nothing to score,
 * nothing to unlock — a place to downshift before or after reps.
 */
export default function Calm() {
  const reframeLogs = useQuery(api.reframes.list, { limit: 2 });

  return (
    <AppShell active="calm">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
        {/* Heading */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            A little space to reset
          </p>
          <h1 className="mt-1 font-display text-3xl text-balance sm:text-4xl">
            Take a moment to <span className="italic text-mint">reset</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Choose from {GROUNDING_EXERCISES.length} guided breathing and
            attention exercises, or try a practice that doesn't need a mic.
            Use this page before or after a difficult conversation.
          </p>
        </section>

        {/* The grounding kit */}
        <GroundingKit />

        {/* No-mic practices */}
        <section className="grid gap-6 lg:grid-cols-2">
          <NBPanel className="bg-ink text-paper">
            <div className="border-b-2 border-paper/20 p-6">
              <div className="flex items-center gap-2 font-display text-xl">
                <MessagesSquare className="size-5 text-sun" /> Read the Room
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm leading-relaxed text-paper/80">
                No microphone needed. Choose a reply and see how it might come
                across. There's a new scenario each day.
              </p>
              <Link to="/quiz" className="mt-6 inline-block">
                <NBButton variant="sun" className="text-xs">
                  Today's scenario <ArrowRight className="size-3.5" />
                </NBButton>
              </Link>
            </div>
          </NBPanel>

          <NBPanel className="bg-ink text-paper">
            <div className="border-b-2 border-paper/20 p-6">
              <div className="flex items-center gap-2 font-display text-xl">
                <Shuffle className="size-5 text-sun" /> Reframe Lab
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm leading-relaxed text-paper/80">
                Think about a moment that bothered you. Notice your first
                reaction, then write what you'd rather say.
              </p>
              <ul className="mt-4 flex flex-col gap-2 text-xs uppercase tracking-widest text-paper/60">
                {(reframeLogs ?? []).map((log) => (
                  <li key={log._id} className="truncate">· {log.trigger}</li>
                ))}
              </ul>
              <Link to="/reframe" className="mt-6 inline-block">
                <NBButton variant="sun" className="text-xs">
                  Open reframe lab <ArrowRight className="size-3.5" />
                </NBButton>
              </Link>
            </div>
          </NBPanel>
        </section>
      </div>
    </AppShell>
  );
}
