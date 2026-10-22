import { APP_ORDER, PAGE_ORDER, appTourStops } from "@/lib/site-nav";
import { useAuth } from "@/hooks/use-auth";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import logo from "@/assets/logo.svg";
import { MicPicker } from "@/components/MicPicker";
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  ChevronDown,
  Clapperboard,
  Languages,
  LayoutDashboard,
  LogOut,
  Mic,
  MessagesSquare,
  Shuffle,
  TrendingUp,
  Wind,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: "dashboard" | "gym" | "calm" | "translate" | "quiz" | "reframe" | "progress";
  to: string;
  label: string;
  short: string;
  icon: typeof Mic;
  tab?: boolean;
}

const NAV: NavItem[] = [
  { id: "dashboard", to: "/dashboard", label: "Today", short: "Today", icon: LayoutDashboard, tab: true },
  { id: "gym", to: "/gym", label: "Practice", short: "Practice", icon: Mic, tab: true },
  { id: "calm", to: "/calm", label: "Pause", short: "Pause", icon: Wind },
  { id: "translate", to: "/translate", label: "Try a new tone", short: "New tone", icon: Languages, tab: true },
  { id: "quiz", to: "/quiz", label: "Read a situation", short: "Room", icon: MessagesSquare },
  { id: "reframe", to: "/reframe", label: "Try another way", short: "Reframe", icon: Shuffle },
  { id: "progress", to: "/progress", label: "Progress", short: "Progress", icon: TrendingUp, tab: true },
];

export function AppShell({
  active,
  children,
}: {
  active?: NavItem["id"];
  children: ReactNode;
}) {
  const { signOut } = useAuth();
  const { pathname } = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="nb-dots flex min-h-screen flex-col bg-paper">
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" title="Back to the ShiftedTone home page" className="group flex items-center gap-3">
            <img src={logo} alt="ShiftedTone" width={34} height={34} className="nb size-8 bg-ink transition-transform duration-200 group-hover:-rotate-6" />
            <span className="font-display text-lg leading-none">Shifted<span className="text-sun">Tone</span></span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.id;
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "nb nb-press flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors",
                    isActive ? "bg-sun text-white" : "bg-transparent text-paper/75 hover:text-paper",
                  )}
                >
                  <Icon className="size-3.5" />
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <EverythingMenu />
            <button onClick={handleSignOut} className="nb nb-press flex items-center gap-2 bg-coral px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-white">
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

<<<<<<< HEAD
      <main id="app-main" className="flex-1 pb-24 md:pb-0">
=======
      <main
        id="app-main"
        className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0"
      >
