import logo from "@/assets/logo.svg";
import { NBButton } from "@/components/nb";
import { useAuth } from "@/hooks/use-auth";
import { motion, useScroll, useSpring } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router";
import { NAV_ITEMS } from "@/lib/site-nav";

const NAV = NAV_ITEMS;

function navClass(active: boolean) {
  return `relative after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:transition-all ${
    active ? "after:w-full after:bg-coral" : "after:w-0 hover:after:w-full hover:after:bg-coral"
  }`;
}

export function PublicLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Reading-progress bar: a thin coral thread filling as you scroll
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 26,
    mass: 0.4,
  });

  return (
    <div className="nb-dots min-h-screen bg-paper">
      {/* Reading progress */}
      <motion.div
        style={{ scaleX: progress }}
        aria-hidden
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-coral"
      />

      {/* Announcement strip */}
      <div className="border-b-2 border-ink bg-ink py-2 text-paper">
        <p className="text-center text-xs font-bold uppercase tracking-widest">
          A place to pause and try a different response.
        </p>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="group flex items-center gap-3">
            <img
              src={logo}
              alt="ShiftedTone"
              width={40}
              height={40}
              className="nb size-10 bg-ink transition-transform duration-200 group-hover:-rotate-6"
            />
            <span className="font-display text-xl">
              Shifted<span className="text-coral">Tone</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-4 text-[13px] font-bold uppercase tracking-wide lg:gap-6 lg:text-sm xl:gap-7 md:flex">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => navClass(isActive)}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link to={isAuthenticated ? "/dashboard" : "/auth"} className="hidden sm:block">
              <NBButton variant="ink" className="px-4 py-2 text-xs">
                {isAuthenticated ? "Open app" : "Get started"}
              </NBButton>
            </Link>
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMenuOpen((o) => !o)}
              className="nb nb-press flex items-center justify-center bg-card p-2 md:hidden"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="border-t-2 border-ink bg-paper md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between border-b border-ink/10 px-4 py-3 text-sm font-bold uppercase tracking-wide"
                >
                  {item.label}
                  <span className={`size-2 ${item.dot}`} />
                </Link>
              ))}
              <Link
                to={isAuthenticated ? "/dashboard" : "/auth"}
                onClick={() => setMenuOpen(false)}
                className="px-4 py-3"
              >
                <NBButton variant="ink" className="w-full text-xs">
                  {isAuthenticated ? "Open app" : "Get started"}
                </NBButton>
              </Link>
            </div>
          </nav>
        )}
      </header>

      {children}

      {/* Footer */}
      <footer className="bg-paper">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="ShiftedTone"
              width={32}
              height={32}
              className="nb size-8 bg-ink"
            />
            <span className="font-display text-sm">
              Shifted<span className="text-coral">Tone</span>
            </span>
          </div>
          <nav className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="hover:text-ink">
                {item.label}
              </Link>
            ))}
            <Link to="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-ink">
              Terms
            </Link>
          </nav>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            A little practice for conversations that matter.
          </p>
        </div>
      </footer>
    </div>
  );
}
