import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScreenHeader } from "../ScreenHeader";
import { cn } from "@/lib/utils";
import { Pencil, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useCycleSettings } from "@/hooks/use-cycle";
import {
  buildMonthGrid,
  cycleNumberFor,
  dayTypeFor,
  getCyclePhase,
  phaseLabel,
  type DayType,
} from "@/lib/cycle";
import { CycleSettingsDialog } from "../CycleSettingsDialog";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const dayClass: Record<DayType, string> = {
  period: "bg-[color-mix(in_oklab,var(--powder-pink)_55%,white)] text-foreground",
  follicular: "bg-card text-foreground border border-border",
  fertile: "bg-[color-mix(in_oklab,var(--powder-blue)_55%,white)] text-foreground",
  ovulation: "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary/30",
  luteal: "bg-[color-mix(in_oklab,var(--baby-lavender)_25%,white)] text-foreground",
};

const monthLabel = (d: Date) =>
  d.toLocaleString(undefined, { month: "long", year: "numeric" });

export function TrackScreen({ onLog }: { onLog: () => void }) {
  const { settings, loading } = useCycleSettings();
  const [cycleOpen, setCycleOpen] = useState(false);
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const today = new Date();
  const cells = useMemo(() => {
    if (!settings) return null;
    return buildMonthGrid(monthAnchor, settings.lastPeriodDate, settings.cycleLength, settings.periodLength);
  }, [monthAnchor, settings]);

  const todayInfo = settings
    ? getCyclePhase(settings.lastPeriodDate, settings.cycleLength, settings.periodLength)
    : null;
  const cycleNo = settings
    ? cycleNumberFor(settings.lastPeriodDate, settings.cycleLength)
    : null;

  const subtitle = todayInfo && cycleNo
    ? `Cycle ${cycleNo} · Day ${todayInfo.dayOfCycle}`
    : loading ? "Loading…" : "Set up your cycle";

  const selectedInfo = settings && selectedDate
    ? getCyclePhase(settings.lastPeriodDate, settings.cycleLength, settings.periodLength, selectedDate)
    : null;
  const selectedIsPast = selectedDate ? selectedDate < new Date(today.getFullYear(), today.getMonth(), today.getDate()) : false;

  return (
    <div className="gx-screen pb-4">
      <ScreenHeader
        title={monthLabel(monthAnchor)}
        subtitle={subtitle}
        trailing={
          <button
            type="button"
            onClick={() => setCycleOpen(true)}
            aria-label="Edit cycle settings"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-card gx-hairline"
          >
            <Pencil className="h-4 w-4" />
          </button>
        }
      />

      <div className="px-5">
        <div className="rounded-[28px] bg-card p-5 gx-card-shadow">
          {/* Month nav */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() - 1, 1))}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground/80"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-[12.5px] font-medium text-muted-foreground">
              {monthLabel(monthAnchor)}
            </p>
            <button
              type="button"
              onClick={() => setMonthAnchor(new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 1))}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground/80"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {["S","M","T","W","T","F","S"].map((d, i) => <div key={i}>{d}</div>)}
          </div>

          {loading ? (
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {Array.from({ length: 35 }).map((_, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-full bg-muted/70 animate-pulse"
                />
              ))}
            </div>
          ) : !settings ? (
            <button
              type="button"
              onClick={() => setCycleOpen(true)}
              className="mt-4 w-full rounded-2xl border border-dashed border-border p-6 text-center"
            >
              <p className="font-display text-[15px] font-semibold">Add your cycle</p>
              <p className="mt-1 text-[12.5px] text-muted-foreground">
                Tell us when your last period started to see your phases here.
              </p>
            </button>
          ) : (
            <div className="mt-3 grid grid-cols-7 gap-1.5">
              {(cells ?? Array.from({ length: 35 }, () => ({ kind: "empty" as const }))).map((c, idx) => {
                if (c.kind === "empty") return <div key={idx} className="aspect-square" />;
                const type = dayTypeFor(c.info);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(c.date)}
                    aria-label={`${c.date.toDateString()} — ${phaseLabel[c.info.phase]}, day ${c.info.dayOfCycle}`}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-xl text-[13px] font-medium transition-transform active:scale-95",
                      dayClass[type],
                      c.isToday && "ring-2 ring-foreground ring-offset-2 ring-offset-card",
                    )}
                  >
                    {c.date.getDate()}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-[11.5px]">
            <Legend color="powder-pink" label="Period" />
            <Legend color="powder-blue" label="Fertile window" />
            <Legend color="primary" label="Ovulation" />
            <Legend color="baby-lavender" label="Luteal" />
          </div>
        </div>

        <div className="mt-3 rounded-[28px] bg-card p-5 gx-card-shadow">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Current phase</p>
          <p className="mt-1.5 font-display text-[22px] font-semibold tracking-tight">
            {todayInfo ? phaseLabel[todayInfo.phase] : "—"}
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            {todayInfo
              ? todayInfo.fertileWindow
                ? "You're in your fertile window. Stay hydrated and prioritise rest."
                : `About ${todayInfo.daysUntilNextPeriod} days until your next period.`
              : "Set up your cycle to see today's phase."}
          </p>
        </div>

        <Button
          onClick={onLog}
          size="lg"
          className="mt-5 h-14 w-full rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-1 h-5 w-5" /> Add to today's log
        </Button>
      </div>

      <CycleSettingsDialog open={cycleOpen} onOpenChange={setCycleOpen} />

      <Dialog open={!!selectedDate} onOpenChange={(v) => { if (!v) setSelectedDate(null); }}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDate?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
            </DialogTitle>
            <DialogDescription>
              {selectedInfo
                ? `Day ${selectedInfo.dayOfCycle} · ${phaseLabel[selectedInfo.phase]}${selectedInfo.fertileWindow ? " · Fertile" : ""}`
                : "—"}
            </DialogDescription>
          </DialogHeader>
          <div className="text-[13.5px] leading-relaxed text-muted-foreground">
            {selectedIsPast
              ? "No log entries for this day yet. Open Log to add your mood, energy, and symptoms."
              : "Predicted phase based on your cycle. Actual symptoms may vary."}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const map: Record<string, string> = {
    "powder-pink": "bg-[color-mix(in_oklab,var(--powder-pink)_55%,white)]",
    "powder-blue": "bg-[color-mix(in_oklab,var(--powder-blue)_55%,white)]",
    "primary": "bg-primary",
    "baby-lavender": "bg-[color-mix(in_oklab,var(--baby-lavender)_25%,white)]",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={cn("inline-block h-3.5 w-3.5 rounded-md", map[color])} />
      <span className="text-foreground/80">{label}</span>
    </div>
  );
}
