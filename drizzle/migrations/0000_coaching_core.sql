
create type public.workspace_role as enum ('owner','admin','member');

create table public.profiles (
  id uuid primary key,
  display_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ai_enabled boolean not null default true,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
grant select, update on public.workspaces to authenticated;
grant all on public.workspaces to service_role;
alter table public.workspaces enable row level security;

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);
grant select, insert, update, delete on public.workspace_members to authenticated;
grant all on public.workspace_members to service_role;
alter table public.workspace_members enable row level security;

create table public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.workspace_role not null default 'member',
  invited_by uuid not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.workspace_invites to authenticated;
grant all on public.workspace_invites to service_role;
alter table public.workspace_invites enable row level security;

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text not null default '',
  leader_prompts jsonb not null default '[]'::jsonb,
  report_prompts jsonb not null default '[]'::jsonb,
  published boolean not null default false,
  version int not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.templates to authenticated;
grant all on public.templates to service_role;
alter table public.templates enable row level security;

create table public.pairings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  leader_id uuid not null,
  report_id uuid not null,
  kind text not null default 'reports_to',
  cadence_days int not null default 14,
  template_id uuid references public.templates(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (workspace_id, leader_id, report_id)
);
grant select, insert, update, delete on public.pairings to authenticated;
grant all on public.pairings to service_role;
alter table public.pairings enable row level security;

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  held_on date not null default current_date,
  status text not null default 'open',
  template_name text,
  leader_prompts jsonb not null default '[]'::jsonb,
  report_prompts jsonb not null default '[]'::jsonb,
  ai_summary text,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.meetings to authenticated;
grant all on public.meetings to service_role;
alter table public.meetings enable row level security;

