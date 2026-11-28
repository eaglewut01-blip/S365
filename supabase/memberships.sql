-- ============================================================================
-- S365 Fitness: packages, purchases, expiry, promotions, self check-in and
-- trainer day schedules.
--
-- Run once in Supabase → SQL Editor, after schema.sql. Safe to run again:
-- existing data is kept.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- packages: what the gym sells. The owner creates and retires these as
-- promotions change; a retired package (active = false) stays on past sales.
--   membership: months + bonus_months + bonus_days of access
--   pt:         sessions + bonus_sessions hours with a trainer
-- ----------------------------------------------------------------------------
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  kind text not null check (kind in ('membership', 'pt')),
  name text not null,
  price numeric(10, 2) not null default 0 check (price >= 0),
  months integer not null default 0 check (months >= 0),
  bonus_months integer not null default 0 check (bonus_months >= 0),
  bonus_days integer not null default 0 check (bonus_days >= 0),
  sessions integer not null default 0 check (sessions >= 0),
  bonus_sessions integer not null default 0 check (bonus_sessions >= 0),
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists packages_branch_idx on public.packages (branch_id);

-- ----------------------------------------------------------------------------
-- member_purchases: one row each time a member buys a package. The package
-- name and terms are copied in, so later edits to a package never rewrite
-- history.
-- ----------------------------------------------------------------------------
create table if not exists public.member_purchases (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  package_id uuid references public.packages (id) on delete set null,
  kind text not null check (kind in ('membership', 'pt')),
  package_name text not null,
  amount numeric(10, 2) not null default 0 check (amount >= 0),
  payment_method text not null default 'transfer' check (payment_method in ('transfer', 'credit', 'cash', 'other')),
  sold_by uuid references public.profiles (id) on delete set null,
  purchased_on date not null default (now() at time zone 'Asia/Bangkok')::date,
  starts_on date,
  ends_on date,
  pt_sessions integer not null default 0 check (pt_sessions >= 0),
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint member_purchases_membership_dates check (
    kind <> 'membership' or (starts_on is not null and ends_on is not null and ends_on >= starts_on)
  )
);

create index if not exists member_purchases_member_idx on public.member_purchases (member_id);
create index if not exists member_purchases_branch_idx on public.member_purchases (branch_id, purchased_on desc);

-- The member's current end date (latest membership purchase) and their LINE
-- account, once they link it.
alter table public.members add column if not exists membership_expires_on date;
alter table public.members add column if not exists line_user_id text;
create unique index if not exists members_line_user_idx on public.members (line_user_id) where line_user_id is not null;
create index if not exists members_expiry_idx on public.members (branch_id, membership_expires_on);

-- The trainer who looks after this member's PT, so the manager can see each
-- trainer's clients and who is about to run out of hours.
alter table public.members add column if not exists pt_trainer_id uuid references public.profiles (id) on delete set null;
create index if not exists members_pt_trainer_idx on public.members (pt_trainer_id) where pt_trainer_id is not null;

