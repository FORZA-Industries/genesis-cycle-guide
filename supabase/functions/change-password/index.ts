// change-password — verifies the CURRENT password before setting a new one.
// Ported from src/lib/account.functions.ts (changePassword).
// Re-authenticates with a throwaway anon client so the caller's session is untouched.

import { handlePost, adminClient, anonClient, json, errorJson, safeError } from "../_shared/http.ts";

Deno.serve((req) =>
  handlePost(req, async (user, body) => {
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword) return errorJson("Current password is required", 400);
    if (newPassword.length < 8 || newPassword.length > 200) {
      return errorJson("New password must be 8–200 characters", 400);
    }
    const email = user.email;
    if (!email) return errorJson("Account has no email on file", 400);

    // Verify current password without disturbing the caller's session.
    const verifier = anonClient();
    const { error: signErr } = await verifier.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signErr) return errorJson("Current password is incorrect", 403);
    await verifier.auth.signOut().catch(() => {});

    const admin = adminClient();
    const { error } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
    if (error) return safeError("change-password", error, "Could not update password.", 500);
    return json({ ok: true });
  }),
);
