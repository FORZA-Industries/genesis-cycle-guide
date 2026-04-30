import { Button } from "@/components/ui/button";
import { BrandOrb } from "../BrandLogo";
import { Baby, Apple, ChevronLeft } from "lucide-react";

export function PregnancyTransition({ onSwitch, onLater }: { onSwitch: () => void; onLater: () => void }) {
  return (
    <div className="gx-screen flex min-h-full flex-col px-6 pt-2 pb-8">
      <button onClick={onLater} className="-ml-2 flex h-11 w-11 items-center justify-center text-foreground">
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="mt-2 flex flex-col items-center text-center">
        <BrandOrb className="h-24 w-24" />
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
    <div className="flex items-start gap-4 rounded-3xl border border-border/60 bg-card p-4 gx-card-shadow">
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
