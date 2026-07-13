import type { User } from "@supabase/supabase-js";

/**
 * Single source for deriving a display name (was duplicated 3× with different
 * metadata precedence). `display_name` wins — it's what updateDisplayName and
 * sign-up write; `full_name` is only set by OAuth providers.
 */
export function displayNameFor(user: User | null | undefined): string {
  return (
    (user?.user_metadata?.display_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Guest"
  );
}
