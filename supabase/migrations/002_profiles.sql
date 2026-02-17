-- Profiles: extends auth.users with org info and role
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

-- Helper: get the current user's org id
create or replace function current_user_org_id()
returns uuid as $$
  select organization_id from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Helper: get the current user's role
create or replace function current_user_role()
returns text as $$
  select role from profiles where id = auth.uid()
$$ language sql security definer stable;

-- Trigger: auto-create profile on auth.users insert
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

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS policies for profiles
create policy "Users can read own profile"
  on profiles for select using (id = auth.uid());

create policy "Users can update own profile"
  on profiles for update using (id = auth.uid());

create policy "Users can read profiles in same org"
  on profiles for select using (organization_id = current_user_org_id());
