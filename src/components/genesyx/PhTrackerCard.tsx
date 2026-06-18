import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, ReferenceArea, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";
import { Plus, Droplet, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePhReadings, phStatus, PH_STATUS_LABEL, PH_STATUS_COLOR } from "@/hooks/use-ph";
import type { PhReadingDTO } from "@/lib/ph.functions";
import { PhLogDialog } from "./PhLogDialog";
import { useAuth } from "@/hooks/use-auth";
import { showSignInRequired } from "@/lib/authPrompt";

type Range = "7" | "30" | "90" | "all";
const RANGE_DAYS: Record<Range, number | null> = { "7": 7, "30": 30, "90": 90, all: null };

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

export function PhTrackerCard({ onRequireAuth }: { onRequireAuth?: () => void }) {
  const { user } = useAuth();
  const [range, setRange] = useState<Range>("30");
  const { readings, loading } = usePhReadings(RANGE_DAYS[range]);
  const [logOpen, setLogOpen] = useState(false);
  const [editing, setEditing] = useState<PhReadingDTO | null>(null);

  const sorted = useMemo(() => [...readings].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt)), [readings]);
  const latest = sorted[sorted.length - 1];
  const latestStatus = latest ? phStatus(latest.phValue) : null;

  const chartData = sorted.map((r) => ({
    t: new Date(r.recordedAt).getTime(),
    ph: r.phValue,
    label: fmtDate(r.recordedAt),
  }));

  const openNew = () => {
    if (!user) {
      showSignInRequired("Sign in to save pH readings.", onRequireAuth);
      return;
    }
    setEditing(null);
    setLogOpen(true);
  };
  const openEdit = (r: PhReadingDTO) => { setEditing(r); setLogOpen(true); };

  return (
    <div className="rounded-[28px] bg-card p-5 gx-card-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Track your pH</p>
          <p className="mt-1 font-display text-[18px] font-semibold tracking-tight">Urine Tracker</p>
        </div>
        <Button onClick={openNew} size="sm" className="h-9 rounded-full bg-primary px-4 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-1 h-4 w-4" /> Log pH
        </Button>
      </div>

      {/* Latest reading */}
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-muted/40 p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{ background: latest ? `color-mix(in oklab, ${PH_STATUS_COLOR[latestStatus!]} 18%, white)` : "var(--muted)" }}
          >
            <Droplet className="h-5 w-5" style={{ color: latest ? PH_STATUS_COLOR[latestStatus!] : "var(--muted-foreground)" }} />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Latest reading</p>
            <p className="font-display text-[22px] font-semibold leading-tight tabular-nums">
              {latest ? latest.phValue.toFixed(1) : "—"}
            </p>
            {latest && (
              <p className="text-[11.5px] text-muted-foreground">{fmtDate(latest.recordedAt)} · {fmtTime(latest.recordedAt)}</p>
            )}
          </div>
        </div>
        {latest && (
          <span
            className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
            style={{ background: `color-mix(in oklab, ${PH_STATUS_COLOR[latestStatus!]} 18%, white)`, color: PH_STATUS_COLOR[latestStatus!] }}
          >
            {PH_STATUS_LABEL[latestStatus!]}
          </span>
        )}
      </div>

      {/* Range selector */}
      <div className="mt-4 grid grid-cols-4 gap-1 rounded-2xl bg-muted p-1">
        {(["7", "30", "90", "all"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "rounded-xl py-2 text-[12px] font-semibold transition-all",
              range === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            )}
          >
            {r === "all" ? "All" : `${r}d`}
          </button>
        ))}
      </div>

      {/* Chart or empty */}
      <div className="mt-3 h-[200px] w-full">
        {loading ? (
          <div className="h-full w-full animate-pulse rounded-2xl bg-muted/50" />
        ) : !user ? (
          <EmptyState label="Sign in to track your pH" cta="Sign in" onCta={onRequireAuth} />
        ) : chartData.length === 0 ? (
          <EmptyState label="No readings yet" cta="Log your first pH" onCta={openNew} />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="color-mix(in oklab, currentColor 8%, transparent)" />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(t) => fmtDate(new Date(t).toISOString())}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
              />
              <YAxis
                domain={[4.5, 9.0]}
                ticks={[4.5, 6.0, 7.5, 9.0]}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
              />
              <ReferenceArea y1={4.5} y2={6.0} fill={PH_STATUS_COLOR.acidic} fillOpacity={0.12} />
              <ReferenceArea y1={6.0} y2={7.5} fill={PH_STATUS_COLOR.optimal} fillOpacity={0.14} />
              <ReferenceArea y1={7.5} y2={9.0} fill={PH_STATUS_COLOR.alkaline} fillOpacity={0.12} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 12 }}
                labelFormatter={(t) => new Date(Number(t)).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                formatter={(v: number) => [v.toFixed(1), "pH"]}
              />
              <Line
                type="monotone"
                dataKey="ph"
                stroke="var(--color-electric-lavender, #4D4DAA)"
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 0, fill: "var(--color-electric-lavender, #4D4DAA)" }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <LegendDot color={PH_STATUS_COLOR.acidic} label="Acidic <6.0" />
        <LegendDot color={PH_STATUS_COLOR.optimal} label="Optimal 6.0–7.5" />
        <LegendDot color={PH_STATUS_COLOR.alkaline} label="Alkaline >7.5" />
      </div>

      {/* History */}
      {sorted.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">History</p>
          <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
            {[...sorted].reverse().map((r) => {
              const s = phStatus(r.phValue);
              return (
                <button
                  key={r.id}
                  onClick={() => openEdit(r)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3 text-left transition-colors hover:border-primary/40"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-display text-[13px] font-semibold tabular-nums"
                      style={{ background: `color-mix(in oklab, ${PH_STATUS_COLOR[s]} 18%, white)`, color: PH_STATUS_COLOR[s] }}
                    >
                      {r.phValue.toFixed(1)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium">{fmtDate(r.recordedAt)} · {fmtTime(r.recordedAt)}</p>
                      <p className="truncate text-[11.5px] text-muted-foreground">
                        {PH_STATUS_LABEL[s]}{r.notes ? ` · ${r.notes}` : ""}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <PhLogDialog open={logOpen} onOpenChange={setLogOpen} editing={editing} />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function EmptyState({ label, cta, onCta }: { label: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-4 text-center">
      <Droplet className="h-7 w-7 text-primary/60" />
      <p className="mt-2 text-[13px] font-medium">{label}</p>
      {cta && (
        <Button onClick={onCta} size="sm" className="mt-3 h-9 rounded-full">
          <Plus className="mr-1 h-4 w-4" /> {cta}
        </Button>
      )}
    </div>
  );
}
