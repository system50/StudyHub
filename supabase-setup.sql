-- StudyHub online database setup
-- Run this entire script in Supabase Dashboard > SQL Editor > New query.

create table if not exists public.study_resources (
    user_id uuid not null references auth.users(id) on delete cascade,
    id bigint not null,
    name text not null,
    subject text not null,
    type text not null,
    link text not null,
    description text not null,
    favorite boolean not null default false,
    updated_at timestamptz not null default now(),
    primary key (user_id, id)
);

alter table public.study_resources enable row level security;

drop policy if exists "Users can view their own study resources" on public.study_resources;
create policy "Users can view their own study resources"
on public.study_resources for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own study resources" on public.study_resources;
create policy "Users can insert their own study resources"
on public.study_resources for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own study resources" on public.study_resources;
create policy "Users can update their own study resources"
on public.study_resources for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own study resources" on public.study_resources;
create policy "Users can delete their own study resources"
on public.study_resources for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.study_resources to authenticated;
