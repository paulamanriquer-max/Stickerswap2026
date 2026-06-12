-- StickerSwap KC: verify and repair sticker tracking.
-- Run this in the correct Supabase project: cntnhuhvfzyebkjbirje.
-- This makes sure the app can save Owned, Missing, and Dupes into public.user_stickers,
-- then shows a per-user sticker tracking report.

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

create index if not exists user_stickers_user_idx on public.user_stickers (user_id);
create index if not exists user_stickers_duplicates_idx on public.user_stickers (sticker_code) where owned = true and duplicate_count > 0;
create index if not exists user_stickers_missing_idx on public.user_stickers (sticker_code) where missing = true;

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
  select *
  from public.user_stickers
  where user_id = auth.uid()
  order by sticker_code;
end;
$$;

grant execute on function public.upsert_user_sticker(text, boolean, boolean, int) to authenticated;
grant execute on function public.upsert_user_stickers_bulk(jsonb) to authenticated;

select
  coalesce(p.username, split_part(au.email, '@', 1), 'Collector') as collector,
  lower(coalesce(p.email, au.email, '')) as email,
  coalesce(count(us.sticker_code), 0)::int as tracked_rows,
  coalesce(count(us.sticker_code) filter (where us.owned = true), 0)::int as owned,
  coalesce(sum(us.duplicate_count), 0)::int as dupes,
  coalesce(count(us.sticker_code) filter (where us.missing = true), 0)::int as saved_missing_rows,
  coalesce(max(us.updated_at), p.last_active, au.last_sign_in_at, au.created_at) as last_sticker_sync
from auth.users au
left join public.profiles p on p.id = au.id
left join public.user_stickers us on us.user_id = au.id
where lower(coalesce(au.email, p.email, '')) <> 'paulaadmin@stickerswap.com'
group by au.id, au.email, au.created_at, au.last_sign_in_at, p.username, p.email, p.last_active
order by collector;
