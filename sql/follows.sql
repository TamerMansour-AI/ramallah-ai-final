create table if not exists follows (
  follower_id uuid references auth.users(id) on delete cascade,
  creator_slug text,
  created_at timestamptz default now(),
  primary key (follower_id, creator_slug)
);
