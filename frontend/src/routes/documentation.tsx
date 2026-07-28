import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/navbar";

export const Route = createFileRoute("/documentation")({
  head: () => ({
    meta: [
      { title: "Documentation — Interlace Drug Interaction Checker" },
      { name: "description", content: "How Interlace grades severity, maps MedDRA System Organ Classes and weights evidence sources." },
      { property: "og:title", content: "Documentation — Interlace Drug Interaction Checker" },
      { property: "og:description", content: "Severity scale, the 27 MedDRA SOCs, and how confidence scores are calculated." },
    ],
  }),
  component: () => (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-[min(760px,92vw)] pt-32 pb-20">
        <h1 className="font-display text-4xl font-semibold">Documentation</h1>
        <p className="mt-4 text-muted-foreground">
          Interlace grades every drug pair on a five-point scale — Safe, Minor, Moderate, Major and
          Contraindicated — then attributes each signal to one of the 27 MedDRA System Organ
          Classes. Confidence is a weighted blend of curated interaction databases, regulatory
          labels and post-marketing report volume.
        </p>
        <h2 className="mt-10 font-display text-2xl font-semibold">Reading a report</h2>
        <p className="mt-3 text-muted-foreground">
          The severity gauge summarises the pair. The mechanism timeline traces the pathway from
          drug to outcome. The anatomical viewer glows at every affected organ system, and the
          confidence card shows exactly which sources contributed.
        </p>
        <h2 className="mt-10 font-display text-2xl font-semibold">Limitations</h2>
        <p className="mt-3 text-muted-foreground">
          This build runs on a curated sample dataset for demonstration. It is educational and is
          not a substitute for professional medical advice.
        </p>
      </main>
    </div>
  ),
});
