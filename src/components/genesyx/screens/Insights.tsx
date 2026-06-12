import { useState } from "react";
import { ScreenHeader } from "../ScreenHeader";
import { insightBars, nutritionBars } from "../mockData";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { PhInsightsSection } from "../PhInsightsSection";

export function InsightsScreen({ onOpenTracker }: { onOpenTracker?: () => void }) {
  const [empty] = useState(false);

  if (empty) {
    return (
      <div className="gx-screen pb-4">
        <ScreenHeader title="Your Insights" large />
        <div className="px-6 mt-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-primary/60" />
          <p className="mt-4 font-display text-[18px] font-semibold">Your patterns will appear here</p>
          <p className="mt-1 text-[13.5px] text-muted-foreground">Keep logging for a few days and we'll start sharing gentle observations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gx-screen pb-4">
      <ScreenHeader
        title="Your Insights"
        subtitle="Understanding your patterns helps you make informed, empowered decisions for your wellbeing."
        large
      />

      <div className="px-5 space-y-4">
        <PhInsightsSection onOpenTracker={onOpenTracker} />

        {/* Cycle regularity */}
        <div className="rounded-3xl bg-card gx-soft-shadow p-5 gx-card-shadow">
          <div className="flex items-baseline justify-between">
            <p className="font-display text-[16px] font-semibold tracking-tight">Cycle regularity</p>
            <span className="text-[12px] font-medium text-primary">Last 7 cycles</span>
          </div>
          <div className="mt-5 flex items-end gap-2 h-32">
            {insightBars.map((v, i) => (
              <div key={i} className="flex-1 flex h-full flex-col items-center justify-end gap-1.5">
                <div className="w-full rounded-t-lg bg-linear-to-t from-primary/80 to-primary/40" style={{ height: `${v}%` }} />
                <span className="text-[10px] text-muted-foreground">C{i + 1}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-foreground/80">
            Your cycles are tracking with steady consistency — a small day-to-day variation is completely typical.
          </p>
        </div>

        {/* Symptom heatmap */}
        <div className="rounded-3xl bg-card gx-soft-shadow p-5 gx-card-shadow">
          <p className="font-display text-[16px] font-semibold tracking-tight">Symptom patterns</p>
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 35 }).map((_, i) => {
              const intensity = (Math.sin(i * 1.7) + 1) / 2;
              const tone = intensity > 0.7 ? "0.5" : intensity > 0.4 ? "0.3" : intensity > 0.15 ? "0.15" : "0.05";
              return (
                <div
                  key={i}
                  className="aspect-square rounded-md"
                  style={{ background: `color-mix(in oklab, var(--electric-lavender) ${parseFloat(tone) * 100}%, white)` }}
                />
              );
            })}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-foreground/80">
            Fatigue tends to ease in the second half of your cycle — useful to plan rest accordingly.
          </p>
        </div>

        {/* Nutrition consistency */}
        <div className="rounded-3xl bg-card gx-soft-shadow p-5 gx-card-shadow">
          <p className="font-display text-[16px] font-semibold tracking-tight">Nutrition consistency</p>
          <div className="mt-5 flex items-end gap-2 h-28">
            {nutritionBars.map((v, i) => (
              <div key={i} className="flex-1 flex h-full flex-col items-center justify-end gap-1.5">
                <div
                  className={cn("w-full rounded-t-lg bg-linear-to-t from-[var(--color-electric-blue)] to-[var(--color-powder-blue)]")}
                  style={{ height: `${v}%` }}
                />
                <span className="text-[10px] text-muted-foreground">{["M","T","W","T","F","S","S"][i]}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed text-foreground/80">
            You've stayed close to your hydration goal four days this week — gentle progress.
          </p>
        </div>
      </div>
    </div>
  );
}
