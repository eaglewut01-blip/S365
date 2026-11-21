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
