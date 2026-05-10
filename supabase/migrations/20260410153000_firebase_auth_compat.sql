begin;

create extension if not exists pgcrypto;

-- Users table: Firebase-backed profile row stored in public.users.
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text,
  email text,
  name text,
  phone text,
  title text,
  linkedin text,
  location text,
  job_type text,
  experience_level text,
  target_roles text[] default '{}'::text[],
  target_companies text[] default '{}'::text[],
  plan text default 'free',
  stripe_customer_id text,
  subscription_id text,
  email_digest text default 'daily',
  follow_up_days int default 7,
  interview_prep_days int default 2,
  created_at timestamptz default now()
);

alter table if exists public.users drop constraint if exists users_id_fkey;
alter table if exists public.users add column if not exists firebase_uid text;
alter table if exists public.users add column if not exists phone text;
alter table if exists public.users add column if not exists title text;
alter table if exists public.users add column if not exists linkedin text;
alter table if exists public.users add column if not exists location text;
alter table if exists public.users add column if not exists job_type text;
alter table if exists public.users add column if not exists experience_level text;
alter table if exists public.users add column if not exists target_roles text[] default '{}'::text[];
alter table if exists public.users add column if not exists target_companies text[] default '{}'::text[];
alter table if exists public.users add column if not exists plan text default 'free';
alter table if exists public.users add column if not exists stripe_customer_id text;
alter table if exists public.users add column if not exists subscription_id text;
alter table if exists public.users add column if not exists email_digest text default 'daily';
alter table if exists public.users add column if not exists follow_up_days int default 7;
alter table if exists public.users add column if not exists interview_prep_days int default 2;
alter table if exists public.users add column if not exists created_at timestamptz default now();
alter table if exists public.users alter column id set default gen_random_uuid();
alter table if exists public.users alter column created_at set default now();

create unique index if not exists users_firebase_uid_key
  on public.users (firebase_uid);

-- Applications table now references public.users.id instead of auth.users.id.
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  company_name text not null,
  role_title text not null,
  job_url text,
  job_description text,
  location text,
  salary_min int,
  salary_max int,
  status text default 'applied',
  applied_date date default current_date,
  next_action text,
  next_action_date date,
  notes text,
  contacts jsonb default '[]'::jsonb,
  interview_rounds jsonb default '[]'::jsonb,
  excitement_level int default 3,
  source text default 'other',
  created_at timestamptz default now()
);

alter table if exists public.applications drop constraint if exists applications_user_id_fkey;
alter table if exists public.applications add constraint applications_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;
alter table if exists public.applications alter column id set default gen_random_uuid();
alter table if exists public.applications alter column applied_date set default current_date;
alter table if exists public.applications alter column contacts set default '[]'::jsonb;
alter table if exists public.applications alter column interview_rounds set default '[]'::jsonb;
alter table if exists public.applications alter column excitement_level set default 3;
alter table if exists public.applications alter column source set default 'other';
alter table if exists public.applications alter column created_at set default now();

-- Reminders table.
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  title text not null,
  description text,
  due_date timestamptz not null,
  is_done boolean default false,
  reminder_type text default 'follow_up',
  created_at timestamptz default now()
);

alter table if exists public.reminders drop constraint if exists reminders_user_id_fkey;
alter table if exists public.reminders drop constraint if exists reminders_application_id_fkey;
alter table if exists public.reminders add constraint reminders_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;
alter table if exists public.reminders add constraint reminders_application_id_fkey
  foreign key (application_id) references public.applications(id) on delete cascade;
alter table if exists public.reminders alter column id set default gen_random_uuid();
alter table if exists public.reminders alter column is_done set default false;
alter table if exists public.reminders alter column reminder_type set default 'follow_up';
alter table if exists public.reminders alter column created_at set default now();

-- Activity log table.
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  event_type text,
  event_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table if exists public.activity_log drop constraint if exists activity_log_user_id_fkey;
alter table if exists public.activity_log drop constraint if exists activity_log_application_id_fkey;
alter table if exists public.activity_log add constraint activity_log_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;
alter table if exists public.activity_log add constraint activity_log_application_id_fkey
  foreign key (application_id) references public.applications(id) on delete cascade;
alter table if exists public.activity_log alter column id set default gen_random_uuid();
alter table if exists public.activity_log alter column event_data set default '{}'::jsonb;
alter table if exists public.activity_log alter column created_at set default now();

-- AI coach sessions.
create table if not exists public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  company text not null,
  role text not null,
  session_type text not null,
  messages jsonb default '[]'::jsonb,
  question_count int default 0,
  avg_score numeric,
  created_at timestamptz default now()
);

alter table if exists public.coach_sessions drop constraint if exists coach_sessions_user_id_fkey;
alter table if exists public.coach_sessions drop constraint if exists coach_sessions_application_id_fkey;
alter table if exists public.coach_sessions add constraint coach_sessions_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;
alter table if exists public.coach_sessions add constraint coach_sessions_application_id_fkey
  foreign key (application_id) references public.applications(id) on delete set null;
alter table if exists public.coach_sessions alter column id set default gen_random_uuid();
alter table if exists public.coach_sessions alter column messages set default '[]'::jsonb;
alter table if exists public.coach_sessions alter column question_count set default 0;
alter table if exists public.coach_sessions alter column created_at set default now();

-- Resume analysis history.
create table if not exists public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  resume_text text not null,
  job_description text not null,
  analysis jsonb not null,
  score int not null,
  created_at timestamptz default now()
);

alter table if exists public.resume_analyses drop constraint if exists resume_analyses_user_id_fkey;
alter table if exists public.resume_analyses drop constraint if exists resume_analyses_application_id_fkey;
alter table if exists public.resume_analyses add constraint resume_analyses_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;
alter table if exists public.resume_analyses add constraint resume_analyses_application_id_fkey
  foreign key (application_id) references public.applications(id) on delete set null;
alter table if exists public.resume_analyses alter column id set default gen_random_uuid();
alter table if exists public.resume_analyses alter column created_at set default now();

-- Firebase app uses server-side Supabase access, so we keep RLS off.
alter table if exists public.users disable row level security;
alter table if exists public.applications disable row level security;
alter table if exists public.reminders disable row level security;
alter table if exists public.activity_log disable row level security;
alter table if exists public.coach_sessions disable row level security;
alter table if exists public.resume_analyses disable row level security;

-- Allow the dashboard activity feed to read recent items directly.
grant select on public.activity_log to anon, authenticated;

commit;
