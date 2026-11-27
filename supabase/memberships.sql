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
-- self_checkin: a member scans the front-desk QR and enters the phone number
-- they registered with. Open to visitors who are not signed in, so it answers
-- only for a valid QR secret and gives back the first name and dates, nothing
-- else. Scanning again within three hours does not add another visit.
-- ----------------------------------------------------------------------------
create or replace function public.self_checkin(p_token text, p_phone text)
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

  select max(checked_in_at) into v_last from public.checkins where member_id = v_member.id;

  if v_last is null or v_last < v_now - interval '3 hours' then
    insert into public.checkins (member_id, branch_id, checked_in_at) values (v_member.id, v_branch, v_now);
    update public.members set last_visit = v_today, visit_count = visit_count + 1 where id = v_member.id;
    v_last := v_now;
    v_new := true;
  end if;

  return jsonb_build_object(
    'ok', true,
    'new', v_new,
    'name', split_part(btrim(v_member.name), ' ', 1),
    'checked_in_at', v_last,
    'expires_on', v_member.membership_expires_on,
    'days_left', v_member.membership_expires_on - v_today,
    'frozen', v_member.status = 'frozen',
    'pt_total', v_member.pt_total,
    'pt_remaining', v_member.pt_remaining,
    'promotions', public.promotions_for_member(v_member.id)
  );
end;
$$;

revoke all on function public.self_checkin(text, text) from public;
grant execute on function public.self_checkin(text, text) to anon, authenticated;

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
