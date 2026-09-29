import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const sendInviteEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ inviteId: z.string().uuid(), origin: z.string().url() }).parse(d))
  .handler(async ({ data, context }) => {
    // RLS: only workspace admins can read invites, so this also authorizes the caller.
    const { data: inv } = await context.supabase
      .from("workspace_invites")
      .select("id, email, workspace_id, accepted_at")
      .eq("id", data.inviteId)
      .maybeSingle();
    if (!inv || inv.accepted_at) return { sent: false };
    const [{ data: ws }, { data: me }] = await Promise.all([
      context.supabase.from("workspaces").select("name, brand_name").eq("id", inv.workspace_id).maybeSingle(),
      context.supabase.from("profiles").select("display_name").eq("id", context.userId).maybeSingle(),
    ]);
    const { sendTemplateEmail } = await import("@/lib/email-templates/send-email");
    const r = await sendTemplateEmail("workspace-invite", inv.email, {
      templateData: {
        workspaceName: ws?.name,
        productName: ws?.brand_name || "Tandem",
        inviterName: me?.display_name,
        link: `${data.origin}/auth?email=${encodeURIComponent(inv.email)}`,
      },
      idempotencyKey: `workspace-invite-${inv.id}`,
    });
    return { sent: r.sent };
  });
