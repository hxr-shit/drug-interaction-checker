import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import { z } from "zod";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Search,
  History,
  Bookmark,
  BookOpen,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { SearchCard } from "@/components/site/search-card";
import { PipelineLoader } from "@/components/checker/pipeline-loader";
import {
  RiskGauge,
  MechanismTimeline,
  OrganCards,
  InteractionGraph,
  SideEffects,
  Recommendations,
  ConfidenceCard,
  Panel,
  SeverityPill,
  SatelliteSocs,
} from "@/components/checker/dashboard-cards";
import { interactionQueryOptions } from "@/lib/interactions/api";
import { getSoc } from "@/lib/interactions/socs";
import type { Severity } from "@/lib/interactions/types";
import { cn } from "@/lib/utils";

const Anatomy3D = lazy(() => import("@/components/checker/anatomy-3d"));

export const Route = createFileRoute("/checker")({
  validateSearch: z.object({
    a: z.string().optional().default(""),
    b: z.string().optional().default(""),
  }),
  head: () => ({
    meta: [
      { title: "Interlace - Drug Interaction Checker" },
      {
        name: "description",
        content:
          "Interactive dashboard showing interaction severity, mechanism, affected organ systems, adverse effects and recommendations for any drug pair.",
      },
      { property: "og:title", content: "Interlace - Drug Interaction Checker" },
      {
        property: "og:description",
        content:
          "Severity gauge, mechanism timeline, 3D organ impact viewer and evidence-weighted confidence for any drug pair.",
      },
    ],
  }),
  component: CheckerPage,
});

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Search, label: "Search" },
  { icon: History, label: "History" },
  { icon: Bookmark, label: "Saved Reports" },
  { icon: BookOpen, label: "Documentation" },
  { icon: Settings, label: "Settings" },
];

function CheckerPage() {
  const { a, b } = Route.useSearch();
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");

  const query = useQuery(interactionQueryOptions(a, b));
  const result = query.data;

  const impacts = useMemo(() => {
    const map: Record<string, Severity> = {};
    result?.socImpacts.forEach((i) => {
      map[i.socId] = i.severity;
    });
    return map;
  }, [result]);

  const filtered = useMemo(() => {
    if (!result) return result;
    if (severityFilter === "all") return result;
    return { ...result, socImpacts: result.socImpacts.filter((i) => i.severity === severityFilter) };
  }, [result, severityFilter]);

  const detail = selected ? result?.socImpacts.find((i) => i.socId === selected) : undefined;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex pt-24">
        <aside
          className={cn(
            "sticky top-24 hidden h-[calc(100vh-7rem)] shrink-0 flex-col gap-1 rounded-r-3xl border-r border-sidebar-border bg-sidebar/60 p-3 backdrop-blur transition-all duration-300 lg:flex",
            collapsed ? "w-16" : "w-56",
          )}
        >
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="mb-2 grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
          {NAV.map((n, i) => (
            <button
              key={n.label}
              type="button"
              className={cn(
                "flex items-center gap-3 rounded-xl px-2.5 py-2 text-sm transition-colors",
                i === 0
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
              )}
            >
              <n.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{n.label}</span>}
            </button>
          ))}
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-16 sm:px-6">
          {!a || !b ? (
            <div className="mx-auto max-w-3xl py-8">
              <h1 className="font-display text-3xl font-semibold">Drug Checker</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick two medicines to generate an organ safety report.
              </p>
              <div className="mt-6">
                <SearchCard compact />
              </div>
            </div>
          ) : query.isPending ? (
            <PipelineLoader />
          ) : query.isError || !result || !filtered ? (
            <div className="py-20 text-center">
              <p className="text-sm text-muted-foreground">
                We couldn't complete this analysis. Please try another pair.
              </p>
              <Link to="/" className="mt-4 inline-block text-sm text-primary underline">
                Back to search
              </Link>
            </div>
          ) : (
            <div className="mx-auto max-w-6xl py-4">
              <motion.header
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between"
              >
                <div className="min-w-0">
                  <h1 className="truncate font-display text-2xl font-semibold sm:text-3xl">
                    {result.drugA} <span className="text-muted-foreground">+</span> {result.drugB}
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{result.summary}</p>
                </div>
                <SeverityPill severity={result.severity} />
              </motion.header>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
                  Filter by severity
                </span>
                {(["all", "minor", "moderate", "major", "contraindicated"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverityFilter(s)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
                      severityFilter === s
                        ? "border-primary/60 bg-primary/12 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <RiskGauge result={result} />
                <MechanismTimeline result={result} />

                <Panel eyebrow="Card 03" title="Organ Impact" className="lg:col-span-2">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-secondary/20">
                      <Suspense
                        fallback={
                          <div className="grid h-[420px] place-items-center text-sm text-muted-foreground">
                            Loading anatomical model…
                          </div>
                        }
                      >
                        <Anatomy3D
                          impacts={impacts}
                          hovered={hovered}
                          onHover={setHovered}
                          onSelect={setSelected}
                        />
                      </Suspense>
                    </div>
                    <div className="min-w-0 rounded-2xl border border-border bg-secondary/20 p-4">
                      {detail ? (
                        <>
                          <p className="text-sm font-medium">{getSoc(detail.socId).name}</p>
                          <div className="mt-2">
                            <SeverityPill severity={detail.severity} />
                          </div>
                          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                            {detail.explanation}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {detail.symptoms.map((s) => (
                              <span
                                key={s}
                                className="rounded-full border border-border px-2 py-0.5 text-[11px]"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                          <p className="mt-3 text-[11px] text-muted-foreground">
                            Confidence {detail.confidence}%
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Click a glowing organ on the model to see its System Organ Class,
                          explanation, severity, symptoms and confidence.
                        </p>
                      )}
                      <SatelliteSocs impacts={impacts} hovered={hovered} onHover={setHovered} />
                    </div>
                  </div>
                </Panel>

                <OrganCards result={filtered} hovered={hovered} onHover={setHovered} />
                <InteractionGraph result={result} hovered={hovered} onHover={setHovered} />
                <SideEffects result={result} hovered={hovered} onHover={setHovered} />
                <Recommendations result={result} />
                <ConfidenceCard result={result} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
