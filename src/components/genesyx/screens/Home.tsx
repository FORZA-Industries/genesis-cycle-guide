import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandOrb } from "../BrandLogo";
import { ArrowRight, Droplets, Flame, Plus, Sparkles, Leaf } from "lucide-react";

export function HomeScreen({ onLog, onPregnancy }: { onLog: () => void; onPregnancy: () => void }) {
  return (
    <div className="gx-screen px-5 pt-2 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[13px] text-muted-foreground">Good morning,</p>
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-tight">Amelia</h1>
        </div>
        <button
          aria-label="Profile"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-baby-lavender)] to-[var(--color-electric-pink)] text-sm font-semibold text-white"
        >
          A
        </button>
      </div>

      {/* Hero cycle status */}
      <div className="relative mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--color-electric-lavender)] via-[var(--color-baby-lavender)] to-[var(--color-electric-pink)] p-6 text-white gx-card-shadow">
        <div className="absolute -right-10 -top-10 opacity-30">
          <BrandOrb className="h-44 w-44" />
        </div>
        <Badge className="rounded-full border-none bg-white/20 px-2.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wider text-white backdrop-blur">
          Day 13 · Fertile window
        </Badge>
        <p className="mt-3 font-display text-[28px] font-semibold leading-tight tracking-tight">
          High chance of conception today
        </p>
        <p className="mt-1.5 text-[13.5px] text-white/85">
          Ovulation expected in 1–2 days. Stay hydrated and rested.
        </p>
        <div className="mt-5 flex items-center gap-3 text-[12px]">
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">High estrogen</span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">Peak energy</span>
        </div>
      </div>

      {/* Today's action */}
      <div className="mt-4 rounded-3xl border border-border/60 bg-card p-5 gx-card-shadow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Today's focus</p>
            <p className="mt-1 font-display text-[17px] font-semibold tracking-tight">Add 2 cups of leafy greens</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Folate-forward foods support egg quality.</p>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--electric-lavender)_10%,white)] text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-border/60 bg-card p-4 gx-soft-shadow">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--powder-blue)_30%,white)] text-[var(--color-electric-blue)]">
            <Droplets className="h-5 w-5" />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Hydration</p>
          <p className="font-display text-[20px] font-semibold leading-tight">1.6 / 2.4L</p>
        </div>
        <div className="rounded-3xl border border-border/60 bg-card p-4 gx-soft-shadow">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--powder-pink)_30%,white)] text-[var(--color-electric-pink)]">
            <Flame className="h-5 w-5" />
          </div>
          <p className="mt-3 text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Streak</p>
          <p className="font-display text-[20px] font-semibold leading-tight">12 days</p>
        </div>
      </div>

      {/* Nutrition tip */}
      <div className="mt-3 rounded-3xl border border-border/60 bg-[color-mix(in_oklab,var(--powder-blue)_18%,white)] p-5">
        <div className="flex items-start gap-3">
          <Leaf className="h-5 w-5 shrink-0 text-[var(--color-electric-blue)]" />
          <div>
            <p className="font-display text-[15px] font-semibold tracking-tight">Nutrition tip</p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/80">
              Pair iron-rich foods with vitamin C — try lentils with bell peppers today.
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={onLog}
        size="lg"
        className="mt-4 h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="mr-1 h-5 w-5" />
        Log today
      </Button>

      <button
        onClick={onPregnancy}
        className="mt-3 flex w-full items-center justify-between rounded-2xl border border-dashed border-border/80 bg-transparent px-4 py-3 text-left"
      >
        <span className="text-[13px] text-muted-foreground">Preview pregnancy pathway</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
