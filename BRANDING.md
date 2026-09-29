# Branding Tandem for your organization

Tandem's default identity uses a clean light interface, deep teal-navy text, bold modern headings, and a teal-to-green growth mark. You can brand one workspace from Settings or fully rebrand your own source copy.

## Workspace branding without code

Workspace owners and admins open **Settings → Branding** and set:

| Field | Where it appears |
| --- | --- |
| Product name | The signed-in header, replacing “Tandem” |
| Logo link | The signed-in header mark |
| Accent color | Buttons, links, highlights, and focus rings |
| Welcome headline | The top of each member's 1-on-1 home page |
| Welcome message | Supporting text below the welcome headline |
| Help contact | The signed-in footer as an email or web link |

Enable the accent-color checkbox before saving if you want the selected color to replace the default teal and green accent. Clear fields to return to Tandem defaults.

### Logo requirements

- Use a publicly reachable `https://` image URL.
- A square PNG, WebP, or SVG with clear space around the mark works best.
- The interface displays the image in a small square, so avoid fine text.
- Direct logo file upload is not currently included.

Workspace branding is visible to everyone in that workspace. It does not change the public landing, sign-in, demo, self-hosting, favicon, or installed-app identity. A small **Powered by Tandem · open source** credit remains in the signed-in footer.

## Fully rebrand your own copy

Fork [the Tandem repository](https://github.com/mckinneylibrary/leadershiptandem) to change the complete product identity.

### Brand marks and public imagery

- `src/assets/logo-mark.png` — bundled mark used by the public, sign-in, self-hosting, and signed-in pages
- `public/logo-full.jpg` — full logo used by project materials
- `public/favicon.png` — browser tab icon
- `public/apple-touch-icon.png` — Apple home-screen icon
- `public/icon-192.png` and `public/icon-512.png` — installed-app icons

Replace each image with an equivalent file using the same name and dimensions. Keep important artwork away from the outer edge of maskable app icons, because some devices crop them into circles or rounded shapes.

### Product name and installed-app details

Update:

- `public/manifest.webmanifest` for the full name, short name, description, colors, and app icons
- `src/routes/__root.tsx` for browser and Apple app metadata
- Each route's `head()` metadata for page titles and social descriptions
- Public-facing copy in `src/routes/index.tsx`, `src/routes/auth.tsx`, `src/routes/demo.tsx`, and `src/routes/self-host.tsx`
- This documentation and repository links if you distribute the rebranded copy

Do not add social preview image metadata unless the image is available at an absolute public HTTPS address.

### Colors and typography

The semantic color and typography tokens are in `src/styles.css`. Change the tokens rather than hardcoding colors in individual pages so the interface, states, and workspace accent override remain consistent.

External font links belong in `src/routes/__root.tsx`, not in a CSS `@import` URL.

### Starter coaching content

The `public.create_workspace` function in `drizzle/migrations/0001_starter_templates.sql` creates the starter question library for each new workspace. If you change it:

- Keep language useful across different types of organizations.
- Preserve separate prompts for the leader and the other participant.
- Add a new migration for an existing installation rather than editing a migration that has already run.
- Remember that meetings copy their prompts when created, so later template changes do not rewrite meeting history.

## Before releasing a rebranded copy

1. Check the public page, sign-in page, demo, and all signed-in pages on desktop and mobile.
2. Install the app on an iPhone or iPad and an Android device to confirm its name and icon.
3. Verify readable contrast for the custom accent color.
4. Confirm the logo URL works for signed-in workspace branding.
5. Check page titles, descriptions, support links, and repository links.
6. Verify that private notes remain author-only and never reach AI.

## License and attribution

The MIT license allows modification, rebranding, hosting, and redistribution. Keep the [LICENSE](./LICENSE) file and its required copyright and permission notice with your copy.