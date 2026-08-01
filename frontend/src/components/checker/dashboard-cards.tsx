import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ShieldCheck, AlertTriangle, OctagonAlert, Database } from "lucide-react";
import { getSoc, SOCS } from "@/lib/interactions/socs";
import { severityMeta, type InteractionResult, type Severity } from "@/lib/interactions/types";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("rounded-3xl glass hover-lift p-5 sm:p-6", className)}
    >
      {eyebrow && (
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
      )}
      <h3 className="mt-1 font-display text-lg font-semibold">{title}</h3>
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

export function SeverityPill({ severity }: { severity: Severity }) {
  const m = severityMeta[severity];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-medium"
      style={{ background: `color-mix(in oklab, ${m.color} 18%, transparent)`, color: m.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  );
}

/* ── Card 1: Overall risk gauge ─────────────────────────────── */
export function RiskGauge({ result }: { result: InteractionResult }) {
  const m = severityMeta[result.severity];
  const pct = (m.rank + 1) / 5;
  const R = 78;
  const circ = Math.PI * R;

  return (
    <Panel eyebrow="Card 01" title="Overall Risk">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full max-w-[240px]">
          <svg viewBox="0 0 200 116" className="w-full">
            <path
              d={`M 22 100 A ${R} ${R} 0 0 1 178 100`}
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <motion.path
              d={`M 22 100 A ${R} ${R} 0 0 1 178 100`}
              fill="none"
              stroke={m.color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ * (1 - pct) }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 text-center">
            <p className="font-display text-2xl font-semibold" style={{ color: m.color }}>
              {m.label}
            </p>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">{m.description}</p>
        <div className="grid w-full grid-cols-5 gap-1">
          {(Object.keys(severityMeta) as Severity[]).map((s) => (
            <div key={s} className="text-center">
              <div
                className="h-1.5 rounded-full transition-opacity"
                style={{
                  background: severityMeta[s].color,
                  opacity: severityMeta[s].rank <= m.rank ? 1 : 0.2,
                }}
              />
              <span className="mt-1 block text-[9px] text-muted-foreground">
                {severityMeta[s].label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-foreground/85">{result.headline}</p>
      </div>
    </Panel>
  );
}

/* ── Card 2: Mechanism timeline ─────────────────────────────── */
export function MechanismTimeline({ result }: { result: InteractionResult }) {
  return (
    <Panel eyebrow="Card 02" title="Mechanism">
      <ol className="relative space-y-1">
        {result.mechanism.map((step, i) => (
          <motion.li
            key={step.id}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="relative pl-8"
          >
            <span className="absolute left-2.5 top-6 h-full w-px bg-gradient-to-b from-primary/50 to-transparent last:hidden" />
            <span className="absolute left-0 top-1.5 grid h-5 w-5 place-items-center rounded-full border border-primary/40 bg-primary/15 text-[10px] font-semibold text-primary">
              {i + 1}
            </span>
            <p className="text-sm font-medium">{step.label}</p>
            <p className="pb-4 text-xs text-muted-foreground">{step.detail}</p>
          </motion.li>
        ))}
      </ol>
    </Panel>
  );
}

/* ── Card 4: Expandable SOC cards ───────────────────────────── */
export function OrganCards({
  result,
  hovered,
  onHover,
}: {
  result: InteractionResult;
  hovered: string | null;
  onHover: (id: string | null) => void;
}) {
  const [open, setOpen] = useState<string | null>(result.socImpacts[0]?.socId ?? null);

  return (
    <Panel eyebrow="Card 04" title="Affected System Organ Classes" className="lg:col-span-2">
      <div className="grid gap-2 sm:grid-cols-2">
        {result.socImpacts.map((impact) => {
          const soc = getSoc(impact.socId);
          if (!soc) return;
          const isOpen = open === impact.socId;
          return (
            <div
              key={impact.socId}
              onMouseEnter={() => onHover(impact.socId)}
              onMouseLeave={() => onHover(null)}
              className={cn(
                "rounded-2xl border bg-secondary/25 p-4 transition-all duration-300",
                hovered === impact.socId
                  ? "border-primary/60 shadow-[0_0_0_3px_var(--cyan-soft)]"
                  : "border-border",
              )}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : impact.socId)}
                className="flex w-full items-start justify-between gap-3 text-left"
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span aria-hidden>{soc.icon}</span>
                    <span className="truncate text-sm font-medium">{soc.short}</span>
                  </span>
                  <span className="mt-1.5 block">
                    <SeverityPill severity={impact.severity} />
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pt-3 text-xs leading-relaxed text-muted-foreground">
                      {impact.explanation}
                    </p>
                    <p className="mt-3 text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                      Symptoms
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {impact.symptoms.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-border px-2 py-0.5 text-[11px] text-foreground/80"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
                      Evidence
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {impact.evidence.map((e) => (
                        <li key={e} className="text-[11px] text-muted-foreground">
                          · {e}
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${impact.confidence}%` }}
                          transition={{ duration: 0.7 }}
                        />
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {impact.confidence}% confidence
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ── Card 5: Interaction graph ──────────────────────────────── */
export function InteractionGraph({
  result,
  hovered,
  onHover,
}: {
  result: InteractionResult;
  hovered: string | null;
  onHover: (id: string | null) => void;
}) {
  const columns = useMemo(() => {
    const order = ["drug", "protein", "gene", "organ", "effect"] as const;
    return order
      .map((kind) => result.graph.nodes.filter((n) => n.kind === kind))
      .filter((c) => c.length > 0);
  }, [result]);

  const W = 760;
  const H = 300;
  const pos = new Map<string, { x: number; y: number }>();
  columns.forEach((col, ci) => {
    col.forEach((n, ri) => {
      pos.set(n.id, {
        x: 60 + (ci * (W - 120)) / Math.max(columns.length - 1, 1),
        y: ((ri + 1) * H) / (col.length + 1),
      });
    });
  });

  return (
    <Panel eyebrow="Card 05" title="Interaction Pathway Graph" className="lg:col-span-2">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[640px]">
          {result.graph.edges.map((e, i) => {
            const a = pos.get(e.from);
            const b = pos.get(e.to);
            if (!a || !b) return null;
            const nodeA = result.graph.nodes.find((n) => n.id === e.from);
            const nodeB = result.graph.nodes.find((n) => n.id === e.to);
            const active =
              hovered && (nodeA?.socId === hovered || nodeB?.socId === hovered);
            const mx = (a.x + b.x) / 2;
            return (
              <path
                key={i}
                d={`M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`}
                fill="none"
                stroke={active ? "var(--primary)" : "var(--border)"}
                strokeWidth={active ? 2 : 1.2}
                strokeDasharray="5 6"
                style={{ animation: "dash-flow 1.6s linear infinite" }}
              />
            );
          })}
          {result.graph.nodes.map((n) => {
            const p = pos.get(n.id)!;
            const active = hovered && n.socId === hovered;
            return (
              <g
                key={n.id}
                transform={`translate(${p.x},${p.y})`}
                onMouseEnter={() => n.socId && onHover(n.socId)}
                onMouseLeave={() => onHover(null)}
                className="cursor-default"
              >
                <circle
                  r={active ? 9 : 6}
                  fill={active ? "var(--primary)" : "var(--card)"}
                  stroke="var(--primary)"
                  strokeWidth="1.5"
                  opacity={active ? 1 : 0.8}
                />
                <text
                  y={-14}
                  textAnchor="middle"
                  fontSize="10.5"
                  fill="var(--foreground)"
                  opacity={0.85}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </Panel>
  );
}

/* ── Card 6: Side-effect comparison ─────────────────────────── */
export function SideEffects({
  result,
  onHover,
  hovered,
}: {
  result: InteractionResult;
  hovered: string | null;
  onHover: (id: string | null) => void;
}) {
  const namesB = new Set(result.effectsB.map((e) => e.name));
  const namesA = new Set(result.effectsA.map((e) => e.name));

  const Column = ({
    title,
    items,
    sharedSet,
  }: {
    title: string;
    items: typeof result.effectsA;
    sharedSet: Set<string>;
  }) => (
    <div className="min-w-0">
      <p className="mb-2 truncate text-sm font-medium">{title}</p>
      <ul className="space-y-1.5">
        {items.map((e) => {
          const shared = sharedSet.has(e.name);
          return (
            <li
              key={e.name}
              onMouseEnter={() => onHover(e.socId)}
              onMouseLeave={() => onHover(null)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs transition-all duration-300",
                shared
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-secondary/25",
                hovered === e.socId && "-translate-y-0.5 border-primary/70",
              )}
            >
              <span className="min-w-0 truncate">{e.name}</span>
              <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                {e.frequency}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <Panel eyebrow="Card 06" title="Side Effects Comparison" className="lg:col-span-2">
      <p className="mb-4 text-xs text-muted-foreground">
        Highlighted rows are shared by both medicines — those are the effects most likely to
        intensify when taken together.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Column title={result.drugA} items={result.effectsA} sharedSet={namesB} />
        <Column title={result.drugB} items={result.effectsB} sharedSet={namesA} />
      </div>
    </Panel>
  );
}

/* ── Card 7: Recommendations ────────────────────────────────── */
const toneStyles = {
  green: { color: "var(--safe)", Icon: ShieldCheck },
  amber: { color: "var(--moderate)", Icon: AlertTriangle },
  red: { color: "var(--critical)", Icon: OctagonAlert },
} as const;

export function Recommendations({ result }: { result: InteractionResult }) {
  return (
    <Panel eyebrow="Card 07" title="Recommendations" className="lg:col-span-2">
      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {result.recommendations.map((r, i) => {
          const { color, Icon } = toneStyles[r.tone];
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border p-4 transition-transform duration-300 hover:-translate-y-1"
              style={{
                borderColor: `color-mix(in oklab, ${color} 35%, transparent)`,
                background: `color-mix(in oklab, ${color} 8%, transparent)`,
              }}
            >
              <Icon className="h-4 w-4" style={{ color }} />
              <p className="mt-2 text-sm font-medium">{r.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
            </motion.div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ── Card 8: Confidence ─────────────────────────────────────── */
export function ConfidenceCard({ result }: { result: InteractionResult }) {
  return (
    <Panel eyebrow="Card 08" title="Confidence & Sources">
      <div className="flex items-center gap-4">
        <div className="relative grid h-20 w-20 shrink-0 place-items-center">
          <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
            <circle cx="40" cy="40" r="34" fill="none" stroke="var(--secondary)" strokeWidth="7" />
            <motion.circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 34}
              initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - result.confidence / 100) }}
              transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span className="font-display text-lg font-semibold">{result.confidence}%</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Weighted agreement across curated interaction databases, regulatory labels and
          post-marketing reports.
        </p>
      </div>
      <ul className="mt-4 space-y-2">
        {result.sources.map((s) => (
          <li key={s.name} className="flex items-center gap-3">
            <Database className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="w-20 shrink-0 text-xs">{s.name}</span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full bg-primary/70"
                initial={{ width: 0 }}
                whileInView={{ width: `${s.weight}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <span className="w-24 shrink-0 text-right text-[11px] text-muted-foreground">
              {s.records.toLocaleString()} records
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/* ── Satellite (non-anatomical) SOC markers ─────────────────── */
export function SatelliteSocs({
  impacts,
  hovered,
  onHover,
}: {
  impacts: Record<string, Severity>;
  hovered: string | null;
  onHover: (id: string | null) => void;
}) {
  const satellites = SOCS.filter((s) => !s.anchor);
  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="mb-2 text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
        Non-anatomical SOCs
      </p>
      <div className="flex flex-wrap gap-1.5">
        {satellites.map((s) => {
          const sev = impacts[s.id];
          return (
            <span
              key={s.id}
              onMouseEnter={() => onHover(s.id)}
              onMouseLeave={() => onHover(null)}
              className={cn(
                "cursor-default rounded-full border px-2.5 py-1 text-[11px] transition-all duration-300",
                sev ? "text-foreground" : "border-border text-muted-foreground/70",
                hovered === s.id && "-translate-y-0.5",
              )}
              style={
                sev
                  ? {
                      borderColor: `color-mix(in oklab, ${severityMeta[sev].color} 45%, transparent)`,
                      background: `color-mix(in oklab, ${severityMeta[sev].color} 12%, transparent)`,
                    }
                  : undefined
              }
            >
              {s.icon} {s.short}
            </span>
          );
        })}
      </div>
    </div>
  );
}
