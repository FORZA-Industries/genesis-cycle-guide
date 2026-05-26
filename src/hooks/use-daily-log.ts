import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getDailyLog, upsertDailyLog, getStreak, type DailyLogDTO } from "@/lib/daily-log.functions";
import { useAuth } from "@/hooks/use-auth";

export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Tiny pub/sub so screens stay in sync after a save anywhere in the app.
type Listener = () => void;
const listeners = new Set<Listener>();
export function emitLogChange() {
  listeners.forEach((l) => l());
}
function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

export function useDailyLog(date: string = todayISO()) {
  const { user } = useAuth();
  const fetchFn = useServerFn(getDailyLog);
  const upsertFn = useServerFn(upsertDailyLog);
  const [log, setLog] = useState<DailyLogDTO>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setLog(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn({ data: { date } });
      setLog(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load log");
    } finally {
      setLoading(false);
    }
  }, [user, fetchFn, date]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => subscribe(refresh), [refresh]);

  const save = useCallback(
    async (input: Parameters<typeof upsertFn>[0]["data"]) => {
      await upsertFn({ data: { ...input, date } });
      emitLogChange();
    },
    [upsertFn, date],
  );

  return { log, loading, error, refresh, save };
}

export function useStreak() {
  const { user } = useAuth();
  const fetchFn = useServerFn(getStreak);
  const [streak, setStreak] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!user) { setStreak(null); return; }
    try {
      const res = await fetchFn();
      setStreak(res.streak);
    } catch {
      setStreak(null);
    }
  }, [user, fetchFn]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => subscribe(refresh), [refresh]);

  return { streak };
}
