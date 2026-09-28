# Tandem

Free, open-source 1-on-1 coaching for leaders at every level: team leads, managers, executives, nonprofit coordinators, volunteer captains.

## Features

- Workspaces with email invites; owner / admin / member roles
- Flexible pairings: reporting lines, skip-levels, or coaching partners
- Shared agenda, leader + report question prompts from templates
- Shared notes and leader-only private notes
- Action items that carry over until done
- Hand-off of a 1-on-1 (and its history) to a new leader
- Growth timeline with Markdown export
- Optional AI summaries and action-item suggestions (never sees private notes)

## Privacy model

- Only the two people in a pairing can edit a meeting. A skip-level leader (the leader's leader) can read shared content.
- Private notes are readable only by their author.
- Workspace admins manage people and templates but cannot read notes.

All rules are enforced in the database with row-level security.

## Stack

TanStack Start (React 19, Vite), Tailwind CSS v4, Postgres with row-level security (Supabase-compatible), Vercel AI SDK.

See [SELF_HOSTING.md](./SELF_HOSTING.md) and [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT — see [LICENSE](./LICENSE).
