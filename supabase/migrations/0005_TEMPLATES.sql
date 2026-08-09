create table templates (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  subject    text not null default '',
  body       text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table templates enable row level security;

create policy "auth-all" on templates for all using (auth.role() = 'authenticated');
