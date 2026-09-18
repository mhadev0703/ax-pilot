begin;

create table public.support_tickets (
  ticket_id text primary key check (ticket_id like 'SYN-%'),
  created_at timestamptz not null,
  system text not null check (system in ('VDI', 'Groupware', 'Provisioning', 'Collaboration', 'Device Lifecycle', 'Printing')),
  category text not null check (category in ('Authentication', 'Access', 'Provisioning', 'Application Support', 'Device Support', 'Print Service')),
  department text not null check (department in ('Engineering', 'Manufacturing', 'Quality', 'Finance', 'HR', 'Procurement', 'IT')),
  password_reset_related boolean not null default false,
  is_repeat_contact boolean not null default false,
  ai_assisted boolean not null default false,
  provisioning_delay boolean not null default false,
  synthetic boolean not null default true check (synthetic),
  check (not password_reset_related or (system = 'VDI' and category = 'Authentication')),
  check (not provisioning_delay or (system = 'Provisioning' and category = 'Provisioning'))
);

create index support_tickets_created_at_idx on public.support_tickets (created_at);
create index support_tickets_system_category_idx on public.support_tickets (system, category, created_at);

alter table public.support_tickets enable row level security;
revoke all on public.support_tickets from anon, authenticated;
grant select, insert, update on public.support_tickets to service_role;
commit;
