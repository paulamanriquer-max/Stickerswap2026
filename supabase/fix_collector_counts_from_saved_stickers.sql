-- StickerSwap KC: make Collectors use saved user_stickers counts.
-- Run this in Supabase project cntnhuhvfzyebkjbirje if Supabase shows sticker rows
-- but the app card still shows 0 for "They need".

create or replace function public.find_matches(
  p_radius_km double precision default 80,
  p_limit int default 100
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
  ),
  my_missing as (
    select us.sticker_code
    from public.user_stickers us
    where us.user_id = auth.uid()
      and coalesce(us.owned, false) = false
      and coalesce(us.duplicate_count, 0) = 0
  ),
  my_duplicates as (
    select us.sticker_code
    from public.user_stickers us
    where us.user_id = auth.uid()
      and us.owned = true
      and us.duplicate_count > 0
  ),
  other_missing as (
    select
      us.user_id,
      us.sticker_code
    from public.user_stickers us
    join visible_users on visible_users.id = us.user_id
    where coalesce(us.owned, false) = false
      and coalesce(us.duplicate_count, 0) = 0
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
  order by scored.they_have_you_need desc, match_score desc, scored.distance_km asc, scored.username asc
  limit p_limit;
$$;

grant execute on function public.find_matches(double precision, int) to authenticated;

select
  coalesce(p.username, split_part(au.email, '@', 1), 'Collector') as collector,
  count(us.sticker_code) filter (where us.owned = true)::int as owned,
  coalesce(sum(us.duplicate_count), 0)::int as dupes,
  count(us.sticker_code) filter (where us.missing = true)::int as missing_saved
from auth.users au
left join public.profiles p on p.id = au.id
left join public.user_stickers us on us.user_id = au.id
where lower(coalesce(au.email, p.email, '')) <> 'paulaadmin@stickerswap.com'
group by au.id, au.email, p.username
order by collector;
