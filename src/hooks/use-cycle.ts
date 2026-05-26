import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCycleSettings, upsertCycleSettings, type CycleSettingsDTO } from "@/lib/cycle.functions";
import { getCyclePhase, type CyclePhaseInfo } from "@/lib/cycle";
import { useAuth } from "@/hooks/use-auth";

export function useCycleSettings() {
  const { user } = useAuth();
  const fetchFn = useServerFn(getCycleSettings);
  const upsertFn = useServerFn(upsertCycleSettings);
  const [data, setData] = useState<CycleSettingsDTO>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load cycle");
    } finally {
      setLoading(false);
    }
  }, [user, fetchFn]);

  useEffect(() => { refresh(); }, [refresh]);

  const save = useCallback(
    async (input: { lastPeriodDate: string; cycleLength: number; periodLength?: number }) => {
      await upsertFn({ data: input });
      await refresh();
    },
    [upsertFn, refresh],
  );

  const cycleInfo = useMemo<CyclePhaseInfo | null>(() => {
    if (!data) return null;
    return getCyclePhase(data.lastPeriodDate, data.cycleLength, data.periodLength);
  }, [data]);

  return { settings: data, cycleInfo, loading, error, refresh, save };
}
