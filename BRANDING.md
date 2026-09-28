# Branding Tandem for your organization

## No-code branding (any install)

Workspace owners and admins open **Settings → Branding** and set:

| Field | Where it shows |
| --- | --- |
| Product name | Header, replacing "Tandem" (a small "Powered by Tandem" footer remains) |
| Logo link | Header mark — a square PNG/SVG URL |
| Accent color | Buttons, links, highlights, focus rings |
| Welcome headline / message | Top of every member's 1-on-1s page |
| Help contact | Footer link — an email (`mailto:`) or URL |

Branding is stored per workspace in the `workspaces` table and protected by the same admin-only update policy as other workspace settings.

## Deeper rebranding (your own copy)

Fork the repo, then:

- **Colors and fonts:** edit the tokens in `src/styles.css` and the font link in `src/routes/__root.tsx`.
- **Public pages:** edit `src/routes/index.tsx` (landing), `src/routes/auth.tsx` (sign-in), `src/routes/self-host.tsx`.
- **Page titles:** each route's `head()` sets its title and description.
- **Starter templates:** the `create_workspace` function in `drizzle/migrations/` seeds the question library.

The MIT license lets you modify and redistribute; keep the `LICENSE` file with your copy.
