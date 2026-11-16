create extension if not exists pgcrypto;

create table if not exists public.branches (
  id text primary key,
  display_order int not null unique,
  created_at timestamptz not null default now()
);

insert into public.branches(id,display_order) values
('HN2.VQ1',1),('HN4.ML',2),('HN10.VINS',3),('HN3.VQ2',4),
('HN12.MĐ',5),('HN13.LB',6),('HN1.LG',7),('HN9.LĐ',8),
('HN6.CG',9),('HN8.NGĐ',10),('HN7.TIMES',11),('HN5.HAPU',12)
on conflict(id) do nothing;

-- PINs are stored as bcrypt hashes. Never put plaintext PINs in frontend code.
create table if not exists public.branch_credentials (
  branch_id text primary key references public.branches(id) on delete cascade,
  pin_hash text not null
);
create table if not exists public.admin_credentials (
  id int primary key default 1 check(id=1),
  pin_hash text not null
);
create table if not exists public.sessions (
  token_hash text primary key,
  role text not null check(role in ('admin','branch')),
  branch_id text references public.branches(id),
  expires_at timestamptz not null
);
create table if not exists public.monthly_kpis (
  month_key text not null,
  branch_id text not null references public.branches(id),
  target numeric(14,2) not null default 0 check(target>=0),
  revenue numeric(14,2) not null default 0 check(revenue>=0),
  updated_at timestamptz not null default now(),
  primary key(month_key,branch_id)
);

alter table public.branches enable row level security;
alter table public.branch_credentials enable row level security;
alter table public.admin_credentials enable row level security;
alter table public.sessions enable row level security;
alter table public.monthly_kpis enable row level security;
-- Intentionally no anon/authenticated policies. All reads/writes go through Edge Functions.
