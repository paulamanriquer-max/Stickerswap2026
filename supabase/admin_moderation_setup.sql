-- StickerSwap admin moderation actions
-- Run this in Supabase SQL Editor after admin_report_setup.sql.

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

revoke execute on function public.admin_delete_public_message(text, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_public_message(text, text, uuid) to anon, authenticated;
