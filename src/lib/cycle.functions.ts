import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function safeThrow(scope: string, err: unknown, userMessage: string): never {
  // eslint-disable-next-line no-console
  console.error(`[cycle:${scope}]`, err instanceof Error ? err.message : err);
  throw new Error(userMessage);
}

export type CycleSettingsDTO = {
  cycleLength: number;
  periodLength: number;
  lastPeriodDate: string; // 'YYYY-MM-DD'
} | null;

export const getCycleSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CycleSettingsDTO> => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("cycle_settings")
      .select("cycle_length, period_length, last_period_date")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) safeThrow("get", error, "Could not load cycle settings.");
    if (!data) return null;
    return {
      cycleLength: data.cycle_length,
      periodLength: data.period_length,
      lastPeriodDate: data.last_period_date,
    };
  });

export const upsertCycleSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { lastPeriodDate: string; cycleLength: number; periodLength?: number }) =>
    z.object({
      lastPeriodDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
      cycleLength: z.number().int().min(21).max(35),
      periodLength: z.number().int().min(1).max(10).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("cycle_settings")
      .upsert(
        {
          user_id: userId,
          last_period_date: data.lastPeriodDate,
          cycle_length: data.cycleLength,
          period_length: data.periodLength ?? 5,
        },
        { onConflict: "user_id" },
      );
    if (error) safeThrow("upsert", error, "Could not save cycle settings.");
    return { ok: true };
  });
