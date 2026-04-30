import { Button } from "@/components/ui/button";
import { BrandOrb } from "../BrandLogo";
import { ArrowRight, Droplets, Plus, Leaf } from "lucide-react";

export function HomeScreen({ onLog, onPregnancy }: { onLog: () => void; onPregnancy: () => void }) {
  return (
    <div className="gx-screen px-5 pt-3 pb-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[13px] text-muted-foreground">Good morning</p>
          <h1 className="mt-0.5 font-display text-[26px] font-semibold leading-tight tracking-tight">Amelia</h1>
        </div>
        <button
          aria-label="Profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-[13px] font-semibold text-foreground gx-hairline"
        >
          A
        </button>
      </div>

      {/* Hero cycle card — clean, premium */}
      <div className="relative mt-6 overflow-hidden rounded-[28px] bg-card p-6 gx-card-shadow">
        <div className="pointer-events-none absolute -right-10 -top-12 opacity-70">
          <BrandOrb className="h-44 w-44" />
        </div>
        <div className="relative">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Day 13 · Fertile window</p>
          <p className="mt-3 max-w-[14ch] font-display text-[26px] font-semibold leading-[1.1] tracking-tight">
            High chance of conception today
          </p>
          <p className="mt-2 max-w-[24ch] text-[13.5px] leading-relaxed text-muted-foreground">
            Ovulation expected in 1–2 days. Stay hydrated and rested.
          </p>
          <div className="mt-5 flex flex-wrap gap-1.5 text-[11.5px]">
            <span className="rounded-full bg-[color-mix(in_oklab,var(--electric-lavender)_8%,white)] px-2.5 py-1 text-primary">High estrogen</span>
            <span className="rounded-full bg-[color-mix(in_oklab,var(--powder-blue)_22%,white)] px-2.5 py-1 text-foreground/75">Peak energy</span>
          </div>
        </div>
      </div>

      {/* Today's focus — minimal */}
      <div className="mt-3 rounded-[24px] bg-card p-5 gx-soft-shadow">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Today's focus</p>
        <p className="mt-1.5 font-display text-[17px] font-semibold tracking-tight">Add 2 cups of leafy greens</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">Folate-forward foods support egg quality.</p>
      </div>

      {/* Two stats — quieter */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] bg-card p-4 gx-soft-shadow">
          <Droplets className="h-4 w-4 text-[var(--color-electric-blue)]" />
          <p className="mt-3 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Hydration</p>
          <p className="mt-0.5 font-display text-[18px] font-semibold leading-tight">1.6<span className="text-muted-foreground text-[12px] font-normal"> / 2.4L</span></p>
        </div>
        <div className="rounded-[20px] bg-card p-4 gx-soft-shadow">
          <Leaf className="h-4 w-4 text-primary" />
          <p className="mt-3 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Streak</p>
          <p className="mt-0.5 font-display text-[18px] font-semibold leading-tight">12 <span className="text-muted-foreground text-[12px] font-normal">days</span></p>
        </div>
      </div>

      <Button
        onClick={onLog}
        size="lg"
        className="mt-5 h-14 w-full rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="mr-1 h-5 w-5" />
        Log today
      </Button>

      <button
        onClick={onPregnancy}
        className="mt-3 flex w-full items-center justify-between px-2 py-3 text-left"
      >
        <span className="text-[13px] text-muted-foreground">Preview pregnancy pathway</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
