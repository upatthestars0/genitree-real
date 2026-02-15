export interface Profile {
  name: string;
  age: number | null;
  sex: string | null;
  lifestyle?: string | null;
}

export interface FamilyMember {
  relation: string;
  condition_list: string[];
  is_alive?: boolean;
  cause_of_death?: string | null;
  age?: number | null;
  age_at_death?: number | null;
}

export interface HealthHistory {
  current_conditions: string[];
  medications: string[];
  allergies: string[];
}

export function generateMockResponse(
  message: string,
  profile: Profile | null,
  familyMembers: FamilyMember[],
  healthHistory: HealthHistory | null
): string {
  const msg = message.toLowerCase();
  const allFamilyConditions = familyMembers.flatMap(
    (m) => m.condition_list || []
  );
  const userConditions = healthHistory?.current_conditions || [];
  const medications = healthHistory?.medications || [];
  const age = profile?.age;

  if (msg.includes("cholesterol") || msg.includes("heart")) {
    const hasCardiacFamily = allFamilyConditions.some(
      (c) => c === "Heart Disease" || c === "Hypertension"
    );
    if (hasCardiacFamily) {
      return `Based on your family history, I can see cardiac conditions in your family. ${
        age && age < 30
          ? "Given your age, early screening is a great preventive step."
          : "I'd recommend regular lipid panel tests."
      } Consider discussing a comprehensive cardiovascular screening with your doctor, including a lipid panel, blood pressure monitoring, and possibly an ECG.`;
    }
    return "While I don't see significant cardiac history in your family records, it's always wise to monitor cholesterol levels regularly. A standard lipid panel every 4-6 years is recommended for most adults.";
  }

  if (msg.includes("test") || msg.includes("screening")) {
    const recs = ["Complete blood count (CBC)", "Basic metabolic panel"];
    if (age && age >= 40) recs.push("Colonoscopy screening");
    if (age && age >= 50) recs.push("Bone density scan");
    if (allFamilyConditions.includes("Diabetes"))
      recs.push("HbA1c (diabetes screening)");
    if (allFamilyConditions.includes("Cancer"))
      recs.push("Cancer marker screening");
    if (profile?.sex === "female") recs.push("Mammogram", "Pap smear");

    return `Based on your profile${
      age ? ` (age ${age})` : ""
    } and family history, here are recommended tests:\n\n${recs
      .map((r) => `- ${r}`)
      .join("\n")}\n\nSpeak with your healthcare provider about the right schedule for these screenings.`;
  }

  if (msg.includes("medication") || msg.includes("safe") || msg.includes("drug")) {
    if (medications.length > 0) {
      return `You're currently taking: ${medications.join(
        ", "
      )}. ${
        healthHistory?.allergies && healthHistory.allergies.length > 0
          ? `Given your allergies to ${healthHistory.allergies.join(
              ", "
            )}, always inform your doctor before starting any new medication.`
          : "Always consult your doctor before making any changes to your medication regimen."
      }`;
    }
    return "I don't have any medications on record for you. If you'd like to track your medications, you can update your health profile in Settings.";
  }

  if (msg.includes("treatment")) {
    return `Based on your family history${
      allFamilyConditions.length ? ` (${[...new Set(allFamilyConditions)].slice(0, 5).join(", ")})` : ""
    }, any treatment decision should be made with your doctor. Share your family history with them so they can tailor options. I can help you prepare: note any symptoms, current medications, and what you've already tried.`;
  }

  if (msg.includes("symptom")) {
    return `Symptoms can have many causes. Given your family history${
      allFamilyConditions.length ? ` (${[...new Set(allFamilyConditions)].join(", ")})` : ""
    }, it's worth mentioning these patterns to your doctor. Track when the symptom started, how often it happens, and what makes it better or worse. I recommend discussing with a healthcare provider for a proper assessment.`;
  }

  if (msg.includes("diabetes") || msg.includes("blood sugar")) {
    const hasDiabetesFamily = allFamilyConditions.includes("Diabetes");
    return hasDiabetesFamily
      ? "I see diabetes in your family history. This means you may have a higher genetic predisposition. Key preventive steps include: maintaining a healthy weight, regular exercise (150+ min/week), limiting processed sugars, and getting annual HbA1c tests."
      : "Based on your records, there's no significant family history of diabetes. However, maintaining a balanced diet and regular exercise is always beneficial.";
  }

  if (msg.includes("cancer")) {
    const hasCancerFamily = allFamilyConditions.includes("Cancer");
    return hasCancerFamily
      ? "Your family history includes cancer. I recommend discussing enhanced screening protocols with your doctor. Depending on the type of cancer in your family, genetic counseling may also be valuable."
      : "I don't see cancer in your family history, but regular age-appropriate screenings are still important for everyone.";
  }

  if (msg.includes("mental") || msg.includes("anxiety") || msg.includes("depression")) {
    const hasMentalFamily = allFamilyConditions.includes("Mental Health");
    return hasMentalFamily
      ? "Mental health conditions appear in your family history. It's great that you're being proactive. Consider maintaining regular check-ins with a mental health professional, staying physically active, and practicing stress management techniques."
      : "While your family history doesn't show mental health conditions, mental wellness is important for everyone. Don't hesitate to seek support if you're feeling overwhelmed.";
  }

  const conditionSummary =
    allFamilyConditions.length > 0
      ? `Based on your family history (including ${[
          ...new Set(allFamilyConditions),
        ].join(", ")})`
      : "Based on your profile";

  return `${conditionSummary}, I'd be happy to help with more specific questions. Try asking about:\n\n- "What tests should I get at my age?"\n- "Should I be worried about heart disease?"\n- "Is my medication safe?"\n- "What about diabetes risk?"\n\nI can provide more tailored insights based on your family and personal health data.`;
}
