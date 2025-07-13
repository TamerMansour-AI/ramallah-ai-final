-- Run once in Supabase SQL editor
create table if not exists public.comments (
  id uuid primary key default extensions.uuid_generate_v4(),
  submission_id uuid references public.submissions(id) on delete cascade,
  name text not null,
  body text not null,
  created_at timestamptz default now()
);
