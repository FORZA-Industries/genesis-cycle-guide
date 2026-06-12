import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function safeThrow(scope: string, err: unknown, userMessage: string): never {
  // eslint-disable-next-line no-console
  console.error(`[ph:${scope}]`, err instanceof Error ? err.message : err);
  throw new Error(userMessage);
}

export type PhReadingDTO = {
  id: string;
  phValue: number;
  recordedAt: string; // ISO
  notes: string | null;
};

const PhValue = z.number().min(4.5).max(9.0);
const IsoDate = z.string().min(1).max(64);

export const listPhReadings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sinceDays?: number | null }) =>
    z.object({ sinceDays: z.number().int().min(1).max(3650).nullable().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<PhReadingDTO[]> => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = (supabase as any)
      .from("ph_readings")
      .select("id, ph_value, recorded_at, notes")
      .eq("user_id", userId)
      .order("recorded_at", { ascending: true })
      .limit(2000);
    if (data.sinceDays) {
      const since = new Date(Date.now() - data.sinceDays * 86400_000).toISOString();
      q = q.gte("recorded_at", since);
    }
    const { data: rows, error } = await q;
    if (error) safeThrow("list", error, "Could not load pH readings.");
    return (rows ?? []).map((r: { id: string; ph_value: number | string; recorded_at: string; notes: string | null }) => ({
      id: r.id,
      phValue: Number(r.ph_value),
      recordedAt: r.recorded_at,
      notes: r.notes,
    }));
  });

export const createPhReading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phValue: number; recordedAt?: string; notes?: string | null }) =>
    z.object({
      phValue: PhValue,
      recordedAt: IsoDate.optional(),
      notes: z.string().trim().max(500).nullable().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (supabase as any)
      .from("ph_readings")
      .insert({
        user_id: userId,
        ph_value: Math.round(data.phValue * 10) / 10,
        recorded_at: data.recordedAt ?? new Date().toISOString(),
        notes: data.notes ?? null,
      })
      .select("id")
      .single();
    if (error) safeThrow("create", error, "Could not save reading.");
    return { id: row.id };
  });

export const updatePhReading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; phValue: number; recordedAt: string; notes: string | null }) =>
    z.object({
      id: z.string().uuid(),
      phValue: PhValue,
      recordedAt: IsoDate,
      notes: z.string().trim().max(500).nullable(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("ph_readings")
      .update({
        ph_value: Math.round(data.phValue * 10) / 10,
        recorded_at: data.recordedAt,
        notes: data.notes,
      })
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) safeThrow("update", error, "Could not update reading.");
    return { ok: true };
  });

export const deletePhReading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("ph_readings")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) safeThrow("delete", error, "Could not delete reading.");
    return { ok: true };
  });
