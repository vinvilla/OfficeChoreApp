-- Chore templates: org-scoped recurring chore definitions
create table if not exists chore_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text default '',
  category_id uuid references categories(id) on delete set null,
  assignee_id uuid references team_members(id) on delete set null,
  recurrence_rule jsonb not null default '{"type": "once"}',
  auto_rotate boolean not null default false,
  rotation_pool uuid[] default '{}',
  rotation_index int not null default 0,
  duration_minutes int default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table chore_templates enable row level security;

create policy "Users can read chore templates in their org"
  on chore_templates for select using (organization_id = current_user_org_id());

create policy "Admins and editors can insert chore templates"
  on chore_templates for insert
  with check (organization_id = current_user_org_id() and current_user_role() in ('admin', 'editor'));

create policy "Admins and editors can update chore templates"
  on chore_templates for update
  using (organization_id = current_user_org_id() and current_user_role() in ('admin', 'editor'));

create policy "Admins and editors can delete chore templates"
  on chore_templates for delete
  using (organization_id = current_user_org_id() and current_user_role() in ('admin', 'editor'));

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger chore_templates_updated_at
  before update on chore_templates
  for each row execute function update_updated_at();
