import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const getProfilePrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("theme")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { theme: (data?.theme as string | null) ?? "dark" };
  });

export const updateTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ theme: z.enum(["light", "dark"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ theme: data.theme })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { theme: data.theme };
  });

export const updateDisplayName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ displayName: z.string().trim().min(1).max(80) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.auth.updateUser({
      data: { display_name: data.displayName },
    });
    if (error) throw new Error(error.message);
    const { error: pErr } = await context.supabase
      .from("profiles")
      .update({ display_name: data.displayName })
      .eq("id", context.userId);
    if (pErr) throw new Error(pErr.message);
    return { displayName: data.displayName };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const changePassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const email = (context.claims as { email?: string }).email;
    if (!email) throw new Error("Account has no email on file");

    // Re-authenticate server-side with a throwaway client so we don't
    // disturb the caller's session.
    const verifier = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { error: signErr } = await verifier.auth.signInWithPassword({
      email,
      password: data.currentPassword,
    });
    if (signErr) {
      throw new Error("Current password is incorrect");
    }
    await verifier.auth.signOut().catch(() => {});

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(context.userId, {
      password: data.newPassword,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
