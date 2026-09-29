# Self-hosting Tandem

This guide covers making your own copy of Tandem, connecting it to a Supabase-compatible backend, and deploying it to a Workers-compatible host.

## What you need

- A GitHub account
- [Bun](https://bun.sh/) for local development
- A hosted or self-managed Supabase-compatible PostgreSQL backend with authentication
- A Workers-compatible deployment account and an HTTPS domain
- Optional: an OpenAI Responses-compatible AI provider

## 1. Get your own copy

Fork [mckinneylibrary/leadershiptandem](https://github.com/mckinneylibrary/leadershiptandem), then clone your fork:

```bash
git clone https://github.com/YOUR-ACCOUNT/leadershiptandem.git
cd leadershiptandem
bun install
```

You can also remix the project in Lovable and connect the resulting project to your GitHub account.

## 2. Create the backend

1. Create a hosted backend project or start a compatible local backend.
2. Apply every SQL file in `drizzle/migrations/` in filename order:
   - `0000_coaching_core.sql`
   - `0001_starter_templates.sql`
   - `0002_workspace_branding.sql`
3. Confirm email/password sign-in is enabled.
4. Optionally configure Google sign-in.
5. Add your local and production addresses to the allowed site and redirect URLs.

The first migration creates the tables, row-level security policies, roles, and workspace functions. The second installs the nine starter templates and 90 prompts. The third adds workspace branding.

Do not remove or weaken row-level security. In particular, private notes must remain author-only and excluded from AI requests.

## 3. Set environment variables

Create a local `.env` file. It is ignored by Git and must not be committed.

```dotenv
# Browser connection
VITE_SUPABASE_URL=https://YOUR-BACKEND.example
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

# Server-side authentication support
SUPABASE_URL=https://YOUR-BACKEND.example
SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY

# Optional AI — use an OpenAI Responses-compatible provider
AI_BASE_URL=https://api.your-provider.example/v1
AI_API_KEY=YOUR_PRIVATE_AI_KEY
AI_MODEL=YOUR_PROVIDER_MODEL_ID
```

The publishable backend key is designed for browser use; database row-level security remains responsible for access control. Never expose an administrative database key or the private `AI_API_KEY` in browser code or a `VITE_` variable.

Leave all three AI variables unset to run Tandem without AI. Admins can also turn configured AI features off per workspace in **Settings**.

## 4. Run locally

```bash
bun run dev
```

Open the local address shown in the terminal. Before deploying, run:

```bash
bun run lint
bun run build
```

## 5. Configure sign-in

- **Email and password:** keep email confirmation enabled unless your use case intentionally requires otherwise.
- **Google:** create and configure the provider, then add the callback address supplied by your backend authentication service.
- **Redirects:** allow both your local development address and the final HTTPS production address.

Workspace invitations do not send email. An admin records an invited email in Tandem and separately gives the person the site address. The invite is accepted automatically when that exact email signs in.

## 6. Deploy

Build Tandem with `bun run build`, then deploy the generated application using your Workers-compatible host's TanStack Start deployment process. Configure the same environment variables in the host's settings; keep `AI_API_KEY` secret.

After deployment:

1. Point your domain to the deployment and require HTTPS.
2. Update authentication site and redirect URLs to the final domain.
3. Create a test account and workspace.
4. Confirm all nine starter templates appear.
5. Invite a second test account and verify it joins with the invited email.
6. Verify shared notes are visible to both participants.
7. Verify each person's private notes are visible only to their author.
8. If AI is enabled, verify summaries use shared content only.

## Progressive web app support

Tandem already includes its web app manifest, favicon, home-screen icons, standalone display mode, and phone/tablet-safe viewport settings. Serve the production site over HTTPS so browsers can offer installation.

The app currently requires a network connection. The service deliberately does not cache meeting notes on the device for offline use.

If you change the product identity, update the PWA files described in [BRANDING.md](./BRANDING.md).

## Backups and operations

- Enable automated database backups with your backend host.
- Test restoration before relying on the installation for important records.
- Keep production secrets in the deployment host, never in the repository.
- Monitor failed sign-ins, database health, and deployment errors.
- Review dependency and platform updates regularly.

## Updating your installation

Keep your changes on a branch or fork. To adopt upstream updates:

1. Review the changes from the [Tandem repository](https://github.com/mckinneylibrary/leadershiptandem).
2. Back up the database.
3. Merge the code into a test branch.
4. Apply only new migration files, in order.
5. Run lint and build checks.
6. Test sign-in, meetings, privacy boundaries, templates, and branding before production deployment.

Never rerun edited historical migrations against an established production database. Add a new migration for schema changes.

## Brand your copy

Workspace owners and admins can make no-code changes in **Settings → Branding**. For a full product rename, source logo replacement, or custom app icons, follow [BRANDING.md](./BRANDING.md).

## License

Tandem is MIT-licensed. You may use, modify, brand, host, and redistribute it, provided your copy retains the required license notice. See [LICENSE](./LICENSE).