// unlink-partner — symmetrically clears the partner link for the caller and
// (guarded) their linked partner.
// Ported from src/lib/partner.functions.ts (unlinkPartner).

import { handlePost, adminClient, json, safeError } from "../_shared/http.ts";

Deno.serve((req) =>
  handlePost(req, async (user) => {
    const admin = adminClient();

    const { data: me, error: meErr } = await admin
      .from("profiles")
      .select("partner_id")
      .eq("id", user.id)
      .maybeSingle();
    if (meErr) return safeError("unlink:fetch", meErr, "Could not unlink.", 500);
    const partnerId = me?.partner_id as string | null | undefined;

    const { error: e1 } = await admin
      .from("profiles")
      .update({ partner_id: null })
      .eq("id", user.id);
    if (e1) return safeError("unlink:self", e1, "Could not unlink.", 500);

    if (partnerId) {
      // Guarded: only clear the partner's link if it still points back at the caller.
      await admin
        .from("profiles")
        .update({ partner_id: null })
        .eq("id", partnerId)
        .eq("partner_id", user.id);
    }
    return json({ ok: true });
  }),
);
