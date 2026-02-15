-- Test/lab results: manual entries and PDF uploads (summary filled by agent later)
create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  family_member_id uuid references public.family_members(id) on delete set null,
  type text not null check (type in ('manual', 'pdf')),
  content text,
  file_path text,
  created_at timestamptz not null default now()
);

alter table public.test_results enable row level security;

create policy "Users can manage own test results"
  on public.test_results for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.test_results is 'Lab/test results: manual notes or PDF uploads; content/summary can be filled by agent API later.';

-- Optional: create a Storage bucket named "results" (public or private with RLS) for PDF uploads.
-- In Supabase Dashboard: Storage → New bucket → name: results. Then add policy to allow authenticated uploads.
