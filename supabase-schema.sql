create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date text,
  category text not null,
  thumbnail text not null,
  images jsonb not null default '[]'::jsonb,
  location text,
  area_label text,
  status text,
  description text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "Public can read projects" on public.projects;
create policy "Public can read projects"
on public.projects for select
using (true);

drop policy if exists "Authenticated admins can insert projects" on public.projects;
create policy "Authenticated admins can insert projects"
on public.projects for insert
to authenticated
with check (true);

drop policy if exists "Authenticated admins can update projects" on public.projects;
create policy "Authenticated admins can update projects"
on public.projects for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated admins can delete projects" on public.projects;
create policy "Authenticated admins can delete projects"
on public.projects for delete
to authenticated
using (true);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

create table if not exists public.site_content (
  key text primary key,
  label text not null,
  value text not null default '',
  input_type text not null default 'textarea',
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
on public.site_content for select
using (true);

drop policy if exists "Authenticated admins can insert site content" on public.site_content;
create policy "Authenticated admins can insert site content"
on public.site_content for insert
to authenticated
with check (true);

drop policy if exists "Authenticated admins can update site content" on public.site_content;
create policy "Authenticated admins can update site content"
on public.site_content for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated admins can delete site content" on public.site_content;
create policy "Authenticated admins can delete site content"
on public.site_content for delete
to authenticated
using (true);

drop trigger if exists set_site_content_updated_at on public.site_content;
create trigger set_site_content_updated_at
before update on public.site_content
for each row
execute function public.set_updated_at();
