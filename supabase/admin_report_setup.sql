-- StickerSwap live admin report
-- Run this once in Supabase SQL Editor before launch.

create extension if not exists pgcrypto;

create or replace function public.admin_report(p_admin_email text, p_admin_password text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  is_admin boolean;
begin
  select lower(trim(p_admin_email)) = 'paulaadmin@stickerswap.com'
    and encode(digest(lower(trim(p_admin_email)) || ':stickerswap-admin:' || p_admin_password, 'sha256'), 'hex') = '8ee25e3331bc1c4706cba86cf2dc0b3e71e73e6b4d6f2172bf41a3eadcc0c567'
  into is_admin;

  if not is_admin then
    raise exception 'Invalid admin credentials';
  end if;

  return jsonb_build_object(
    'users',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.username,
          'email', p.email,
          'joinedAt', to_char(p.created_at, 'YYYY-MM-DD'),
          'lastActive', to_char(p.last_active, 'YYYY-MM-DD'),
          'stickers', coalesce(s.collected_count, 0),
          'trades', coalesce(m.private_message_count, 0),
          'status', p.status,
          'location', case
            when p.location_enabled and p.latitude is not null and p.longitude is not null then 'Kansas City + location on'
            else 'Kansas City'
          end
        )
        order by p.created_at desc
      )
      from public.profiles p
      left join (
        select
          user_id,
          count(*) filter (where owned = true or duplicate_count > 0)::int as collected_count
        from public.user_stickers
        group by user_id
      ) s on s.user_id = p.id
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
      ) m on m.participant_id = p.id
    ), '[]'::jsonb),
    'publicMessages',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pm.id,
          'user', coalesce(p.username, 'Unknown collector'),
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
      where pm.room_key = 'kansas_city'
      limit 200
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.admin_report(text, text) from public, anon, authenticated;
grant execute on function public.admin_report(text, text) to anon, authenticated;
