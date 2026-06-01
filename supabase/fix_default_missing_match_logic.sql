-- Fix StickerSwap matching so "missing" follows the product rule:
-- any sticker the user does not own is missing by default, even if no row
-- exists yet in user_stickers.

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
  my_missing as (
    select stickers.code as sticker_code
    from public.stickers
    left join public.user_stickers
      on user_stickers.user_id = auth.uid()
      and user_stickers.sticker_code = stickers.code
    where coalesce(user_stickers.owned, false) = false
      and coalesce(user_stickers.duplicate_count, 0) = 0
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
  other_missing as (
    select
      visible_users.id as user_id,
      stickers.code as sticker_code
    from visible_users
    cross join public.stickers
    left join public.user_stickers
      on user_stickers.user_id = visible_users.id
      and user_stickers.sticker_code = stickers.code
    where coalesce(user_stickers.owned, false) = false
      and coalesce(user_stickers.duplicate_count, 0) = 0
  ),
  scored as (
    select
      visible_users.id,
      visible_users.username,
      visible_users.email,
      visible_users.distance_km,
      (
        select array_agg(distinct user_stickers.sticker_code order by user_stickers.sticker_code)
        from public.user_stickers
        join my_missing
          on my_missing.sticker_code = user_stickers.sticker_code
        where user_stickers.user_id = visible_users.id
          and user_stickers.owned = true
          and user_stickers.duplicate_count > 0
      ) as matches,
      (select array_agg(sticker_code order by sticker_code) from my_missing) as you_need,
      (
        select array_agg(sticker_code order by sticker_code)
        from other_missing
        where other_missing.user_id = visible_users.id
      ) as they_need,
      (
        select count(distinct user_stickers.sticker_code)::int
        from public.user_stickers
        join my_missing
          on my_missing.sticker_code = user_stickers.sticker_code
        where user_stickers.user_id = visible_users.id
          and user_stickers.owned = true
          and user_stickers.duplicate_count > 0
      ) as they_have_you_need,
      (
        select count(distinct my_duplicates.sticker_code)::int
        from my_duplicates
        join other_missing
          on other_missing.sticker_code = my_duplicates.sticker_code
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

grant execute on function public.find_matches(double precision, int) to authenticated;
