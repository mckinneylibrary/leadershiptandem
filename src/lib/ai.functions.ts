import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAI } from "./ai.server";

const input = z.object({ meetingId: z.string().uuid() });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sb = any;

// Builds the meeting transcript from SHARED content only. Private notes never reach the AI.
async function loadMeeting(supabase: Sb, meetingId: string) {
  const { data: m, error } = await supabase.from("meetings").select("*").eq("id", meetingId).single();
  if (error || !m) throw new Error("Meeting not found.");
  const { data: ws } = await supabase.from("workspaces").select("ai_enabled").eq("id", m.workspace_id).single();
  if (!ws?.ai_enabled) throw new Error("AI is turned off for this workspace.");
  const [{ data: agenda }, { data: notes }, { data: actions }] = await Promise.all([
    supabase.from("agenda_items").select("body, done").eq("meeting_id", meetingId),
    supabase.from("meeting_notes").select("body, author_id").eq("meeting_id", meetingId).eq("visibility", "shared"),
    supabase.from("action_items").select("body, done_at").eq("pairing_id", m.pairing_id).is("done_at", null),
  ]);
  const { data: pairing } = await supabase.from("pairings").select("leader_id").eq("id", m.pairing_id).single();
  const text = [
    `Agenda:\n${(agenda ?? []).map((a: any) => `- ${a.body}${a.done ? " (covered)" : ""}`).join("\n") || "(none)"}`,
    `Notes:\n${(notes ?? []).map((n: any) => `[${n.author_id === pairing?.leader_id ? "Leader" : "Report"}] ${n.body}`).join("\n\n") || "(none)"}`,
    `Already-open action items:\n${(actions ?? []).map((a: any) => `- ${a.body}`).join("\n") || "(none)"}`,
  ].join("\n\n");
  return { meeting: m, text };
}

export const summarizeMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { text } = await loadMeeting(context.supabase, data.meetingId);
    const summary = await runAI(
      "You summarize 1-on-1 coaching conversations between a leader and the person they support. Be warm, concise and concrete. Write 3-6 short bullet points covering themes, wins, concerns and commitments. No preamble. Keep it under 150 words.",
      text,
    );
    const { error } = await context.supabase.from("meetings").update({ ai_summary: summary }).eq("id", data.meetingId);
    if (error) throw new Error("Couldn't save the summary.");
    return { summary };
  });

export const suggestActionItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => input.parse(d))
  .handler(async ({ data, context }) => {
    const { text } = await loadMeeting(context.supabase, data.meetingId);
    const raw = await runAI(
      'Extract concrete follow-up action items from this 1-on-1. Skip anything already in the open list. Reply ONLY with a JSON array like [{"body":"...","owner":"leader"|"report"}], at most 6 items. Reply [] if none.',
      text,
    );
    const match = raw.match(/\[[\s\S]*\]/);
    try {
      const parsed = z
        .array(z.object({ body: z.string().min(1), owner: z.enum(["leader", "report"]).catch("report") }))
        .parse(JSON.parse(match?.[0] ?? "[]"));
      return { items: parsed.slice(0, 6) };
    } catch {
      return { items: [] as { body: string; owner: "leader" | "report" }[] };
    }
  });
