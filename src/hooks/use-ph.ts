import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listPhReadings,
  createPhReading,
  updatePhReading,
  deletePhReading,
  type PhReadingDTO,
} from "@/lib/ph.functions";
import { useAuth } from "@/hooks/use-auth";

type Listener = () => void;
const listeners = new Set<Listener>();
function emit() { listeners.forEach((l) => l()); }

export type PhStatus = "acidic" | "optimal" | "alkaline";
export function phStatus(v: number): PhStatus {
  if (v < 6.0) return "acidic";
  if (v > 7.5) return "alkaline";
  return "optimal";
}
export const PH_STATUS_LABEL: Record<PhStatus, string> = {
  acidic: "Acidic",
  optimal: "Optimal",
  alkaline: "Alkaline",
};
export const PH_STATUS_COLOR: Record<PhStatus, string> = {
  acidic: "var(--color-electric-pink, #D85A8A)",
  optimal: "#3FA37A",
  alkaline: "var(--color-electric-lavender, #4D4DAA)",
};

export function usePhReadings(sinceDays: number | null = null) {
  const { user } = useAuth();
  const fetchFn = useServerFn(listPhReadings);
  const [readings, setReadings] = useState<PhReadingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) { setReadings([]); setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn({ data: { sinceDays } });
      setReadings(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load readings");
    } finally {
      setLoading(false);
    }
  }, [user, fetchFn, sinceDays]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    listeners.add(refresh);
    return () => { listeners.delete(refresh); };
  }, [refresh]);

  return { readings, loading, error, refresh };
}

export function usePhMutations() {
  const { user } = useAuth();
  const createFn = useServerFn(createPhReading);
  const updateFn = useServerFn(updatePhReading);
  const deleteFn = useServerFn(deletePhReading);

  const create = useCallback(
    async (input: { phValue: number; recordedAt?: string; notes?: string | null }) => {
      if (!user) throw new Error("Please sign in to save your reading.");
      await createFn({ data: input });
      emit();
    },
    [user, createFn],
  );
  const update = useCallback(
    async (input: { id: string; phValue: number; recordedAt: string; notes: string | null }) => {
      if (!user) throw new Error("Please sign in.");
      await updateFn({ data: input });
      emit();
    },
    [user, updateFn],
  );
  const remove = useCallback(
    async (id: string) => {
      if (!user) throw new Error("Please sign in.");
      await deleteFn({ data: { id } });
      emit();
    },
    [user, deleteFn],
  );

  return { create, update, remove };
}
