# Self-hosting Tandem

## 0. Get your own copy

Fork the repository (or remix the project in Lovable) and clone it:

```
git clone https://github.com/<you>/tandem.git
cd tandem
```

## 1. Database and auth

Tandem uses Supabase (hosted or self-hosted) for Postgres, auth and row-level security.

1. Create a Supabase project (or run `supabase start` locally).
2. Apply the SQL in `drizzle/migrations/` in order.
3. Enable email/password sign-in (and optionally Google).
4. Set the site URL / redirect URLs to your domain.

## 2. Environment

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...

# Optional AI (any OpenAI Responses-compatible endpoint)
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-...
AI_MODEL=gpt-5
```

Leave the AI variables unset to run without AI. Admins can also turn AI off per workspace in Settings.

## 3. Run and deploy

```
bun install
bun run dev      # development
bun run build    # production build (Cloudflare Workers compatible)
```

Deploy the build to Cloudflare Workers (`wrangler deploy`) or any Workers-compatible host, and point your domain at it.

## 4. Brand it

See [BRANDING.md](./BRANDING.md) — no-code branding in Settings, or deeper changes in your fork.
