-- StickerSwap live admin report
-- Run this in Supabase SQL Editor. It reads Supabase Auth first, so Admin can
-- still show signups even if a profile row failed to create.

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

revoke execute on function public.admin_report(text, text) from public, anon, authenticated;
grant execute on function public.admin_report(text, text) to anon, authenticated;
