// Shared helpers for Genesyx Edge Functions.
// These four functions exist because they need the service-role key and must
// never ship inside a client app. Logic is ported from src/lib/account.functions.ts
// and src/lib/partner.functions.ts (the web app's TanStack server functions).

import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function errorJson(message: string, status: number): Response {
  return json({ error: message }, status);
}

/** Log full detail server-side; return only a safe generic message to the client. */
export function safeError(scope: string, err: unknown, userMessage: string, status = 400): Response {
  console.error(`[${scope}]`, err instanceof Error ? err.message : err);
  return errorJson(userMessage, status);
}

export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export function anonClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** Verify the caller's JWT and return the authenticated user, or null. */
export async function requireUser(req: Request): Promise<User | null> {
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  const jwt = authHeader.slice(7);
  const { data, error } = await anonClient().auth.getUser(jwt);
  if (error || !data.user) return null;
  return data.user;
}

/** Standard wrapper: CORS preflight + POST-only + auth + JSON body. */
export async function handlePost(
  req: Request,
  handler: (user: User, body: Record<string, unknown>) => Promise<Response>,
): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorJson("Method not allowed", 405);

  const user = await requireUser(req);
  if (!user) return errorJson("Unauthorized", 401);

  let body: Record<string, unknown> = {};
  try {
    const text = await req.text();
    if (text) body = JSON.parse(text);
  } catch {
    return errorJson("Invalid JSON body", 400);
  }
  return handler(user, body);
}
