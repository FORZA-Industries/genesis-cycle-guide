import { Button } from "@/components/ui/button";
import { Baby, Apple, ChevronLeft, Heart, Sparkles } from "lucide-react";

export function PregnancyTransition({ onSwitch, onLater }: { onSwitch: () => void; onLater: () => void }) {
  return (
    <div className="gx-screen flex min-h-full flex-col px-6 pt-2 pb-8">
      <button onClick={onLater} className="-ml-2 flex h-11 w-11 items-center justify-center text-foreground">
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="mt-2 flex flex-col items-center text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[color-mix(in_oklab,var(--powder-pink)_30%,white)] text-[var(--color-electric-pink)]" aria-hidden>
          <Heart className="h-9 w-9" />
        </div>
        <h1 className="mt-6 max-w-[18ch] font-display text-[26px] font-semibold leading-tight tracking-tight">
          Support for the next chapter
        </h1>
        <p className="mt-3 max-w-[30ch] text-[14px] leading-relaxed text-muted-foreground">
          Whenever you're ready, Genesyx can gently shift to support you through pregnancy — at your pace.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        <FeatureCard Icon={Baby} title="Trimester tracking" desc="Week-by-week guidance with calm, clear updates." />
        <FeatureCard Icon={Apple} title="Prenatal nutrition" desc="Updated focus foods and supplement guidance." />
      </div>

      <div className="mt-auto space-y-2 pt-8">
        <Button
          onClick={onSwitch}
          size="lg"
          className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Switch to pregnancy mode
        </Button>
        <button onClick={onLater} className="block w-full py-3 text-center text-sm font-medium text-foreground/80">
          Not yet, keep tracking
        </button>
      </div>
    </div>
  );
}

function FeatureCard({ Icon, title, desc }: { Icon: typeof Baby; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 rounded-3xl bg-card gx-soft-shadow p-4 gx-card-shadow">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--powder-pink)_25%,white)] text-[var(--color-electric-pink)]">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-display text-[15.5px] font-semibold tracking-tight">{title}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

/**
 * Lightweight pregnancy-mode dashboard. Replaces the "coming soon" toast
 * with a real in-app screen so the toggle actually leads somewhere.
 */
export function PregnancyHome({
  displayName,
  onBackToPrep,
}: {
  displayName: string;
  onBackToPrep: () => void;
}) {
  return (
    <div className="gx-screen px-5 pt-3 pb-4">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[13px] text-muted-foreground">Pregnancy mode</p>
          <h1 className="mt-0.5 font-display text-[26px] font-semibold leading-tight tracking-tight">{displayName}</h1>
        </div>
      </div>

      <div className="mt-6 rounded-[28px] bg-card p-6 gx-card-shadow">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--color-electric-pink)]">Week-by-week</p>
        <p className="mt-3 font-display text-[24px] font-semibold leading-[1.1] tracking-tight">
          Gentle prenatal guidance
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
          Once you confirm your due date, Genesyx will guide you through each week with calm prenatal nutrition,
          symptom tracking, and supplement reminders.
        </p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] bg-card p-4 gx-soft-shadow">
          <Baby className="h-4 w-4 text-[var(--color-electric-pink)]" />
          <p className="mt-3 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Trimester</p>
          <p className="mt-0.5 font-display text-[18px] font-semibold leading-tight">—</p>
        </div>
        <div className="rounded-[20px] bg-card p-4 gx-soft-shadow">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="mt-3 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Focus</p>
          <p className="mt-0.5 font-display text-[18px] font-semibold leading-tight">Folate</p>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] bg-card p-5 gx-soft-shadow">
        <p className="font-display text-[15.5px] font-semibold tracking-tight">Prenatal essentials</p>
        <ul className="mt-2 space-y-1.5 text-[13.5px] text-foreground/85">
          <li>• Folate 400–800 mcg daily</li>
          <li>• Vitamin D 600 IU daily</li>
          <li>• Omega-3 (DHA) 200 mg daily</li>
          <li>• Stay hydrated and rest when needed</li>
        </ul>
      </div>

      <Button
        onClick={onBackToPrep}
        variant="outline"
        className="mt-6 h-12 w-full rounded-2xl"
      >
        Switch back to fertility prep
      </Button>
    </div>
  );
}
