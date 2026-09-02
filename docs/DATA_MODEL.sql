-- PostgreSQL starting schema for Northstar.
-- Authentication user records are expected to be owned by the auth provider.

create extension if not exists pgcrypto;

create type task_status as enum ('backlog', 'planned', 'doing', 'done', 'cancelled');
create type plan_status as enum ('draft', 'approved', 'completed', 'superseded');
create type action_status as enum ('proposed', 'confirmed', 'executed', 'rejected', 'failed', 'undone');

create table profiles (
  user_id uuid primary key,
  display_name text,
  timezone text not null,
  currency char(3) not null default 'AUD',
  coaching_tone text not null default 'calm',
  working_hours jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  title text not null,
  description text,
  domain text not null,
  target_date date,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  title text not null,
  notes text,
  status task_status not null default 'backlog',
  importance smallint not null default 3 check (importance between 1 and 5),
  energy_required smallint check (energy_required between 1 and 5),
  estimated_minutes integer check (estimated_minutes > 0),
  actual_minutes integer check (actual_minutes >= 0),
  due_at timestamptz,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  completed_at timestamptz,
  source text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  plan_date date not null,
  status plan_status not null default 'draft',
  rationale text,
  assumptions jsonb not null default '[]'::jsonb,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, plan_date, status)
);

create table plan_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references daily_plans(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  title text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  position integer not null,
  is_top_priority boolean not null default false
);

create table financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  name text not null,
  account_type text not null,
  provider_ref text,
  active boolean not null default true
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  account_id uuid references financial_accounts(id) on delete set null,
  amount numeric(14,2) not null,
  currency char(3) not null,
  category text not null,
  merchant text,
  note text,
  occurred_at timestamptz not null,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  category text not null,
  period_start date not null,
  period_end date not null,
  limit_amount numeric(14,2) not null check (limit_amount >= 0),
  currency char(3) not null,
  unique (user_id, category, period_start, period_end)
);

create table wellbeing_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  measured_at timestamptz not null,
  sleep_minutes integer check (sleep_minutes >= 0),
  sleep_quality smallint check (sleep_quality between 1 and 5),
  energy smallint check (energy between 1 and 5),
  mood smallint check (mood between 1 and 5),
  soreness smallint check (soreness between 1 and 5),
  steps integer check (steps >= 0),
  note text,
  source text not null default 'manual'
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  channel text not null check (channel in ('text', 'voice')),
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create table action_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  conversation_id uuid references conversations(id) on delete set null,
  action_type text not null,
  status action_status not null default 'proposed',
  preview jsonb not null,
  idempotency_key text not null unique,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  executed_at timestamptz
);

create table learned_observations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  statement text not null,
  evidence jsonb not null default '[]'::jsonb,
  confidence numeric(4,3) check (confidence between 0 and 1),
  expires_at timestamptz,
  user_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);

create index tasks_user_status_due_idx on tasks(user_id, status, due_at);
create index transactions_user_occurred_idx on transactions(user_id, occurred_at desc);
create index checkins_user_measured_idx on wellbeing_checkins(user_id, measured_at desc);