-- A repeat purchase of the same kind (the "RN" rows in the gym's old sheets).
alter table public.member_purchases add column if not exists is_renewal boolean not null default false;

-- What the member came to do on this visit; they pick it when checking in.
alter table public.checkins add column if not exists activity text;
alter table public.checkins drop constraint if exists checkins_activity_check;
alter table public.checkins add constraint checkins_activity_check check (activity is null or activity in ('weights', 'cardio', 'class'));

-- The id a member or sale had in the gym's previous system, so a migration
-- can be traced back and run again without adding anything twice.
alter table public.members add column if not exists legacy_code text;
create unique index if not exists members_legacy_code_idx on public.members (branch_id, legacy_code) where legacy_code is not null;
alter table public.member_purchases add column if not exists legacy_code text;
create unique index if not exists member_purchases_legacy_code_idx on public.member_purchases (legacy_code) where legacy_code is not null;

-- A photo of the payment slip or card receipt for a sale, kept in a private
-- Storage bucket under the branch's own folder.
alter table public.member_purchases add column if not exists proof_path text;
-- Photos of the signed contract and any other papers for the sale, in the same private bucket.
alter table public.member_purchases add column if not exists document_paths text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "payment_proofs_staff_read" on storage.objects;
create policy "payment_proofs_staff_read" on storage.objects for select
  to authenticated using (
    bucket_id = 'payment-proofs' and public.is_staff() and (storage.foldername(name))[1] = public.current_branch()::text
  );

drop policy if exists "payment_proofs_staff_insert" on storage.objects;
create policy "payment_proofs_staff_insert" on storage.objects for insert
  to authenticated with check (
    bucket_id = 'payment-proofs' and public.is_staff() and (storage.foldername(name))[1] = public.current_branch()::text
  );

drop policy if exists "payment_proofs_owner_delete" on storage.objects;
create policy "payment_proofs_owner_delete" on storage.objects for delete
  to authenticated using (
    bucket_id = 'payment-proofs' and public.current_role() = 'owner' and (storage.foldername(name))[1] = public.current_branch()::text
  );

-- Staff can sign up on their own; the account is "pending" and can open
-- nothing until the owner approves it and gives it a real role.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('owner', 'staff', 'trainer', 'member', 'pending'));

-- Who trains the client for a PT sale, kept on the sale so monthly figures can
-- be split by trainer; and the trainer's name carried over from the previous
-- system for clients whose trainer has no account here yet.
alter table public.member_purchases add column if not exists trainer_id uuid references public.profiles (id) on delete set null;
alter table public.members add column if not exists legacy_trainer text;

-- Group classes: the instructor is typed in (teachers change week to week)
-- and a class has a length, so the timetable image can be drawn from them.
alter table public.classes add column if not exists instructor_name text;
alter table public.classes add column if not exists duration_minutes integer not null default 60;

-- The secret printed inside the front-desk QR code.
alter table public.branches add column if not exists checkin_token text;
create unique index if not exists branches_checkin_token_idx on public.branches (checkin_token) where checkin_token is not null;

-- Each sale also appears in the revenue report, which reads public.payments.
alter table public.payments add column if not exists purchase_id uuid references public.member_purchases (id) on delete cascade;
create unique index if not exists payments_purchase_idx on public.payments (purchase_id) where purchase_id is not null;

-- Keep the member's expiry date, PT hours and the revenue row in step with
-- their purchases, whichever way a purchase is added, corrected or removed.
create or replace function public.handle_member_purchase_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member uuid := coalesce(new.member_id, old.member_id);
  v_delta integer := 0;
begin
  if tg_op = 'INSERT' then
    v_delta := case when new.kind = 'pt' then new.pt_sessions else 0 end;
  elsif tg_op = 'UPDATE' then
    v_delta := (case when new.kind = 'pt' then new.pt_sessions else 0 end)
             - (case when old.kind = 'pt' then old.pt_sessions else 0 end);
  else
    v_delta := -(case when old.kind = 'pt' then old.pt_sessions else 0 end);
  end if;

  update public.members m
     set membership_expires_on = (
           select max(p.ends_on) from public.member_purchases p
            where p.member_id = v_member and p.kind = 'membership'
         ),
         pt_total = greatest(0, m.pt_total + v_delta),
         pt_remaining = greatest(0, m.pt_remaining + v_delta)
   where m.id = v_member;

  if tg_op = 'INSERT' then
    -- What the member now holds, and who trains them, follow from the sale itself.
    if new.kind = 'membership' then
      update public.members set plan = new.package_name, status = 'active' where id = new.member_id;
    elsif new.trainer_id is not null then
      update public.members set pt_trainer_id = new.trainer_id where id = new.member_id;
    end if;
    if new.amount > 0 then
      insert into public.payments (member_id, branch_id, amount, paid_at, purchase_id)
      values (new.member_id, new.branch_id, new.amount, new.purchased_on::timestamp at time zone 'Asia/Bangkok', new.id);
    end if;
  elsif tg_op = 'UPDATE' then
    delete from public.payments where purchase_id = new.id;
    if new.amount > 0 then
      insert into public.payments (member_id, branch_id, amount, paid_at, purchase_id)
      values (new.member_id, new.branch_id, new.amount, new.purchased_on::timestamp at time zone 'Asia/Bangkok', new.id);
    end if;
  end if;

  return null;
