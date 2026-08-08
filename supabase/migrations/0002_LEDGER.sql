create table coders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  team       text,
  contact    text,
  active     boolean not null default true,
  created_at timestamptz default now()
);

create table funds (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table cases (
  id                  uuid primary key default gen_random_uuid(),
  coder_id            uuid not null references coders(id),
  fund_id             uuid not null references funds(id),
  mrn                 text not null,
  episode             text not null,
  admit_date          date not null,
  discharge_date      date not null,
  coding_date         date,
  audit_date          date       default current_date,
  drg_version         text not null,
  drg_pre             text not null,
  drg_post            text,
  drg_change_reason   text,
  -- ordered pre-audit code lists as JSONB: [{code, description}]
  diagnoses_pre       jsonb not null   default '[]',
  procedures_pre      jsonb not null   default '[]',
  -- financial impact, manual entry
  reimbursement_pre   numeric(10,2),
  reimbursement_post  numeric(10,2),
  impact_delta        numeric(10,2)
    generated always as (
      case when reimbursement_pre is not null and reimbursement_post is not null
           then reimbursement_post - reimbursement_pre end
    )
    stored,
  impact_note         text,
  status              text not null    default 'in_review',
  created_at          timestamptz      default now(),
  updated_at          timestamptz      default now()
);
create index cases_coder_idx      on cases(coder_id);
create index cases_audit_date_idx on cases(audit_date);
create index cases_status_idx     on cases(status);

-- per-change rows with inline notes (the model dig-in decision)
create table code_changes (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references cases(id) on delete cascade,
  kind       text not null    -- 'dx' | 'px'
    check (kind in ('dx', 'px')),
  action     text not null    -- 'added' | 'removed'
    check (action in ('added', 'removed')),
  code       text not null,
  note       text,
  created_at timestamptz default now()
);
create index code_changes_case_idx on code_changes(case_id);

-- RLS: lock every table to authenticated requests. Not per-user scoping —
-- the app is single-user — but the anon key is public in the browser bundle,
-- so an unlocked table is world-readable to anyone who scrapes it.
alter table cases        enable row level security;
alter table code_changes enable row level security;
alter table coders       enable row level security;
alter table funds        enable row level security;

create policy "auth-all" on cases        for all using (auth.role() = 'authenticated');
create policy "auth-all" on code_changes for all using (auth.role() = 'authenticated');
create policy "auth-all" on coders       for all using (auth.role() = 'authenticated');
create policy "auth-all" on funds        for all using (auth.role() = 'authenticated');