>>>>>>> origin/main
        {children}
        <AppPager pathname={pathname} />
      </main>

      {/* Simplified mobile bottom nav: 4 tabs only, no mic button */}
      <nav aria-label="Primary (mobile)" className="fixed inset-x-0 bottom-0 z-40 border-t-2 border-ink bg-paper md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 items-end gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
          {NAV.filter((n) => n.tab).map((item) => (
            <TabItem key={item.id} item={item} active={active} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function AppPager({ pathname }: { pathname: string }) {
  const { prev, next } = appTourStops(pathname);
  if (!prev || !next) return null;

  return (
    <nav
      aria-label="Practice pages"
      className="mx-auto flex max-w-4xl items-stretch justify-between gap-3 px-4 pb-8 pt-2"
    >
      <Link to={prev.to} className="group min-w-0 flex-1">
<<<<<<< HEAD
        <div className="nb nb-press flex h-full items-center gap-2 bg-card p-3 sm:gap-3 sm:p-4">
          <span className="min-w-0">
            <span className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground sm:text-[10px]">
              Previous — {prev.blurb}
            </span>
            <span className="block truncate font-display text-base leading-tight sm:text-lg">
              {prev.label}
            </span>
          </span>
        </div>
      </Link>
      <Link to={next.to} className="group min-w-0 flex-1">
        <div className="nb nb-press flex h-full items-center justify-end gap-2 bg-sun p-3 text-right sm:gap-3 sm:p-4">
          <span className="min-w-0">
            <span className="block text-[9px] font-bold uppercase tracking-widest text-ink/70 sm:text-[10px]">
              Next — {next.blurb}
            </span>
            <span className="block truncate font-display text-base leading-tight sm:text-lg">
              {next.label}
            </span>
          </span>
        </div>
=======
        <span className="nb nb-press flex h-full items-center gap-2 bg-card p-3 sm:gap-3 sm:p-4">
          <ArrowLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-1" />
          <span className="min-w-0">
            <span className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground sm:text-[10px]">
              Back
            </span>
            <span className="block truncate font-display text-sm leading-tight sm:text-lg">
              {prev.label}
            </span>
          </span>
        </span>
      </Link>
      <Link to={next.to} className="group min-w-0 flex-1">
        <span className="nb nb-press flex h-full items-center justify-end gap-2 bg-sun p-3 text-right sm:gap-3 sm:p-4">
          <span className="min-w-0">
            <span className="block text-[9px] font-bold uppercase tracking-widest text-ink/70 sm:text-[10px]">
              Next
            </span>
            <span className="block truncate font-display text-sm leading-tight sm:text-lg">
              {next.label}
            </span>
          </span>
          <ArrowRight className="size-4 shrink-0 transition-transform group-hover:translate-x-1" />
        </span>
>>>>>>> origin/main
      </Link>
    </nav>
  );
}

function EverythingMenu() {
  const { pathname } = useLocation();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="nb nb-press flex items-center gap-1.5 bg-paper px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-ink" aria-label="Pages and sound settings">
          Pages<span className="hidden sm:inline"> &amp; sound</span> <ChevronDown className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={8} className="w-80 max-w-[calc(100vw-2rem)] rounded-none border-2 border-ink bg-card p-0 nb-shadow-sm">
        <div className="grid grid-cols-2">
          <div>
            <h2 className="border-b-2 border-ink px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-ink/60">Your practice</h2>
            <div className="flex flex-col p-1">
              {APP_ORDER.map((item) => {
                const Icon = NAV.find((n) => n.to === item.to)?.icon;
                const isCurrent = pathname === item.to;
                return (
                  <Link key={item.to} to={item.to} aria-current={isCurrent ? "page" : undefined} className={cn("flex cursor-pointer items-center justify-start gap-2 rounded-none px-3 py-1.5 text-xs font-bold uppercase tracking-wide hover:bg-sun hover:text-white", isCurrent ? "bg-sun text-white" : "text-ink")}>
                    {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}{item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div>
            <h2 className="border-b-2 border-l-2 border-ink px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-ink/60">Learn</h2>
            <div className="flex flex-col p-1">
              {PAGE_ORDER.map((item) => (
                <Link to={item.to} key={item.to} className="flex cursor-pointer items-center justify-start gap-2 rounded-none px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink hover:bg-sun hover:text-white">
                  {item.to === "/watch" && <Clapperboard className="size-3.5" aria-hidden />}{item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <section aria-labelledby="sound-settings-heading" className="border-t-2 border-ink p-3">
          <h2 id="sound-settings-heading" className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-ink/60">
            <AudioLines className="size-3.5" /> Sound settings
          </h2>
          <MicPicker activeLabel="" alwaysShow className="flex-col items-start" />
        </section>
      </PopoverContent>
    </Popover>
  );
}

function TabItem({ item, active }: { item: NavItem; active?: NavItem["id"] }) {
  const Icon = item.icon;
  const isActive = active === item.id;
  return (
    <Link to={item.to} aria-current={isActive ? "page" : undefined} className={cn("flex flex-col items-center justify-center gap-0.5 py-1.5 text-[9px] font-bold uppercase tracking-widest", isActive ? "text-sun" : "text-muted-foreground")}>
      <Icon className={cn("size-5", isActive && "text-sun")} />
      {item.short}
    </Link>
  );
}

export function LevelRing({ level, pct }: { level: number; pct: number }) {
  const R = 15.5;
  const C = 2 * Math.PI * R;
  return (
    <span className="relative inline-flex size-9 items-center justify-center">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r={R} fill="none" strokeWidth="3" className="stroke-paper/20" />
        <circle cx="18" cy="18" r={R} fill="none" strokeWidth="3" strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} strokeLinecap="butt" className="stroke-sun" />
      </svg>
      <span className="font-display text-[11px] font-bold tabular-nums">{level}</span>
    </span>
  );
}
