import { Button } from "@/components/ui/button";
import { BrandLogo, BrandOrb } from "./BrandLogo";
import { Sparkles, Heart, Leaf, BarChart3, ChevronRight } from "lucide-react";

export function SplashScreen({ onStart, onSignIn }: { onStart: () => void; onSignIn: () => void }) {
  return (
    <div className="gx-screen flex h-full min-h-[760px] flex-col px-6 pt-6 pb-10">
      <BrandLogo />

      <div className="mt-10 flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative">
          <BrandOrb className="h-44 w-44" />
          <div className="absolute -inset-6 rounded-full border border-primary/10" />
          <div className="absolute -inset-12 rounded-full border border-primary/5" />
        </div>

        <h1 className="mt-12 max-w-[18ch] font-display text-[34px] font-semibold leading-[1.1] tracking-tight text-foreground">
          Feel informed, supported, and ready for your conception journey.
        </h1>
        <p className="mt-4 max-w-[28ch] text-[15px] leading-relaxed text-muted-foreground">
          A gentle, personalised companion for your fertility-prep journey.
        </p>
      </div>

      <div className="space-y-3">
        <Button
          size="lg"
          onClick={onStart}
          className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Start Your Personalised Quiz
          <ChevronRight className="ml-1 h-5 w-5" />
        </Button>
        <button
          onClick={onSignIn}
          className="block w-full py-3 text-center text-sm font-medium text-foreground/80 hover:text-foreground"
        >
          Sign in
        </button>
        <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[12px] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-[var(--color-electric-lavender)]" />
          Educational fertility wellness support, tailored to you.
        </p>
      </div>
    </div>
  );
}

export function OnboardingIntro({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const benefits = [
    { Icon: Heart, title: "Understand your cycle", desc: "Recognise patterns with calm, clear guidance.", tint: "lavender" },
    { Icon: Leaf, title: "Support fertility nutrition", desc: "Cycle-aware food and supplement focus.", tint: "blue" },
    { Icon: BarChart3, title: "Receive tailored insights", desc: "Gentle observations based on your tracking.", tint: "pink" },
  ] as const;

  const tints = {
    lavender: "bg-[color-mix(in_oklab,var(--electric-lavender)_12%,white)] text-[var(--color-electric-lavender)]",
    blue: "bg-[color-mix(in_oklab,var(--powder-blue)_30%,white)] text-[var(--color-electric-blue)]",
    pink: "bg-[color-mix(in_oklab,var(--powder-pink)_30%,white)] text-[var(--color-electric-pink)]",
  };

  return (
    <div className="gx-screen flex h-full flex-col px-6 pt-2 pb-10">
      <button onClick={onBack} className="-ml-2 flex h-11 w-11 items-center justify-center text-foreground">
        <ChevronRight className="h-5 w-5 rotate-180" />
      </button>

      <div className="mt-2">
        <h1 className="max-w-[16ch] font-display text-[30px] font-semibold leading-[1.1] tracking-tight">
          Your fertility preparation, gently guided
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Genesyx blends cycle awareness, nutrition, and supportive insights into one calm space.
        </p>
      </div>

      <div className="mt-8 space-y-3">
        {benefits.map(({ Icon, title, desc, tint }) => (
          <div key={title} className="flex items-start gap-4 rounded-3xl border border-border/60 bg-card p-4 gx-card-shadow">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tints[tint]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-foreground">{title}</p>
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-8">
        <Button
          size="lg"
          onClick={onContinue}
          className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
