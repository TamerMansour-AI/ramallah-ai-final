-- Supabase schema for user profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  bio text,
  slug text unique,
  created_at timestamp with time zone default now()
);
