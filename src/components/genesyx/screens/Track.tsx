import { Button } from "@/components/ui/button";
import { ScreenHeader } from "../ScreenHeader";
import { cycleDays } from "../mockData";
import { cn } from "@/lib/utils";
import { Pencil, Plus } from "lucide-react";

const dayClass = {
  period: "bg-[color-mix(in_oklab,var(--powder-pink)_55%,white)] text-foreground",
  follicular: "bg-card text-foreground border border-border",
  fertile: "bg-[color-mix(in_oklab,var(--powder-blue)_55%,white)] text-foreground",
  ovulation: "bg-primary text-primary-foreground ring-2 ring-offset-2 ring-primary/30",
  luteal: "bg-[color-mix(in_oklab,var(--baby-lavender)_25%,white)] text-foreground",
} as const;

export function TrackScreen({ onLog }: { onLog: () => void }) {
  const today = 13;
  return (
    <div className="gx-screen pb-4">
      <ScreenHeader title="May 2026" subtitle="Cycle 24 · Day 13" trailing={
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-card gx-hairline">
          <Pencil className="h-4 w-4" />
        </button>
      }/>

      <div className="px-5">
        <div className="rounded-[28px] bg-card p-5 gx-card-shadow">
          <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {["S","M","T","W","T","F","S"].map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {cycleDays.map((cd) => (
              <div
                key={cd.day}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-xl text-[13px] font-medium",
                  dayClass[cd.type],
                  cd.day === today && "ring-2 ring-foreground ring-offset-2 ring-offset-card"
                )}
                aria-label={`Day ${cd.day} ${cd.type}`}
              >
                {cd.day}
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-[11.5px]">
            <Legend color="powder-pink" label="Period" />
            <Legend color="powder-blue" label="Fertile window" />
            <Legend color="primary" label="Ovulation" textWhite />
            <Legend color="baby-lavender" label="Luteal" />
          </div>
        </div>

        <div className="mt-3 rounded-[28px] bg-card p-5 gx-card-shadow">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Current phase</p>
          <p className="mt-1.5 font-display text-[22px] font-semibold tracking-tight">Ovulatory Phase</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
            Peak fertility. Energy is naturally higher — a good moment for nourishing meals and gentle movement.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5 text-[11.5px]">
            {["High estrogen", "Peak energy", "LH rising"].map((t) => (
              <span key={t} className="rounded-full bg-muted px-2.5 py-1 text-foreground/75">{t}</span>
            ))}
          </div>
        </div>

        <Button
          onClick={onLog}
          size="lg"
          className="mt-5 h-14 w-full rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-1 h-5 w-5" /> Add to today's log
        </Button>
      </div>
    </div>
  );
}

function Legend({ color, label, textWhite }: { color: string; label: string; textWhite?: boolean }) {
  const map: Record<string, string> = {
    "powder-pink": "bg-[color-mix(in_oklab,var(--powder-pink)_55%,white)]",
    "powder-blue": "bg-[color-mix(in_oklab,var(--powder-blue)_55%,white)]",
    "primary": "bg-primary",
    "baby-lavender": "bg-[color-mix(in_oklab,var(--baby-lavender)_25%,white)]",
  };
  return (
    <div className="flex items-center gap-2">
      <span className={cn("inline-block h-3.5 w-3.5 rounded-md", map[color])} />
      <span className={cn("text-foreground/80", textWhite && "")}>{label}</span>
    </div>
  );
}
