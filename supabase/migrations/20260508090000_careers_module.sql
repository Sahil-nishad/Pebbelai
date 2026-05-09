begin;

create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  file_url text not null,
  parsed_name text,
  extracted_skills jsonb not null default '[]'::jsonb,
  extracted_projects jsonb not null default '[]'::jsonb,
  extracted_education jsonb not null default '[]'::jsonb,
  extracted_experience jsonb not null default '[]'::jsonb,
  raw_text text,
  created_at timestamptz not null default now()
);

create index if not exists resumes_user_id_idx on public.resumes(user_id);

create table if not exists public.recruiters (
  id uuid primary key default gen_random_uuid(),
  recruiter_name text not null,
  company text,
  email text unique,
  linkedin_url text,
  designation text
);

create table if not exists public.recruiter_posts (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid references public.recruiters(id) on delete set null,
  role text,
  location text,
  post_content text not null,
  extracted_skills jsonb not null default '[]'::jsonb,
  extracted_email_candidates jsonb not null default '[]'::jsonb,
  source_url text not null,
  source_platform text,
  created_at timestamptz not null default now()
);

create table if not exists public.gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  refresh_token text not null,
  access_token text,
  token_expiry timestamptz,
  scopes jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists gmail_connections_user_id_uq on public.gmail_connections(user_id);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  recruiter_id uuid references public.recruiters(id) on delete set null,
  recruiter_post_id uuid references public.recruiter_posts(id) on delete set null,
  resume_id uuid references public.resumes(id) on delete set null,
  email_subject text not null,
  email_body text not null,
  match_percentage integer not null default 0,
  missing_skills jsonb not null default '[]'::jsonb,
  match_summary text,
  sent_status text not null default 'draft',
  reply_status text not null default 'pending',
  gmail_message_id text,
  created_at timestamptz not null default now()
);

create index if not exists applications_user_id_idx on public.applications(user_id);

create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  application_id uuid not null references public.applications(id) on delete cascade,
  subject text not null,
  body text not null,
  sent_status text not null default 'pending',
  gmail_message_id text,
  created_at timestamptz not null default now()
);

create index if not exists followups_user_id_idx on public.followups(user_id);
create index if not exists followups_application_id_idx on public.followups(application_id);

commit;
