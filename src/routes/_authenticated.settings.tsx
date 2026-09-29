import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { sendInviteEmail } from "@/lib/invite.functions";
import { CreateWorkspace, useWorkspace, type Role } from "@/lib/workspace";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Tandem" }, { name: "description", content: "Workspace, members and invites." }] }),
  component: Settings,
});

const box = "rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function Settings() {
  const { workspace, isAdmin, members, userId, refresh, switchWorkspace } = useWorkspace();
  const qc = useQueryClient();
  const me = members.find((m) => m.user_id === userId);
  const [displayName, setDisplayName] = useState(me?.display_name ?? "");
  const [wsName, setWsName] = useState(workspace.name);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [creating, setCreating] = useState(false);

  const invites = useQuery({
    queryKey: ["invites", workspace.id],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("workspace_invites").select("*").eq("workspace_id", workspace.id).is("accepted_at", null).order("created_at")).data ?? [],
  });

  const sendInvite = useServerFn(sendInviteEmail);
  const invite = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("workspace_invites").insert({ workspace_id: workspace.id, email: email.trim().toLowerCase(), role, invited_by: userId }).select("id").single();
      if (error) throw error;
      try {
        const r = await sendInvite({ data: { inviteId: data.id, origin: window.location.origin } });
        return r.sent;
      } catch {
        return false;
      }
    },
    onSuccess: (sent) => {
      toast.success(sent ? `Invitation emailed to ${email}.` : `Invite saved. Use "Copy link" to share it with ${email}.`);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["invites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function saveProfile() {
    const { error } = await supabase.from("profiles").update({ display_name: displayName }).eq("id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); refresh(); }
  }
  async function saveWorkspace(patch: { name?: string; ai_enabled?: boolean }) {
    const { error } = await supabase.from("workspaces").update(patch).eq("id", workspace.id);
    if (error) toast.error(error.message);
    else refresh();
  }
  async function setMemberRole(uid: string, r: Role) {
    const { error } = await supabase.from("workspace_members").update({ role: r }).eq("workspace_id", workspace.id).eq("user_id", uid);
    if (error) toast.error(error.message); else refresh();
  }
  async function removeMember(uid: string) {
    if (!confirm("Remove this person from the workspace?")) return;
    const { error } = await supabase.from("workspace_members").delete().eq("workspace_id", workspace.id).eq("user_id", uid);
    if (error) toast.error(error.message); else refresh();
  }

  if (creating) return <CreateWorkspace onCreated={(id) => { setCreating(false); refresh(); switchWorkspace(id); }} />;

  return (
    <div className="space-y-12">
      <h1 className="text-3xl">Settings</h1>

      <section className="space-y-3">
        <h2 className="text-xl">Your profile</h2>
        <div className="flex gap-2">
          <input className={`${box} w-72`} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          <button onClick={saveProfile} className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Save</button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl">Workspace</h2>
        {isAdmin ? (
          <>
            <div className="flex gap-2">
              <input className={`${box} w-72`} value={wsName} onChange={(e) => setWsName(e.target.value)} />
              <button onClick={() => saveWorkspace({ name: wsName })} className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Rename</button>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-primary" checked={workspace.ai_enabled} onChange={(e) => saveWorkspace({ ai_enabled: e.target.checked })} />
              AI summaries and action-item suggestions
            </label>
            <p className="text-xs text-muted-foreground">Admins manage people and templates but can't read anyone's meeting notes.</p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">{workspace.name}. Only admins can change workspace settings.</p>
        )}
        <button onClick={() => setCreating(true)} className="text-sm font-medium text-primary hover:underline">+ Create another workspace</button>
      </section>

      {isAdmin && <Branding />}

      <section className="space-y-3">
        <h2 className="text-xl">Members</h2>
        <ul className="divide-y rounded-lg border bg-card">
          {members.map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
              <div className="flex-1">
                <p className="font-medium">{m.display_name}{m.user_id === userId && " (you)"}</p>
                <p className="text-muted-foreground">{m.email}</p>
              </div>
              {isAdmin && m.role !== "owner" && m.user_id !== userId ? (
                <>
                  <select className={box} value={m.role} onChange={(e) => setMemberRole(m.user_id, e.target.value as Role)}>
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button onClick={() => removeMember(m.user_id)} className="text-muted-foreground hover:text-destructive">Remove</button>
                </>
              ) : (
                <span className="capitalize text-muted-foreground">{m.role}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isAdmin && (
        <section className="space-y-3">
          <h2 className="text-xl">Invite people</h2>
          <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (email.trim()) invite.mutate(); }}>
            <input type="email" required className={`${box} w-72`} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.org" />
            <select className={box} value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <button className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Invite</button>
          </form>
          <p className="text-xs text-muted-foreground">They'll join automatically the first time they sign in with that email.</p>
          {!!invites.data?.length && (
            <ul className="divide-y rounded-lg border bg-card text-sm">
              {invites.data.map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 p-3">
                  <span className="flex-1">{i.email} · <span className="text-muted-foreground">{i.role} · pending</span></span>
                  <button
                    className="text-primary hover:underline"
                    onClick={() => {
                      const link = `${window.location.origin}/auth?email=${encodeURIComponent(i.email)}`;
                      navigator.clipboard.writeText(link).then(
                        () => toast.success("Invitation link copied"),
                        () => toast.error("Couldn't copy the link"),
                      );
                    }}
                  >
                    Copy link
                  </button>
                  <button className="text-muted-foreground hover:text-destructive" onClick={async () => { await supabase.from("workspace_invites").delete().eq("id", i.id); qc.invalidateQueries({ queryKey: ["invites"] }); }}>
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Branding() {
  const { workspace, refresh } = useWorkspace();
  const [f, setF] = useState({
    brand_name: workspace.brand_name ?? "",
    logo_url: workspace.logo_url ?? "",
    accent_color: workspace.accent_color ?? "#10b981",
    use_accent: !!workspace.accent_color,
    welcome_headline: workspace.welcome_headline ?? "",
    welcome_tagline: workspace.welcome_tagline ?? "",
    support_contact: workspace.support_contact ?? "",
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const clean = (v: string) => v.trim() || null;

  async function save() {
    const { error } = await supabase.from("workspaces").update({
      brand_name: clean(f.brand_name),
      logo_url: clean(f.logo_url),
      accent_color: f.use_accent ? f.accent_color : null,
      welcome_headline: clean(f.welcome_headline),
      welcome_tagline: clean(f.welcome_tagline),
      support_contact: clean(f.support_contact),
    }).eq("id", workspace.id);
    if (error) toast.error(error.message);
    else { toast.success("Branding saved"); refresh(); }
  }

  const field = (label: string, k: keyof typeof f, placeholder: string, hint?: string) => (
    <label className="block space-y-1 text-sm">
      <span className="font-medium">{label}</span>
      <input className={`${box} w-full`} value={f[k] as string} onChange={set(k)} placeholder={placeholder} />
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl">Branding</h2>
        <p className="text-sm text-muted-foreground">Make this workspace look like your organization. Everyone in the workspace sees it.</p>
      </div>
      <div className="grid gap-4 rounded-lg border bg-card p-6 md:grid-cols-2">
        {field("Product name", "brand_name", "Tandem", "Shown in the header instead of “Tandem”.")}
        {field("Logo link", "logo_url", "https://yourorg.org/logo.png", "A link to a square image of your logo.")}
        {field("Welcome headline", "welcome_headline", "Great leaders meet often.")}
        {field("Welcome message", "welcome_tagline", "A short note shown at the top of everyone’s 1-on-1s page.")}
        {field("Help contact", "support_contact", "help@yourorg.org", "An email or web link people can use for help.")}
        <div className="space-y-1 text-sm">
          <span className="font-medium">Accent color</span>
          <div className="flex items-center gap-3">
            <input type="checkbox" className="accent-primary" checked={f.use_accent} onChange={set("use_accent")} />
            <input type="color" disabled={!f.use_accent} value={f.accent_color} onChange={set("accent_color")} className="h-9 w-14 cursor-pointer rounded border border-input bg-background disabled:opacity-40" />
            <span className="text-xs text-muted-foreground">{f.use_accent ? f.accent_color : "Using the default emerald"}</span>
          </div>
        </div>
      </div>
      <button onClick={save} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Save branding</button>
    </section>
  );
}
