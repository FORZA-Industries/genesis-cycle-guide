import { Button } from "@/components/ui/button";
import { ScreenHeader } from "../ScreenHeader";
import { Progress } from "@/components/ui/progress";
import { nutritionFocus, articles } from "../mockData";
import { Droplets, ChevronRight, Pill, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const toneMap = {
  lavender: "from-[color-mix(in_oklab,var(--electric-lavender)_18%,white)] to-[color-mix(in_oklab,var(--baby-lavender)_15%,white)] text-primary",
  blue: "from-[color-mix(in_oklab,var(--powder-blue)_30%,white)] to-[color-mix(in_oklab,var(--baby-blue)_20%,white)] text-[var(--color-electric-blue)]",
  pink: "from-[color-mix(in_oklab,var(--powder-pink)_30%,white)] to-[color-mix(in_oklab,var(--baby-pink)_20%,white)] text-[var(--color-electric-pink)]",
} as const;

export function NutritionScreen() {
  return (
    <div className="gx-screen pb-4">
      <ScreenHeader title="Your nutrition focus" subtitle="Cycle-aware foods for your ovulatory phase." large />

      <div className="px-5 space-y-4">
        {/* Hydration */}
        <div className="rounded-3xl border border-border/60 bg-card p-5 gx-card-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--powder-blue)_30%,white)] text-[var(--color-electric-blue)]">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-[16px] font-semibold tracking-tight">Hydration goal</p>
                <p className="text-[12.5px] text-muted-foreground">Aim for 2.4L today</p>
              </div>
            </div>
            <span className="font-display text-[18px] font-semibold text-foreground">1.6L</span>
          </div>
          <Progress value={66} className="mt-4 h-2 bg-muted [&>div]:bg-[var(--color-electric-blue)]" />
        </div>

        <div>
          <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Foods to focus on</p>
          <div className="grid grid-cols-2 gap-3">
            {nutritionFocus.map((f) => (
              <div
                key={f.title}
                className={cn("rounded-3xl bg-gradient-to-br p-4 gx-soft-shadow border border-border/40", toneMap[f.tone])}
              >
                <p className="font-display text-[15px] font-semibold leading-tight tracking-tight text-foreground">{f.title}</p>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-foreground/75">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Supplements */}
        <div className="rounded-3xl border border-border/60 bg-card p-5 gx-card-shadow">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--electric-lavender)_10%,white)] text-primary">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-[16px] font-semibold tracking-tight">Supplement guidance</p>
                <p className="mt-0.5 text-[13px] text-muted-foreground">Folate · Omega-3 · Vitamin D · Zinc</p>
              </div>
            </div>
          </div>
          <Button className="mt-4 h-11 w-full rounded-xl bg-primary text-[14px] font-semibold hover:bg-primary/90">
            Review Plan
          </Button>
        </div>

        {/* Articles */}
        <div>
          <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Learn more</p>
          <div className="space-y-2">
            {articles.map((a) => (
              <button key={a.title} className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card p-4 text-left gx-soft-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--powder-pink)_22%,white)] text-[var(--color-electric-pink)]">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[14.5px] font-medium leading-tight text-foreground">{a.title}</p>
                    <p className="mt-1 text-[11.5px] text-muted-foreground">{a.read}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
