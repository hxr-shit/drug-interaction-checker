import { Link } from "@tanstack/react-router";
import { Github, Menu, Moon, Sun, Activity } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/checker", label: "Drug Checker" },
  { to: "/documentation", label: "Documentation" },
  { to: "/about", label: "About" },
  { to: "/api", label: "API" },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle colour theme"
      className={cn(
        "relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-secondary/40 text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:text-primary",
        className,
      )}
    >
      <Sun
        className={cn(
          "absolute h-4 w-4 transition-all duration-500",
          theme === "light" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0",
        )}
      />
      <Moon
        className={cn(
          "absolute h-4 w-4 transition-all duration-500",
          theme === "dark" ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0",
        )}
      />
    </button>
  );
}

export function Logo() {
  return (
    <Link to="/" className="group flex min-w-0 items-center gap-2.5">
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 ring-1 ring-primary/25 transition-transform duration-300 group-hover:scale-105">
        <Activity className="h-4.5 w-4.5 text-primary" />
        <span className="absolute inset-0 rounded-xl bg-primary/20 blur-md transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-display text-[0.95rem] font-semibold tracking-tight">
          Interlace
        </span>
        <span className="block truncate text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
          Organ Safety
        </span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto mt-3 w-[min(1200px,94vw)] rounded-2xl glass px-4 py-2.5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="flex min-w-0 items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 lg:flex">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  activeOptions={{ exact: l.to === "/" }}
                  className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground data-[status=active]:bg-secondary/70 data-[status=active]:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="View source on GitHub"
              className="hidden h-9 w-9 place-items-center rounded-full border border-border bg-secondary/40 text-muted-foreground transition-all duration-300 hover:border-primary/50 hover:text-primary sm:grid"
            >
              <Github className="h-4 w-4" />
            </a>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle navigation"
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-secondary/40 text-muted-foreground lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        {open && (
          <nav className="mt-3 grid gap-1 border-t border-border pt-3 lg:hidden">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground data-[status=active]:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
