/**
 * The 27 MedDRA System Organ Classes, each mapped to an anchor on the 3D
 * anatomical model. SOCs without a physical location (`anchor: null`) are
 * rendered as satellite markers orbiting the model.
 */
export type SocAnchor = {
  position: [number, number, number];
  /** Rough radius of the highlight sphere in model units. */
  radius: number;
};

export type Soc = {
  id: string;
  name: string;
  short: string;
  icon: string;
  blurb: string;
  anchor: SocAnchor | null;
};

export const SOCS: Soc[] = [
  {
    id: "blood",
    name: "Blood and lymphatic system disorders",
    short: "Blood & Lymphatic",
    icon: "🩸",
    blurb: "Clotting, platelets, red and white cell lines, lymph nodes.",
    anchor: { position: [-0.28, 0.42, 0.1], radius: 0.16 },
  },
  {
    id: "cardiac",
    name: "Cardiac disorders",
    short: "Cardiac",
    icon: "🫀",
    blurb: "Rhythm, conduction, contractility and heart failure.",
    anchor: { position: [-0.12, 0.55, 0.16], radius: 0.17 },
  },
  {
    id: "congenital",
    name: "Congenital, familial and genetic disorders",
    short: "Congenital & Genetic",
    icon: "🧬",
    blurb: "Inherited traits and developmental conditions.",
    anchor: null,
  },
  {
    id: "ear",
    name: "Ear and labyrinth disorders",
    short: "Ear & Labyrinth",
    icon: "👂",
    blurb: "Hearing, tinnitus and vestibular balance.",
    anchor: { position: [0.24, 1.44, 0], radius: 0.09 },
  },
  {
    id: "endocrine",
    name: "Endocrine disorders",
    short: "Endocrine",
    icon: "🦋",
    blurb: "Thyroid, adrenal and pituitary hormone signalling.",
    anchor: { position: [0, 1.06, 0.12], radius: 0.11 },
  },
  {
    id: "eye",
    name: "Eye disorders",
    short: "Eye",
    icon: "👁️",
    blurb: "Vision, retina, intraocular pressure.",
    anchor: { position: [-0.11, 1.5, 0.19], radius: 0.08 },
  },
  {
    id: "gi",
    name: "Gastrointestinal disorders",
    short: "Gastrointestinal",
    icon: "🫃",
    blurb: "Stomach, intestines, bleeding, nausea and motility.",
    anchor: { position: [0.02, 0.05, 0.14], radius: 0.22 },
  },
  {
    id: "general",
    name: "General disorders and administration site conditions",
    short: "General Conditions",
    icon: "🌡️",
    blurb: "Fatigue, fever, oedema and injection-site reactions.",
    anchor: null,
  },
  {
    id: "hepatobiliary",
    name: "Hepatobiliary disorders",
    short: "Hepatobiliary",
    icon: "🫁",
    blurb: "Liver enzymes, bile flow, hepatocellular injury.",
    anchor: { position: [-0.3, 0.24, 0.14], radius: 0.18 },
  },
  {
    id: "immune",
    name: "Immune system disorders",
    short: "Immune System",
    icon: "🛡️",
    blurb: "Hypersensitivity, anaphylaxis and autoimmunity.",
    anchor: { position: [0.34, 0.3, 0.06], radius: 0.13 },
  },
  {
    id: "infections",
    name: "Infections and infestations",
    short: "Infections",
    icon: "🦠",
    blurb: "Opportunistic and secondary infections.",
    anchor: null,
  },
  {
    id: "injury",
    name: "Injury, poisoning and procedural complications",
    short: "Injury & Poisoning",
    icon: "⚠️",
    blurb: "Overdose, toxicity and procedure-related harm.",
    anchor: null,
  },
  {
    id: "investigations",
    name: "Investigations",
    short: "Investigations",
    icon: "🧪",
    blurb: "Laboratory values, INR, enzyme and imaging changes.",
    anchor: null,
  },
  {
    id: "metabolism",
    name: "Metabolism and nutrition disorders",
    short: "Metabolism & Nutrition",
    icon: "⚗️",
    blurb: "Glucose, electrolytes, lipids and appetite.",
    anchor: { position: [0.3, 0.12, 0.1], radius: 0.13 },
  },
  {
    id: "musculoskeletal",
    name: "Musculoskeletal and connective tissue disorders",
    short: "Musculoskeletal",
    icon: "🦴",
    blurb: "Muscle breakdown, myalgia, joints and connective tissue.",
    anchor: { position: [-0.52, -0.62, 0.05], radius: 0.18 },
  },
  {
    id: "neoplasms",
    name: "Neoplasms benign, malignant and unspecified",
    short: "Neoplasms",
    icon: "🔬",
    blurb: "Benign and malignant growths, including cysts and polyps.",
    anchor: null,
  },
  {
    id: "nervous",
    name: "Nervous system disorders",
    short: "Nervous System",
    icon: "🧠",
    blurb: "CNS depression, seizures, neuropathy, headache.",
    anchor: { position: [0, 1.58, 0], radius: 0.2 },
  },
  {
    id: "pregnancy",
    name: "Pregnancy, puerperium and perinatal conditions",
    short: "Pregnancy & Perinatal",
    icon: "🤰",
    blurb: "Foetal exposure, labour and postpartum outcomes.",
    anchor: { position: [0, -0.16, 0.2], radius: 0.13 },
  },
  {
    id: "product",
    name: "Product issues",
    short: "Product Issues",
    icon: "📦",
    blurb: "Formulation, packaging and quality defects.",
    anchor: null,
  },
  {
    id: "psychiatric",
    name: "Psychiatric disorders",
    short: "Psychiatric",
    icon: "💭",
    blurb: "Mood, sleep, agitation, confusion and dependence.",
    anchor: { position: [0, 1.72, -0.1], radius: 0.15 },
  },
  {
    id: "renal",
    name: "Renal and urinary disorders",
    short: "Renal & Urinary",
    icon: "🫘",
    blurb: "Kidney filtration, creatinine and urinary output.",
    anchor: { position: [0.28, -0.02, -0.14], radius: 0.14 },
  },
  {
    id: "reproductive",
    name: "Reproductive system and breast disorders",
    short: "Reproductive & Breast",
    icon: "🌸",
    blurb: "Fertility, menstrual and breast tissue effects.",
    anchor: { position: [-0.02, -0.36, 0.14], radius: 0.13 },
  },
  {
    id: "respiratory",
    name: "Respiratory, thoracic and mediastinal disorders",
    short: "Respiratory & Thoracic",
    icon: "🫁",
    blurb: "Airways, gas exchange, cough and respiratory depression.",
    anchor: { position: [0.26, 0.62, 0.12], radius: 0.19 },
  },
  {
    id: "skin",
    name: "Skin and subcutaneous tissue disorders",
    short: "Skin & Subcutaneous",
    icon: "🧴",
    blurb: "Rash, bruising, photosensitivity and severe reactions.",
    anchor: { position: [0.56, 0.18, 0.08], radius: 0.16 },
  },
  {
    id: "social",
    name: "Social circumstances",
    short: "Social Circumstances",
    icon: "🏠",
    blurb: "Adherence, lifestyle and caregiving context.",
    anchor: null,
  },
  {
    id: "surgical",
    name: "Surgical and medical procedures",
    short: "Surgical & Procedures",
    icon: "🩺",
    blurb: "Peri-procedural bleeding and anaesthetic interactions.",
    anchor: null,
  },
  {
    id: "vascular",
    name: "Vascular disorders",
    short: "Vascular",
    icon: "🩹",
    blurb: "Blood pressure, haemorrhage, thrombosis and flushing.",
    anchor: { position: [-0.5, 0.02, 0.06], radius: 0.15 },
  },
];

export const socById = new Map(SOCS.map((s) => [s.id, s]));

export function getSoc(name: string): SOC | null {
  const soc = SOCS[name];

  if (!soc) {
    console.warn(`Unknown SOC: ${name}`);
    return null;
  }

  return soc;
}