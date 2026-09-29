# Contributing to Tandem

Thank you for helping make thoughtful 1-on-1s available to leaders everywhere.

Repository: [github.com/mckinneylibrary/leadershiptandem](https://github.com/mckinneylibrary/leadershiptandem)

## Before you begin

- Search existing issues before opening a new one.
- Open an issue before a large feature or major design change so the direction can be discussed.
- Keep changes focused; avoid unrelated cleanup in the same pull request.
- Never include real meeting content, user information, credentials, or private keys in issues, screenshots, fixtures, or commits.

## Local setup

```bash
git clone https://github.com/mckinneylibrary/leadershiptandem.git
cd leadershiptandem
bun install
bun run dev
```

Follow [SELF_HOSTING.md](./SELF_HOSTING.md) to create a local backend and set the required environment variables. Keep `.env` local and uncommitted.

## Product principles

- **Organization-neutral:** avoid HR-specific, government-specific, or industry-specific assumptions and wording.
- **Useful at every leadership level:** features and language should work for peers, mentors, team leads, executives, volunteers, and other relationships.
- **Private by design:** private notes are author-only and must never be sent to AI.
- **AI is optional:** every core workflow must remain useful when AI is disabled or unavailable.
- **Professional and accessible:** preserve the clean Tandem design, strong hierarchy, readable contrast, keyboard access, and phone/tablet usability.

## Security and data rules

- Enforce access in database row-level security, not only in interface controls.
- Store workspace roles only in the dedicated membership table and use the existing role-checking function.
- Every new public table must include explicit grants, row-level security, and policies in the same migration.
- Never broaden meeting or note access merely to simplify a query.
- AI server functions may read shared content only.
- Meetings copy template prompts at creation; preserve this behavior so template edits cannot rewrite history.
- Add a new migration for schema changes. Do not edit a migration that has already shipped.

## Interface and content

- Use semantic design tokens from `src/styles.css`; do not hardcode visual colors in pages.
- Reuse the existing interface controls and patterns.
- Test long names and content at phone, tablet, and desktop widths.
- Keep visible language direct, calm, and free of technical jargon.
- New content should make sense in commercial, nonprofit, community, education, and public-service settings without naming any one sector.

## Quality checks

Before opening a pull request, run:

```bash
bun run lint
bun run build
```

Also test the workflow you changed in the browser. For data or permission changes, use two accounts with different roles and verify both allowed and denied behavior. For AI changes, confirm private notes are absent from every request.

## Pull requests

Include:

- A concise description of the problem and solution
- The user-facing behavior that changed
- Screenshots for visible changes at relevant screen sizes
- Database migration and permission notes when applicable
- The checks and browser flows you completed

By contributing, you agree that your work is released under the project's [MIT License](./LICENSE).