-- Categories: org-scoped chore categories
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