end;
$$;

-- New or repeat is decided here from the member's whole history, so it is
-- right whoever records the sale.
create or replace function public.prepare_member_purchase()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.is_renewal := exists (
    select 1 from public.member_purchases p where p.member_id = new.member_id and p.kind = new.kind
  );
  return new;
end;
$$;

drop trigger if exists before_member_purchase_insert on public.member_purchases;
create trigger before_member_purchase_insert
  before insert on public.member_purchases
  for each row execute function public.prepare_member_purchase();

drop trigger if exists on_member_purchase_change on public.member_purchases;
create trigger on_member_purchase_change
  after insert or update or delete on public.member_purchases
  for each row execute function public.handle_member_purchase_change();

-- ----------------------------------------------------------------------------
-- promotions: a renewal offer shown to members who are about to run out.
--   membership_expiring: membership ends within days_before days, or has ended
--   pt_low:              bought PT and has pt_at_most hours or fewer left
--   all:                 everyone
-- ----------------------------------------------------------------------------
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  title text not null,
  body text not null default '',
  audience text not null check (audience in ('membership_expiring', 'pt_low', 'all')),
  days_before integer not null default 7 check (days_before >= 0),
  pt_at_most integer not null default 2 check (pt_at_most >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists promotions_branch_idx on public.promotions (branch_id);

-- Promotions that apply to one member today.
create or replace function public.promotions_for_member(p_member uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('title', pr.title, 'body', pr.body, 'audience', pr.audience) order by pr.created_at desc), '[]'::jsonb)
    from public.members m
    join public.promotions pr on pr.branch_id = m.branch_id and pr.active
   where m.id = p_member
     and (
       pr.audience = 'all'
       or (pr.audience = 'membership_expiring'
           and m.membership_expires_on is not null
           and m.membership_expires_on - (now() at time zone 'Asia/Bangkok')::date <= pr.days_before)
       or (pr.audience = 'pt_low' and m.pt_total > 0 and m.pt_remaining <= pr.pt_at_most)
     );
$$;

revoke all on function public.promotions_for_member(uuid) from public, anon, authenticated;

-- The signed-in member's own promotions (member portal).
create or replace function public.my_promotions()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select public.promotions_for_member(m.id) from public.members m where m.profile_id = auth.uid() limit 1),
    '[]'::jsonb
  );
$$;

revoke all on function public.my_promotions() from public, anon;
grant execute on function public.my_promotions() to authenticated;

-- ----------------------------------------------------------------------------
-- checkin_attempts: scans that were turned away (expired, on hold, no
-- package), so the front desk sees them and nobody slips in on a dead
-- membership.
-- ----------------------------------------------------------------------------
create table if not exists public.checkin_attempts (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  member_id uuid not null references public.members (id) on delete cascade,
  reason text not null check (reason in ('expired', 'frozen', 'no_package')),
  created_at timestamptz not null default now()
);

create index if not exists checkin_attempts_branch_idx on public.checkin_attempts (branch_id, created_at desc);

