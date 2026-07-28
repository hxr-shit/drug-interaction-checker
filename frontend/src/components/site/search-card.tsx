import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftRight, Clock, Search, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { POPULAR_DRUGS } from "@/lib/interactions/data";
import { searchDrugs } from "@/lib/interactions/api";
import { cn } from "@/lib/utils";

const RECENTS_KEY = "dic-recent-pairs";

type Recent = { a: string; b: string };

function useRecents() {
  const [recents, setRecents] = useState<Recent[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENTS_KEY);
      if (raw) setRecents(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  const push = (pair: Recent) => {
    setRecents((prev) => {
      const next = [pair, ...prev.filter((p) => !(p.a === pair.a && p.b === pair.b))].slice(0, 5);
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };
  return { recents, push };
}

function DrugInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const suggestions = focused ? searchDrugs(value) : [];
  const show = suggestions.length > 0 && !suggestions.some((s) => s.name === value);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={wrap} className="relative min-w-0 flex-1">
      <label className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-2 rounded-2xl border bg-secondary/40 px-4 py-3 transition-all duration-300",
          focused ? "border-primary/60 shadow-[0_0_0_4px_var(--cyan-soft)]" : "border-border",
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={value}
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (!show) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => (a + 1) % suggestions.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => (a - 1 + suggestions.length) % suggestions.length);
            } else if (e.key === "Enter") {
              e.preventDefault();
              onChange(suggestions[active].name);
              setFocused(false);
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-[0.95rem] outline-none placeholder:text-muted-foreground/70"
        />
      </div>

      <AnimatePresence>
        {show && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl glass-strong p-1.5"
          >
            {suggestions.map((s, i) => (
              <li key={s.name}>
                <button
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    onChange(s.name);
                    setFocused(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                    i === active ? "bg-primary/12 text-foreground" : "text-muted-foreground",
                  )}
                >
                  <span className="truncate text-sm font-medium">{s.name}</span>
                  <span className="shrink-0 text-[0.68rem] text-muted-foreground">{s.className}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SearchCard({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { recents, push } = useRecents();
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [swapping, setSwapping] = useState(false);

  const run = (drugA: string, drugB: string) => {
    if (!drugA.trim() || !drugB.trim()) return;
    push({ a: drugA, b: drugB });
    navigate({ to: "/checker", search: { a: drugA, b: drugB } });
  };

  return (
    <div
      id="search"
      className={cn(
        "relative w-full rounded-3xl glass-strong p-5 sm:p-7",
        !compact && "shadow-[0_40px_120px_-40px_oklch(0.1_0.06_250/0.85)]",
      )}
    >
      <div className="pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-b from-primary/10 to-transparent opacity-60" />
      <div className="relative">
        {!compact && (
          <div className="mb-5 flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Enter two medicines to analyse their combined organ safety profile</span>
          </div>
        )}

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-end">
          <DrugInput label="Drug A" value={a} onChange={setA} placeholder="e.g. Warfarin" />
          <button
            type="button"
            aria-label="Swap drugs"
            onClick={() => {
              setSwapping(true);
              setA(b);
              setB(a);
              setTimeout(() => setSwapping(false), 420);
            }}
            className="mx-auto grid h-11 w-11 shrink-0 place-items-center self-center rounded-full border border-border bg-secondary/50 text-muted-foreground transition-all duration-300 hover:border-primary/60 hover:text-primary sm:mb-1"
          >
            <ArrowLeftRight
              className={cn("h-4 w-4 transition-transform duration-400", swapping && "rotate-180")}
            />
          </button>
          <DrugInput label="Drug B" value={b} onChange={setB} placeholder="e.g. Aspirin" />
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          onClick={() => run(a, b)}
          disabled={!a.trim() || !b.trim()}
          className="group relative mt-5 flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-primary px-6 py-3.5 font-medium text-primary-foreground transition-opacity disabled:opacity-40"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <Search className="h-4 w-4" />
          Analyse Interaction
        </motion.button>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Popular drugs
            </p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_DRUGS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => (a ? setB(d) : setA(d))}
                  className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:text-foreground"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-0">
            <p className="mb-2 flex items-center gap-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              <Clock className="h-3 w-3" /> Recent searches
            </p>
            {recents.length === 0 ? (
              <p className="text-xs text-muted-foreground/70">
                Your last five checks will appear here.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {recents.map((r) => (
                  <button
                    key={`${r.a}-${r.b}`}
                    type="button"
                    onClick={() => run(r.a, r.b)}
                    className="rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs text-foreground/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60"
                  >
                    {r.a} + {r.b}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
