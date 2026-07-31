import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Activity, HeartPulse, Workflow, FileText } from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { MolecularField } from "@/components/site/molecular-field";
import { SearchCard } from "@/components/site/search-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Interlace — Understand Drug Interactions Before They Become Problems" },
      {
        name: "description",
        content:
          "Check two medicines for interactions, affected organ systems, mechanisms and adverse effects, explained in language anyone can understand.",
      },
      { property: "og:title", content: "Interlace — Drug Interaction & Organ Safety Checker" },
      {
        property: "og:description",
        content:
          "Interaction detection, organ-specific risk analysis and mechanism explanations across all 27 MedDRA System Organ Classes.",
      },
    ],
  }),
  component: Index,
});

const FEATURES = [
  { icon: Activity, title: "Interaction Detection", text: "Curated pairwise signals with severity grading." },
  { icon: HeartPulse, title: "Organ-specific Risk Analysis", text: "Mapped across all 27 MedDRA SOCs." },
  { icon: Workflow, title: "Mechanism Explanation", text: "Enzyme, protein and pathway level detail." },
  { icon: FileText, title: "Patient-friendly Reports", text: "Plain language, no clinical jargon." },
];

function Index() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />

      <section className="relative overflow-hidden pt-32 pb-16 sm:pt-40">
        <div className="pointer-events-none absolute inset-0 grid-fade opacity-60" />
        <div className="pointer-events-none absolute inset-0">
          <MolecularField />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />

        <div className="relative mx-auto w-[min(1200px,92vw)]">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0"
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs text-primary">
                <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-primary" />
                27 MedDRA System Organ Classes
              </span>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Understand Drug
                <br />
                Interactions Before
                <br />
                <span className="text-gradient">They Become Problems.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Explain interactions, affected organs, adverse effects, and biological mechanisms
                in language anyone can understand.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#search"
                  className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Enter the Drugs
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
                <Link
                  to="/about"
                  className="inline-flex items-center rounded-full border border-border bg-secondary/40 px-6 py-3 text-sm font-medium transition-colors hover:border-primary/50"
                >
                  Learn More
                </Link>
              </div>
            </motion.div>

            <div className="grid gap-2.5">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, x: -14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.08, duration: 0.5 }}
                  className="flex min-w-0 items-start gap-3 rounded-2xl glass hover-lift p-3.5"
                >
                  <f.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-14 animate-float-slow"
          >
            <SearchCard />
          </motion.div>

          <div className="mt-10 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Featured drug pairs</span>
            <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-400">
              In Progress
            </span>
          </div>
        </div>
      </section>

      <footer className="mx-auto w-[min(1200px,92vw)] border-t border-border py-8 text-xs text-muted-foreground">
        Interlace is an educational tool built on curated sample data. It is not medical advice —
        always confirm with a qualified clinician.
      </footer>
    </div>
  );
}
