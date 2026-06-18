import { Button } from "@/components/ui/button";
import { BrandLogo } from "../BrandLogo";
import { Sparkles, Heart, Leaf, BarChart3, ChevronRight } from "lucide-react";
import splashBg from "@/assets/splash-bg.jpg.asset.json";
import introIllustration from "@/assets/intro-illustration.png.asset.json";
import eggMale from "@/assets/egg-male.png";
import eggFemale from "@/assets/egg-female.png";


/**
 * Floating brand Egg — uses the official Genesyx 'Egg' artworks
 * (Male = blue, Female = pink) from the brand guidelines. The JPGs ship
 * on a white background, so we use mix-blend-multiply to drop the white
 * cleanly against the Zenith Grey canvas.
 */
function FloatingEgg({
  variant,
  size,
  className = "",
  delay = 0,
  duration = 10,
  rotate = 0,
  opacity = 1,
}: {
  variant: "male" | "female";
  size: number;
  className?: string;
  delay?: number;
  duration?: number;
  rotate?: number;
  opacity?: number;
}) {
  return (
    <img
      src={variant === "male" ? eggMale : eggFemale}
      alt=""
      aria-hidden
      className={`pointer-events-none absolute select-none ${className}`}

      style={{
        width: size,
        height: size,
        transform: `rotate(${rotate}deg)`,
        animation: `gx-float ${duration}s ease-in-out ${delay}s infinite`,
        opacity,
      }}
      draggable={false}
    />
  );
}

export function SplashScreen({ onStart, onSignIn }: { onStart: () => void; onSignIn: () => void }) {
  return (
    <div className="gx-screen relative flex h-full min-h-[760px] flex-col overflow-hidden px-6 pt-4 pb-10">
      {/* Full-bleed brand background — floating soft eggs on zenith grey */}
      <img
        src={splashBg.url}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* Ambient brand eggs — symbol of the embryo, gently floating over the bg */}
      <FloatingEgg variant="male"   size={170} delay={0}   duration={12} rotate={20}   className="-left-12 -top-6" />
      <FloatingEgg variant="female" size={150} delay={1.2} duration={13} rotate={-25}  className="-right-10 -top-4" />
      <FloatingEgg variant="female" size={110} delay={2}   duration={11} rotate={55}   className="-left-8 top-[36%]" />
      <FloatingEgg variant="male"   size={130} delay={0.6} duration={14} rotate={-15}  className="-right-12 top-[42%]" />
      <FloatingEgg variant="male"   size={90}  delay={2.4} duration={10} rotate={70}   className="left-1/3 top-[18%]" opacity={0.85} />
      <FloatingEgg variant="female" size={120} delay={1.8} duration={13} rotate={-50}  className="-left-10 bottom-44" />
      <FloatingEgg variant="male"   size={150} delay={0.4} duration={12} rotate={30}   className="-right-14 bottom-36" />
      <FloatingEgg variant="female" size={70}  delay={3}   duration={11} rotate={0}    className="right-1/4 bottom-24" opacity={0.85} />

      <div className="relative z-10 flex justify-center pt-2">
        <BrandLogo size={64} />
      </div>

      <div className="relative z-10 mt-8 flex flex-1 flex-col items-center justify-center text-center">
        <p className="font-display text-[13px] font-medium uppercase tracking-[0.22em] text-[var(--color-electric-lavender)]">
          Step into the future of fertility
        </p>
        <h1 className="mt-4 max-w-[16ch] font-display text-[32px] font-semibold leading-[1.05] tracking-tight text-foreground">
          Feel informed, supported and ready for your conception journey.
        </h1>
        <p className="mt-5 max-w-[28ch] text-[15px] leading-relaxed text-muted-foreground">
          A premium, gently-guided companion blending cycle awareness, nutrition and supplement support.
        </p>
      </div>

      <div className="relative z-10 space-y-3">
        <Button
          size="lg"
          onClick={onStart}
          className="h-14 w-full rounded-2xl bg-[var(--color-electric-lavender)] text-base font-semibold text-white shadow-[0_10px_30px_-12px_rgba(77,77,170,0.55)] hover:bg-[var(--color-electric-lavender)]/90"
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

      <div className="mt-2 flex flex-col items-center text-center">
        <img
          src={introIllustration.url}
          alt=""
          aria-hidden
          className="h-44 w-44 object-contain"
          loading="lazy"
          width={1024}
          height={1024}
        />
        <h1 className="mt-4 max-w-[16ch] font-display text-[30px] font-semibold leading-[1.1] tracking-tight">
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
