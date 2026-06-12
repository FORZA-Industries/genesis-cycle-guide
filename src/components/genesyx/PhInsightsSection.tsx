import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, ArrowRight, ChevronRight, Droplet } from "lucide-react";
import { usePhReadings, phStatus, PH_STATUS_LABEL, PH_STATUS_COLOR, type PhStatus } from "@/hooks/use-ph";

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function PhInsightsSection({ onOpenTracker }: { onOpenTracker?: () => void }) {
  const { readings, loading } = usePhReadings(90);

  const { latest, previous, avg7, avg30, status, trend, insight, recommendation } = useMemo(() => {
    const sorted = [...readings].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
    const latest = sorted[sorted.length - 1] ?? null;
    const previous = sorted[sorted.length - 2] ?? null;
    const now = Date.now();
    const last7 = sorted.filter((r) => now - new Date(r.recordedAt).getTime() <= 7 * 86400_000);
    const last30 = sorted.filter((r) => now - new Date(r.recordedAt).getTime() <= 30 * 86400_000);
    const avg7 = avg(last7.map((r) => r.phValue));
    const avg30 = avg(last30.map((r) => r.phValue));
    const status: PhStatus | null = latest ? phStatus(latest.phValue) : null;
    const trend: "up" | "down" | "flat" | null = latest && previous
      ? latest.phValue - previous.phValue > 0.1 ? "up"
        : latest.phValue - previous.phValue < -0.1 ? "down" : "flat"
      : null;

    let insight = "Log a few more readings and we'll share gentle observations.";
    let recommendation: string | null = null;
    if (last7.length >= 2 && avg7 != null) {
      const s = phStatus(avg7);
      if (s === "acidic") {
        insight = "Your pH has been trending acidic this week.";
        recommendation = "Try more leafy greens, citrus, and steady hydration to gently shift toward optimal.";
      } else if (s === "alkaline") {
        insight = "Your pH has been trending alkaline this week.";
        recommendation = "Balance with whole grains, lean protein, and reduce excess mineral water.";
      } else {
        insight = "Your pH is sitting comfortably in the optimal range — lovely work.";
        recommendation = "Keep your current hydration and meal rhythm; consistency is the goal.";
      }
    }

    return { latest, previous, avg7, avg30, status, trend, insight, recommendation };
  }, [readings]);

  const TrendIcon = trend === "up" ? ArrowUpRight : trend === "down" ? ArrowDownRight : ArrowRight;

  return (
    <button
      type="button"
      onClick={onOpenTracker}
      className="block w-full text-left rounded-3xl bg-card gx-soft-shadow p-5 gx-card-shadow transition-colors hover:border-primary/40"
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-[16px] font-semibold tracking-tight">Urine pH</p>
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-primary">
          Open tracker <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>

      {loading ? (
        <div className="mt-4 h-20 animate-pulse rounded-2xl bg-muted/50" />
      ) : !latest ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-muted/30 p-4">
          <Droplet className="h-5 w-5 text-primary/70" />
          <p className="text-[13px] text-muted-foreground">No pH readings yet. Tap to log your first one.</p>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Current</p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="font-display text-3xl font-semibold tabular-nums" style={{ color: PH_STATUS_COLOR[status!] }}>
                  {latest.phValue.toFixed(1)}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider"
                  style={{ background: `color-mix(in oklab, ${PH_STATUS_COLOR[status!]} 18%, white)`, color: PH_STATUS_COLOR[status!] }}
                >
                  {PH_STATUS_LABEL[status!]}
                </span>
              </div>
            </div>
            {trend && (
              <div className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground">
                <TrendIcon className="h-4 w-4" />
                vs previous
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="7-day avg" value={avg7 != null ? avg7.toFixed(2) : "—"} />
            <Stat label="30-day avg" value={avg30 != null ? avg30.toFixed(2) : "—"} />
          </div>

          <p className="mt-4 text-[13px] leading-relaxed text-foreground/80">{insight}</p>
          {recommendation && (
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{recommendation}</p>
          )}
        </>
      )}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3">
      <p className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-[18px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}
