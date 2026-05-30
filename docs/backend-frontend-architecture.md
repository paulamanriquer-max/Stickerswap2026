# StickerSwap Backend + Frontend Architecture

This app is now designed for real user testing with an email-backed account model and Supabase as the live backend.

## Account Model

- Users create an account with name, email, and password.
- Duplicate emails are not allowed.
- Password recovery starts from the Log in screen.
- The security question is stored for account recovery context, but the safest production reset path is still Supabase email recovery or a small Supabase Edge Function.
- Location is optional and can be turned on or off from Location Settings.
- New users start with every sticker set to Missing.

## Current Local Preview

The local preview still works without Supabase credentials. It stores data in the browser so you can keep testing UX quickly:

- current user
- sticker statuses
- private and public chats
- notification preferences
- privacy settings
- admin user/activity data

## Supabase Files

- `supabase/schema.sql` creates the live database tables, security policies, matching functions, chat functions, analytics, notification preferences, and realtime setup.
- `supabase/seed_stickers.sql` inserts all 992 stickers from the app checklist in album order.
- `.env.example` shows the values needed to connect the app to a Supabase project.

## Tables

- `profiles`: user profile, email, status, location, privacy, recovery question metadata
- `stickers`: Panini checklist source of truth
- `user_stickers`: each user’s owned, missing, and duplicate count
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

## Setup Steps

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed_stickers.sql`.
5. Copy `.env.example` to `.env`.
6. Add your Supabase Project URL and anon key.
7. Change `VITE_BACKEND_MODE=local` to `VITE_BACKEND_MODE=supabase` when we are ready to switch the app from local preview storage to live Supabase data.

## Important Launch Note

The database is ready for live data. The app still needs the final adapter switch after the Supabase URL and anon key exist. Keeping `VITE_BACKEND_MODE=local` protects the current preview while setup is incomplete.
