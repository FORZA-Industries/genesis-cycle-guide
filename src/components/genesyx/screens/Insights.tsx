import { useEffect, useMemo, useState } from "react";
import { ScreenHeader } from "../ScreenHeader";
import { Sparkles, Droplets } from "lucide-react";
import { PhInsightsSection } from "../PhInsightsSection";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { listDailyLogs, type DailyLogRowDTO } from "@/lib/daily-log.functions";

const WATER_TARGET_ML = 2400;

export function InsightsScreen({ onOpenTracker }: { onOpenTracker?: () => void }) {
  const { user } = useAuth();
  const listFn = useServerFn(listDailyLogs);
  const [logs, setLogs] = useState<DailyLogRowDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setLogs([]); setLoading(false); return; }
    setLoading(true);
    listFn({ data: { sinceDays: 30 } })
      .then((rows) => { if (!cancelled) setLogs(rows); })
      .catch(() => { if (!cancelled) setLogs([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, listFn]);

  const last7 = useMemo(() => {
    const out: { date: string; weekday: string; pct: number; ml: number }[] = [];
    const today = new Date();
    const byDate = new Map(logs.map((l) => [l.date, l]));
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const ml = byDate.get(iso)?.waterMl ?? 0;
      out.push({
        date: iso,
        weekday: ["S","M","T","W","T","F","S"][d.getDay()],
        pct: Math.min(100, Math.round((ml / WATER_TARGET_ML) * 100)),
        ml,
      });
    }
    return out;
  }, [logs]);

  const symptomCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of logs) {
      for (const s of l.symptoms) counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [logs]);

  const loggedDays = logs.length;
  const avgWater = loggedDays > 0
    ? Math.round(logs.reduce((a, l) => a + l.waterMl, 0) / loggedDays)
    : 0;

  if (!user) {
    return (
      <div className="gx-screen pb-4">
        <ScreenHeader title="Your Insights" large />
        <div className="px-6 mt-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-primary/60" />
          <p className="mt-4 font-display text-[18px] font-semibold">Sign in to see your insights</p>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Your patterns appear here once you start logging.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="gx-screen pb-4">
        <ScreenHeader title="Your Insights" large />
        <div className="px-5 space-y-4">
          <div className="h-40 animate-pulse rounded-3xl bg-muted/50" />
          <div className="h-40 animate-pulse rounded-3xl bg-muted/50" />
        </div>
      </div>
    );
  }

  const empty = loggedDays === 0;

  return (
    <div className="gx-screen pb-4">
      <ScreenHeader
        title="Your Insights"
        subtitle={empty
          ? "Log a few days and your patterns will start to appear here."
          : "Patterns from the last 30 days of your real data."}
        large
      />

      <div className="px-5 space-y-4">
        <PhInsightsSection onOpenTracker={onOpenTracker} />

        {/* Hydration - last 7 days from real logs */}
        <div className="rounded-3xl bg-card gx-soft-shadow p-5 gx-card-shadow">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-[16px] font-semibold tracking-tight">Hydration</p>
            <span className="text-[12px] font-medium text-primary">Last 7 days</span>
          </div>
          <div className="mt-5 flex items-end gap-2 h-32">
            {last7.map((d, i) => (
              <div key={i} className="flex-1 flex h-full flex-col items-center justify-end gap-1.5">
                <div
                  className="w-full rounded-t-lg bg-linear-to-t from-[var(--color-electric-blue)] to-[var(--color-powder-blue)]"
                  style={{ height: `${Math.max(d.pct, 4)}%`, opacity: d.ml === 0 ? 0.25 : 1 }}
                  title={`${d.date}: ${(d.ml / 1000).toFixed(1)}L`}
                />
                <span className="text-[10px] text-muted-foreground">{d.weekday}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-2 text-[13px] leading-relaxed text-foreground/80">
            <Droplets className="h-4 w-4 text-[var(--color-electric-blue)]" />
            {avgWater > 0
              ? `${(avgWater / 1000).toFixed(1)}L average across ${loggedDays} day${loggedDays === 1 ? "" : "s"} logged.`
              : "No hydration logged yet — tap Log today on Home to start."}
          </p>
        </div>

        {/* Symptom frequency */}
        <div className="rounded-3xl bg-card gx-soft-shadow p-5 gx-card-shadow">
          <p className="font-display text-[16px] font-semibold tracking-tight">Top symptoms</p>
          {symptomCounts.length === 0 ? (
            <p className="mt-3 text-[13px] text-muted-foreground">
              No symptoms logged in the last 30 days.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {symptomCounts.map(([name, count]) => {
                const max = symptomCounts[0][1];
                const pct = Math.round((count / max) * 100);
                return (
                  <li key={name}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="font-medium text-foreground">{name}</span>
                      <span className="text-muted-foreground">{count} day{count === 1 ? "" : "s"}</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Logging consistency */}
        <div className="rounded-3xl bg-card gx-soft-shadow p-5 gx-card-shadow">
          <p className="font-display text-[16px] font-semibold tracking-tight">Logging consistency</p>
          <p className="mt-2 text-[13px] leading-relaxed text-foreground/80">
            You've logged <strong>{loggedDays}</strong> day{loggedDays === 1 ? "" : "s"} out of the last 30. Steady, gentle tracking gives the clearest picture.
          </p>
        </div>
      </div>
    </div>
  );
}
