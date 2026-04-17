---
name: GeniTree project state
description: Current build state, decisions made, and what's been changed from the original prototype
type: project
---

GeniTree is a hereditary health family tree app. V0 prototype being built for a client demo.

**Core insight:** "A health history that builds itself from documents you already have." Highest-intent moment = 10 min after a medical consultation when user has a document in hand.

## Tech stack
- Next.js 15, TypeScript, Tailwind, shadcn/ui
- Supabase (auth + database)
- Anthropic SDK (Claude sonnet-4-6)
- Deployed on Vercel

## Changes made from original prototype

### Chat API (`src/app/api/chat/route.ts`)
- **Was:** Gemini API via raw fetch, no user context
- **Now:** Anthropic SDK (Claude sonnet-4-6), fetches user profile + family members + health history from Supabase server-side, builds a personalised system prompt per user

### Sidebar / navigation (`src/app/dashboard/layout.tsx`)
- **Was:** Me, My Children, Ask a question, Family Tree, Results, Settings
- **Now:** Family Tree, Add Data, Recommendations, Chat, Settings
- Removed: Children, Medications, Ask pages (deleted from filesystem)

## What's been built (V0 status)
- [x] Onboarding (3-step: about you, family history, personal health) — untouched, works
- [x] Family Tree (visual, add/edit/remove members) — untouched, works
- [x] Chat — rebuilt with Claude + family context system prompt
- [ ] Add Data page — to build (file upload → Claude vision → save to Supabase)
- [ ] Recommendations — to rebuild with Claude (currently hardcoded if/else rules)
- [ ] Sidebar redirect: /dashboard → /dashboard/family-tree (default landing)

## PRD location
`/PRD.md` in project root

## V1 backlog
- data@genitree.com email ingestion
- Family member data sharing with consent
- Audio transcription from consultations
- NHS/EHR integration
- Mobile app
