import { Button } from "@/components/ui/button";
import { BrandLogo, BrandOrb } from "../BrandLogo";
import { Sparkles, Heart, Leaf, BarChart3, ChevronRight } from "lucide-react";

/**
 * Genesyx Egg — a smooth, fully-round orb with a soft pink → lavender → blue
 * gradient and a glossy highlight. Used as the brand's central conception symbol.
 */
function GenesyxEgg({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* Soft outer aura */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-70"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, #f5c8e6 0%, #c9b8f0 35%, #a8c7f0 65%, transparent 80%)",
        }}
      />
      {/* Main round egg body */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 32% 28%, #fde6f2 0%, #f0bcdf 22%, #c9a8e8 55%, #a8c0ee 85%, #94b4e6 100%)",
          boxShadow:
            "inset -10px -14px 40px rgba(120, 110, 180, 0.25), inset 8px 10px 30px rgba(255,255,255,0.55)",
        }}
      />
      {/* Glossy top-left highlight */}
      <div
        className="absolute rounded-full opacity-80 mix-blend-screen"
        style={{
          inset: "8%",
          background:
            "radial-gradient(ellipse 45% 32% at 30% 22%, rgba(255,255,255,0.95) 0%, transparent 65%)",
        }}
      />
      {/* Soft bottom shadow blush */}
      <div
        className="absolute rounded-full opacity-50"
        style={{
          inset: "10%",
          background:
            "radial-gradient(ellipse 60% 35% at 65% 80%, rgba(180,140,210,0.35) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

/**
 * Small floating egg used as ambient decoration.
 */
function FloatingEgg({
  size,
  className = "",
  delay = 0,
  duration = 8,
  hue = "lavender",
}: {
  size: number;
  className?: string;
  delay?: number;
  duration?: number;
  hue?: "lavender" | "pink" | "blue";
}) {
  const palettes = {
    lavender: "radial-gradient(circle at 30% 28%, #f3e0fa 0%, #d6b8f0 45%, #a892d8 100%)",
    pink: "radial-gradient(circle at 30% 28%, #ffe1ee 0%, #f5b8d8 45%, #d890b8 100%)",
    blue: "radial-gradient(circle at 30% 28%, #e0ecfa 0%, #b8d0f0 45%, #8aa8d8 100%)",
  } as const;
  return (
    <div
      className={`pointer-events-none absolute rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: palettes[hue],
        boxShadow:
          "inset -3px -4px 10px rgba(120, 110, 180, 0.25), inset 2px 3px 8px rgba(255,255,255,0.6)",
        animation: `gx-float ${duration}s ease-in-out ${delay}s infinite`,
        opacity: 0.85,
      }}
    />
  );
}

export function SplashScreen({ onStart, onSignIn }: { onStart: () => void; onSignIn: () => void }) {
  return (
    <div className="gx-screen relative flex h-full min-h-[760px] flex-col overflow-hidden px-6 pt-4 pb-10">
      {/* Ambient floating eggs */}
      <FloatingEgg size={42} hue="pink" delay={0} duration={9} className="left-6 top-24" />
      <FloatingEgg size={28} hue="blue" delay={1.5} duration={11} className="right-10 top-32" />
      <FloatingEgg size={20} hue="lavender" delay={0.8} duration={7} className="left-16 top-[42%]" />
      <FloatingEgg size={36} hue="lavender" delay={2} duration={10} className="right-6 top-[48%]" />
      <FloatingEgg size={24} hue="pink" delay={3} duration={8} className="left-8 bottom-56" />
      <FloatingEgg size={32} hue="blue" delay={1} duration={9} className="right-14 bottom-48" />
      <FloatingEgg size={18} hue="lavender" delay={2.5} duration={12} className="left-1/2 top-20" />

      <div className="relative z-10 flex justify-center pt-2"><BrandLogo size={56} /></div>

      <div className="relative z-10 mt-6 flex flex-1 flex-col items-center justify-center text-center">
        <div className="relative" style={{ animation: "gx-float 6s ease-in-out infinite" }}>
          <GenesyxEgg className="h-60 w-60" />
          <div className="pointer-events-none absolute -inset-8 rounded-full border border-primary/10" />
          <div className="pointer-events-none absolute -inset-16 rounded-full border border-primary/5" />
        </div>

        <h1 className="mt-10 max-w-[18ch] font-display text-[30px] font-semibold leading-[1.1] tracking-tight text-foreground">
          Feel informed, supported, and ready for your conception journey.
        </h1>
        <p className="mt-4 max-w-[28ch] text-[15px] leading-relaxed text-muted-foreground">
          A gentle, personalised companion for your fertility-prep journey.
        </p>
      </div>

      <div className="relative z-10 space-y-3">
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
          <div key={title} className="flex items-start gap-4 rounded-3xl bg-card gx-soft-shadow p-4 gx-card-shadow">
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