-- ----------------------------------------------------------------------------
-- self_checkin: a member scans the front-desk QR and enters the phone number
-- they registered with. Open to visitors who are not signed in, so it answers
-- only for a valid QR secret and gives back the first name and dates, nothing
-- else. Scanning again within three hours does not add another visit; it only
-- updates what they said they came to do.
--
-- Who gets in: only a membership that has not ended. Membership and PT are
-- sold separately, and PT hours alone do not open the door. An ended
-- membership, a membership on hold, or no membership at all is turned away
-- and recorded in checkin_attempts for the front desk.
-- ----------------------------------------------------------------------------
drop function if exists public.self_checkin(text, text);
create or replace function public.self_checkin(p_token text, p_phone text, p_activity text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch uuid;
  v_digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_matches integer;
  v_member public.members%rowtype;
  v_last timestamptz;
  v_now timestamptz := now();
  v_today date := (now() at time zone 'Asia/Bangkok')::date;
  v_new boolean := false;
  v_reason text;
  v_activity text := case when p_activity in ('weights', 'cardio', 'class') then p_activity end;
begin
  if coalesce(p_token, '') = '' then
    return jsonb_build_object('ok', false, 'reason', 'bad_link');
  end if;
  select id into v_branch from public.branches where checkin_token = p_token;
  if v_branch is null then
    return jsonb_build_object('ok', false, 'reason', 'bad_link');
  end if;
  if length(v_digits) < 9 or length(v_digits) > 12 then
    return jsonb_build_object('ok', false, 'reason', 'bad_phone');
  end if;

  -- Compare the last nine digits, so 081-234-5678, 0812345678 and
  -- +66812345678 are the same number.
  select count(*) into v_matches
    from public.members
   where branch_id = v_branch and status <> 'cancelled'
     and right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 9) = right(v_digits, 9);

  if v_matches = 0 then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  elsif v_matches > 1 then
    return jsonb_build_object('ok', false, 'reason', 'ask_staff');
  end if;

  select * into v_member
    from public.members
   where branch_id = v_branch and status <> 'cancelled'
     and right(regexp_replace(coalesce(phone, ''), '\D', '', 'g'), 9) = right(v_digits, 9);

  v_reason := case
    when v_member.status = 'frozen' then 'frozen'
    when v_member.membership_expires_on is not null and v_member.membership_expires_on < v_today then 'expired'
    when v_member.membership_expires_on is null then 'no_package'
  end;

  if v_reason is not null then
    -- One row per member and reason every five minutes is enough for the desk.
    if not exists (
      select 1 from public.checkin_attempts
       where member_id = v_member.id and reason = v_reason and created_at > v_now - interval '5 minutes'
    ) then
      insert into public.checkin_attempts (branch_id, member_id, reason) values (v_branch, v_member.id, v_reason);
    end if;
    return jsonb_build_object(
      'ok', false,
      'reason', v_reason,
      'name', split_part(btrim(v_member.name), ' ', 1),
      'expires_on', v_member.membership_expires_on,
      'promotions', public.promotions_for_member(v_member.id)
    );
  end if;

  select max(checked_in_at) into v_last from public.checkins where member_id = v_member.id;

  if v_last is null or v_last < v_now - interval '3 hours' then
    insert into public.checkins (member_id, branch_id, checked_in_at, activity) values (v_member.id, v_branch, v_now, v_activity);
    update public.members set last_visit = v_today, visit_count = visit_count + 1 where id = v_member.id;
    v_last := v_now;
    v_new := true;
  elsif v_activity is not null then
    update public.checkins set activity = v_activity where member_id = v_member.id and checked_in_at = v_last;
  end if;

  return jsonb_build_object(
    'ok', true,
    'new', v_new,
    'name', split_part(btrim(v_member.name), ' ', 1),
    'checked_in_at', v_last,
    'activity', (select activity from public.checkins where member_id = v_member.id and checked_in_at = v_last limit 1),
    'expires_on', v_member.membership_expires_on,
    'days_left', v_member.membership_expires_on - v_today,
    'frozen', v_member.status = 'frozen',
    'pt_total', v_member.pt_total,
    'pt_remaining', v_member.pt_remaining,
    'promotions', public.promotions_for_member(v_member.id)
  );
end;
$$;

