-- Sticker Swap 2026 Supabase backend
-- Low-friction model: username-first anonymous users, optional magic-link email upgrade.

create extension if not exists pgcrypto;
create extension if not exists earthdistance cascade;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text not null check (char_length(trim(username)) > 0),
  email text unique,
  is_anonymous boolean not null default true,
  created_at timestamptz not null default now(),
  last_active timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  constraint email_required_when_authenticated check (
    is_anonymous = true or email is not null
  )
);

create table if not exists public.stickers (
  id text primary key,
  team text not null,
  number int not null,
  name text not null
);

create table if not exists public.user_stickers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  sticker_id text not null references public.stickers(id) on delete cascade,
  quantity int not null default 0 check (quantity >= 0),
  is_needed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, sticker_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.users(id) on delete cascade,
  user_b uuid not null references public.users(id) on delete cascade,
  distance_km double precision not null,
  match_score double precision not null,
  created_at timestamptz not null default now(),
  unique (user_a, user_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  message_text text not null check (char_length(trim(message_text)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.public_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  message_text text not null check (char_length(trim(message_text)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_authenticated_user()
returns trigger
language plpgsql
as $$
begin
  if new.email is not null then
    new.is_anonymous := false;
  end if;
  new.last_active := now();
  return new;
end;
$$;

drop trigger if exists users_set_authenticated_user on public.users;
create trigger users_set_authenticated_user
before insert or update on public.users
for each row execute function public.set_authenticated_user();

create or replace function public.touch_user()
returns trigger
language plpgsql
as $$
begin
  update public.users set last_active = now() where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists user_stickers_touch_user on public.user_stickers;
create trigger user_stickers_touch_user
after insert or update on public.user_stickers
for each row execute function public.touch_user();

create or replace function public.distance_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
returns double precision
language sql
immutable
as $$
  select case
    when lat1 is null or lon1 is null or lat2 is null or lon2 is null then null
    else earth_distance(ll_to_earth(lat1, lon1), ll_to_earth(lat2, lon2)) / 1000
  end;
$$;

create or replace function public.create_anonymous_user(
  p_id uuid,
  p_username text,
  p_latitude double precision default null,
  p_longitude double precision default null
)
returns public.users
language plpgsql
security definer
as $$
declare
  created_user public.users;
begin
  insert into public.users (id, username, latitude, longitude)
  values (p_id, trim(p_username), p_latitude, p_longitude)
  on conflict (id) do update
    set username = excluded.username,
        latitude = excluded.latitude,
        longitude = excluded.longitude,
        last_active = now()
  returning * into created_user;

  insert into public.analytics_events (user_id, event_name, properties)
  values (created_user.id, 'username_created', jsonb_build_object('username', created_user.username));

  return created_user;
end;
$$;

create or replace function public.add_email_to_user(
  p_user_id uuid,
  p_email text
)
returns public.users
language plpgsql
security definer
as $$
declare
  updated_user public.users;
begin
  update public.users
  set email = lower(trim(p_email)),
      is_anonymous = false,
      last_active = now()
  where id = p_user_id
  returning * into updated_user;

  insert into public.analytics_events (user_id, event_name)
  values (updated_user.id, 'email_added'), (updated_user.id, 'chat_unlocked');

  return updated_user;
end;
$$;

create or replace function public.upsert_user_sticker(
  p_user_id uuid,
  p_sticker_id text,
  p_quantity int default 0,
  p_is_needed boolean default false
)
returns public.user_stickers
language plpgsql
security definer
as $$
declare
  saved public.user_stickers;
begin
  insert into public.user_stickers (user_id, sticker_id, quantity, is_needed, updated_at)
  values (p_user_id, p_sticker_id, greatest(p_quantity, 0), p_is_needed, now())
  on conflict (user_id, sticker_id) do update
    set quantity = greatest(excluded.quantity, 0),
        is_needed = excluded.is_needed,
        updated_at = now()
  returning * into saved;

  insert into public.analytics_events (user_id, event_name, properties)
  values (
    p_user_id,
    case when p_quantity > 1 then 'duplicate_added' else 'sticker_added' end,
    jsonb_build_object('sticker_id', p_sticker_id, 'quantity', p_quantity, 'is_needed', p_is_needed)
  );

  return saved;
end;
$$;

create or replace function public.find_matches(
  p_user_id uuid,
  p_radius_km double precision default 50,
  p_limit int default 20
)
returns table (
  user_id uuid,
  username text,
  distance_km double precision,
  match_score double precision,
  they_have_you_need int,
  you_have_they_need int
)
language sql
stable
as $$
  with me as (
    select * from public.users where id = p_user_id
  ),
  nearby as (
    select
      u.id,
      u.username,
      public.distance_km(me.latitude, me.longitude, u.latitude, u.longitude) as distance_km
    from public.users u, me
    where u.id <> p_user_id
      and u.latitude is not null
      and u.longitude is not null
      and public.distance_km(me.latitude, me.longitude, u.latitude, u.longitude) <= p_radius_km
  ),
  scored as (
    select
      nearby.id as user_id,
      nearby.username,
      nearby.distance_km,
      count(distinct need.sticker_id) filter (where other_dupes.quantity > 1) as they_have_you_need,
      count(distinct other_need.sticker_id) filter (where my_dupes.quantity > 1) as you_have_they_need
    from nearby
    left join public.user_stickers need
      on need.user_id = p_user_id and need.is_needed = true
    left join public.user_stickers other_dupes
      on other_dupes.user_id = nearby.id
      and other_dupes.sticker_id = need.sticker_id
      and other_dupes.quantity > 1
    left join public.user_stickers other_need
      on other_need.user_id = nearby.id and other_need.is_needed = true
    left join public.user_stickers my_dupes
      on my_dupes.user_id = p_user_id
      and my_dupes.sticker_id = other_need.sticker_id
      and my_dupes.quantity > 1
    group by nearby.id, nearby.username, nearby.distance_km
  )
  select
    user_id,
    username,
    distance_km,
    (they_have_you_need * 2 + you_have_they_need) / greatest(distance_km, 1) as match_score,
    they_have_you_need,
    you_have_they_need
  from scored
  order by match_score desc, distance_km asc
  limit p_limit;
$$;

create or replace function public.send_private_message(
  p_sender_id uuid,
  p_receiver_id uuid,
  p_message_text text
)
returns public.messages
language plpgsql
security definer
as $$
declare
  sender_email text;
  saved public.messages;
begin
  select email into sender_email from public.users where id = p_sender_id;
  if sender_email is null then
    raise exception 'Add your email to chat and trade with others';
  end if;

  insert into public.messages (sender_id, receiver_id, message_text)
  values (p_sender_id, p_receiver_id, trim(p_message_text))
  returning * into saved;

  insert into public.analytics_events (user_id, event_name, properties)
  values (p_sender_id, 'message_sent', jsonb_build_object('type', 'private', 'receiver_id', p_receiver_id));

  return saved;
end;
$$;

create or replace function public.send_public_message(
  p_user_id uuid,
  p_message_text text
)
returns public.public_messages
language plpgsql
security definer
as $$
declare
  saved public.public_messages;
begin
  insert into public.public_messages (user_id, message_text)
  values (p_user_id, trim(p_message_text))
  returning * into saved;

  insert into public.analytics_events (user_id, event_name, properties)
  values (p_user_id, 'message_sent', jsonb_build_object('type', 'public'));

  return saved;
end;
$$;

alter table public.users enable row level security;
alter table public.stickers enable row level security;
alter table public.user_stickers enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;
alter table public.public_messages enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "users read public profiles" on public.users;
create policy "users read public profiles"
on public.users for select
using (true);

drop policy if exists "users update own profile" on public.users;
create policy "users update own profile"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "stickers readable by all" on public.stickers;
create policy "stickers readable by all"
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

drop policy if exists "messages insert by sender with email" on public.messages;
create policy "messages insert by sender with email"
on public.messages for insert
with check (
  auth.uid() = sender_id
  and exists (select 1 from public.users where id = auth.uid() and email is not null)
);

drop policy if exists "public messages readable by all" on public.public_messages;
create policy "public messages readable by all"
on public.public_messages for select
using (true);

drop policy if exists "public messages insert by user" on public.public_messages;
create policy "public messages insert by user"
on public.public_messages for insert
with check (auth.uid() = user_id);

drop policy if exists "analytics insert own events" on public.analytics_events;
create policy "analytics insert own events"
on public.analytics_events for insert
with check (auth.uid() = user_id or user_id is null);

-- Realtime setup
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.public_messages;

-- Example queries
-- Create anonymous user:
-- select * from public.create_anonymous_user(gen_random_uuid(), 'PaulaCollector', 39.0997, -94.5786);
--
-- Add sticker or duplicate:
-- select * from public.upsert_user_sticker('<user_uuid>', 'MEX_12', 2, false);
--
-- Mark sticker as needed:
-- select * from public.upsert_user_sticker('<user_uuid>', 'ARG_10', 0, true);
--
-- Find nearby matches:
-- select * from public.find_matches('<user_uuid>', 50, 20);
--
-- Send private message:
-- select * from public.send_private_message('<sender_uuid>', '<receiver_uuid>', 'Want to trade today?');
--
-- Send public message:
-- select * from public.send_public_message('<user_uuid>', 'Looking for MEX 12 near Kansas City.');

