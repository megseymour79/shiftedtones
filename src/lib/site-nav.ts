/**
 * Public-site navigation, shared by the header, mobile menu, and footer.
 * Every path here must be registered in main.tsx — site-nav.test.ts guards
 * the list so a new link without a route can't ship silently.
 * Keep labels conversational, concise, and easy to scan.
 */

export interface NavItem {
  to: string;
  label: string;
  /** Accent dot shown in the mobile menu. */
  dot: string;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/how", label: "How it works", dot: "bg-sun" },
  { to: "/tone-check", label: "Tone check", dot: "bg-coral" },
  { to: "/drills", label: "Practice", dot: "bg-mint" },
  { to: "/watch", label: "Watch", dot: "bg-coral" },
  { to: "/library", label: "Library", dot: "bg-paper" },
];

/** The public routes the router must register for the nav to be safe. */
export const PUBLIC_ROUTES = ["/", ...NAV_ITEMS.map((n) => n.to)];

/**
 * The guided tour: the natural reading order through the public site.
 * Each section page gets a back/forward pager so visitors can walk the
 * whole story — Home → How → Tone check → Practice → Watch → Library —
 * without hunting for the nav. `/` opens the tour; Library closes it.
 */
export const PAGE_ORDER: { to: string; label: string; blurb: string; dot: string }[] = [
  { to: "/", label: "Home", blurb: "A little about ShiftedTone", dot: "bg-coral" },
  { to: "/how", label: "How it works", blurb: "A few simple steps", dot: "bg-sun" },
  { to: "/tone-check", label: "Tone check", blurb: "Notice how you respond under pressure", dot: "bg-coral" },
  { to: "/drills", label: "Practice", blurb: "Try a few everyday scenarios", dot: "bg-mint" },
  { to: "/watch", label: "Watch", blurb: "Short videos about tone and communication", dot: "bg-coral" },
  { to: "/library", label: "Library", blurb: "Books and research to explore", dot: "bg-paper" },
];

/** Prev/next stops of the tour for a given path (nulls at the ends). */
export function tourStops(
  pathname: string,
): { prev: (typeof PAGE_ORDER)[number] | null; next: (typeof PAGE_ORDER)[number] | null } {
  const i = PAGE_ORDER.findIndex((p) => p.to === pathname);
  return {
    prev: i > 0 ? PAGE_ORDER[i - 1] : null,
    next: i >= 0 && i < PAGE_ORDER.length - 1 ? PAGE_ORDER[i + 1] : null,
  };
}

/**
 * The signed-in app's walking order. Same idea as the public tour: every
 * page ends with back / next so the tools chain into one circuit —
 * dashboard → practice → calm → translate → quiz → reframe → progress →
 * back home. `/practice/:drillId` matches its position by prefix.
 */
export const APP_ORDER: { to: string; label: string; blurb: string }[] = [
  { to: "/dashboard", label: "Today", blurb: "A quick look at your practice" },
  { to: "/gym", label: "Practice", blurb: "Choose a scenario and give it a try" },
  { to: "/calm", label: "Pause", blurb: "Take a moment to settle" },
  { to: "/translate", label: "Try a new tone", blurb: "Try the same words another way" },
  { to: "/quiz", label: "Read a situation", blurb: "Think through what a moment calls for" },
  { to: "/reframe", label: "Try another way", blurb: "Explore a different response" },
  { to: "/progress", label: "Progress", blurb: "Look back on your practice" },
];

/**
 * Route prefixes with a virtual position: `/practice/:drillId` sits
 * between Dashboard (0) and Translate (1), so its back/next resolve
 * without being a stable route in APP_ORDER.
 */
const APP_VIRTUAL: { prefix: string; prev: number; next: number }[] = [
  { prefix: "/practice/", prev: 0, next: 1 },
];

/**
 * Prev/next stops of the app circuit for a given path. The circuit
 * wraps — the last page's "next" is the dashboard — so every signed-in
 * page shows both buttons and the loop never dead-ends.
 */
export function appTourStops(
  pathname: string,
): { prev: (typeof APP_ORDER)[number] | null; next: (typeof APP_ORDER)[number] | null } {
  const len = APP_ORDER.length;
  const i = APP_ORDER.findIndex((p) => p.to === pathname);
  if (i < 0) {
    const match = APP_VIRTUAL.find((m) => pathname.startsWith(m.prefix));
    if (match) return { prev: APP_ORDER[match.prev], next: APP_ORDER[match.next] };
    return { prev: null, next: null };
  }
  return {
    prev: APP_ORDER[(i - 1 + len) % len],
    next: APP_ORDER[(i + 1) % len],
  };
}
