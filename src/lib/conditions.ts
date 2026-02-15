/**
 * Expanded health conditions with optional inline follow-up questions.
 * Used for "Me", family members, and children (parents log for kids).
 */

export type FollowUpType = "subtype" | "age_at_diagnosis" | "notes";

export interface ConditionOption {
  id: string;
  label: string;
  /** For recommendations we match on this key (e.g. "Cancer", "Diabetes") */
  category?: string;
  followUps?: FollowUpType[];
  /** If set, show this dropdown for "subtype" follow-up */
  subtypes?: string[];
}

/** Flat list of all selectable conditions for chips/picker */
export const ALL_CONDITIONS: ConditionOption[] = [
  // Blood & anaemia
  { id: "anaemia", label: "Anaemia", category: "Anaemia" },
  { id: "anaemia-iron", label: "Anaemia (iron deficiency)", category: "Anaemia" },
  { id: "anaemia-b12", label: "Anaemia (B12 / folate)", category: "Anaemia" },
  { id: "anaemia-haemolytic", label: "Anaemia (haemolytic)", category: "Anaemia" },
  { id: "thalassaemia", label: "Thalassaemia", category: "Anaemia" },
  { id: "sickle-cell", label: "Sickle cell disease", category: "Anaemia" },
  { id: "bleeding-disorder", label: "Bleeding / clotting disorder" },
  // Cancer – with subtype follow-up
  { id: "cancer", label: "Cancer", category: "Cancer", followUps: ["subtype", "age_at_diagnosis"], subtypes: ["Breast", "Lung", "Colorectal", "Prostate", "Melanoma", "Ovarian", "Cervical", "Leukaemia", "Lymphoma", "Other"] },
  { id: "cancer-breast", label: "Breast cancer", category: "Cancer", followUps: ["age_at_diagnosis"] },
  { id: "cancer-lung", label: "Lung cancer", category: "Cancer", followUps: ["age_at_diagnosis"] },
  { id: "cancer-colorectal", label: "Colorectal cancer", category: "Cancer", followUps: ["age_at_diagnosis"] },
  { id: "cancer-prostate", label: "Prostate cancer", category: "Cancer", followUps: ["age_at_diagnosis"] },
  { id: "cancer-ovarian", label: "Ovarian cancer", category: "Cancer", followUps: ["age_at_diagnosis"] },
  { id: "cancer-other", label: "Other cancer", category: "Cancer", followUps: ["age_at_diagnosis", "notes"] },
  // Cardiovascular
  { id: "heart-disease", label: "Heart disease", category: "Heart Disease", followUps: ["notes"] },
  { id: "hypertension", label: "Hypertension", category: "Hypertension" },
  { id: "stroke", label: "Stroke", category: "Stroke", followUps: ["age_at_diagnosis"] },
  { id: "cholesterol", label: "High cholesterol" },
  // Metabolic
  { id: "diabetes", label: "Diabetes", category: "Diabetes", followUps: ["subtype"], subtypes: ["Type 1", "Type 2", "Gestational", "Prediabetes"] },
  { id: "thyroid", label: "Thyroid disorder", followUps: ["subtype"], subtypes: ["Hypothyroidism", "Hyperthyroidism", "Hashimoto's", "Other"] },
  { id: "pcos", label: "PCOS", category: "Autoimmune Disorder" },
  // Autoimmune & inflammatory
  { id: "autoimmune", label: "Autoimmune disease", category: "Autoimmune Disorder", followUps: ["subtype", "notes"], subtypes: ["Rheumatoid arthritis", "Lupus (SLE)", "Multiple sclerosis", "Crohn's / IBD", "Coeliac", "Psoriasis / psoriatic arthritis", "Sjögren's", "Other"] },
  { id: "rheumatoid-arthritis", label: "Rheumatoid arthritis", category: "Autoimmune Disorder" },
  { id: "lupus", label: "Lupus (SLE)", category: "Autoimmune Disorder" },
  { id: "ms", label: "Multiple sclerosis", category: "Autoimmune Disorder" },
  { id: "ibd", label: "Crohn's / IBD", category: "Autoimmune Disorder" },
  { id: "coeliac", label: "Coeliac disease", category: "Autoimmune Disorder" },
  { id: "asthma", label: "Asthma", category: "Asthma" },
  { id: "eczema", label: "Eczema" },
  // Mental health
  { id: "mental-health", label: "Mental health condition", category: "Mental Health", followUps: ["subtype"], subtypes: ["Depression", "Anxiety", "Bipolar", "PTSD", "ADHD", "Other"] },
  { id: "depression", label: "Depression", category: "Mental Health" },
  { id: "anxiety", label: "Anxiety disorder", category: "Mental Health" },
  { id: "bipolar", label: "Bipolar disorder", category: "Mental Health" },
  { id: "adhd", label: "ADHD", category: "Mental Health" },
  // Neurological
  { id: "alzheimers", label: "Alzheimer's / dementia", category: "Alzheimer's", followUps: ["age_at_diagnosis"] },
  { id: "epilepsy", label: "Epilepsy" },
  { id: "migraine", label: "Migraine" },
  // Kidney & liver
  { id: "kidney-disease", label: "Kidney disease", category: "Kidney Disease" },
  { id: "liver-disease", label: "Liver disease" },
  // Gynaecological / reproductive
  { id: "menopause", label: "Menopause", followUps: ["age_at_diagnosis", "notes"] },
  { id: "endometriosis", label: "Endometriosis" },
  { id: "fibroids", label: "Fibroids" },
  { id: "irregular-periods", label: "Irregular or heavy periods" },
  { id: "infertility", label: "Fertility issues / infertility" },
  // Other
  { id: "osteoporosis", label: "Osteoporosis" },
  { id: "arthritis", label: "Arthritis (osteo or other)" },
  { id: "chronic-pain", label: "Chronic pain" },
  { id: "obesity", label: "Obesity / weight-related" },
  { id: "eating-disorder", label: "Eating disorder" },
  { id: "other", label: "Other", followUps: ["notes"] },
];

/** For recommendation matching: map condition id or label to category */
export function getCategoryForCondition(idOrLabel: string): string | undefined {
  const c = ALL_CONDITIONS.find(
    (x) => x.id === idOrLabel || x.label === idOrLabel || x.category === idOrLabel
  );
  return c?.category ?? (ALL_CONDITIONS.some((x) => x.id === idOrLabel || x.label === idOrLabel) ? idOrLabel : undefined);
}

/** Display label for a stored condition (id or full label) */
export function getConditionLabel(idOrLabel: string): string {
  const c = ALL_CONDITIONS.find((x) => x.id === idOrLabel || x.label === idOrLabel);
  return c?.label ?? idOrLabel;
}

export interface ConditionDetail {
  id: string;
  label: string;
  category?: string;
  subtype?: string;
  age_at_diagnosis?: number;
  notes?: string;
}

/** Turn condition_details (from DB) + current_conditions into list for display and for recommendation matching */
export function conditionDetailsToDisplayList(details: ConditionDetail[] | null, fallbackList: string[]): string[] {
  if (details && details.length > 0) {
    return details.map((d) => (d.subtype ? `${d.label} (${d.subtype})` : d.label));
  }
  return fallbackList;
}

/** Categories we use in getRecommendations (existing logic) */
export const RECOMMENDATION_CATEGORIES = [
  "Heart Disease",
  "Hypertension",
  "Diabetes",
  "Cancer",
  "Autoimmune Disorder",
  "Mental Health",
  "Stroke",
  "Alzheimer's",
  "Asthma",
  "Kidney Disease",
  "Anaemia",
] as const;
