-- StickerSwap 2026 Supabase schema
-- Current product model: required name + email + password, optional location,
-- real sticker ownership, Kansas City matching, public rooms, private chat, admin reporting.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (char_length(trim(username)) > 0),
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

create table if not exists public.stickers (
  code text primary key,
  sticker_number text not null,
  team_code text not null,
  number int not null,
  name text not null,
  category text not null,
  album_order int not null unique
);

create table if not exists public.user_stickers (
  user_id uuid not null references public.profiles(id) on delete cascade,
  sticker_code text not null references public.stickers(code) on delete cascade,
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

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
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

create index if not exists profiles_location_idx on public.profiles (latitude, longitude);
create index if not exists user_stickers_user_idx on public.user_stickers (user_id);
create index if not exists user_stickers_duplicates_idx on public.user_stickers (sticker_code) where owned = true and duplicate_count > 0;
create index if not exists user_stickers_missing_idx on public.user_stickers (sticker_code) where missing = true;
create index if not exists messages_pair_idx on public.messages (sender_id, receiver_id, created_at desc);
create index if not exists public_messages_room_idx on public.public_messages (room_key, created_at desc);
create index if not exists analytics_user_idx on public.analytics_events (user_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists user_stickers_touch_updated_at on public.user_stickers;
create trigger user_stickers_touch_updated_at
before update on public.user_stickers
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    username,
    email,
    recovery_question,
    recovery_answer_digest
  )
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), split_part(new.email, '@', 1)),
    lower(new.email),
    nullif(trim(new.raw_user_meta_data->>'recovery_question'), ''),
    nullif(trim(new.raw_user_meta_data->>'recovery_answer_digest'), '')
  )
  on conflict (id) do update
    set username = excluded.username,
        email = excluded.email,
        recovery_question = excluded.recovery_question,
        recovery_answer_digest = excluded.recovery_answer_digest,
        last_active = now();

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.distance_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
returns double precision
language sql
immutable
set search_path = public
as $$
  select case
    when lat1 is null or lon1 is null or lat2 is null or lon2 is null then null
    else (
      6371 * acos(
        least(
          1,
          greatest(
            -1,
            cos(radians(lat1)) * cos(radians(lat2)) *
            cos(radians(lon2) - radians(lon1)) +
            sin(radians(lat1)) * sin(radians(lat2))
          )
        )
      )
    )
  end;
$$;

create or replace function public.upsert_user_sticker(
  p_sticker_code text,
  p_owned boolean,
  p_missing boolean,
  p_duplicate_count int default 0
)
returns public.user_stickers
language plpgsql
security definer
set search_path = public
as $$
declare
  saved public.user_stickers;
  normalized_duplicate_count int;
  normalized_owned boolean;
  normalized_missing boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  normalized_duplicate_count := greatest(coalesce(p_duplicate_count, 0), 0);
  normalized_owned := coalesce(p_owned, false) or normalized_duplicate_count > 0;
  normalized_missing := case
    when normalized_owned then false
    else coalesce(p_missing, true)
  end;

  insert into public.user_stickers (user_id, sticker_code, owned, missing, duplicate_count, updated_at)
  values (auth.uid(), p_sticker_code, normalized_owned, normalized_missing, normalized_duplicate_count, now())
  on conflict (user_id, sticker_code) do update
    set owned = excluded.owned,
        missing = excluded.missing,
        duplicate_count = excluded.duplicate_count,
        updated_at = now()
  returning * into saved;

  update public.profiles set last_active = now() where id = auth.uid();

  insert into public.analytics_events (user_id, event_name, properties)
  values (
    auth.uid(),
    case when normalized_duplicate_count > 0 then 'duplicate_added' else 'sticker_added' end,
    jsonb_build_object(
      'sticker_code', p_sticker_code,
      'owned', normalized_owned,
      'missing', normalized_missing,
      'duplicate_count', normalized_duplicate_count
    )
  );

  return saved;
end;
$$;

create or replace function public.upsert_user_stickers_bulk(p_stickers jsonb)
returns setof public.user_stickers
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  normalized_duplicate_count int;
  normalized_owned boolean;
  normalized_missing boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if jsonb_typeof(p_stickers) <> 'array' then
    raise exception 'Expected an array of stickers';
  end if;

  for item in select * from jsonb_array_elements(p_stickers) loop
    normalized_duplicate_count := greatest(coalesce((item->>'duplicate_count')::int, 0), 0);
    normalized_owned := coalesce((item->>'owned')::boolean, false) or normalized_duplicate_count > 0;
    normalized_missing := case
      when normalized_owned then false
      else coalesce((item->>'missing')::boolean, true)
    end;

    insert into public.user_stickers (user_id, sticker_code, owned, missing, duplicate_count, updated_at)
    values (auth.uid(), item->>'sticker_code', normalized_owned, normalized_missing, normalized_duplicate_count, now())
    on conflict (user_id, sticker_code) do update
      set owned = excluded.owned,
          missing = excluded.missing,
          duplicate_count = excluded.duplicate_count,
          updated_at = now();
  end loop;

  update public.profiles set last_active = now() where id = auth.uid();

  return query
  select * from public.user_stickers
  where user_id = auth.uid()
  order by sticker_code;
