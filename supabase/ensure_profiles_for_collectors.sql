-- StickerSwap collector profile repair.
-- Run this once in Supabase SQL Editor if Admin shows users that do not appear in Collectors.

create or replace function public.ensure_my_profile(
  p_username text default null,
  p_email text default null
)
returns setof public.profiles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_auth_user auth.users;
  saved_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into current_auth_user
  from auth.users
  where id = auth.uid();

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
    set username = coalesce(nullif(trim(p_username), ''), public.profiles.username),
        email = lower(coalesce(nullif(trim(p_email), ''), public.profiles.email)),
        status = case when public.profiles.status = 'banned' then 'banned' else 'active' end,
        profile_visible = case when public.profiles.status = 'banned' then false else public.profiles.profile_visible end,
        last_active = now()
  returning * into saved_profile;

  insert into public.notification_preferences (user_id)
  values (saved_profile.id)
  on conflict (user_id) do nothing;

  return next saved_profile;
end;
$$;

revoke execute on function public.ensure_my_profile(text, text) from public, anon, authenticated;
grant execute on function public.ensure_my_profile(text, text) to authenticated;

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

insert into public.notification_preferences (user_id)
select p.id
from public.profiles p
left join public.notification_preferences np on np.user_id = p.id
where np.user_id is null;
