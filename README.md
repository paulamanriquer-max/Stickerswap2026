
# Sticker Swap 2026

This is now the source of truth for the Sticker Swap 2026 app. Future app, data, backend, and UX changes should be made here in Codex instead of Figma Make.

## Previewing the app

The easiest preview file is generated at:

`dist/stickerswap-preview.html`

Open that file in your browser to test the app without Figma Make.

## Editing workflow

1. Ask Codex for the product or database change.
2. Codex edits the source files in this repo.
3. Codex runs a build and refreshes `dist/stickerswap-preview.html`.
4. You open the preview file and test the app.
5. When ready, run `push-stickerswap-to-github.command` from the Codex folder.

## Backend

The Supabase-ready backend schema is in:

`supabase/schema.sql`

The architecture notes and example API calls are in:

`docs/backend-frontend-architecture.md`
