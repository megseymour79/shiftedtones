import { useAction, useMutation, useQuery } from "convex/react";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { NBBadge, NBButton, NBPanel } from "@/components/nb";

/**
 * The post-take coach: one number-anchored note per take.
 * Free users get three tastes; after that this card becomes the upsell.
 */
export function CoachNote({ sessionId }: { sessionId: Id<"practiceSessions"> }) {
  const access = useQuery(api.coachNotes.checkAccess);
  const existing = useQuery(api.coachNotes.forSession, { sessionId });
  const generate = useAction(api.coach.generate);
  const unlock = useMutation(api.coachNotes.unlock);

  const [note, setNote] = useState<{
    feedback: string;
    oneThing: string;
    source: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (access === undefined || existing === undefined) {
    return (
      <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Checking your coach…
      </div>
    );
  }
  // Signed-out users never reach this protected route; render nothing.
  if (access === null || existing === null) return null;

  const shown = existing ?? note;

  if (shown) {
    return (
      <NBPanel className="mt-5 border-l-4 border-l-sun p-5">
        <div className="flex flex-wrap items-center gap-2">
          <NBBadge className="bg-sun">
            <Sparkles className="size-3" /> Coach
          </NBBadge>
          {shown.source === "fallback" && (
            <NBBadge className="bg-paper text-[9px]">offline read</NBBadge>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed">{shown.feedback}</p>
        {shown.oneThing && (
          <div className="nb mt-4 bg-sun p-3">
            <span className="text-[10px] font-bold uppercase tracking-widest">
              For next time
            </span>
            <p className="mt-0.5 font-display text-sm">{shown.oneThing}</p>
          </div>
        )}
      </NBPanel>
    );
  }

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generate({ sessionId });
      setNote(result);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "We couldn't review that take. Try again in a moment.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      await unlock({});
      toast.success("Coach unlocked. You'll get a note after each take.");
    } catch {
      toast.error("We couldn't unlock the coach. Try again in a moment.");
    }
  };

  if (access.entitlement.needsUpgrade) {
    return (
      <NBPanel className="mt-5 bg-ink p-6 text-paper">
        <NBBadge className="bg-sun">
          <Sparkles className="size-3" /> The Coach
        </NBBadge>
        <p className="mt-3 font-display text-xl leading-snug">
          You've used all three free notes.
        </p>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-paper/80">
          Get feedback on your pace, pitch, and stability, plus one idea to
          try next time.
        </p>
        <div className="mt-4">
          <NBButton onClick={handleUnlock} variant="sun">
            Unlock the coach
          </NBButton>
        </div>
      </NBPanel>
    );
  }

  return (
    <div className="mt-5">
      {!access.hasAnyNotes && (
        <p className="mb-2 text-xs text-muted-foreground">
          Your first three notes are free. Each one is based on your practice scores.
        </p>
      )}
      {access.entitlement.freeRemaining > 0 && access.hasAnyNotes && (
        <p className="mb-2 text-xs text-muted-foreground">
          {access.entitlement.freeRemaining} free note
          {access.entitlement.freeRemaining === 1 ? "" : "s"} left
        </p>
      )}
      <NBButton onClick={run} disabled={loading} variant="coral">
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Taking a look…
          </>
        ) : (
          <>
            <Sparkles className="size-4" /> Get a note on this take
          </>
        )}
      </NBButton>
      {error && <p className="nb mt-3 bg-coral px-3 py-2 text-sm font-medium">{error}</p>}
    </div>
  );
}
