import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { articles } from "../mockData";
import { Droplets, ChevronRight, Pill, Minus, Plus } from "lucide-react";
import { useCycleSettings } from "@/hooks/use-cycle";
import { getCyclePhase, phaseFoods, phaseLabel } from "@/lib/cycle";
import { cn } from "@/lib/utils";

export function NutritionScreen() {
  const { settings, loading } = useCycleSettings();
  const info = settings
    ? getCyclePhase(settings.lastPeriodDate, settings.cycleLength, settings.periodLength)
    : null;
  const phase = info?.phase ?? "follicular";
  const foods = info ? phaseFoods[phase] : [];
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="gx-screen pb-6">
      <div className="px-6 pt-3 pb-6">
        <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-primary">
          Today · {info ? phaseLabel[phase] : loading ? "Loading…" : "Set your cycle"}
        </p>
        <h1 className="mt-2 font-display text-[32px] font-semibold leading-[1.05] tracking-tight">
          Your nutrition focus
        </h1>
        <p className="mt-3 text-[14.5px] leading-relaxed text-muted-foreground">
          Foods chosen to gently support your body through this week of your cycle.
        </p>
      </div>

      <div className="px-5 space-y-3">
        {/* Hydration — refined */}
        <div className="rounded-[28px] bg-card p-5 gx-card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Hydration</p>
              <div className="mt-1.5 flex items-baseline gap-1.5">
                <span className="font-display text-[28px] font-semibold tracking-tight">1.6</span>
                <span className="text-[13px] text-muted-foreground">/ 2.4 L</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button aria-label="Remove" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground/70">
                <Minus className="h-4 w-4" />
              </button>
              <button aria-label="Add" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <Progress value={66} className="mt-4 h-1.5 bg-muted [&>div]:bg-foreground" />
          <div className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Droplets className="h-3.5 w-3.5" />
            <span>800ml to go — about 3 more glasses</span>
          </div>
        </div>

        {/* Foods — phase-driven, expandable */}
        <div className="rounded-[28px] bg-card overflow-hidden gx-card-shadow">
          <div className="px-5 pt-5 pb-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Focus foods</p>
            <p className="mt-1 font-display text-[18px] font-semibold tracking-tight">
              {info ? `Gentle priorities for your ${phaseLabel[phase].toLowerCase()}` : "Set up your cycle to see your foods"}
            </p>
          </div>
          {foods.length > 0 && (
            <ul>
              {foods.map((f, i) => {
                const open = expanded === i;
                return (
                  <li key={f.title}>
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : i)}
                      aria-expanded={open}
                      className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors active:bg-muted/40"
                    >
                      <FoodGlyph index={i % 4} />
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[15.5px] font-semibold tracking-tight text-foreground">{f.title}</p>
                        <p className={cn("mt-0.5 text-[13px] leading-relaxed text-muted-foreground", !open && "line-clamp-2")}>{f.desc}</p>
                      </div>
                      <ChevronRight className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground/60 transition-transform", open && "rotate-90")} />
                    </button>
                    {i < foods.length - 1 && <div className="mx-5 h-px bg-border/60" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>


        {/* Supplements — refined */}
        <div className="rounded-[28px] bg-card p-5 gx-card-shadow">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--electric-lavender)_8%,white)] text-primary">
              <Pill className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[16px] font-semibold tracking-tight">Your supplement plan</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                Folate, Omega-3, Vitamin D, and Zinc — taken with breakfast.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex -space-x-1.5">
                  {["F", "O", "D", "Z"].map((l, i) => (
                    <span
                      key={l}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-[color-mix(in_oklab,var(--electric-lavender)_10%,white)] text-[10.5px] font-semibold text-primary"
                      style={{ zIndex: 10 - i }}
                    >
                      {l}
                    </span>
                  ))}
                </div>
                <span className="text-[12px] text-muted-foreground">3 of 4 taken today</span>
              </div>
            </div>
          </div>
          <Button className="mt-5 h-12 w-full rounded-2xl bg-primary text-[14.5px] font-semibold hover:bg-primary/90">
            Review Plan
          </Button>
        </div>

        {/* Articles — calmer */}
        <div className="pt-4">
          <p className="mb-3 px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Learn more</p>
          <div className="space-y-2">
            {articles.map((a) => (
              <button key={a.title} className="flex w-full items-center justify-between rounded-2xl bg-card p-4 text-left gx-soft-shadow">
                <div className="min-w-0 pr-3">
                  <p className="text-[14.5px] font-medium leading-snug text-foreground">{a.title}</p>
                  <p className="mt-1 text-[11.5px] text-muted-foreground">{a.read}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Subtle abstract food glyph — restrained, not illustrative */
function FoodGlyph({ index }: { index: number }) {
  const tints = [
    "bg-[color-mix(in_oklab,var(--electric-lavender)_10%,white)]",
    "bg-[color-mix(in_oklab,var(--powder-blue)_22%,white)]",
    "bg-[color-mix(in_oklab,var(--powder-pink)_22%,white)]",
    "bg-[color-mix(in_oklab,var(--electric-lavender)_8%,white)]",
  ];
  const dots = [
    "bg-primary/80",
    "bg-[var(--color-electric-blue)]/80",
    "bg-[var(--color-electric-pink)]/70",
    "bg-primary/70",
  ];
  return (
    <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tints[index]}`}>
      <span className={`h-2 w-2 rounded-full ${dots[index]}`} />
    </div>
  );
}
