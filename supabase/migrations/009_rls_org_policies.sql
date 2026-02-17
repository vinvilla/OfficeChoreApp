-- Organization RLS policies
create policy "Users can read their own org"
  on organizations for select
  using (id = current_user_org_id());

create policy "Admins can update their org"
  on organizations for update
  using (id = current_user_org_id() and current_user_role() = 'admin');
