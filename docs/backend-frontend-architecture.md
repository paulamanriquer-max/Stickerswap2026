# StickerSwap Backend + Frontend Architecture

This app is now designed for real user testing with an email-backed account model and Supabase as the live backend.

## Account Model

- Users create an account with name, email, and password.
- Duplicate emails are not allowed.
- Password recovery starts from the Log in screen.
- The security question is stored for account recovery context, with a Supabase Edge Function handling password reset.
- Location is optional and can be turned on or off from Location Settings.
- New users start with every sticker set to Missing.

## Live Backend

The app is configured for Supabase when `VITE_BACKEND_MODE=supabase`.

- Accounts are created through Supabase Auth.
- Profiles are stored in `profiles`.
- Sticker status changes are stored in `user_stickers`.
- Matching reads live collector data.
- Kansas City public chat stores messages in `public_messages`.
- Analytics events are stored in `analytics_events`.

## Supabase Files

- `supabase/schema.sql` creates the live database tables, security policies, matching functions, chat functions, analytics, notification preferences, and realtime setup.
- `supabase/seed_stickers.sql` inserts all 992 stickers from the app checklist in album order.
- `.env.example` shows the values needed to connect the app to a Supabase project.

## Tables

- `profiles`: user profile, email, status, location, privacy, recovery question metadata
- `stickers`: Panini checklist source of truth
- `user_stickers`: each user's owned, missing, and duplicate count
- `messages`: private chat
- `public_messages`: Kansas City community room
- `analytics_events`: admin/activity tracking
- `notification_preferences`: push notification settings

## Sticker Rules

- Missing is the default for every sticker.
- Owned means the user has at least one physical copy.
- Duplicate means the user owns the sticker and has extras available to trade.
- Supabase enforces that a duplicate cannot exist unless the sticker is owned.
- Owned and Missing cannot both be true.

## Matching

`find_matches()` returns collectors sorted by useful trade overlap:

- Matches: stickers I need that they have as duplicates.
- You Need: my full missing list.
- They Need: their full missing list.
- Score: percent of my missing list they can help with.
- Location: if both users allow location, the function filters by radius; otherwise it stays in the Kansas City MVP market.

## Chat

- Public room: Kansas City Community.
- Private messages: sender and receiver only.
- Realtime is enabled for private and public messages.

## Security

Supabase RLS policies enforce:

- users can update only their own profile
- users can read and edit only their own sticker collection
- messages are visible only to sender and receiver
- public room messages are visible to authenticated users
- notification settings are visible/editable only by the current user
