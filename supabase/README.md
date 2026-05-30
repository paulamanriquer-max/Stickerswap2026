# Supabase Setup

Run these files in this order from the Supabase SQL Editor:

1. `schema.sql`
2. `seed_stickers.sql`

Then copy `.env.example` to `.env` and fill in:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_BACKEND_MODE=supabase
```

The local app preview should stay on `VITE_BACKEND_MODE=local` until the Supabase project is created and the schema has been run.
