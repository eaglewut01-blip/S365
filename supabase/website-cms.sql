-- ============================================================================
-- S365 Fitness: owner-editable content for the public website
-- Run this in the Supabase SQL editor AFTER supabase/schema.sql.
-- Safe to run more than once.
--
-- What it adds
--   site_texts   one row per piece of text the owner has changed
--   site_photos  one row per photo the owner has uploaded
--   site-media   public Storage bucket that holds those photos
--
-- The website falls back to the texts and photos built into the code
-- whenever these tables have nothing for a given field or section, so an
-- empty database shows the site exactly as it was designed.
-- ============================================================================

create table if not exists public.site_texts (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create table if not exists public.site_photos (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('hero', 'trainers', 'zones', 'results', 'community')),
  storage_path text not null unique,
  title text,
  alt text,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create index if not exists site_photos_section_order_idx on public.site_photos (section, sort_order);

alter table public.site_texts enable row level security;
alter table public.site_photos enable row level security;

-- Everyone (including visitors who are not signed in) can read website
-- content; only the owner can change it. Hidden photos are visible to the
-- owner only.
drop policy if exists "site_texts_public_read" on public.site_texts;
create policy "site_texts_public_read" on public.site_texts for select
  to anon, authenticated using (true);

drop policy if exists "site_texts_owner_write" on public.site_texts;
create policy "site_texts_owner_write" on public.site_texts for all
  to authenticated using (public.current_role() = 'owner') with check (public.current_role() = 'owner');

drop policy if exists "site_photos_public_read" on public.site_photos;
create policy "site_photos_public_read" on public.site_photos for select
  to anon, authenticated using (is_visible or public.current_role() = 'owner');

drop policy if exists "site_photos_owner_write" on public.site_photos;
create policy "site_photos_owner_write" on public.site_photos for all
  to authenticated using (public.current_role() = 'owner') with check (public.current_role() = 'owner');

-- Reading goes through the anon key, so the API roles need table privileges
-- as well as the policies above.
grant select on public.site_texts, public.site_photos to anon, authenticated;
grant insert, update, delete on public.site_texts, public.site_photos to authenticated;

-- ----------------------------------------------------------------------------
-- Storage: public bucket for website photos (JPEG/PNG/WebP, 5 MB per file).
-- The admin page shrinks photos in the browser before uploading, so real
-- uploads are far below the limit.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site_media_public_read" on storage.objects;
create policy "site_media_public_read" on storage.objects for select
  to anon, authenticated using (bucket_id = 'site-media');

drop policy if exists "site_media_owner_insert" on storage.objects;
create policy "site_media_owner_insert" on storage.objects for insert
  to authenticated with check (bucket_id = 'site-media' and public.current_role() = 'owner');

drop policy if exists "site_media_owner_update" on storage.objects;
create policy "site_media_owner_update" on storage.objects for update
  to authenticated using (bucket_id = 'site-media' and public.current_role() = 'owner')
  with check (bucket_id = 'site-media' and public.current_role() = 'owner');

drop policy if exists "site_media_owner_delete" on storage.objects;
create policy "site_media_owner_delete" on storage.objects for delete
  to authenticated using (bucket_id = 'site-media' and public.current_role() = 'owner');

-- ============================================================================
-- Part 2: clips, machine guides, articles and products
-- One table holds all four lists. `data` carries the fields of each kind
-- (see src/content/collections.ts), so adding a field needs no migration.
-- ============================================================================

create table if not exists public.site_items (
  id uuid primary key default gen_random_uuid(),
  collection text not null check (collection in ('videos', 'machines', 'articles', 'products')),
  slug text,
  data jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create unique index if not exists site_items_slug_idx on public.site_items (collection, slug) where slug is not null;
create index if not exists site_items_order_idx on public.site_items (collection, sort_order);

alter table public.site_items enable row level security;

drop policy if exists "site_items_public_read" on public.site_items;
create policy "site_items_public_read" on public.site_items for select
  to anon, authenticated using (is_visible or public.current_role() = 'owner');

drop policy if exists "site_items_owner_write" on public.site_items;
create policy "site_items_owner_write" on public.site_items for all
  to authenticated using (public.current_role() = 'owner') with check (public.current_role() = 'owner');

grant select on public.site_items to anon, authenticated;
grant insert, update, delete on public.site_items to authenticated;

-- A short line under a photo, e.g. what a trainer specialises in.
alter table public.site_photos add column if not exists caption text;

-- Short video clips go in the same bucket: allow video files up to 50 MB.
update storage.buckets
   set file_size_limit = 52428800,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
 where id = 'site-media';

-- ----------------------------------------------------------------------------
-- "How busy is the gym now?" for the public website.
-- Visitors must not read check-in rows (they identify members), so this
-- function returns counts only. "Now" = check-ins in the last 90 minutes.
-- "Peak" = the busiest 90-minute stretch of the last 28 days, so the level
-- is relative to this gym's own busy times. Hourly averages cover the same
-- weekday over the last 8 weeks, in Bangkok time.
-- ----------------------------------------------------------------------------
create or replace function public.gym_crowd()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with recent as (
    select checked_in_at from public.checkins where checked_in_at > now() - interval '56 days'
  ),
  slots as (
    select date_trunc('hour', checked_in_at) + (floor(extract(minute from checked_in_at) / 30) * interval '30 minutes') as slot,
           count(*) as n
      from recent
     where checked_in_at > now() - interval '28 days'
     group by 1
  ),
  windows as (
    -- three consecutive half-hour slots = one 90-minute window
    select sum(n) over (order by slot range between interval '60 minutes' preceding and current row) as in_window from slots
  ),
  hourly as (
    select extract(hour from checked_in_at at time zone 'Asia/Bangkok')::int as hour,
           count(*)::numeric / greatest(count(distinct (checked_in_at at time zone 'Asia/Bangkok')::date), 1) as avg_checkins
      from recent
     where extract(dow from checked_in_at at time zone 'Asia/Bangkok') = extract(dow from now() at time zone 'Asia/Bangkok')
     group by 1
  )
  select jsonb_build_object(
    'now', (select count(*) from recent where checked_in_at > now() - interval '90 minutes'),
    'peak', coalesce((select max(in_window) from windows), 0),
    'days_of_data', (select count(distinct (checked_in_at at time zone 'Asia/Bangkok')::date) from recent),
    'hourly', coalesce((select jsonb_agg(jsonb_build_object('hour', hour, 'avg', round(avg_checkins, 1)) order by hour) from hourly), '[]'::jsonb)
  );
$$;

revoke all on function public.gym_crowd() from public;
grant execute on function public.gym_crowd() to anon, authenticated;