revoke all on function public.self_checkin(text, text, text) from public;
grant execute on function public.self_checkin(text, text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- trainer_slots: each trainer fills in their own day, hour by hour, so the
-- manager can see who is free and when.
--   pt: training a client   trial: trial session for a prospect
--   free: available         off: not working that hour
-- ----------------------------------------------------------------------------
create table if not exists public.trainer_slots (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  hour smallint not null check (hour between 0 and 23),
  kind text not null check (kind in ('pt', 'trial', 'free', 'off')),
  client_name text,
  updated_at timestamptz not null default now(),
  unique (trainer_id, work_date, hour)
);

create index if not exists trainer_slots_day_idx on public.trainer_slots (branch_id, work_date);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.packages enable row level security;
alter table public.member_purchases enable row level security;
alter table public.promotions enable row level security;
alter table public.trainer_slots enable row level security;
alter table public.checkin_attempts enable row level security;

-- checkin_attempts: written only by self_checkin(); staff read their branch
drop policy if exists "attempts_staff_select" on public.checkin_attempts;
create policy "attempts_staff_select" on public.checkin_attempts for select
  to authenticated using (public.is_staff() and branch_id = public.current_branch());

-- packages: everyone on the team can read; only the owner creates and edits
drop policy if exists "packages_team_select" on public.packages;
create policy "packages_team_select" on public.packages for select
  to authenticated using (branch_id = public.current_branch() and public.current_role() in ('owner', 'staff', 'trainer'));
drop policy if exists "packages_owner_write" on public.packages;
create policy "packages_owner_write" on public.packages for all
  to authenticated using (public.current_role() = 'owner' and branch_id = public.current_branch())
  with check (public.current_role() = 'owner' and branch_id = public.current_branch());

-- member_purchases: staff record and correct sales; a member reads their own
drop policy if exists "purchases_staff_all" on public.member_purchases;
create policy "purchases_staff_all" on public.member_purchases for all
  to authenticated using (public.is_staff() and branch_id = public.current_branch())
  with check (public.is_staff() and branch_id = public.current_branch());
drop policy if exists "purchases_member_select" on public.member_purchases;
create policy "purchases_member_select" on public.member_purchases for select
  to authenticated using (member_id in (select id from public.members where profile_id = auth.uid()));

-- promotions: staff read; only the owner writes. Members get theirs through
-- my_promotions() and self_checkin(), never by reading the table.
drop policy if exists "promotions_staff_select" on public.promotions;
create policy "promotions_staff_select" on public.promotions for select
  to authenticated using (public.is_staff() and branch_id = public.current_branch());
drop policy if exists "promotions_owner_write" on public.promotions;
create policy "promotions_owner_write" on public.promotions for all
  to authenticated using (public.current_role() = 'owner' and branch_id = public.current_branch())
  with check (public.current_role() = 'owner' and branch_id = public.current_branch());

-- trainer_slots: a trainer manages their own day; staff see and correct all
drop policy if exists "slots_trainer_own" on public.trainer_slots;
create policy "slots_trainer_own" on public.trainer_slots for all
  to authenticated using (trainer_id = auth.uid() and branch_id = public.current_branch())
  with check (trainer_id = auth.uid() and branch_id = public.current_branch() and public.current_role() = 'trainer');
drop policy if exists "slots_staff_all" on public.trainer_slots;
create policy "slots_staff_all" on public.trainer_slots for all
  to authenticated using (public.is_staff() and branch_id = public.current_branch())
  with check (public.is_staff() and branch_id = public.current_branch());

-- Trainers sell too: they may add a customer and record their own sales
-- (always under their own name), attach the slip, and see their team's names.
drop policy if exists "purchases_trainer_insert" on public.member_purchases;
create policy "purchases_trainer_insert" on public.member_purchases for insert
  to authenticated with check (public.current_role() = 'trainer' and branch_id = public.current_branch() and sold_by = auth.uid());
drop policy if exists "purchases_trainer_select" on public.member_purchases;
create policy "purchases_trainer_select" on public.member_purchases for select
  to authenticated using (public.current_role() = 'trainer' and sold_by = auth.uid());
drop policy if exists "members_trainer_insert" on public.members;
create policy "members_trainer_insert" on public.members for insert
  to authenticated with check (public.current_role() = 'trainer' and branch_id = public.current_branch());
drop policy if exists "profiles_select_team" on public.profiles;
create policy "profiles_select_team" on public.profiles for select
  to authenticated using (
    public.current_role() = 'trainer' and branch_id = public.current_branch() and role in ('owner', 'staff', 'trainer')
  );
drop policy if exists "payment_proofs_trainer_insert" on storage.objects;
create policy "payment_proofs_trainer_insert" on storage.objects for insert
  to authenticated with check (
    bucket_id = 'payment-proofs' and public.current_role() = 'trainer' and (storage.foldername(name))[1] = public.current_branch()::text
  );

-- ============================================================================
-- New accounts never choose their own role.
-- The role and branch used to be read from what the sign-up request said
-- about itself, so anyone holding the site's public key could have registered
-- as an owner. Every new account now starts as "pending" with no branch; the
-- server sets the real role afterwards (see setAccountProfile in
-- src/lib/supabase/admin.ts).
-- ============================================================================
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
    'pending',
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), new.email), 60),
    left(new.raw_user_meta_data ->> 'phone', 30),
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ============================================================================
-- PT sign-off: after a session the client signs on the trainer's phone, and
-- that one step records the session and takes one hour off the client's PT.
-- ============================================================================
alter table public.pt_sessions add column if not exists signature text;

