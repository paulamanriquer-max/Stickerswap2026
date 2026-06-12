-- StickerSwap KC: show all active collectors, not only users currently inside the location radius.
-- Run this once in the correct Supabase project: cntnhuhvfzyebkjbirje.

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
    status = case when status = 'banned' then 'banned' else 'active' end,
    last_active = now()
where lower(coalesce(email, '')) <> 'paulaadmin@stickerswap.com';

insert into public.notification_preferences (user_id)
select p.id
from public.profiles p
left join public.notification_preferences np on np.user_id = p.id
where np.user_id is null;

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
  (select count(*) from auth.users where lower(coalesce(email, '')) <> 'paulaadmin@stickerswap.com') as auth_users,
  (select count(*) from public.profiles where lower(coalesce(email, '')) <> 'paulaadmin@stickerswap.com' and status = 'active' and profile_visible = true) as visible_collectors;
