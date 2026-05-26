import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function safeThrow(scope: string, err: unknown, userMessage: string): never {
  // eslint-disable-next-line no-console
  console.error(`[account:${scope}]`, err instanceof Error ? err.message : err);
  throw new Error(userMessage);
}

export const updateDisplayName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { displayName: string }) =>
    z.object({
      displayName: z.string().trim().min(1, "Name cannot be empty").max(80),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: data.displayName })
      .eq("id", userId);
    if (error) safeThrow("name", error, "Could not update your name.");
    return { ok: true, displayName: data.displayName };
  });

export const updateTheme = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { theme: "light" | "dark" }) =>
    z.object({ theme: z.enum(["light", "dark"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ theme: data.theme })
      .eq("id", userId);
    if (error) safeThrow("theme", error, "Could not save theme.");
    return { ok: true };
  });

export const getProfilePrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("display_name, theme")
      .eq("id", userId)
      .maybeSingle();
    if (error) safeThrow("prefs", error, "Could not load profile.");
    return {
      displayName: (data?.display_name as string | null) ?? null,
      theme: ((data as { theme?: string } | null)?.theme as "light" | "dark" | undefined) ?? "dark",
    };
  });

export const deleteAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Unlink partner first (clear partner_id from partner's profile)
    const { data: me } = await supabaseAdmin
      .from("profiles")
      .select("partner_id")
      .eq("id", userId)
      .maybeSingle();
    const partnerId = (me as { partner_id?: string | null } | null)?.partner_id;
    if (partnerId) {
      await supabaseAdmin
        .from("profiles")
        .update({ partner_id: null })
        .eq("id", partnerId);
    }

    // Delete from app tables (ignore "table not found" errors for tables that don't exist yet)
    const tablesToClear: { table: string; col: string }[] = [
      { table: "daily_logs", col: "user_id" },
      { table: "cycle_settings", col: "user_id" },
      { table: "partner_links", col: "user_id" },
      { table: "partner_invites", col: "inviter_id" },
      { table: "profiles", col: "id" },
    ];
    for (const t of tablesToClear) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabaseAdmin as any).from(t.table).delete().eq(t.col, userId);
      if (error && !/relation .* does not exist|schema cache|Could not find the table/i.test(error.message)) {
        // eslint-disable-next-line no-console
        console.warn(`[account:delete:${t.table}]`, error.message);
      }
    }

    // Finally delete the auth user
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) safeThrow("auth:delete", delErr, "Could not delete account.");

    return { ok: true };
  });
