export interface Profile {
  age: number | null;
  sex: string | null;
}

export interface FamilyMember {
  condition_list: string[];
}

export interface ConditionDetail {
  id?: string;
  label: string;
  category?: string;
  subtype?: string;
  age_at_diagnosis?: number;
  notes?: string;
}

export interface HealthHistory {
  current_conditions: string[];
  condition_details?: ConditionDetail[] | null;
}

export interface Recommendation {
  test: string;
  reason: string;
  frequency: string;
  priority: "high" | "medium" | "routine";
}

function normalizeConditionsForRecs(health: HealthHistory | null): string[] {
  if (!health) return [];
  const fromDetails = (health.condition_details || [])
    .map((d) => d.category || d.label)
    .filter(Boolean);
  if (fromDetails.length > 0) return fromDetails;
  return health.current_conditions || [];
}

export function getRecommendations(
  profile: Profile | null,
  familyMembers: FamilyMember[],
  healthHistory: HealthHistory | null
): Recommendation[] {
  const myConditions = normalizeConditionsForRecs(healthHistory);
  const allConditions = [
    ...familyMembers.flatMap((m) => m.condition_list || []),
    ...myConditions,
  ];
  const age = profile?.age || 30;
  const sex = profile?.sex;

  const recs: Recommendation[] = [
    {
      test: "Complete Blood Count (CBC)",
      reason: "Baseline health screening for all adults",
      frequency: "Annually",
      priority: "routine",
    },
    {
      test: "Basic Metabolic Panel",
      reason: "Monitors kidney function, blood sugar, and electrolytes",
      frequency: "Annually",
      priority: "routine",
    },
    {
      test: "Lipid Panel",
      reason: "Screens for cholesterol and triglyceride levels",
      frequency: age >= 40 ? "Annually" : "Every 4-6 years",
      priority: allConditions.some((c) => c === "Heart Disease" || c === "Hypertension") ? "high" : "routine",
    },
  ];

  if (allConditions.includes("Diabetes")) {
    recs.push(
      { test: "HbA1c Test", reason: "Family history of diabetes", frequency: "Every 6 months", priority: "high" },
      { test: "Fasting Glucose", reason: "Monitor blood sugar", frequency: "Annually", priority: "high" }
    );
  }

  if (allConditions.some((c) => c === "Heart Disease" || c === "Hypertension")) {
    recs.push(
      { test: "Blood Pressure Monitoring", reason: "Cardiac conditions in family", frequency: "Every 3-6 months", priority: "high" },
      { test: "Electrocardiogram (ECG)", reason: "Baseline cardiac screening", frequency: "Annually", priority: "medium" }
    );
  }

  if (allConditions.includes("Cancer")) {
    recs.push({ test: "Cancer Marker Screening", reason: "Family history of cancer", frequency: "Discuss with doctor", priority: "high" });
  }

  if (sex === "female") {
    recs.push({
      test: "Mammogram",
      reason: age >= 40 ? "Recommended for women 40+" : "Baseline if family history",
      frequency: age >= 40 ? "Annually" : "As recommended",
      priority: allConditions.includes("Cancer") ? "high" : "medium",
    });
    recs.push({ test: "Pap Smear", reason: "Cervical cancer screening", frequency: "Every 3 years", priority: "routine" });
  }

  if (age >= 45) {
    recs.push({
      test: "Colonoscopy",
      reason: "Recommended from age 45",
      frequency: "Every 10 years",
      priority: allConditions.includes("Cancer") ? "high" : "medium",
    });
  }

  if (allConditions.includes("Mental Health")) {
    recs.push({ test: "Mental Health Screening", reason: "Family history", frequency: "Annually", priority: "medium" });
  }

  if (age >= 50) {
    recs.push({ test: "Bone Density Scan (DEXA)", reason: "Adults 50+", frequency: "Every 2 years", priority: "routine" });
  }

  return recs;
}
