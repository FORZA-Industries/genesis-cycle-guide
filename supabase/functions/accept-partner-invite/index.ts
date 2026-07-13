// accept-partner-invite — validates and atomically accepts a partner invite,
// then symmetrically links both profiles.
// Ported from src/lib/partner.functions.ts (acceptPartnerInvite).
// partner_id writes are locked at the RLS layer; linking happens via service role
// only after every rule below passes for the authenticated caller.

import { handlePost, adminClient, json, errorJson, safeError } from "../_shared/http.ts";

Deno.serve((req) =>
  handlePost(req, async (user, body) => {
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (code.length < 8 || code.length > 64) return errorJson("Invalid invite code", 400);

    const myEmail = user.email?.toLowerCase();
    if (!myEmail) return errorJson("Email not verified on your account", 400);

    const admin = adminClient();

    const { data: invite, error: fetchErr } = await admin
      .from("partner_invites")
      .select("id,inviter_id,invitee_email,status,expires_at")
      .eq("code", code)
      .maybeSingle();
    if (fetchErr) return safeError("accept:fetch", fetchErr, "Could not load invite.", 500);
    if (!invite) return errorJson("Invite not found", 404);
    if (invite.status !== "pending") return errorJson(`Invite is ${invite.status}`, 409);
    if (new Date(invite.expires_at) < new Date()) return errorJson("Invite expired", 410);
    if (invite.invitee_email.toLowerCase() !== myEmail) {
      return errorJson("This invite is for a different email address", 403);
    }
    if (invite.inviter_id === user.id) {
      return errorJson("You can't accept your own invite", 400);
    }

    // Atomic accept: the status guard makes double-accepts lose the race.
    const { data: upd, error: updErr } = await admin
      .from("partner_invites")
      .update({
        status: "accepted",
        accepted_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invite.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();
    if (updErr) return safeError("accept:update", updErr, "Could not accept invite.", 500);
    if (!upd) return errorJson("Invite was already accepted or revoked", 409);

    const { error: e1 } = await admin
      .from("profiles")
      .update({ partner_id: invite.inviter_id })
      .eq("id", user.id);
    if (e1) return safeError("accept:link1", e1, "Could not link accounts.", 500);

    const { error: e2 } = await admin
      .from("profiles")
      .update({ partner_id: user.id })
      .eq("id", invite.inviter_id);
    if (e2) return safeError("accept:link2", e2, "Could not link accounts.", 500);

    return json({ ok: true });
  }),
);
