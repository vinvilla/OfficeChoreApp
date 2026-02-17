-- Team members: org-scoped, optionally linked to a profile
create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  profile_id uuid references profiles(id) on delete set null,
  name text not null,
  color text not null default '#6366f1',
  created_at timestamptz not null default now()
);

alter table team_members enable row level security;

create policy "Users can read team members in their org"
  on team_members for select using (organization_id = current_user_org_id());

create policy "Admins and editors can insert team members"
  on team_members for insert
  with check (organization_id = current_user_org_id() and current_user_role() in ('admin', 'editor'));

create policy "Admins and editors can update team members"
  on team_members for update
  using (organization_id = current_user_org_id() and current_user_role() in ('admin', 'editor'));

create policy "Admins can delete team members"
  on team_members for delete
  using (organization_id = current_user_org_id() and current_user_role() = 'admin');
