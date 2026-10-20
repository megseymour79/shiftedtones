import { NBButton } from "@/components/nb";
import { OPEN_IN_TAB_HINT } from "@/hooks/use-tone-capture";
import { ExternalLink, MicOff } from "lucide-react";

/**
 * The shared mic-error banner for the capture pages.
 *
 * The capture hook marks permission-blocked errors with the
 * [open-in-tab] suffix when the app runs inside an embedded frame —
 * there, the browser refuses the mic with no prompt at all, and opening
 * the app in a full tab is the one-click fix. This component catches the
 * flag, strips it from the visible message, and renders the escape hatch.
 */
export function MicError({ message }: { message: string }) {
  const canOpenInTab = message.includes(OPEN_IN_TAB_HINT);
  const text = canOpenInTab
    ? message.replace(OPEN_IN_TAB_HINT, "").trim()
    : message;

  return (
    <div
      className="nb max-w-md bg-coral px-4 py-3 text-left"
      role="alert"
    >
      <p className="flex items-start gap-2 text-sm font-medium whitespace-pre-line">
        <MicOff className="mt-0.5 size-4 shrink-0" />
        {text}
      </p>
      {canOpenInTab && (
        <div className="mt-3 flex items-center gap-2">
          <NBButton
            variant="ink"
            className="px-3 py-1.5 text-xs"
            onClick={() => window.open(window.location.href, "_blank", "noopener,noreferrer")}
          >
            <ExternalLink className="size-3.5" /> Open in a new tab
          </NBButton>
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink/70">
            Allow microphone access in the new tab
          </span>
        </div>
      )}
    </div>
  );
}
