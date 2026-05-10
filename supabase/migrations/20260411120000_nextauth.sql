begin;

-- Add password_hash to users table for email/password auth
alter table if exists public.users add column if not exists password_hash text;

-- Password reset tokens table
create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);

-- Index for fast token lookups
create index if not exists password_reset_tokens_token_idx
  on public.password_reset_tokens (token);

-- Auto-cleanup: delete used or expired tokens older than 24h
create index if not exists password_reset_tokens_expires_idx
  on public.password_reset_tokens (expires_at);

-- Keep RLS off (server-side only access via service role key)
alter table if exists public.password_reset_tokens disable row level security;

commit;
