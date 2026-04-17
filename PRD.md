# GeniTree — Product Requirements Document
## V0 Prototype

---

## Problem

Health records don't track hereditary context. People at risk of genetic disorders don't know which biomarkers to monitor, and clinicians often diagnose without the full picture. Existing health apps ignore family history entirely.

## Core Insight

> "A health history that builds itself from documents you already have."

The highest-intent moment is the 10 minutes after a medical consultation — when someone has a document in hand and wants to understand it in the context of their family. That's the moment GeniTree captures.

## Target Users

- **Primary:** adults 25–45 who have had a health scare in their family, or who are proactively health-conscious
- **Secondary:** parents managing their children's health records

## Non-Goals (V0)

- Clinician-facing features
- Real email ingestion (`data@genitree.com` is a V1 placeholder)
- Family member data sharing / privacy controls
- Audio transcription from consultations
- Mobile app

---

## Screens

### 1. Onboarding *(one-time, first install only)*

- **Step 1 — About You:** name, age, biological sex, height, weight, lifestyle
- **Step 2 — Family History:** immediate family + known conditions (mother, father, siblings pre-filled; add more)
- **Step 3 — Your Health History:** current conditions, medications, allergies, surgeries
- After completion: redirects permanently to Family Tree. Onboarding never shown again.
- **Status:** exists — keep as-is

### 2. Family Tree

- Visual tree layout: grandparents → parents → you → siblings → children
- Each member card shows: name, relation, age, condition tags
- Add / edit / remove members
- "Add family member" button (data sharing tagged *coming soon*)
- **Status:** exists — keep as-is

### 3. Add Data *(merged upload + email forwarding)*

- Upload a medical document (PDF, JPG, PNG)
- Claude reads it and extracts structured data: conditions, test results, dates, medications
- User confirms which family member the document belongs to
- Extracted data is saved to Supabase under that family member
- Small note at the bottom: *"You can also forward medical emails to data@genitree.com — coming soon"*
- **Status:** to build

### 4. Recommendations

- Claude-powered reasoning — no hardcoded rules
- Context: full family history + personal health history + any parsed documents
- Uses evidence-based medical knowledge (guidelines-level, like OpenEvidence)
- Grouped by priority: **High** / **Recommended** / **Routine**
- Each item includes: test name, reason (linked to specific family history), frequency
- **Status:** rebuild with Claude

### 5. Chat

- Ask anything about your health
- Claude has full family + personal context injected into the system prompt
- Feels like "a doctor who already knows your family"
- **Status:** rebuild with Claude

---

## Technical Plan

| Priority | Task | Detail |
|----------|------|--------|
| 1 | Swap chat API to Claude | Replace Gemini with Anthropic SDK, inject family + personal health context into system prompt |
| 2 | Rebuild recommendations with Claude | Claude call with medical reasoning, replace hardcoded if/else rules |
| 3 | Build Add Data page | File upload → Claude vision extraction → confirm member → save to Supabase |
| 4 | Email forwarding note | Static UI note on Add Data page |

## Data Model (existing Supabase tables)

- `users` — profile: age, sex, height, weight, lifestyle, onboarding_completed
- `family_members` — relation, name, age, is_alive, condition_list, condition_details, cause_of_death
- `health_history` — current_conditions, medications, allergies, surgeries
- Results from document parsing: to be added to `family_members.condition_details` or a new `results` table

---

## V0.5 Backlog (post-demo quick wins)
- Conditions split into "current" vs "past" on family member cards
- Free-text box on family member form — Claude parses it and auto-populates conditions (e.g. "had a heart attack at 60, takes metformin" → extracts conditions + medications)

## V1 Backlog

- `data@genitree.com` email ingestion — forward GP results email → auto-parsed
- Family member data sharing with consent flow
- Extended family (grandparents, aunts/uncles) with richer relation types
- Mobile app
- Audio transcription from consultations (post-consultation capture)
- NHS App / EHR integration

---

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Claude over Gemini | Own API access, no third-party dependency, better reasoning for medical context |
| Manual upload over email ingestion | Removes infra complexity for V0; email is V1 |
| Recommendations via Claude not rules | Rules don't scale; Claude reasons from actual medical knowledge |
| Onboarding becomes family tree | Reduces cognitive overhead; app state = family tree |
| No clinician features | 18-month sales cycle minimum; design around what patients already do |

---

*Last updated: 2026-04-17*
