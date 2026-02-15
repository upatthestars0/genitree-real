"use client";

import { TestTube, Calendar, AlertTriangle, CheckCircle } from "lucide-react";

interface Profile {
  age: number | null;
  sex: string | null;
}

interface FamilyMember {
  condition_list: string[];
}

interface HealthHistory {
  current_conditions: string[];
}

interface Recommendation {
  test: string;
  reason: string;
  frequency: string;
  priority: "high" | "medium" | "routine";
}

function getRecommendations(
  profile: Profile | null,
  familyMembers: FamilyMember[],
  healthHistory: HealthHistory | null
): Recommendation[] {
  const allConditions = [
    ...familyMembers.flatMap((m) => m.condition_list || []),
    ...(healthHistory?.current_conditions || []),
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
      priority: allConditions.includes("Heart Disease") ? "high" : "routine",
    },
  ];

  if (allConditions.includes("Diabetes")) {
    recs.push({
      test: "HbA1c Test",
      reason: "Family history of diabetes increases your risk",
      frequency: "Every 6 months",
      priority: "high",
    });
    recs.push({
      test: "Fasting Glucose",
      reason: "Monitor blood sugar levels given family history",
      frequency: "Annually",
      priority: "high",
    });
  }

  if (allConditions.includes("Heart Disease") || allConditions.includes("Hypertension")) {
    recs.push({
      test: "Blood Pressure Monitoring",
      reason: "Cardiac conditions in family history",
      frequency: "Every 3-6 months",
      priority: "high",
    });
    recs.push({
      test: "Electrocardiogram (ECG)",
      reason: "Baseline cardiac screening due to family history",
      frequency: "Annually",
      priority: "medium",
    });
  }

  if (allConditions.includes("Cancer")) {
    recs.push({
      test: "Cancer Marker Screening",
      reason: "Family history of cancer warrants early screening",
      frequency: "Discuss with doctor",
      priority: "high",
    });
  }

  if (sex === "female") {
    recs.push({
      test: "Mammogram",
      reason: age >= 40 ? "Recommended for women 40+" : "Baseline if family history of breast cancer",
      frequency: age >= 40 ? "Annually" : "As recommended",
      priority: allConditions.includes("Cancer") ? "high" : "medium",
    });
    recs.push({
      test: "Pap Smear",
      reason: "Cervical cancer screening",
      frequency: "Every 3 years",
      priority: "routine",
    });
  }

  if (age >= 45) {
    recs.push({
      test: "Colonoscopy",
      reason: "Recommended starting at age 45",
      frequency: "Every 10 years",
      priority: allConditions.includes("Cancer") ? "high" : "medium",
    });
  }

  if (allConditions.includes("Mental Health")) {
    recs.push({
      test: "Mental Health Screening",
      reason: "Family history of mental health conditions",
      frequency: "Annually",
      priority: "medium",
    });
  }

  if (age >= 50) {
    recs.push({
      test: "Bone Density Scan (DEXA)",
      reason: "Recommended for adults 50+",
      frequency: "Every 2 years",
      priority: "routine",
    });
  }

  return recs;
}

export default function RecommendationsClient({
  profile,
  familyMembers,
  healthHistory,
}: {
  profile: Profile | null;
  familyMembers: FamilyMember[];
  healthHistory: HealthHistory | null;
}) {
  const recs = getRecommendations(profile, familyMembers, healthHistory);
  const highPriority = recs.filter((r) => r.priority === "high");
  const medPriority = recs.filter((r) => r.priority === "medium");
  const routinePriority = recs.filter((r) => r.priority === "routine");

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Test Recommendations
        </h1>
        <p className="text-muted-foreground">
          Personalized screening recommendations based on your family history
        </p>
      </div>

      {highPriority.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="font-semibold text-red-600">High Priority</h2>
          </div>
          <div className="space-y-3">
            {highPriority.map((rec) => (
              <div
                key={rec.test}
                className="flex items-start gap-4 rounded-xl border border-red-100 bg-red-50/50 p-4"
              >
                <TestTube className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div className="flex-1">
                  <h3 className="font-semibold">{rec.test}</h3>
                  <p className="text-sm text-muted-foreground">{rec.reason}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {rec.frequency}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {medPriority.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <TestTube className="h-4 w-4 text-orange-500" />
            <h2 className="font-semibold text-orange-600">Recommended</h2>
          </div>
          <div className="space-y-3">
            {medPriority.map((rec) => (
              <div
                key={rec.test}
                className="flex items-start gap-4 rounded-xl border bg-card p-4"
              >
                <TestTube className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
                <div className="flex-1">
                  <h3 className="font-semibold">{rec.test}</h3>
                  <p className="text-sm text-muted-foreground">{rec.reason}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {rec.frequency}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <h2 className="font-semibold text-green-700">Routine</h2>
        </div>
        <div className="space-y-3">
          {routinePriority.map((rec) => (
            <div
              key={rec.test}
              className="flex items-start gap-4 rounded-xl border bg-card p-4"
            >
              <TestTube className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div className="flex-1">
                <h3 className="font-semibold">{rec.test}</h3>
                <p className="text-sm text-muted-foreground">{rec.reason}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {rec.frequency}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-muted/50 p-4 text-xs text-muted-foreground">
        <p>
          <strong>Disclaimer:</strong> These recommendations are generated based
          on your family history and general medical guidelines. They are not a
          substitute for professional medical advice. Always consult with your
          healthcare provider for personalized screening schedules.
        </p>
      </div>
    </div>
  );
}