end;
$$;

create or replace function public.find_matches(
  p_radius_km double precision default 50,
  p_limit int default 20
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
  my_stickers as (
    select * from public.user_stickers where user_id = auth.uid()
  ),
  my_missing as (
    select sticker_code from my_stickers where missing = true
  ),
  my_duplicates as (
    select sticker_code from my_stickers where owned = true and duplicate_count > 0
  ),
  visible_users as (
    select
      p.id,
      p.username,
      p.email,
      coalesce(public.distance_km(me.latitude, me.longitude, p.latitude, p.longitude), 0) as distance_km
    from public.profiles p, me
    where p.id <> auth.uid()
      and p.status = 'active'
      and p.profile_visible = true
      and (
        me.location_enabled = false
        or p.location_enabled = false
        or public.distance_km(me.latitude, me.longitude, p.latitude, p.longitude) <= p_radius_km
      )
  ),
  scored as (
    select
      visible_users.id,
      visible_users.username,
      visible_users.email,
      visible_users.distance_km,
      array_remove(array_agg(distinct other_duplicates.sticker_code), null) as matches,
      (select array_agg(sticker_code order by sticker_code) from my_missing) as you_need,
      array_remove(array_agg(distinct other_missing.sticker_code), null) as they_need,
      count(distinct other_duplicates.sticker_code)::int as they_have_you_need,
      (count(distinct my_duplicates.sticker_code) filter (where other_missing.sticker_code is not null))::int as you_have_they_need
    from visible_users
    left join my_missing
      on true
    left join public.user_stickers other_duplicates
      on other_duplicates.user_id = visible_users.id
      and other_duplicates.sticker_code = my_missing.sticker_code
      and other_duplicates.owned = true
      and other_duplicates.duplicate_count > 0
    left join public.user_stickers other_missing
      on other_missing.user_id = visible_users.id
      and other_missing.missing = true
    left join my_duplicates
      on my_duplicates.sticker_code = other_missing.sticker_code
    group by visible_users.id, visible_users.username, visible_users.email, visible_users.distance_km
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

  insert into public.analytics_events (user_id, event_name, properties)
  values (auth.uid(), 'message_sent', jsonb_build_object('type', 'private', 'receiver_id', p_receiver_id));

  return saved;
end;
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

  insert into public.analytics_events (user_id, event_name, properties)
  values (auth.uid(), 'message_sent', jsonb_build_object('type', 'public', 'room_key', saved.room_key));

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

alter table public.profiles enable row level security;
alter table public.stickers enable row level security;
alter table public.user_stickers enable row level security;
alter table public.messages enable row level security;
alter table public.public_messages enable row level security;
alter table public.analytics_events enable row level security;
alter table public.notification_preferences enable row level security;

drop policy if exists "profiles readable when visible or own" on public.profiles;
create policy "profiles readable when visible or own"
on public.profiles for select
using (profile_visible = true or auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "stickers readable by everyone" on public.stickers;
create policy "stickers readable by everyone"
on public.stickers for select
using (true);

drop policy if exists "users read own stickers" on public.user_stickers;
create policy "users read own stickers"
on public.user_stickers for select
using (auth.uid() = user_id);

drop policy if exists "users write own stickers" on public.user_stickers;
create policy "users write own stickers"
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

drop policy if exists "analytics insert own events" on public.analytics_events;
create policy "analytics insert own events"
on public.analytics_events for insert
with check (auth.uid() = user_id or user_id is null);

drop policy if exists "notification prefs read own" on public.notification_preferences;
create policy "notification prefs read own"
on public.notification_preferences for select
using (auth.uid() = user_id);

drop policy if exists "notification prefs update own" on public.notification_preferences;
create policy "notification prefs update own"
on public.notification_preferences for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke execute on function public.touch_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.distance_km(double precision, double precision, double precision, double precision) from public, anon, authenticated;
revoke execute on function public.upsert_user_sticker(text, boolean, boolean, int) from public, anon, authenticated;
revoke execute on function public.upsert_user_stickers_bulk(jsonb) from public, anon, authenticated;
revoke execute on function public.find_matches(double precision, int) from public, anon, authenticated;
revoke execute on function public.send_private_message(uuid, text) from public, anon, authenticated;
revoke execute on function public.send_public_message(text, text) from public, anon, authenticated;
revoke execute on function public.email_exists(text) from public, anon, authenticated;
revoke execute on function public.get_recovery_question(text) from public, anon, authenticated;
revoke execute on function public.verify_recovery_answer(text, text) from public, anon, authenticated;

grant execute on function public.email_exists(text) to anon, authenticated;
grant execute on function public.get_recovery_question(text) to anon, authenticated;
grant execute on function public.verify_recovery_answer(text, text) to anon, authenticated;
grant execute on function public.upsert_user_sticker(text, boolean, boolean, int) to authenticated;
grant execute on function public.upsert_user_stickers_bulk(jsonb) to authenticated;
grant execute on function public.find_matches(double precision, int) to authenticated;
grant execute on function public.send_private_message(uuid, text) to authenticated;
grant execute on function public.send_public_message(text, text) to authenticated;

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
