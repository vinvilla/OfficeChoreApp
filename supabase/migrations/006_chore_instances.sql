-- Chore instances: individual calendar events
create table if not exists chore_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  template_id uuid references chore_templates(id) on delete cascade,
  title text not null,
  description text default '',
  assignee_id uuid references team_members(id) on delete set null,
  date date not null,
  start_time time,
  end_time time,
  status text not null default 'pending' check (status in ('pending', 'done', 'overdue', 'skipped')),
  completed_at timestamptz,
  is_detached boolean not null default false,
  created_at timestamptz not null default now()
);

alter table chore_instances enable row level security;

create policy "Users can read chore instances in their org"
  on chore_instances for select using (organization_id = current_user_org_id());

create policy "Admins and editors can insert chore instances"
  on chore_instances for insert
  with check (organization_id = current_user_org_id() and current_user_role() in ('admin', 'editor'));

create policy "Admins and editors can update chore instances"
  on chore_instances for update
  using (organization_id = current_user_org_id() and current_user_role() in ('admin', 'editor'));

create policy "Admins and editors can delete chore instances"
  on chore_instances for delete
  using (organization_id = current_user_org_id() and current_user_role() in ('admin', 'editor'));

-- Enable realtime
alter publication supabase_realtime add table chore_instances;
alter publication supabase_realtime add table chore_templates;
alter publication supabase_realtime add table team_members;

-- Index for date range queries
create index idx_chore_instances_date on chore_instances(organization_id, date);
create index idx_chore_instances_template on chore_instances(template_id);
