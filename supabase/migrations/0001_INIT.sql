-- pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- single-user profile mirroring auth.users
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at   timestamptz default now()
);

alter table profiles enable row level security;
create policy "self-read"   on profiles for select using (auth.uid() = id);
create policy "self-update" on profiles for update using (auth.uid() = id);