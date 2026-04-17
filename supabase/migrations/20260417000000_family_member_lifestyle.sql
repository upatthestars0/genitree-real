alter table public.family_members
  add column if not exists smoking text,
  add column if not exists alcohol text,
  add column if not exists notes text;
