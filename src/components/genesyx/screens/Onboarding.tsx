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
 * Soft blurred crescent "egg" — matches the brand reference: a hazy
 * gradient halo with a paler off-center hollow, heavily blurred for that
 * dreamy, floating feel.
 */
function FloatingEgg({
  size,
  className = "",
  delay = 0,
  duration = 9,
  hue = "lavender",
  rotate = 0,
}: {
  size: number;
  className?: string;
  delay?: number;
  duration?: number;
  hue?: "lavender" | "pink" | "blue" | "mix";
  rotate?: number;
}) {
  const palettes = {
    lavender: { ring: "#a974e6", glow: "#d9a8ff" },
    pink: { ring: "#e074b8", glow: "#ffa8d6" },
    blue: { ring: "#6a92e6", glow: "#a8c8ff" },
    mix: { ring: "#a974e6", glow: "#6a92e6" },
  } as const;
  const { ring, glow } = palettes[hue];
  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        animation: `gx-float ${duration}s ease-in-out ${delay}s infinite`,
      }}
    >
      {/* Outer vivid gradient ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(from 140deg, ${ring} 0deg, ${glow} 120deg, ${ring} 240deg, ${glow} 360deg)`,
          filter: "blur(6px)",
          opacity: 1,
        }}
      />
      {/* Inner hollow — the crescent shape */}
      <div
        className="absolute rounded-full bg-background"
        style={{
          inset: "20%",
          transform: "translate(14%, -12%)",
          filter: "blur(8px)",
          opacity: 1,
        }}
      />
    </div>
  );
}

export function SplashScreen({ onStart, onSignIn }: { onStart: () => void; onSignIn: () => void }) {
  return (
    <div className="gx-screen relative flex h-full min-h-[760px] flex-col overflow-hidden px-6 pt-4 pb-10">
      {/* Ambient floating crescent eggs */}
      <FloatingEgg size={140} hue="blue"     delay={0}   duration={11} rotate={20}   className="-left-10 top-10" />
      <FloatingEgg size={120} hue="lavender" delay={1.2} duration={13} rotate={-30}  className="-right-6 top-6" />
      <FloatingEgg size={90}  hue="pink"     delay={2}   duration={10} rotate={45}   className="-left-6 top-[38%]" />
      <FloatingEgg size={110} hue="lavender" delay={0.6} duration={12} rotate={-15}  className="-right-10 top-[44%]" />
      <FloatingEgg size={80}  hue="blue"     delay={2.4} duration={9}  rotate={70}   className="left-1/3 top-[22%]" />
      <FloatingEgg size={100} hue="pink"     delay={1.8} duration={14} rotate={-50}  className="-left-8 bottom-40" />
      <FloatingEgg size={130} hue="blue"     delay={0.4} duration={12} rotate={30}   className="-right-12 bottom-32" />
      <FloatingEgg size={60}  hue="lavender" delay={3}   duration={10} rotate={0}    className="right-1/4 bottom-20" />



      <div className="relative z-10 flex justify-center pt-2"><BrandLogo size={56} /></div>

      <div className="relative z-10 mt-6 flex flex-1 flex-col items-center justify-center text-center">


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
