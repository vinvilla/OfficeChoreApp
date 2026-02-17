-- ============================================================
-- OFFICE CHORE MANAGER V2 — Combined Migration
-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)
-- ============================================================

-- 001: Organizations
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);
alter table organizations enable row level security;

-- 002: Profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  organization_id uuid references organizations(id) on delete set null,
  role text not null default 'admin' check (role in ('admin', 'editor', 'viewer')),
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table profiles enable row level security;

create or replace function current_user_org_id()
returns uuid as $$
  select organization_id from profiles where id = auth.uid()
$$ language sql security definer stable;

create or replace function current_user_role()
returns text as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create policy "Users can read own profile"
  on profiles for select using (id = auth.uid());

create policy "Users can update own profile"
  on profiles for update using (id = auth.uid());

create policy "Users can read profiles in same org"
  on profiles for select using (organization_id = current_user_org_id());

-- 003: Team Members
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

-- 004: Categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  icon text,
  created_at timestamptz not null default now()
);
alter table categories enable row level security;

create policy "Users can read categories in their org"
  on categories for select using (organization_id = current_user_org_id());

create policy "Admins and editors can manage categories"
  on categories for all
  using (organization_id = current_user_org_id() and current_user_role() in ('admin', 'editor'));

-- 005: Chore Templates
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

-- 006: Chore Instances
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

create index idx_chore_instances_date on chore_instances(organization_id, date);
create index idx_chore_instances_template on chore_instances(template_id);

-- 007: Holidays
create table if not exists holidays (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  country text not null default 'US',
  is_floating boolean not null default false,
  created_at timestamptz not null default now()
);
alter table holidays enable row level security;

create policy "Anyone can read holidays"
  on holidays for select using (true);

create index idx_holidays_date on holidays(date);

-- 008: Audit Log
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

-- 009: Organization RLS policies
create policy "Users can read their own org"
  on organizations for select
  using (id = current_user_org_id());

create policy "Admins can update their org"
  on organizations for update
  using (id = current_user_org_id() and current_user_role() = 'admin');

-- Allow new users to create organizations (before they have an org)
create policy "Authenticated users can create orgs"
  on organizations for insert
  with check (auth.uid() is not null);
