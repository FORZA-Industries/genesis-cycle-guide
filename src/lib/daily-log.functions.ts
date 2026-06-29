import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function safeThrow(scope: string, err: unknown, userMessage: string): never {
  // eslint-disable-next-line no-console
  console.error(`[daily-log:${scope}]`, err instanceof Error ? err.message : err);
  throw new Error(userMessage);
}

export type DailyLogDTO = {
  date: string;
  mood: string | null;
  energy: string | null;
  symptoms: string[];
  sleepMinutes: number | null;
  waterMl: number;
  supplements: string[];
  notes: string | null;
} | null;

export const getDailyLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { date: string }) =>
    z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<DailyLogDTO> => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await (supabase as any)
      .from("daily_logs")
      .select("date, mood, energy, symptoms, sleep_minutes, water_ml, supplements, notes")
      .eq("user_id", userId)
      .eq("date", data.date)
      .maybeSingle();
    if (error) safeThrow("get", error, "Could not load today's log.");
    if (!row) return null;
    return {
      date: row.date,
      mood: row.mood,
      energy: row.energy,
      symptoms: row.symptoms ?? [],
      sleepMinutes: row.sleep_minutes,
      waterMl: row.water_ml ?? 0,
      supplements: row.supplements ?? [],
      notes: row.notes,
    };
  });

const UpsertSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mood: z.string().max(20).nullable().optional(),
  energy: z.enum(["low", "normal", "high"]).nullable().optional(),
  symptoms: z.array(z.string().min(1).max(40)).max(50).optional(),
  sleepMinutes: z.number().int().min(0).max(1440).nullable().optional(),
  waterMl: z.number().int().min(0).max(10000).optional(),
  supplements: z.array(z.string().min(1).max(40)).max(50).optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export const upsertDailyLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof UpsertSchema>) => UpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload: Record<string, unknown> = { user_id: userId, date: data.date };
    if (data.mood !== undefined) payload.mood = data.mood;
    if (data.energy !== undefined) payload.energy = data.energy;
    if (data.symptoms !== undefined) payload.symptoms = data.symptoms;
    if (data.sleepMinutes !== undefined) payload.sleep_minutes = data.sleepMinutes;
    if (data.waterMl !== undefined) payload.water_ml = data.waterMl;
    if (data.supplements !== undefined) payload.supplements = data.supplements;
    if (data.notes !== undefined) payload.notes = data.notes;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("daily_logs")
      .upsert(payload, { onConflict: "user_id,date" });
    if (error) safeThrow("upsert", error, "Could not save log.");
    return { ok: true };
  });

export const getStreak = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ streak: number }> => {
    const { supabase, userId } = context;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("daily_logs")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(400);
    if (error) safeThrow("streak", error, "Could not load streak.");
    if (!data || data.length === 0) return { streak: 0 };
    const set = new Set<string>(data.map((r: { date: string }) => r.date));
    const today = new Date();
    const iso = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };
    if (!set.has(iso(today))) return { streak: 0 };
    let streak = 0;
    const cursor = new Date(today);
    while (set.has(iso(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return { streak };
  });

export type DailyLogRowDTO = {
  date: string;
  mood: string | null;
  energy: string | null;
  symptoms: string[];
  waterMl: number;
};

export const listDailyLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sinceDays: number }) =>
    z.object({ sinceDays: z.number().int().min(1).max(365) }).parse(input),
  )
  .handler(async ({ data, context }): Promise<DailyLogRowDTO[]> => {
    const { supabase, userId } = context;
    const since = new Date();
    since.setDate(since.getDate() - data.sinceDays);
    const sinceIso = since.toISOString().slice(0, 10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows, error } = await (supabase as any)
      .from("daily_logs")
      .select("date, mood, energy, symptoms, water_ml")
      .eq("user_id", userId)
      .gte("date", sinceIso)
      .order("date", { ascending: true });
    if (error) safeThrow("list", error, "Could not load logs.");
    return (rows ?? []).map((r: { date: string; mood: string | null; energy: string | null; symptoms: string[] | null; water_ml: number | null }) => ({
      date: r.date,
      mood: r.mood,
      energy: r.energy,
      symptoms: r.symptoms ?? [],
      waterMl: r.water_ml ?? 0,
    }));
  });
