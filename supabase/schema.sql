-- ============================================================================
-- S365 Fitness — database schema + row level security
-- Run this once against a fresh Supabase project (SQL Editor → New query).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Helper: current user's role / profile lookups (used inside RLS policies)
-- ----------------------------------------------------------------------------
create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role in ('owner', 'staff') from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.current_branch()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select branch_id from public.profiles where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- branches
-- ----------------------------------------------------------------------------
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- profiles — one row per authenticated user (owner, staff, trainer, member)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'staff', 'trainer', 'member')),
  full_name text not null,
  phone text,
  branch_id uuid references public.branches (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- members — gym members (may or may not have a login of their own)
-- ----------------------------------------------------------------------------
create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  branch_id uuid not null references public.branches (id) on delete cascade,
  name text not null,
  phone text,
  plan text not null default '8x / month',
  status text not null default 'active' check (status in ('active', 'frozen', 'cancelled')),
  joined_date date not null default current_date,
  last_visit date,
  visit_count integer not null default 0,
  billing_status text not null default 'paid' check (billing_status in ('paid', 'due', 'overdue')),
  next_bill_date date,
  amount numeric(10, 2) not null default 0,
  pt_total integer not null default 0,
  pt_remaining integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists members_branch_idx on public.members (branch_id);

-- ----------------------------------------------------------------------------
-- classes
-- ----------------------------------------------------------------------------
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  name text not null,
  trainer_id uuid references public.profiles (id) on delete set null,
  day_of_week integer not null check (day_of_week between 0 and 6),
  start_time time not null,
  capacity integer not null default 10,
  created_at timestamptz not null default now()
);

create index if not exists classes_branch_idx on public.classes (branch_id);

-- ----------------------------------------------------------------------------
-- class_bookings
-- ----------------------------------------------------------------------------
create table if not exists public.class_bookings (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  status text not null default 'booked' check (status in ('booked', 'waitlist')),
  created_at timestamptz not null default now(),
  unique (class_id, member_id)
);

create index if not exists class_bookings_class_idx on public.class_bookings (class_id);
create index if not exists class_bookings_member_idx on public.class_bookings (member_id);

-- ----------------------------------------------------------------------------
-- checkins
-- ----------------------------------------------------------------------------
create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete cascade,
  checked_in_at timestamptz not null default now()
);

create index if not exists checkins_branch_idx on public.checkins (branch_id, checked_in_at desc);

-- ----------------------------------------------------------------------------
-- payments — a row per "mark as paid" action, powers the revenue report
-- ----------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete cascade,
  amount numeric(10, 2) not null,
  paid_at timestamptz not null default now()
);

create index if not exists payments_branch_idx on public.payments (branch_id, paid_at);

-- ----------------------------------------------------------------------------
-- pt_sessions — trainer logs, member confirms/disputes, hours deduct on approval
-- ----------------------------------------------------------------------------
create table if not exists public.pt_sessions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  branch_id uuid not null references public.branches (id) on delete cascade,
  session_date date not null default current_date,
  session_time time not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'disputed')),
  logged_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists pt_sessions_member_idx on public.pt_sessions (member_id);
create index if not exists pt_sessions_trainer_idx on public.pt_sessions (trainer_id);

-- deduct one PT hour the moment a session flips pending -> approved
create or replace function public.handle_pt_session_approved()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    update public.members
      set pt_remaining = greatest(0, pt_remaining - 1)
      where id = new.member_id;
    new.resolved_at = now();
  elsif new.status = 'disputed' and old.status is distinct from 'disputed' then
    new.resolved_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_pt_session_status_change on public.pt_sessions;
create trigger on_pt_session_status_change
  before update on public.pt_sessions
  for each row
  execute function public.handle_pt_session_approved();

