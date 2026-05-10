begin;

alter table if exists public.users add column if not exists salary_min int;
alter table if exists public.users add column if not exists salary_max int;

commit;
