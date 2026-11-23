# Project memory

## Product intent & audience

- Next.js application with Supabase backend integration (auth/database).

## Brand personality & voice

- Production-quality, beautiful, non-cookie-cutter web pages (per `.bolt/prompt`).

## Visual design & UX direction

- Stack: Next.js, Tailwind CSS, shadcn/ui, React hooks, Lucide React icons.
- Aesthetic: polished, custom, production-worthy — avoid generic templates.

## Decisions, constraints & rationale

- Supabase client lives at `lib/supabase.ts`; uses `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)`.
- Env vars require `NEXT_PUBLIC_` prefix (client-side access). Correct names: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `.gitignore` already excludes `.env` — confirmed, no change needed.
- Do not modify existing database, tables, data, or unrelated code.
- Never print or expose credentials.
- `.env` file must exist at project root for Next.js to load it; missing file was root cause of `supabaseUrl is required`.
- Dev server restart required after adding `.env` so Next.js picks up variables.

## Open questions & assumptions

- Supabase credentials must be supplied by user; cannot be inferred or created.
- Assumption: user will provide valid `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase dashboard.