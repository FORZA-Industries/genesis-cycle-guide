import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BrandOrb } from "../BrandLogo";
import { CalendarDays, Leaf, Sparkles, BookOpen, Check, Mail, ChevronLeft, Lock } from "lucide-react";
import { toast } from "sonner";

export function QuizResults({
  onUnlock,
  onContinue,
  onBack,
}: {
  onUnlock: () => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  const insights = [
    { Icon: CalendarDays, label: "Cycle awareness", value: "Build a steady tracking rhythm" },
    { Icon: Leaf, label: "Nutrition focus", value: "Folate, omega-3, and zinc-rich foods" },
    { Icon: Sparkles, label: "Daily support", value: "Gentle prompts and supplement plan" },
  ];

  return (
    <div className="gx-screen flex min-h-full flex-col px-6 pt-2 pb-8">
      <button onClick={onBack} className="-ml-2 flex h-11 w-11 items-center justify-center text-foreground">
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="mt-2 flex flex-col items-center text-center">
        <BrandOrb className="h-20 w-20" />
        <Badge className="mt-5 rounded-full border-none bg-[color-mix(in_oklab,var(--electric-lavender)_10%,white)] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary">
          Your readiness summary
        </Badge>
        <h1 className="mt-3 font-display text-[26px] font-semibold leading-tight tracking-tight">
          A thoughtful starting point
        </h1>
        <p className="mt-2 max-w-[30ch] text-[14px] leading-relaxed text-muted-foreground">
          You're already taking meaningful steps. Here's where Genesyx will support you next.
        </p>
      </div>

      <div className="mt-7 rounded-3xl border border-border/60 bg-card p-5 gx-card-shadow">
        <div className="space-y-4">
          {insights.map(({ Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--electric-lavender)_10%,white)] text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 border-b border-border/50 pb-4 last:border-b-0 last:pb-0">
                <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
                <p className="mt-0.5 text-[15px] font-medium text-foreground">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 rounded-3xl border border-border/60 bg-[color-mix(in_oklab,var(--powder-blue)_18%,white)] p-5">
        <p className="font-display text-[15px] font-semibold text-foreground">Suggested next steps</p>
        <ul className="mt-3 space-y-2 text-[14px] text-foreground/85">
          {[
            "Start logging your cycle for 7 days",
            "Review your personalised nutrition focus",
            "Save the free fertility nutrition guide",
          ].map((s) => (
            <li key={s} className="flex items-start gap-2.5">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto space-y-2 pt-7">
        <Button
          onClick={onUnlock}
          size="lg"
          className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <BookOpen className="mr-2 h-5 w-5" />
          Unlock My Free Guide
        </Button>
        <button
          onClick={onContinue}
          className="block w-full py-3 text-center text-sm font-medium text-foreground/80 hover:text-foreground"
        >
          Continue to dashboard
        </button>
      </div>
    </div>
  );
}

export function WaitlistScreen({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = () => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSuccess(true);
    toast.success("You're on the list", { description: "Your guide is on its way to your inbox." });
  };

  if (success) {
    return (
      <div className="gx-screen flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--electric-lavender)_12%,white)] text-primary">
          <Check className="h-10 w-10" />
        </div>
        <h2 className="mt-6 font-display text-[24px] font-semibold tracking-tight">You're on the list</h2>
        <p className="mt-2 max-w-[28ch] text-[14px] text-muted-foreground">
          Your guide is on its way. We'll be in touch when Genesyx opens for early access.
        </p>
        <Button
          onClick={onContinue}
          size="lg"
          className="mt-10 h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Continue to app
        </Button>
      </div>
    );
  }

  return (
    <div className="gx-screen flex min-h-full flex-col px-6 pt-2 pb-8">
      <button onClick={onBack} className="-ml-2 flex h-11 w-11 items-center justify-center text-foreground">
        <ChevronLeft className="h-5 w-5" />
      </button>

      <h1 className="mt-2 font-display text-[26px] font-semibold leading-tight tracking-tight">
        The Genesyx Fertility Nutrition Guide
      </h1>
      <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
        A free companion eBook to help you start eating with intention.
      </p>

      {/* eBook preview */}
      <div className="mt-6 rounded-3xl border border-border/60 bg-gradient-to-br from-[color-mix(in_oklab,var(--electric-lavender)_18%,white)] via-[color-mix(in_oklab,var(--powder-pink)_22%,white)] to-[color-mix(in_oklab,var(--powder-blue)_22%,white)] p-6 gx-card-shadow">
        <div className="mx-auto flex h-48 w-36 flex-col justify-between rounded-2xl bg-card p-4 shadow-[0_24px_48px_-16px_rgba(77,77,170,0.35)]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Genesyx</p>
            <p className="mt-2 font-display text-[15px] font-semibold leading-tight tracking-tight text-foreground">
              The Fertility Nutrition Guide
            </p>
          </div>
          <BrandOrb className="h-10 w-10 self-end" />
        </div>
      </div>

      <ul className="mt-6 space-y-2.5 text-[14px] text-foreground/85">
        {[
          "Early access to Genesyx",
          "Personalised fertility-prep tools",
          "Nutrition and supplement guidance",
        ].map((b) => (
          <li key={b} className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <label htmlFor="wl-email" className="text-[13px] font-medium text-foreground">Email address</label>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="wl-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            className="h-13 rounded-2xl border-border/70 bg-card pl-11 text-[15px]"
            aria-invalid={!!error}
          />
        </div>
        {error && <p className="mt-2 text-[12.5px] font-medium text-destructive">{error}</p>}
      </div>

      <div className="mt-auto pt-6 space-y-3">
        <Button
          onClick={submit}
          size="lg"
          className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Join the Waiting List
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-center text-[11.5px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </div>
  );
}
