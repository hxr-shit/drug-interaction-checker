import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/navbar";

export const Route = createFileRoute("/api")({
  head: () => ({
    meta: [
      { title: "API — Interlace Drug Interaction Checker" },
      { name: "description", content: "The typed interaction contract Interlace consumes, ready to point at your own service." },
      { property: "og:title", content: "API — Interlace Drug Interaction Checker" },
      { property: "og:description", content: "One validated InteractionResult contract powers the entire dashboard." },
    ],
  }),
  component: () => (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-[min(760px,92vw)] pt-32 pb-20">
        <h1 className="font-display text-4xl font-semibold">API</h1>
        <p className="mt-4 text-muted-foreground">
          The whole dashboard reads a single validated shape, <code>InteractionResult</code>.
          Swapping the sample dataset for a live service means replacing the body of one function —
          no component changes.
        </p>
        <pre className="mt-6 overflow-x-auto rounded-2xl border border-border bg-secondary/30 p-4 text-xs">
{`GET /interactions?a=Warfarin&b=Aspirin

{
  "drugA": "Warfarin",
  "drugB": "Aspirin",
  "severity": "major",
  "mechanism": [...],
  "socImpacts": [{ "socId": "blood", "severity": "contraindicated", ... }],
  "graph": { "nodes": [...], "edges": [...] },
  "recommendations": [...],
  "confidence": 94
}`}
        </pre>
      </main>
    </div>
  ),
});
