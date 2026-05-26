import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const emailSchema = z.string().trim().toLowerCase().email().max(255);

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

    // Generate a 16-char unguessable code on the server
    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

    const { data: inv, error } = await supabase
      .from("partner_invites")
      .insert({ inviter_id: userId, invitee_email: data.email, code })
      .select("id,code")
      .single();
    if (error) throw new Error(error.message);
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
      .eq("inviter_id", userId); // server-side ownership enforcement
    if (error) throw new Error(error.message);
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

    // Re-fetch & re-validate atomically server-side
    const { data: invite, error: fetchErr } = await supabase
      .from("partner_invites")
      .select("id,inviter_id,invitee_email,status,expires_at")
      .eq("code", data.code)
      .maybeSingle();
    if (fetchErr) throw new Error(fetchErr.message);
    if (!invite) throw new Error("Invite not found");
    if (invite.status !== "pending") throw new Error(`Invite is ${invite.status}`);
    if (new Date(invite.expires_at) < new Date()) throw new Error("Invite expired");
    if (invite.invitee_email.toLowerCase() !== myEmail) {
      throw new Error("This invite is for a different email address");
    }
    if (invite.inviter_id === userId) {
      throw new Error("You can't accept your own invite");
    }

    // Use service role for the cross-user profile write (after all checks pass).
    // We dynamic-import so client bundles never see this module.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Make sure neither side is already linked
    const { data: profs, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id,partner_id")
      .in("id", [userId, invite.inviter_id]);
    if (pErr) throw new Error(pErr.message);
    for (const p of profs ?? []) {
      if (p.partner_id && p.partner_id !== (p.id === userId ? invite.inviter_id : userId)) {
        throw new Error("One of the accounts is already linked to a different partner");
      }
    }

    // Atomic-ish: mark invite accepted only if still pending
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
    if (updErr) throw new Error(updErr.message);
    if (!upd) throw new Error("Invite was already accepted or revoked");

    const { error: e1 } = await supabaseAdmin
      .from("profiles")
      .update({ partner_id: invite.inviter_id })
      .eq("id", userId);
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await supabaseAdmin
      .from("profiles")
      .update({ partner_id: userId })
      .eq("id", invite.inviter_id);
    if (e2) throw new Error(e2.message);

    return { ok: true };
  });

export const unlinkPartner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    // Get current partner id first
    const { data: me, error: meErr } = await supabase
      .from("profiles")
      .select("partner_id")
      .eq("id", userId)
      .maybeSingle();
    if (meErr) throw new Error(meErr.message);
    const partnerId = me?.partner_id;

    // Clear my own side under RLS
    const { error: e1 } = await supabase
      .from("profiles")
      .update({ partner_id: null })
      .eq("id", userId);
    if (e1) throw new Error(e1.message);

    // Clear the partner's side with service role (after verifying they pointed to us)
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
