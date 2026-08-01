import { queryOptions } from "@tanstack/react-query";
import { interactionResultSchema, severityLevels, type InteractionResult, type Severity } from "./types";

/**
 * SINGLE SWAP POINT.
 * Today this resolves against the local typed sample dataset. When the real
 * service is ready, replace the body of `fetchInteraction` with a `fetch()`
 * call — every component consumes the validated `InteractionResult` shape and
 * needs no changes.
 */

export async function fetchInteraction(
  rawA: string,
  rawB: string
): Promise<InteractionResult> {
  const response = await fetch("/checker", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      drug_a: rawA.trim(),
      drug_b: rawB.trim(),
      explain: "template",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Backend request failed.");
  }

  const data = await response.json();

  const severityMap: Record<string, Severity> = {
    high: "major",
    moderate: "moderate",
    low: "minor",
    none: "safe",
    safe: "safe",
    minor: "minor",
    major: "major",
    contraindicated: "contraindicated",
  };

  return interactionResultSchema.parse({
    drugA: rawA,
    drugB: rawB,

    severity: severityMap[data.severity] ?? "safe",

    headline: data.found
      ? `${rawA} and ${rawB} interaction detected`
      : `No significant interaction found`,

    summary: data.explanation,

    mechanism: data.mechanism
      ? [
          {
            id: "m1",
            label: "Interaction Mechanism",
            kind: "interaction",
            detail: data.mechanism,
          },
        ]
      : [
          {
            id: "phase2",
            label: "Mechanism",
            kind: "interaction",
            detail: "Not available right now. Phase 2 underway.",
          },
        ],

    socImpacts:
      data.shared_organ_details?.length > 0
        ? data.shared_organ_details.map((organ: any) => ({
            socId: organ.organ,
            severity: severityMap[data.severity] ?? "safe",
            explanation: organ.plain_name,
            symptoms: [],
            evidence: ["Database"],
            confidence: 0,
          }))
        : [
            {
              socId: "phase2",
              severity: "safe",
              explanation: "System Organ Class analysis is under development.",
              symptoms: [],
              evidence: ["Phase 2 underway"],
              confidence: 0,
            },
          ],

    graph: {
      nodes: [
        {
          id: "phase2",
          label: "Biological Graph",
          kind: "effect",
        },
      ],
      edges: [],
    },

    effectsA: (data.drug_a_organs || []).map((o: any) => ({
      name: o.organ,
      socId: o.organ,
      frequency: "common",
    })),

    effectsB: (data.drug_b_organs || []).map((o: any) => ({
      name: o.organ,
      socId: o.organ,
      frequency: "common",
    })),

    recommendations: [
      {
        id: "clinical",
        tone:
          severityMap[data.severity] === "major" ||
          severityMap[data.severity] === "contraindicated"
            ? "red"
            : severityMap[data.severity] === "moderate"
            ? "amber"
            : "green",

        title: "Clinical Recommendation",

        detail: data.explanation,
      },

      {
        id: "future",

        tone: "amber",

        title: "Advanced Recommendations",

        detail: "Phase 2 underway.",
      },
    ],

    confidence: data.found ? 75 : 25,

    sources: [
      {
        name: data.explanation_source ?? "Backend",
        records: 1,
        weight: 100,
      },
    ],
  });
}

export const interactionQueryOptions = (drugA: string, drugB: string) =>
  queryOptions({
    queryKey: ["interaction", drugA.toLowerCase(), drugB.toLowerCase()],
    queryFn: () => fetchInteraction(drugA, drugB),
    enabled: Boolean(drugA && drugB),
    staleTime: 5 * 60_000,
  });

export function searchDrugs() {
  return [];
}