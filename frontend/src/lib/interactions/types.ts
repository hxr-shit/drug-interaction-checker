import { z } from "zod";

/** Severity scale used across the app. */
export const severityLevels = ["safe", "minor", "moderate", "major", "contraindicated"] as const;
export const severitySchema = z.enum(severityLevels);
export type Severity = (typeof severityLevels)[number];

export const socImpactSchema = z.object({
  socId: z.string(),
  severity: severitySchema,
  explanation: z.string(),
  symptoms: z.array(z.string()),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(100),
});
export type SocImpact = z.infer<typeof socImpactSchema>;

export const mechanismStepSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["drug", "enzyme", "protein", "interaction", "outcome"]),
  detail: z.string(),
});
export type MechanismStep = z.infer<typeof mechanismStepSchema>;

export const graphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(["drug", "protein", "gene", "organ", "effect"]),
  socId: z.string().optional(),
});
export const graphEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
});
export type GraphNode = z.infer<typeof graphNodeSchema>;
export type GraphEdge = z.infer<typeof graphEdgeSchema>;

export const adverseEffectSchema = z.object({
  name: z.string(),
  socId: z.string(),
  frequency: z.enum(["common", "uncommon", "rare"]),
});
export type AdverseEffect = z.infer<typeof adverseEffectSchema>;

export const recommendationSchema = z.object({
  id: z.string(),
  tone: z.enum(["green", "amber", "red"]),
  title: z.string(),
  detail: z.string(),
});
export type Recommendation = z.infer<typeof recommendationSchema>;

export const interactionResultSchema = z.object({
  drugA: z.string(),
  drugB: z.string(),
  severity: severitySchema,
  headline: z.string(),
  summary: z.string(),
  mechanism: z.array(mechanismStepSchema),
  socImpacts: z.array(socImpactSchema),
  graph: z.object({ nodes: z.array(graphNodeSchema), edges: z.array(graphEdgeSchema) }),
  effectsA: z.array(adverseEffectSchema),
  effectsB: z.array(adverseEffectSchema),
  recommendations: z.array(recommendationSchema),
  confidence: z.number().min(0).max(100),
  sources: z.array(z.object({ name: z.string(), records: z.number(), weight: z.number() })),
});
export type InteractionResult = z.infer<typeof interactionResultSchema>;

export const severityMeta: Record<
  Severity,
  { label: string; color: string; rank: number; description: string }
> = {
  safe: { label: "Safe", color: "var(--safe)", rank: 0, description: "No clinically meaningful interaction expected." },
  minor: { label: "Minor", color: "var(--minor)", rank: 1, description: "Limited clinical impact; awareness is enough." },
  moderate: { label: "Moderate", color: "var(--moderate)", rank: 2, description: "Monitoring or dose adjustment advised." },
  major: { label: "Major", color: "var(--major)", rank: 3, description: "Serious risk; alternative therapy preferred." },
  contraindicated: {
    label: "Contraindicated",
    color: "var(--critical)",
    rank: 4,
    description: "This combination should not be used together.",
  },
};
