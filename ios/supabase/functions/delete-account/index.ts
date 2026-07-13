// delete-account — remote-first account deletion (Master Implementation Doc §6.8).
// Target path in the iOS repo: supabase/functions/delete-account/index.ts
// Deploy: `supabase functions deploy delete-account` (human checklist §9.6).
// The SERVICE ROLE KEY exists only here (auto-injected by the Edge runtime) — never in the app.
//
// Contract: the app calls this with the user's JWT; on {ok:true} it wipes local
// data and signs out. On any error the user stays signed in and keeps their data.
// DB rows are removed by ON DELETE CASCADE from auth.users (001_initial_schema.sql).

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json({ error: "Unauthorized" }, 401);
  }

  // Verify the caller's JWT with the anon client.
  const anon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error: authErr } = await anon.auth.getUser(authHeader.slice(7));
  if (authErr || !data.user) return json({ error: "Unauthorized" }, 401);

  // Service-role delete. Cascades remove all user rows.
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { error } = await admin.auth.admin.deleteUser(data.user.id);
  if (error) {
    console.error("[delete-account]", error.message);
    return json({ error: "Could not delete account." }, 500);
  }
  return json({ ok: true });
});
