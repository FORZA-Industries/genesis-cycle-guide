// delete-account — remote-first account deletion.
// Ported from src/lib/account.functions.ts (deleteAccount).
// Contract (roadmap D7): server deletes the account; the client wipes local data
// ONLY after this returns ok. On failure the user stays signed in.

import { handlePost, adminClient, json, safeError } from "../_shared/http.ts";

Deno.serve((req) =>
  handlePost(req, async (user) => {
    const admin = adminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return safeError("delete-account", error, "Could not delete account.", 500);
    // Cascade note: profiles/cycle_settings/daily_logs/ph_readings rows are removed by
    // FK ON DELETE CASCADE from auth.users (see migrations). Nothing else to do here.
    return json({ ok: true });
  }),
);
