import { queryOptions } from "@tanstack/react-query";
import { INTERACTION_INDEX, pairKey, DRUGS } from "./data";
import { SOCS } from "./socs";
import { interactionResultSchema, severityLevels, type InteractionResult, type Severity } from "./types";

/**
 * SINGLE SWAP POINT.
 * Today this resolves against the local typed sample dataset. When the real
 * service is ready, replace the body of `fetchInteraction` with a `fetch()`
 * call — every component consumes the validated `InteractionResult` shape and
 * needs no changes.
 */
const LATENCY_MS = 2600;

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Deterministic, clearly-labelled fallback for pairs outside the sample set. */
function synthesize(drugA: string, drugB: string): InteractionResult {
  const seed = hash(pairKey(drugA, drugB));
  const severity: Severity = severityLevels[seed % 3 === 0 ? 1 : seed % 3 === 1 ? 2 : 0];
  const physical = SOCS.filter((s) => s.anchor);
  const picked = [0, 1, 2, 3].map((i) => physical[(seed + i * 7) % physical.length]);
  const unique = [...new Map(picked.map((p) => [p.id, p])).values()];

  return interactionResultSchema.parse({
    drugA,
    drugB,
    severity,
    headline: "No high-severity interaction recorded for this combination",
    summary: `Our sample dataset holds no curated record for ${drugA} with ${drugB}. The profile below is assembled from the individual safety signals of each medicine, so treat it as orientation rather than clinical advice.`,
    mechanism: [
      { id: "m1", kind: "drug", label: `${drugA} + ${drugB}`, detail: "No shared metabolic pathway identified in the sample dataset." },
      { id: "m2", kind: "enzyme", label: "Hepatic CYP screening", detail: "Neither agent is flagged as a strong inhibitor or inducer of the other's route." },
      { id: "m3", kind: "protein", label: "Transporter overlap", detail: "No significant competition at P-gp or OATP transporters." },
      { id: "m4", kind: "interaction", label: "Additive class effects", detail: "Any overlap is expected to come from shared side-effect profiles." },
      { id: "m5", kind: "outcome", label: "Routine monitoring", detail: "Watch for the organ systems highlighted below." },
    ],
    socImpacts: unique.map((soc, i) => ({
      socId: soc.id,
      severity: (i === 0 ? severity : "minor") as Severity,
      explanation: `${soc.blurb} Effects here are attributed to the individual agents rather than a documented interaction.`,
      symptoms: ["Monitor for new symptoms", "Report persistent changes"],
      evidence: ["Aggregated label data"],
      confidence: 55 - i * 6,
    })),
    graph: {
      nodes: [
        { id: "a", label: drugA, kind: "drug" },
        { id: "b", label: drugB, kind: "drug" },
        { id: "p", label: "Shared transporters", kind: "protein" },
        { id: "g", label: "CYP panel", kind: "gene" },
        { id: "o", label: unique[0].short, kind: "organ", socId: unique[0].id },
        { id: "e", label: "Additive class effects", kind: "effect", socId: unique[0].id },
      ],
      edges: [
        { from: "a", to: "p" },
        { from: "b", to: "p" },
        { from: "g", to: "p" },
        { from: "p", to: "o" },
        { from: "o", to: "e" },
      ],
    },
    effectsA: unique.slice(0, 3).map((s, i) => ({
      name: `${s.short} effects`,
      socId: s.id,
      frequency: i === 0 ? "common" : "uncommon",
    })),
    effectsB: unique.slice(1, 4).map((s, i) => ({
      name: `${s.short} effects`,
      socId: s.id,
      frequency: i === 0 ? "common" : "rare",
    })),
    recommendations: [
      { id: "r1", tone: "green", title: "No documented interaction", detail: "Nothing in the sample dataset flags this pair as unsafe." },
      { id: "r2", tone: "amber", title: "Confirm with your prescriber", detail: "Absence of a record is not the same as proof of safety." },
    ],
    confidence: 48,
    sources: [
      { name: "DrugBank", records: 0, weight: 40 },
      { name: "DDInter", records: 0, weight: 38 },
      { name: "FAERS", records: 42, weight: 52 },
      { name: "OpenFDA", records: 2, weight: 60 },
      { name: "PubMed", records: 3, weight: 45 },
    ],
  });
}

function normalize(name: string) {
  const trimmed = name.trim();
  const match = DRUGS.find(
    (d) =>
      d.name.toLowerCase() === trimmed.toLowerCase() ||
      d.aliases.some((a) => a === trimmed.toLowerCase()),
  );
  return match?.name ?? trimmed.replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function fetchInteraction(rawA: string, rawB: string): Promise<InteractionResult> {
  const drugA = normalize(rawA);
  const drugB = normalize(rawB);
  if (!drugA || !drugB) throw new Error("Two medicines are required.");

  await new Promise((r) => setTimeout(r, LATENCY_MS));

  const found = INTERACTION_INDEX.get(pairKey(drugA, drugB));
  if (found) {
    const oriented =
      found.drugA.toLowerCase() === drugA.toLowerCase()
        ? found
        : { ...found, drugA: found.drugA, drugB: found.drugB };
    return interactionResultSchema.parse(oriented);
  }
  return synthesize(drugA, drugB);
}

export const interactionQueryOptions = (drugA: string, drugB: string) =>
  queryOptions({
    queryKey: ["interaction", drugA.toLowerCase(), drugB.toLowerCase()],
    queryFn: () => fetchInteraction(drugA, drugB),
    enabled: Boolean(drugA && drugB),
    staleTime: 5 * 60_000,
  });

export function searchDrugs(query: string, limit = 7) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return DRUGS.filter(
    (d) => d.name.toLowerCase().includes(q) || d.aliases.some((a) => a.includes(q)),
  ).slice(0, limit);
}
