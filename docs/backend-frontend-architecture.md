# Sticker Swap Backend + Frontend Architecture

This app uses a low-friction account model:

- Username is required.
- Email is optional at first.
- Anonymous users can collect stickers, browse matches, and post in public chat.
- Adding email upgrades the same `user_id` with magic link auth. A new user should not be created.

## Frontend State

`src/app/lib/backend.ts` is the prototype backend adapter. It stores the same entities in `localStorage` that Supabase will store later:

- `stickerswap.currentUser`
- `stickerswap.userStickers`
- `stickerswap.conversations`
- `stickerswap.publicMessages`
- `stickerswap.analyticsEvents`

First open flow:

1. User enters username.
2. App creates an anonymous user with UUID.
3. User is sent into location permission and then the app.
4. Email is requested only when useful.

Upgrade prompts fire when:

- collected stickers exceed 20
- duplicate total exceeds 5
- user tries to send a private message

Chat rules:

- Public chat is available for all users.
- Private chat is blocked until `email !== null`.
- Email upgrade preserves the same local/Supabase `user_id`.

## Supabase API Calls

Create anonymous user:

```ts
await supabase.rpc('create_anonymous_user', {
  p_id: localUserId,
  p_username: username,
  p_latitude: latitude,
  p_longitude: longitude,
});
```

Add email / upgrade account:

```ts
await supabase.auth.signInWithOtp({ email });
await supabase.rpc('add_email_to_user', {
  p_user_id: localUserId,
  p_email: email,
});
```

Add sticker:

```ts
await supabase.rpc('upsert_user_sticker', {
  p_user_id: userId,
  p_sticker_id: 'MEX_12',
  p_quantity: 1,
  p_is_needed: false,
});
```

Add duplicate:

```ts
await supabase.rpc('upsert_user_sticker', {
  p_user_id: userId,
  p_sticker_id: 'MEX_12',
  p_quantity: 2,
  p_is_needed: false,
});
```

Find matches:

```ts
await supabase.rpc('find_matches', {
  p_user_id: userId,
  p_radius_km: 50,
  p_limit: 20,
});
```

Send private message:

```ts
await supabase.rpc('send_private_message', {
  p_sender_id: userId,
  p_receiver_id: receiverId,
  p_message_text: message,
});
```

Send public message:

```ts
await supabase.rpc('send_public_message', {
  p_user_id: userId,
  p_message_text: message,
});
```

## Realtime Subscriptions

Private messages:

```ts
supabase
  .channel(`private_messages:${userId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `receiver_id=eq.${userId}`,
    },
    (payload) => {
      // append message to private conversation
    }
  )
  .subscribe();
```

Public messages:

```ts
supabase
  .channel('public_messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'public_messages',
    },
    (payload) => {
      // append message to public room
    }
  )
  .subscribe();
```

## Analytics Events

Track these events in `analytics_events`:

- `app_open`
- `username_created`
- `sticker_added`
- `duplicate_added`
- `collection_progress`
- `nearby_users_found`
- `match_found`
- `chat_attempted`
- `chat_unlocked`
- `message_sent`
- `email_added`

