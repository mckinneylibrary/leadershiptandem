alter table public.workspaces
  add column if not exists brand_name text,
  add column if not exists logo_url text,
  add column if not exists accent_color text,
  add column if not exists welcome_headline text,
  add column if not exists welcome_tagline text,
  add column if not exists support_contact text;
alter table public.workspaces add constraint workspaces_accent_hex check (accent_color is null or accent_color ~ '^#[0-9a-fA-F]{6}$');