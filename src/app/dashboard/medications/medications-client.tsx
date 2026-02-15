"use client";

import { Pill, AlertTriangle, Info, ShieldCheck } from "lucide-react";

interface HealthHistory {
  medications: string[];
  allergies: string[];
  current_conditions: string[];
}

interface FamilyMember {
  condition_list: string[];
}

// Future: AI integration for real drug interaction analysis
// Future: Integration with drug databases (RxNorm, OpenFDA)

const MEDICATION_INFO: Record<
  string,
  { category: string; warnings: string[]; interactions: string[] }
> = {
  metformin: {
    category: "Antidiabetic",
    warnings: [
      "May cause vitamin B12 deficiency with long-term use",
      "Monitor kidney function regularly",
    ],
    interactions: ["Alcohol may increase risk of lactic acidosis"],
  },
  lisinopril: {
    category: "ACE Inhibitor (Blood Pressure)",
    warnings: [
      "May cause persistent dry cough",
      "Monitor potassium levels",
    ],
    interactions: ["NSAIDs may reduce effectiveness", "Potassium supplements may cause hyperkalemia"],
  },
  atorvastatin: {
    category: "Statin (Cholesterol)",
    warnings: [
      "Report unexplained muscle pain immediately",
      "Regular liver function tests recommended",
    ],
    interactions: ["Grapefruit juice may increase side effects"],
  },
  omeprazole: {
    category: "Proton Pump Inhibitor",
    warnings: [
      "Long-term use may affect calcium absorption",
      "May mask symptoms of stomach cancer",
    ],
    interactions: ["May reduce effectiveness of clopidogrel"],
  },
  sertraline: {
    category: "SSRI (Antidepressant)",
    warnings: [
      "May take 4-6 weeks for full effect",
      "Do not stop abruptly",
    ],
    interactions: ["Avoid MAOIs", "NSAIDs may increase bleeding risk"],
  },
};

export default function MedicationsClient({
  healthHistory,
  familyMembers,
}: {
  healthHistory: HealthHistory | null;
  familyMembers: FamilyMember[];
}) {
  const medications = healthHistory?.medications || [];
  const allergies = healthHistory?.allergies || [];
  const allFamilyConditions = familyMembers.flatMap(
    (m) => m.condition_list || []
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Medication Insights
        </h1>
        <p className="text-muted-foreground">
          Understanding your medications and potential interactions
        </p>
      </div>

      {/* Allergies Alert */}
      {allergies.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div>
            <h3 className="font-semibold text-red-700">Known Allergies</h3>
            <p className="text-sm text-red-600">
              {allergies.join(", ")}
            </p>
            <p className="mt-1 text-xs text-red-500">
              Always inform your healthcare providers about these allergies
              before receiving any new medications.
            </p>
          </div>
        </div>
      )}

      {/* Current Medications */}
      {medications.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Your Medications</h2>
          {medications.map((med) => {
            const key = med.toLowerCase().trim();
            const info = MEDICATION_INFO[key];

            return (
              <div key={med} className="rounded-xl border bg-card p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Pill className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold capitalize">{med}</h3>
                    {info ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          {info.category}
                        </p>
                        <div className="mt-4 space-y-3">
                          {info.warnings.length > 0 && (
                            <div>
                              <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-orange-600">
                                <AlertTriangle className="h-3 w-3" />
                                Warnings
                              </div>
                              <ul className="space-y-1">
                                {info.warnings.map((w) => (
                                  <li
                                    key={w}
                                    className="text-sm text-muted-foreground"
                                  >
                                    {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {info.interactions.length > 0 && (
                            <div>
                              <div className="mb-1 flex items-center gap-1 text-xs font-semibold text-blue-600">
                                <Info className="h-3 w-3" />
                                Interactions
                              </div>
                              <ul className="space-y-1">
                                {info.interactions.map((i) => (
                                  <li
                                    key={i}
                                    className="text-sm text-muted-foreground"
                                  >
                                    {i}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <p className="mt-1 text-sm text-muted-foreground">
                        Detailed information for this medication is not yet in
                        our database. Please consult your pharmacist or doctor
                        for interactions and warnings.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-8 text-center">
          <ShieldCheck className="mx-auto mb-3 h-12 w-12 text-primary/30" />
          <h3 className="text-lg font-medium">No Medications Recorded</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You haven&apos;t added any medications yet. Update your health
            profile in Settings to track medications.
          </p>
        </div>
      )}

      {/* Family Context */}
      {allFamilyConditions.length > 0 && (
        <div className="rounded-xl border bg-muted/50 p-5">
          <h3 className="mb-2 font-semibold">
            Family Health Context for Medications
          </h3>
          <p className="text-sm text-muted-foreground">
            Based on your family history of{" "}
            <strong>{[...new Set(allFamilyConditions)].join(", ")}</strong>,
            always inform your doctor about these hereditary conditions when
            receiving new prescriptions, as they may affect medication choices.
          </p>
        </div>
      )}

      <div className="rounded-xl border bg-muted/50 p-4 text-xs text-muted-foreground">
        <p>
          <strong>Disclaimer:</strong> This information is for educational
          purposes only. It is not a substitute for professional medical or
          pharmaceutical advice. Always consult your doctor or pharmacist
          regarding medication interactions and side effects.
        </p>
      </div>
    </div>
  );
}
