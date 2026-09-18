begin;

create table public.licenses (
  product text primary key,
  contracted_seats integer not null check (contracted_seats > 0),
  active_users_30d integer not null check (active_users_30d >= 0),
  active_users_90d integer not null check (active_users_90d >= 0),
  reserved_seats integer not null check (reserved_seats >= 0),
  upcoming_demand integer not null check (upcoming_demand >= 0),
  temporary_inactive_users integer not null check (temporary_inactive_users >= 0),
  department_survey_demand integer not null check (department_survey_demand >= 0),
  annual_unit_cost numeric(12,2) not null check (annual_unit_cost >= 0),
  annual_cost numeric(12,2) not null check (annual_cost >= 0),
  renewal_date date not null,
  contract_minimum_seats integer not null check (contract_minimum_seats > 0),
  recommended_buffer integer not null check (recommended_buffer >= 0),
  contract_change_allowed boolean not null,
  synthetic boolean not null default true check (synthetic),
  check (active_users_30d <= active_users_90d),
  check (contract_minimum_seats <= contracted_seats)
);

alter table public.licenses enable row level security;
revoke all on public.licenses from anon, authenticated;
grant select, insert, update on public.licenses to service_role;
commit;
