import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/navbar";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Interlace Drug Interaction & Organ Safety Checker" },
      { name: "description", content: "Why Interlace exists: making drug interaction science readable for patients and clinicians alike." },
      { property: "og:title", content: "About — Interlace" },
      { property: "og:description", content: "Making drug interaction science readable for patients and clinicians alike." },
    ],
  }),
  component: () => (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-[min(760px,92vw)] pt-32 pb-20">
        <h1 className="font-display text-4xl font-semibold">About Interlace</h1>
        <p className="mt-4 text-muted-foreground">
          Interaction warnings are usually written for pharmacists, not people. Interlace takes the
          same underlying evidence — enzyme pathways, transporter competition, post-marketing
          reports — and renders it as something you can actually see: which organ systems are
          affected, how badly, and why.
        </p>
        <p className="mt-4 text-muted-foreground">
          Every result maps onto the 27 MedDRA System Organ Classes, so the anatomical viewer and
          the underlying regulatory vocabulary stay in lockstep.
        </p>
      </main>
    </div>
  ),
});
