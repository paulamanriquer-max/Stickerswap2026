-- StickerSwap launch repair: create/repair the live backend tables used by Collectors and Chat.
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default 'Collector',
  email text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended', 'banned')),
  latitude double precision,
  longitude double precision,
  location_enabled boolean not null default false,
  profile_visible boolean not null default true,
  recovery_question text,
  recovery_answer_digest text,
  created_at timestamptz not null default now(),
  last_active timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_stickers (
  user_id uuid not null references public.profiles(id) on delete cascade,
  sticker_code text not null,
  owned boolean not null default false,
  missing boolean not null default true,
  duplicate_count int not null default 0 check (duplicate_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, sticker_code),
  constraint duplicate_requires_owned check (duplicate_count = 0 or owned = true),
  constraint owned_and_missing_are_exclusive check (not (owned = true and missing = true))
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  message_text text not null check (char_length(trim(message_text)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.public_messages (
  id uuid primary key default gen_random_uuid(),
  room_key text not null default 'kansas_city',
  user_id uuid not null references public.profiles(id) on delete cascade,
  message_text text not null check (char_length(trim(message_text)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  push_enabled boolean not null default false,
  matches boolean not null default true,
  messages boolean not null default true,
  trade_requests boolean not null default true,
  permission text not null default 'default',
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_stickers_user_idx on public.user_stickers (user_id);
create index if not exists user_stickers_duplicates_idx on public.user_stickers (sticker_code) where owned = true and duplicate_count > 0;
create index if not exists user_stickers_missing_idx on public.user_stickers (sticker_code) where missing = true;
create index if not exists messages_pair_idx on public.messages (sender_id, receiver_id, created_at desc);
create index if not exists public_messages_room_idx on public.public_messages (room_key, created_at desc);

insert into public.profiles (
  id,
  username,
  email,
  recovery_question,
  recovery_answer_digest,
  status,
  profile_visible,
  location_enabled,
  created_at,
  last_active
)
select
  au.id,
  coalesce(nullif(trim(au.raw_user_meta_data->>'username'), ''), split_part(au.email, '@', 1), 'Collector'),
  lower(au.email),
  nullif(trim(au.raw_user_meta_data->>'recovery_question'), ''),
  nullif(trim(au.raw_user_meta_data->>'recovery_answer_digest'), ''),
  'active',
  true,
  false,
  au.created_at,
  coalesce(au.last_sign_in_at, au.updated_at, au.created_at, now())
from auth.users au
left join public.profiles p on p.id = au.id
where p.id is null
  and lower(coalesce(au.email, '')) <> 'paulaadmin@stickerswap.com';

update public.profiles
set profile_visible = true,
    status = 'active',
    last_active = now()
where lower(coalesce(email, '')) <> 'paulaadmin@stickerswap.com'
  and status <> 'banned';

insert into public.notification_preferences (user_id)
select p.id
from public.profiles p
left join public.notification_preferences np on np.user_id = p.id
where np.user_id is null;

create or replace function public.ensure_my_profile(
  p_username text default null,
  p_email text default null
)
returns table (
  id uuid,
  username text,
  email text,
  created_at timestamptz,
  last_active timestamptz,
  latitude double precision,
  longitude double precision
)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_auth_user auth.users;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into current_auth_user
  from auth.users
  where auth.users.id = auth.uid();

  if current_auth_user.id is null then
    raise exception 'Auth user not found';
  end if;

  insert into public.profiles (
    id,
    username,
    email,
    recovery_question,
    recovery_answer_digest,
    status,
    profile_visible,
    location_enabled,
    created_at,
    last_active
  )
  values (
    current_auth_user.id,
    coalesce(
      nullif(trim(p_username), ''),
      nullif(trim(current_auth_user.raw_user_meta_data->>'username'), ''),
      split_part(coalesce(nullif(trim(p_email), ''), current_auth_user.email), '@', 1),
      'Collector'
    ),
    lower(coalesce(nullif(trim(p_email), ''), current_auth_user.email)),
    nullif(trim(current_auth_user.raw_user_meta_data->>'recovery_question'), ''),
    nullif(trim(current_auth_user.raw_user_meta_data->>'recovery_answer_digest'), ''),
    'active',
    true,
    false,
    current_auth_user.created_at,
    coalesce(current_auth_user.last_sign_in_at, current_auth_user.updated_at, now())
  )
  on conflict (id) do update
    set username = coalesce(nullif(trim(p_username), ''), profiles.username),
        email = lower(coalesce(nullif(trim(p_email), ''), profiles.email)),
        status = case when profiles.status = 'banned' then 'banned' else 'active' end,
        profile_visible = case when profiles.status = 'banned' then false else true end,
        last_active = now();

  insert into public.notification_preferences (user_id)
  values (current_auth_user.id)
  on conflict (user_id) do nothing;

  return query
  select p.id, p.username, p.email, p.created_at, p.last_active, p.latitude, p.longitude
  from public.profiles p
  where p.id = current_auth_user.id;
end;
$$;

create or replace function public.find_matches(
  p_radius_km double precision default 80,
  p_limit int default 50
)
returns table (
  user_id uuid,
  username text,
  email text,
  distance_km double precision,
  match_score int,
  matches text[],
  you_need text[],
  they_need text[],
  they_have_you_need int,
  you_have_they_need int
)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select * from public.profiles where id = auth.uid()
  ),
  my_missing as (
    select sticker_code
    from public.user_stickers
    where user_id = auth.uid()
      and coalesce(owned, false) = false
      and coalesce(duplicate_count, 0) = 0
  ),
  my_duplicates as (
    select sticker_code
    from public.user_stickers
    where user_id = auth.uid()
      and owned = true
      and duplicate_count > 0
  ),
  visible_users as (
    select
      p.id,
      p.username,
      p.email,
      case
        when me.latitude is null or me.longitude is null or p.latitude is null or p.longitude is null then 0
        else (
          6371 * acos(
            least(1, greatest(-1,
              cos(radians(me.latitude)) * cos(radians(p.latitude)) *
              cos(radians(p.longitude) - radians(me.longitude)) +
              sin(radians(me.latitude)) * sin(radians(p.latitude))
            ))
          )
        )
      end as distance_km
    from public.profiles p, me
    where p.id <> auth.uid()
      and p.status = 'active'
      and p.profile_visible = true
      and lower(coalesce(p.email, '')) <> 'paulaadmin@stickerswap.com'
      and (
        me.location_enabled = false
        or p.location_enabled = false
        or me.latitude is null
        or me.longitude is null
        or p.latitude is null
        or p.longitude is null
        or (
          6371 * acos(
            least(1, greatest(-1,
              cos(radians(me.latitude)) * cos(radians(p.latitude)) *
              cos(radians(p.longitude) - radians(me.longitude)) +
              sin(radians(me.latitude)) * sin(radians(p.latitude))
            ))
          )
        ) <= p_radius_km
      )
  ),
  other_missing as (
    select user_id, sticker_code
    from public.user_stickers
    where coalesce(owned, false) = false
      and coalesce(duplicate_count, 0) = 0
  ),
  scored as (
    select
      visible_users.id,
      visible_users.username,
      visible_users.email,
      visible_users.distance_km,
      (
        select array_agg(distinct us.sticker_code order by us.sticker_code)
        from public.user_stickers us
        join my_missing on my_missing.sticker_code = us.sticker_code
        where us.user_id = visible_users.id
          and us.owned = true
          and us.duplicate_count > 0
      ) as matches,
      (select array_agg(sticker_code order by sticker_code) from my_missing) as you_need,
      (
        select array_agg(sticker_code order by sticker_code)
        from other_missing
        where other_missing.user_id = visible_users.id
      ) as they_need,
      (
        select count(distinct us.sticker_code)::int
        from public.user_stickers us
        join my_missing on my_missing.sticker_code = us.sticker_code
        where us.user_id = visible_users.id
          and us.owned = true
          and us.duplicate_count > 0
      ) as they_have_you_need,
      (
        select count(distinct my_duplicates.sticker_code)::int
        from my_duplicates
        join other_missing on other_missing.sticker_code = my_duplicates.sticker_code
        where other_missing.user_id = visible_users.id
      ) as you_have_they_need
    from visible_users
  )
  select
    scored.id as user_id,
    scored.username,
    scored.email,
    scored.distance_km,
    case
      when coalesce(array_length(scored.you_need, 1), 0) = 0 then 0
      else round((scored.they_have_you_need::numeric / greatest(array_length(scored.you_need, 1), 1)) * 100)::int
    end as match_score,
    coalesce(scored.matches, '{}') as matches,
    coalesce(scored.you_need, '{}') as you_need,
    coalesce(scored.they_need, '{}') as they_need,
    scored.they_have_you_need,
    scored.you_have_they_need
  from scored
  order by scored.they_have_you_need desc, match_score desc, scored.distance_km asc
  limit p_limit;
$$;

create or replace function public.send_public_message(
  p_room_key text,
  p_message_text text
)
returns public.public_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.public_messages;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.public_messages (room_key, user_id, message_text)
  values (coalesce(nullif(trim(p_room_key), ''), 'kansas_city'), auth.uid(), trim(p_message_text))
  returning * into saved;

  return saved;
end;
$$;

create or replace function public.send_private_message(
  p_receiver_id uuid,
  p_message_text text
)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.messages;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.messages (sender_id, receiver_id, message_text)
  values (auth.uid(), p_receiver_id, trim(p_message_text))
  returning * into saved;

  return saved;
end;
$$;

create or replace function public.email_exists(p_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where email = lower(trim(p_email))
      and status = 'active'
  );
$$;

create or replace function public.get_recovery_question(p_email text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select recovery_question
  from public.profiles
  where email = lower(trim(p_email))
    and status = 'active';
$$;

create or replace function public.verify_recovery_answer(p_email text, p_recovery_answer_digest text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where email = lower(trim(p_email))
      and recovery_answer_digest = p_recovery_answer_digest
      and status = 'active'
  );
$$;

create or replace function public.admin_report(p_admin_email text, p_admin_password text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  is_admin boolean;
begin
  select lower(trim(p_admin_email)) = 'paulaadmin@stickerswap.com'
    and p_admin_password = 'M0nasMundial2026!'
  into is_admin;

  if not is_admin then
    raise exception 'Invalid admin credentials';
  end if;

  return jsonb_build_object(
    'users',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', au.id,
          'name', coalesce(nullif(trim(p.username), ''), nullif(trim(au.raw_user_meta_data->>'username'), ''), split_part(au.email, '@', 1)),
          'email', lower(coalesce(p.email, au.email, '')),
          'joinedAt', to_char(coalesce(p.created_at, au.created_at), 'YYYY-MM-DD'),
          'lastActive', to_char(coalesce(p.last_active, au.last_sign_in_at, au.updated_at, au.created_at), 'YYYY-MM-DD'),
          'stickers', coalesce(s.collected_count, 0),
          'trades', coalesce(m.private_message_count, 0),
          'status', coalesce(p.status, 'active'),
          'location', case
            when coalesce(p.location_enabled, false) and p.latitude is not null and p.longitude is not null then 'Kansas City + location on'
            else 'Kansas City'
          end
        )
        order by coalesce(p.created_at, au.created_at) desc
      )
      from auth.users au
      left join public.profiles p on p.id = au.id
      left join (
        select
          user_id,
          count(*) filter (where owned = true or duplicate_count > 0)::int as collected_count
        from public.user_stickers
        group by user_id
      ) s on s.user_id = au.id
      left join (
        select
          participant_id,
          count(*)::int as private_message_count
        from (
          select sender_id as participant_id from public.messages
          union all
          select receiver_id as participant_id from public.messages
        ) participants
        group by participant_id
      ) m on m.participant_id = au.id
      where lower(coalesce(au.email, '')) <> 'paulaadmin@stickerswap.com'
        and coalesce(p.status, 'active') <> 'banned'
    ), '[]'::jsonb),
    'publicMessages',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pm.id,
          'user', coalesce(p.username, split_part(au.email, '@', 1), 'Unknown collector'),
          'room', 'Kansas City Community',
          'city', 'Kansas City',
          'message', pm.message_text,
          'timestamp', to_char(pm.created_at, 'YYYY-MM-DD HH24:MI'),
          'flagged', false
        )
        order by pm.created_at desc
      )
      from public.public_messages pm
      left join public.profiles p on p.id = pm.user_id
      left join auth.users au on au.id = pm.user_id
      where pm.room_key = 'kansas_city'
      limit 200
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_delete_public_message(
  p_admin_email text,
  p_admin_password text,
  p_message_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
begin
  select lower(trim(p_admin_email)) = 'paulaadmin@stickerswap.com'
    and p_admin_password = 'M0nasMundial2026!'
  into is_admin;

  if not is_admin then
    raise exception 'Invalid admin credentials';
  end if;

  delete from public.public_messages
  where id = p_message_id;

  return true;
end;
$$;

create or replace function public.admin_delete_user(
  p_admin_email text,
  p_admin_password text,
  p_user_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
begin
  select lower(trim(p_admin_email)) = 'paulaadmin@stickerswap.com'
    and p_admin_password = 'M0nasMundial2026!'
  into is_admin;

  if not is_admin then
    raise exception 'Invalid admin credentials';
  end if;

  update public.profiles
  set
    status = 'banned',
    profile_visible = false,
    last_active = now()
  where id = p_user_id;

  return true;
end;
$$;

alter table public.profiles enable row level security;
alter table public.user_stickers enable row level security;
alter table public.messages enable row level security;
alter table public.public_messages enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "profiles readable when visible or own" on public.profiles;
create policy "profiles readable when visible or own"
on public.profiles for select
using (profile_visible = true or auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "users read own stickers" on public.user_stickers;
create policy "users read own stickers"
on public.user_stickers for select
using (auth.uid() = user_id);

drop policy if exists "users upsert own stickers" on public.user_stickers;
create policy "users upsert own stickers"
on public.user_stickers for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "messages readable by sender receiver" on public.messages;
create policy "messages readable by sender receiver"
on public.messages for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "messages insert by sender" on public.messages;
create policy "messages insert by sender"
on public.messages for insert
with check (auth.uid() = sender_id);

drop policy if exists "public messages readable by authenticated users" on public.public_messages;
create policy "public messages readable by authenticated users"
on public.public_messages for select
using (auth.role() = 'authenticated');

drop policy if exists "public messages insert by user" on public.public_messages;
create policy "public messages insert by user"
on public.public_messages for insert
with check (auth.uid() = user_id);

drop policy if exists "notification prefs own" on public.notification_preferences;
create policy "notification prefs own"
on public.notification_preferences for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "analytics insert own events" on public.analytics_events;
create policy "analytics insert own events"
on public.analytics_events for insert
with check (auth.uid() = user_id or user_id is null);

revoke execute on function public.ensure_my_profile(text, text) from public, anon, authenticated;
revoke execute on function public.find_matches(double precision, int) from public, anon, authenticated;
revoke execute on function public.send_public_message(text, text) from public, anon, authenticated;
revoke execute on function public.send_private_message(uuid, text) from public, anon, authenticated;
revoke execute on function public.email_exists(text) from public, anon, authenticated;
revoke execute on function public.get_recovery_question(text) from public, anon, authenticated;
revoke execute on function public.verify_recovery_answer(text, text) from public, anon, authenticated;
revoke execute on function public.admin_report(text, text) from public, anon, authenticated;
revoke execute on function public.admin_delete_public_message(text, text, uuid) from public, anon, authenticated;
revoke execute on function public.admin_delete_user(text, text, uuid) from public, anon, authenticated;

grant execute on function public.ensure_my_profile(text, text) to authenticated;
grant execute on function public.find_matches(double precision, int) to authenticated;
grant execute on function public.send_public_message(text, text) to authenticated;
grant execute on function public.send_private_message(uuid, text) to authenticated;
grant execute on function public.email_exists(text) to anon, authenticated;
grant execute on function public.get_recovery_question(text) to anon, authenticated;
grant execute on function public.verify_recovery_answer(text, text) to anon, authenticated;
grant execute on function public.admin_report(text, text) to anon, authenticated;
grant execute on function public.admin_delete_public_message(text, text, uuid) to anon, authenticated;
grant execute on function public.admin_delete_user(text, text, uuid) to anon, authenticated;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.public_messages;
exception
  when duplicate_object then null;
end $$;

select
  (select count(*) from auth.users where lower(coalesce(email, '')) <> 'paulaadmin@stickerswap.com') as auth_users,
  (select count(*) from public.profiles where lower(coalesce(email, '')) <> 'paulaadmin@stickerswap.com' and status = 'active' and profile_visible = true) as visible_collectors,
  (select count(*) from public.messages) as private_messages,
  (select count(*) from public.public_messages) as public_messages;
