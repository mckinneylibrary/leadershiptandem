import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Role = "owner" | "admin" | "member";
export type Member = { user_id: string; role: Role; display_name: string; email: string };
export type Workspace = {
  id: string;
  name: string;
  ai_enabled: boolean;
  brand_name: string | null;
  logo_url: string | null;
  accent_color: string | null;
  welcome_headline: string | null;
  welcome_tagline: string | null;
  support_contact: string | null;
};

type Ctx = {
  userId: string;
  workspace: Workspace;
  role: Role;
  isAdmin: boolean;
  workspaces: (Workspace & { role: Role })[];
  members: Member[];
  memberName: (id: string) => string;
  switchWorkspace: (id: string) => void;
  refresh: () => void;
};

const WorkspaceContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "tandem.workspace";

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
}

export function WorkspaceProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setSelected(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  const memberships = useQuery({
    queryKey: ["memberships", userId],
    queryFn: async () => {
      await supabase.rpc("accept_invites");
      const { data, error } = await supabase
        .from("workspace_members")
        .select("role, workspace_id, workspaces(id, name, ai_enabled, brand_name, logo_url, accent_color, welcome_headline, welcome_tagline, support_contact)")
        .eq("user_id", userId);
      if (error) throw error;
      return (data ?? [])
        .filter((m) => m.workspaces)
        .map((m) => ({ ...(m.workspaces as Workspace), role: m.role as Role }));
    },
  });

  const workspaces = memberships.data ?? [];
  const current = workspaces.find((w) => w.id === selected) ?? workspaces[0];

  const members = useQuery({
    queryKey: ["members", current?.id],
    enabled: !!current,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("workspace_members")
        .select("user_id, role")
        .eq("workspace_id", current!.id);
      if (error) throw error;
      const ids = (rows ?? []).map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, email")
        .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      return (rows ?? []).map((r) => {
        const p = profiles?.find((x) => x.id === r.user_id);
        return {
          user_id: r.user_id,
          role: r.role as Role,
          display_name: p?.display_name || p?.email || "Unknown",
          email: p?.email ?? "",
        };
      });
    },
  });

  const value = useMemo<Ctx | null>(() => {
    if (!current) return null;
    const list = members.data ?? [];
    return {
      userId,
      workspace: current,
      role: current.role,
      isAdmin: current.role === "owner" || current.role === "admin",
      workspaces,
      members: list,
      memberName: (id) => (id === userId ? "You" : list.find((m) => m.user_id === id)?.display_name ?? "Someone"),
      switchWorkspace: (id) => {
        window.localStorage.setItem(STORAGE_KEY, id);
        setSelected(id);
        qc.invalidateQueries();
      },
      refresh: () => {
        qc.invalidateQueries({ queryKey: ["memberships", userId] });
        qc.invalidateQueries({ queryKey: ["members"] });
      },
    };
  }, [current, members.data, userId, workspaces, qc]);

  if (memberships.isLoading) return <FullPageMessage text="Opening your notebook…" />;
  if (memberships.error) return <FullPageMessage text="We couldn't load your workspaces. Try refreshing." />;
  if (!current) return <CreateWorkspace onCreated={(id) => { window.localStorage.setItem(STORAGE_KEY, id); setSelected(id); memberships.refetch(); }} />;
  if (!value) return null;

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function FullPageMessage({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <p className="font-serif text-lg text-muted-foreground">{text}</p>
    </div>
  );
}

export function CreateWorkspace({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <form
        className="w-full max-w-md space-y-5 rounded-lg border bg-card p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(null);
          const { data, error } = await supabase.rpc("create_workspace", { _name: name.trim() });
          setBusy(false);
          if (error) return setErr(error.message);
          onCreated(data as string);
        }}
      >
        <div>
          <p className="text-sm uppercase tracking-widest text-highlight">Welcome</p>
          <h1 className="mt-2 text-3xl">Name your workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Usually your organization, team, or group. If someone invited you, ask them to send the invite to the email you signed in with.
          </p>
        </div>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Riverside Food Bank"
          className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
        />
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button
          disabled={busy || !name.trim()}
          className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create workspace"}
        </button>
      </form>
    </div>
  );
}