create or replace function public.sign_pt_session(p_member uuid, p_signature text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := public.current_role();
  v_branch uuid := public.current_branch();
  v_member public.members%rowtype;
  v_now timestamptz := now();
  v_local timestamp := (now() at time zone 'Asia/Bangkok');
  v_id uuid;
begin
  if auth.uid() is null or v_branch is null or v_role is null or v_role not in ('trainer', 'owner', 'staff') then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
  end if;
  -- A signature is pen strokes written as "M x y L x y ...", nothing else.
  if p_signature is null or length(p_signature) < 30 or length(p_signature) > 20000 or p_signature !~ '^[ML0-9 ]+$' then
    return jsonb_build_object('ok', false, 'reason', 'no_signature');
  end if;

  select * into v_member from public.members where id = p_member and branch_id = v_branch for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_member.pt_remaining <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'no_hours');
  end if;
  -- A second tap, or the same session signed twice, must not take two hours.
  if exists (
    select 1 from public.pt_sessions
    where member_id = p_member and trainer_id = auth.uid() and signature is not null and logged_at > v_now - interval '10 minutes'
  ) then
    return jsonb_build_object('ok', false, 'reason', 'just_signed', 'remaining', v_member.pt_remaining);
  end if;

  insert into public.pt_sessions (member_id, trainer_id, branch_id, session_date, session_time, status, logged_at, resolved_at, signature)
  values (p_member, auth.uid(), v_branch, v_local::date, v_local::time, 'approved', v_now, v_now, p_signature)
  returning id into v_id;

  update public.members
    set pt_remaining = pt_remaining - 1,
        pt_trainer_id = case when pt_trainer_id is null and v_role = 'trainer' then auth.uid() else pt_trainer_id end
    where id = p_member;

  return jsonb_build_object('ok', true, 'id', v_id, 'remaining', v_member.pt_remaining - 1);
end;
$$;

revoke all on function public.sign_pt_session(uuid, text) from public, anon;
grant execute on function public.sign_pt_session(uuid, text) to authenticated;

-- Owner or staff: cancel a session that was signed by mistake and give the hour back.
create or replace function public.void_pt_session(p_session uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.pt_sessions%rowtype;
begin
  if not public.is_staff() then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
  end if;
  select * into v_session from public.pt_sessions where id = p_session and branch_id = public.current_branch() for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  delete from public.pt_sessions where id = p_session;
  if v_session.status = 'approved' then
    update public.members set pt_remaining = least(pt_total, pt_remaining + 1) where id = v_session.member_id;
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.void_pt_session(uuid) from public, anon;
grant execute on function public.void_pt_session(uuid) to authenticated;

-- ============================================================================
-- Staff clock-in: a team member scans the staff QR at the gym with their own
-- phone (already signed in) and the time they arrived is recorded, once a day.
-- ============================================================================
-- The QR secret lives apart from `branches`, which every signed-in account can
-- read; only the owner can see or replace it.
create table if not exists public.branch_secrets (
  branch_id uuid primary key references public.branches (id) on delete cascade,
  staff_token text
);
alter table public.branch_secrets enable row level security;
drop policy if exists "branch_secrets_owner_all" on public.branch_secrets;
create policy "branch_secrets_owner_all" on public.branch_secrets for all
  to authenticated using (public.current_role() = 'owner' and branch_id = public.current_branch())
  with check (public.current_role() = 'owner' and branch_id = public.current_branch());

create table if not exists public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  work_date date not null,
  clocked_in_at timestamptz not null default now(),
  unique (profile_id, work_date)
);
create index if not exists staff_attendance_day_idx on public.staff_attendance (branch_id, work_date);
alter table public.staff_attendance enable row level security;

