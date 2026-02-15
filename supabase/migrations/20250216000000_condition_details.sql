-- Optional: add condition_details for richer follow-up data (Me + family members)
-- Each entry can have subtype, age_at_diagnosis, notes for inline follow-ups.

alter table public.health_history
  add column if not exists condition_details jsonb default '[]'::jsonb;

comment on column public.health_history.condition_details is 'Array of { id, label, subtype?, age_at_diagnosis?, notes? } for conditions with follow-up answers.';

alter table public.family_members
  add column if not exists condition_details jsonb default '[]'::jsonb;

comment on column public.family_members.condition_details is 'Array of { id, label, subtype?, age_at_diagnosis?, notes? } for conditions with follow-up answers.';
