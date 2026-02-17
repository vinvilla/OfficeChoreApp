-- Audit log: org-scoped activity history
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb default '{}',
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

create policy "Admins can read audit log"
  on audit_log for select
  using (organization_id = current_user_org_id() and current_user_role() = 'admin');

create policy "System can insert audit log"
  on audit_log for insert
  with check (organization_id = current_user_org_id());

create index idx_audit_log_org_date on audit_log(organization_id, created_at desc);