-- ----------------------------------------------------------------------------
-- book_class / cancel_booking — atomic helpers so two people can't both grab
-- the last spot, and cancelling promotes the earliest waitlisted member.
-- Both run SECURITY DEFINER (bypassing RLS internally) but do their own
-- authorization check first: either staff acting within their branch, or a
-- member acting on their own linked member row. This sidesteps the fact
-- that RLS's FOR UPDATE row-locking would otherwise require the caller to
-- hold an UPDATE policy on rows (e.g. another member's waitlist row) that
-- they should never be granted directly.
create or replace function public.book_class(p_class_id uuid, p_member_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity integer;
  v_booked_count integer;
  v_status text;
begin
  if not (
    (public.is_staff() and exists (select 1 from public.classes cl where cl.id = p_class_id and cl.branch_id = public.current_branch()))
    or exists (select 1 from public.members m where m.id = p_member_id and m.profile_id = auth.uid())
  ) then
    raise exception 'ไม่มีสิทธิ์จองคลาสนี้';
  end if;

  select capacity into v_capacity from public.classes where id = p_class_id for update;
  if v_capacity is null then
    raise exception 'ไม่พบคลาสนี้';
  end if;

  select count(*) into v_booked_count
    from public.class_bookings
    where class_id = p_class_id and status = 'booked';

  v_status := case when v_booked_count < v_capacity then 'booked' else 'waitlist' end;

  insert into public.class_bookings (class_id, member_id, status)
  values (p_class_id, p_member_id, v_status)
  on conflict (class_id, member_id) do nothing;

  return v_status;
end;
$$;

create or replace function public.cancel_booking(p_class_id uuid, p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_was_booked boolean;
  v_promote record;
begin
  if not (
    (public.is_staff() and exists (select 1 from public.classes cl where cl.id = p_class_id and cl.branch_id = public.current_branch()))
    or exists (select 1 from public.members m where m.id = p_member_id and m.profile_id = auth.uid())
  ) then
    raise exception 'ไม่มีสิทธิ์ยกเลิกการจองนี้';
  end if;

  select status = 'booked' into v_was_booked
    from public.class_bookings where class_id = p_class_id and member_id = p_member_id;

  delete from public.class_bookings where class_id = p_class_id and member_id = p_member_id;

  if v_was_booked then
    select id, member_id into v_promote
      from public.class_bookings
      where class_id = p_class_id and status = 'waitlist'
      order by created_at asc
      limit 1
      for update skip locked;

    if found then
      update public.class_bookings set status = 'booked' where id = v_promote.id;
    end if;
  end if;
end;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.classes enable row level security;
alter table public.class_bookings enable row level security;
alter table public.checkins enable row level security;
alter table public.pt_sessions enable row level security;
alter table public.payments enable row level security;

-- branches: any signed-in user can read; only owners manage
create policy "branches_select" on public.branches for select
  to authenticated using (true);
create policy "branches_owner_write" on public.branches for all
  to authenticated using (public.current_role() = 'owner') with check (public.current_role() = 'owner');

-- profiles: read-only via RLS for everyone — role/branch_id are security-sensitive
-- (they drive every other policy in this file) so they are never writable from
-- the client. profiles are only ever created by the handle_new_user trigger
-- (security definer, bypasses RLS) and only ever edited via the service-role
-- admin client in lib/actions/accounts.ts. This deliberately means there is no
-- "edit my profile" self-service UPDATE policy — add one later with an explicit
-- column allowlist (name/phone only) if that becomes a requirement, but never
-- widen this to a blanket USING/CHECK on id = auth.uid() since that would let
-- any signed-in user rewrite their own role straight to 'owner'.
create policy "profiles_select_self" on public.profiles for select
  to authenticated using (id = auth.uid());
create policy "profiles_select_staff" on public.profiles for select
  to authenticated using (public.is_staff() and branch_id = public.current_branch());

-- members: staff full access within branch; trainers read members they train;
-- a member can read/update a narrow set of fields on their own linked row
create policy "members_staff_all" on public.members for all
  to authenticated using (public.is_staff() and branch_id = public.current_branch())
  with check (public.is_staff() and branch_id = public.current_branch());

-- Trainers can see the full member roster of their own branch (read-only) —
-- needed so a trainer can pick a member from a list the first time they log
-- a PT session with them, before any pt_sessions/class_bookings row exists.
create policy "members_trainer_select" on public.members for select
  to authenticated using (
    public.current_role() = 'trainer' and branch_id = public.current_branch()
  );

create policy "members_self_select" on public.members for select
  to authenticated using (profile_id = auth.uid());

-- classes: readable by everyone signed in; staff manage; trainers can update their own classes
create policy "classes_select" on public.classes for select
  to authenticated using (true);
create policy "classes_staff_write" on public.classes for all
  to authenticated using (public.is_staff() and branch_id = public.current_branch())
  with check (public.is_staff() and branch_id = public.current_branch());

-- class_bookings: staff manage all in branch; members manage their own booking
create policy "bookings_staff_all" on public.class_bookings for all
  to authenticated using (
    public.is_staff() and exists (
      select 1 from public.classes cl where cl.id = class_bookings.class_id and cl.branch_id = public.current_branch()
    )
  )
  with check (
    public.is_staff() and exists (
      select 1 from public.classes cl where cl.id = class_bookings.class_id and cl.branch_id = public.current_branch()
    )
  );

create policy "bookings_select_trainer" on public.class_bookings for select
  to authenticated using (
    exists (select 1 from public.classes cl where cl.id = class_bookings.class_id and cl.trainer_id = auth.uid())
  );

create policy "bookings_member_select" on public.class_bookings for select
  to authenticated using (
    exists (select 1 from public.members m where m.id = class_bookings.member_id and m.profile_id = auth.uid())
  );

create policy "bookings_member_insert" on public.class_bookings for insert
  to authenticated with check (
    exists (select 1 from public.members m where m.id = class_bookings.member_id and m.profile_id = auth.uid())
  );

create policy "bookings_member_delete" on public.class_bookings for delete
  to authenticated using (
    exists (select 1 from public.members m where m.id = class_bookings.member_id and m.profile_id = auth.uid())
  );

-- checkins: staff insert/read within branch; a member can read their own history
create policy "checkins_staff_all" on public.checkins for all
  to authenticated using (public.is_staff() and branch_id = public.current_branch())
  with check (public.is_staff() and branch_id = public.current_branch());

create policy "checkins_member_select" on public.checkins for select
  to authenticated using (
    exists (select 1 from public.members m where m.id = checkins.member_id and m.profile_id = auth.uid())
  );

-- pt_sessions:
--  - staff: full access within branch (oversight + dispute resolution)
--  - trainer: can INSERT sessions for themselves (always starts "pending"), and read their own
--  - member: can read their own sessions, and UPDATE ONLY the status of their own
--            *pending* sessions to 'approved' or 'disputed' (enforced in check clause)
create policy "pt_staff_all" on public.pt_sessions for all
  to authenticated using (public.is_staff() and branch_id = public.current_branch())
  with check (public.is_staff() and branch_id = public.current_branch());

create policy "pt_trainer_select" on public.pt_sessions for select
  to authenticated using (trainer_id = auth.uid());

create policy "pt_trainer_insert" on public.pt_sessions for insert
  to authenticated with check (
    trainer_id = auth.uid()
    and status = 'pending'
    and public.current_role() = 'trainer'
  );

create policy "pt_member_select" on public.pt_sessions for select
  to authenticated using (
    exists (select 1 from public.members m where m.id = pt_sessions.member_id and m.profile_id = auth.uid())
  );

create policy "pt_member_update" on public.pt_sessions for update
  to authenticated using (
    status = 'pending'
    and exists (select 1 from public.members m where m.id = pt_sessions.member_id and m.profile_id = auth.uid())
  )
  with check (
    status in ('approved', 'disputed')
    and exists (select 1 from public.members m where m.id = pt_sessions.member_id and m.profile_id = auth.uid())
  );

-- payments: staff insert/read within branch; a member can read their own payment history
create policy "payments_staff_all" on public.payments for all
  to authenticated using (public.is_staff() and branch_id = public.current_branch())
  with check (public.is_staff() and branch_id = public.current_branch());

create policy "payments_member_select" on public.payments for select
  to authenticated using (
    exists (select 1 from public.members m where m.id = payments.member_id and m.profile_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Auto-create a profile row whenever a new auth user signs up.
-- Role + full name + branch come from user_metadata, set either by the
-- invite server actions in lib/actions/accounts.ts, or manually the very
-- first time (bootstrapping the first owner account — see README.md).
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, phone, branch_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'member'),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    new.raw_user_meta_data ->> 'phone',
    nullif(new.raw_user_meta_data ->> 'branch_id', '')::uuid
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Seed data (optional) — one branch + an owner account.
-- Create the owner's auth user first via Supabase Studio → Authentication,
-- then run:
--   insert into public.branches (name) values ('สาขาทองหล่อ');
-- and set that user's profiles.branch_id / role afterwards.
-- ============================================================================