create table public.agenda_items (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  author_id uuid not null,
  body text not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.agenda_items to authenticated;
grant all on public.agenda_items to service_role;
alter table public.agenda_items enable row level security;

create table public.meeting_notes (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  author_id uuid not null,
  visibility text not null default 'shared' check (visibility in ('shared','private')),
  body text not null default '',
  updated_at timestamptz not null default now(),
  unique (meeting_id, author_id, visibility)
);
grant select, insert, update, delete on public.meeting_notes to authenticated;
grant all on public.meeting_notes to service_role;
alter table public.meeting_notes enable row level security;

create table public.action_items (
  id uuid primary key default gen_random_uuid(),
  pairing_id uuid not null references public.pairings(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete set null,
  owner_id uuid not null,
  body text not null,
  due_date date,
  done_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.action_items to authenticated;
grant all on public.action_items to service_role;
alter table public.action_items enable row level security;

create or replace function public.is_member(_ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from workspace_members where workspace_id=_ws and user_id=auth.uid())
$$;
create or replace function public.has_workspace_role(_ws uuid, _role workspace_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from workspace_members where workspace_id=_ws and user_id=auth.uid()
    and (role=_role or role='owner'))
$$;
create or replace function public.can_view_pairing(_p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from pairings p where p.id=_p and (
      p.leader_id=auth.uid() or p.report_id=auth.uid()
      or exists (select 1 from pairings s where s.workspace_id=p.workspace_id and s.active
                 and s.report_id=p.leader_id and s.leader_id=auth.uid() and s.kind='reports_to')
    ))
$$;
create or replace function public.is_pairing_party(_p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from pairings p where p.id=_p and (p.leader_id=auth.uid() or p.report_id=auth.uid()))
$$;
create or replace function public.meeting_pairing(_m uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select pairing_id from meetings where id=_m
$$;
create or replace function public.shares_workspace(_u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from workspace_members a join workspace_members b on a.workspace_id=b.workspace_id
    where a.user_id=auth.uid() and b.user_id=_u)
$$;

create policy "profiles read" on public.profiles for select to authenticated using (id=auth.uid() or public.shares_workspace(id));
create policy "profiles insert self" on public.profiles for insert to authenticated with check (id=auth.uid());
create policy "profiles update self" on public.profiles for update to authenticated using (id=auth.uid());

create policy "ws read" on public.workspaces for select to authenticated using (public.is_member(id));
create policy "ws admin update" on public.workspaces for update to authenticated using (public.has_workspace_role(id,'admin'));

create policy "members read" on public.workspace_members for select to authenticated using (public.is_member(workspace_id));
create policy "members admin write" on public.workspace_members for update to authenticated using (public.has_workspace_role(workspace_id,'admin'));
create policy "members admin delete" on public.workspace_members for delete to authenticated using (public.has_workspace_role(workspace_id,'admin') or user_id=auth.uid());

create policy "invites admin read" on public.workspace_invites for select to authenticated using (public.has_workspace_role(workspace_id,'admin'));
create policy "invites admin insert" on public.workspace_invites for insert to authenticated with check (public.has_workspace_role(workspace_id,'admin') and invited_by=auth.uid());
create policy "invites admin delete" on public.workspace_invites for delete to authenticated using (public.has_workspace_role(workspace_id,'admin'));

create policy "templates read" on public.templates for select to authenticated using (public.is_member(workspace_id));
create policy "templates admin insert" on public.templates for insert to authenticated with check (public.has_workspace_role(workspace_id,'admin'));
create policy "templates admin update" on public.templates for update to authenticated using (public.has_workspace_role(workspace_id,'admin'));
create policy "templates admin delete" on public.templates for delete to authenticated using (public.has_workspace_role(workspace_id,'admin'));

create policy "pairings read" on public.pairings for select to authenticated using (public.can_view_pairing(id) or public.has_workspace_role(workspace_id,'admin'));
create policy "pairings insert" on public.pairings for insert to authenticated with check (public.is_member(workspace_id) and (leader_id=auth.uid() or public.has_workspace_role(workspace_id,'admin')));
create policy "pairings update" on public.pairings for update to authenticated using (leader_id=auth.uid() or public.has_workspace_role(workspace_id,'admin'));
create policy "pairings delete" on public.pairings for delete to authenticated using (leader_id=auth.uid() or public.has_workspace_role(workspace_id,'admin'));

create policy "meetings read" on public.meetings for select to authenticated using (public.can_view_pairing(pairing_id));
create policy "meetings insert" on public.meetings for insert to authenticated with check (public.is_pairing_party(pairing_id) and created_by=auth.uid());
create policy "meetings update" on public.meetings for update to authenticated using (public.is_pairing_party(pairing_id));
create policy "meetings delete" on public.meetings for delete to authenticated using (public.is_pairing_party(pairing_id));

create policy "agenda read" on public.agenda_items for select to authenticated using (public.can_view_pairing(public.meeting_pairing(meeting_id)));
create policy "agenda insert" on public.agenda_items for insert to authenticated with check (public.is_pairing_party(public.meeting_pairing(meeting_id)) and author_id=auth.uid());
create policy "agenda update" on public.agenda_items for update to authenticated using (public.is_pairing_party(public.meeting_pairing(meeting_id)));
create policy "agenda delete" on public.agenda_items for delete to authenticated using (author_id=auth.uid());

create policy "notes read" on public.meeting_notes for select to authenticated using (
  (visibility='private' and author_id=auth.uid())
  or (visibility='shared' and public.can_view_pairing(public.meeting_pairing(meeting_id))));
create policy "notes insert" on public.meeting_notes for insert to authenticated with check (author_id=auth.uid() and public.is_pairing_party(public.meeting_pairing(meeting_id)));
create policy "notes update" on public.meeting_notes for update to authenticated using (author_id=auth.uid());
create policy "notes delete" on public.meeting_notes for delete to authenticated using (author_id=auth.uid());

create policy "actions read" on public.action_items for select to authenticated using (public.can_view_pairing(pairing_id));
create policy "actions insert" on public.action_items for insert to authenticated with check (public.is_pairing_party(pairing_id) and created_by=auth.uid());
create policy "actions update" on public.action_items for update to authenticated using (public.is_pairing_party(pairing_id));
create policy "actions delete" on public.action_items for delete to authenticated using (public.is_pairing_party(pairing_id));

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), coalesce(new.email,''))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.create_workspace(_name text) returns uuid
language plpgsql security definer set search_path = public as $$
declare ws uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into workspaces(name, created_by) values (_name, auth.uid()) returning id into ws;
  insert into workspace_members(workspace_id, user_id, role) values (ws, auth.uid(), 'owner');
  insert into templates(workspace_id, name, description, leader_prompts, report_prompts, published) values
  (ws,'Weekly check-in','A light, regular pulse on work and wellbeing.',
    '["What went well since we last talked?","Where can I remove a blocker for you?","What feedback do I owe you?"]',
    '["What is on your mind this week?","What are you stuck on?","What would make next week great?"]', true),
  (ws,'Career growth','Longer-horizon conversation about direction and skills.',
    '["Where do you want to be in 1-2 years?","Which skill should we invest in next?","What stretch opportunity could I open up?"]',
    '["What work energizes you most lately?","What do you want to learn?","How can I help you grow?"]', true),
  (ws,'First 90 days','For someone new to the team or role.',
    '["What has surprised you so far?","Who should you meet next?","Is anything unclear about expectations?"]',
    '["What is going well in onboarding?","What still feels confusing?","What support do you need?"]', true),
  (ws,'Skip-level','A leader meeting with their report''s reports.',
    '["What is working well on your team?","What would you change if you could?","What should I know that I might not hear?"]',
    '["What do you want leadership to understand?","Where do you see opportunity?"]', true);
  return ws;
end $$;
grant execute on function public.create_workspace(text) to authenticated;

create or replace function public.accept_invites() returns int
language plpgsql security definer set search_path = public as $$
declare n int := 0; r record; em text;
begin
  select email into em from auth.users where id=auth.uid();
  for r in select * from workspace_invites where lower(email)=lower(em) and accepted_at is null loop
    insert into workspace_members(workspace_id,user_id,role) values (r.workspace_id, auth.uid(), r.role)
      on conflict (workspace_id,user_id) do nothing;
    update workspace_invites set accepted_at=now() where id=r.id;
    n := n+1;
  end loop;
  return n;
end $$;
grant execute on function public.accept_invites() to authenticated;
