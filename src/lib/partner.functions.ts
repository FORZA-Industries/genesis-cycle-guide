import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const emailSchema = z.string().trim().toLowerCase().email().max(255);

/** Log full error server-side; return a safe generic message to the client. */
function safeThrow(scope: string, err: unknown, userMessage: string): never {
  // eslint-disable-next-line no-console
  console.error(`[partner:${scope}]`, err instanceof Error ? err.message : err);
  throw new Error(userMessage);
}

export const sendPartnerInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) =>
    z.object({ email: emailSchema }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const myEmail = (claims.email as string | undefined)?.toLowerCase();
    if (myEmail && myEmail === data.email) {
      throw new Error("You can't invite yourself");
    }

    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

    const { data: inv, error } = await supabase
      .from("partner_invites")
      .insert({ inviter_id: userId, invitee_email: data.email, code })
      .select("id,code")
      .single();
    if (error) safeThrow("send", error, "Could not create invite. Please try again.");
    return inv;
  });

export const revokePartnerInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("partner_invites")
      .update({ status: "revoked" })
      .eq("id", data.id)
      .eq("inviter_id", userId);
    if (error) safeThrow("revoke", error, "Could not revoke invite.");
    return { ok: true };
  });

export const acceptPartnerInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) =>
    z.object({ code: z.string().min(8).max(64) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const myEmail = (claims.email as string | undefined)?.toLowerCase();
    if (!myEmail) throw new Error("Email not verified on your account");

    const { data: invite, error: fetchErr } = await supabase
      .from("partner_invites")
      .select("id,inviter_id,invitee_email,status,expires_at")
      .eq("code", data.code)
      .maybeSingle();
    if (fetchErr) safeThrow("accept:fetch", fetchErr, "Could not load invite.");
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") throw new Error(`Invite is ${invite.status}`);
    if (new Date(invite.expires_at) < new Date()) throw new Error("Invite expired");
    if (invite.invitee_email.toLowerCase() !== myEmail) {
      throw new Error("This invite is for a different email address");
    }
    if (invite.inviter_id === userId) {
      throw new Error("You can't accept your own invite");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profs, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id,partner_id")
      .in("id", [userId, invite.inviter_id]);
    if (pErr) safeThrow("accept:profiles", pErr, "Could not verify accounts.");
    for (const p of profs ?? []) {
      if (p.partner_id && p.partner_id !== (p.id === userId ? invite.inviter_id : userId)) {
        throw new Error("One of the accounts is already linked to a different partner");
      }
    }

    const { data: upd, error: updErr } = await supabaseAdmin
      .from("partner_invites")
      .update({
        status: "accepted",
        accepted_by: userId,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (updErr) safeThrow("accept:update", updErr, "Could not accept invite.");
    if (!upd) throw new Error("Invite was already accepted or revoked");

    const { error: e1 } = await supabaseAdmin
      .from("profiles")
      .update({ partner_id: invite.inviter_id })
      .eq("id", userId);
    if (e1) safeThrow("accept:link1", e1, "Could not link accounts.");
    const { error: e2 } = await supabaseAdmin
      .from("profiles")
      .update({ partner_id: userId })
      .eq("id", invite.inviter_id);
    if (e2) safeThrow("accept:link2", e2, "Could not link accounts.");

    return { ok: true };
  });

export const unlinkPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: me, error: meErr } = await supabase
      .from("profiles")
      .select("partner_id")
      .eq("id", userId)
      .maybeSingle();
    if (meErr) safeThrow("unlink:fetch", meErr, "Could not unlink.");
    const partnerId = me?.partner_id;

    const { error: e1 } = await supabase
      .from("profiles")
      .update({ partner_id: null })
      .eq("id", userId);
    if (e1) safeThrow("unlink:self", e1, "Could not unlink.");

    if (partnerId) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin
        .from("profiles")
        .update({ partner_id: null })
        .eq("id", partnerId)
        .eq("partner_id", userId);
    }
    return { ok: true };
  });
