-- Comments table
create table if not exists public.comments (
  id bigserial primary key,
  submission_id bigint references public.submissions(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text not null,
  body text not null,
  created_at timestamptz default now()
);
