-- Holidays: global table pre-seeded with US federal holidays
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
