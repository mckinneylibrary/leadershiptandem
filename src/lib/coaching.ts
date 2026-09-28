import { supabase } from "@/integrations/supabase/client";

export type Pairing = {
  id: string;
  workspace_id: string;
  leader_id: string;
  report_id: string;
  kind: string;
  cadence_days: number;
  template_id: string | null;
  active: boolean;
};

export type Template = {
  id: string;
  name: string;
  description: string;
  leader_prompts: string[];
  report_prompts: string[];
  published: boolean;
  version: number;
};

export function asList(v: unknown): string[] {
  return Array.isArray(v) ? v.map(String) : [];
}

export function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d.length === 10 ? d + "T12:00:00" : d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function daysSince(d: string) {
  const then = new Date(d + "T12:00:00").getTime();
  return Math.floor((Date.now() - then) / 86400000);
}

export function relationLabel(p: Pairing, me: string) {
  if (p.kind === "partner") return "Coaching partner";
  return p.leader_id === me ? "You lead" : "Leads you";
}

export async function fetchTemplates(workspaceId: string): Promise<Template[]> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((t) => ({
    ...t,
    leader_prompts: asList(t.leader_prompts),
    report_prompts: asList(t.report_prompts),
  }));
}

export async function startMeeting(pairing: Pairing, userId: string, templates: Template[]) {
  const published = templates.filter((t) => t.published);
  const t = published.find((x) => x.id === pairing.template_id) ?? published[0];
  const { data, error } = await supabase
    .from("meetings")
    .insert({
      pairing_id: pairing.id,
      workspace_id: pairing.workspace_id,
      created_by: userId,
      template_name: t?.name ?? null,
      leader_prompts: t?.leader_prompts ?? [],
      report_prompts: t?.report_prompts ?? [],
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