-- Written only by clock_in(). Owner and staff read their branch; everyone reads their own.
drop policy if exists "attendance_select" on public.staff_attendance;
create policy "attendance_select" on public.staff_attendance for select
  to authenticated using (profile_id = auth.uid() or (public.is_staff() and branch_id = public.current_branch()));
drop policy if exists "attendance_owner_delete" on public.staff_attendance;
create policy "attendance_owner_delete" on public.staff_attendance for delete
  to authenticated using (public.current_role() = 'owner' and branch_id = public.current_branch());

create or replace function public.clock_in(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles%rowtype;
  v_today date := (now() at time zone 'Asia/Bangkok')::date;
  v_row public.staff_attendance%rowtype;
  v_new boolean := false;
begin
  select * into v_profile from public.profiles where id = auth.uid();
  if not found or v_profile.branch_id is null or v_profile.role not in ('owner', 'staff', 'trainer') then
    return jsonb_build_object('ok', false, 'reason', 'not_allowed');
  end if;
  if coalesce(p_token, '') = '' or not exists (
    select 1 from public.branch_secrets where branch_id = v_profile.branch_id and staff_token = p_token
  ) then
    return jsonb_build_object('ok', false, 'reason', 'bad_link');
  end if;

  -- The first scan of the day is the arrival time; later scans change nothing.
  insert into public.staff_attendance (branch_id, profile_id, work_date)
  values (v_profile.branch_id, v_profile.id, v_today)
  on conflict (profile_id, work_date) do nothing
  returning * into v_row;
  if found then
    v_new := true;
  else
    select * into v_row from public.staff_attendance where profile_id = v_profile.id and work_date = v_today;
  end if;

  return jsonb_build_object('ok', true, 'new', v_new, 'at', v_row.clocked_in_at, 'name', v_profile.full_name);
end;
$$;

revoke all on function public.clock_in(text) from public, anon;
grant execute on function public.clock_in(text) to authenticated;

-- The time each team member is due at work, set by the owner on the team
-- page. Empty means no fixed time, so that person is never shown as late.
alter table public.profiles add column if not exists work_start time;

-- Someone who has left the team: the account stays, so past sales and PT
-- sessions keep their name, but the role "left" opens nothing.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('owner', 'staff', 'trainer', 'member', 'pending', 'left'));

-- A trainer also sees the PT sales made for their own clients (not only the
-- sales they made themselves), so their client page can show what was bought.
drop policy if exists "purchases_trainer_select" on public.member_purchases;
create policy "purchases_trainer_select" on public.member_purchases for select
  to authenticated using (public.current_role() = 'trainer' and (sold_by = auth.uid() or trainer_id = auth.uid()));

-- Trainers see the whole team's day (who trains, who is free, hour by hour) so
-- they can tell which hours are open. Only the kind of each hour is returned,
-- never another trainer's client names.
create or replace function public.team_schedule(p_date date)
returns table (trainer_id uuid, hour smallint, kind text)
language sql
stable
security definer
set search_path = public
as $$
  select s.trainer_id, s.hour, s.kind
    from public.trainer_slots s
   where s.work_date = p_date
     and s.branch_id = public.current_branch()
     and public.current_role() in ('owner', 'staff', 'trainer');
$$;

revoke all on function public.team_schedule(date) from public, anon;
grant execute on function public.team_schedule(date) to authenticated;

-- A shared account for the front-counter computer. It is a staff account that
-- the app keeps to the counter screens (check-in, selling, member look-up);
-- see COUNTER_PATHS in src/lib/supabase/middleware.ts.
alter table public.profiles add column if not exists counter_only boolean not null default false;
