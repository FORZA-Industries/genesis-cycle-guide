import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Leaf, Sparkles, BookOpen, Check, Mail, ChevronLeft, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export type QuizAnswers = Record<string, string>;

// Map quiz answers → personalized readiness summary cards
function personalizedInsights(a: QuizAnswers) {
  const cycleVal =
    a.cycle === "very" ? "Your cycle is steady — easy to build a tracking rhythm"
    : a.cycle === "mostly" ? "Mostly regular — tracking will reveal your fertile window"
    : a.cycle === "irregular" ? "Irregular cycles — daily logging will surface patterns"
    : "We'll help you learn your unique cycle rhythm";

  const nutritionVal =
    a.support === "nutrition" ? "Folate, omega-3, zinc, and iron-forward meals"
    : "Folate, omega-3, and zinc-rich foods";

  const supportVal =
    a.supplements === "yes" ? "Your routine is on track — we'll keep it gentle"
    : a.supplements === "some" ? "We'll suggest the few additions that matter most"
    : a.supplements === "no" ? "A simple starter routine — folate first"
    : "Personalised supplement guidance, step by step";

  return [
    { Icon: CalendarDays, label: "Cycle awareness", value: cycleVal },
    { Icon: Leaf, label: "Nutrition focus", value: nutritionVal },
    { Icon: Sparkles, label: "Daily support", value: supportVal },
  ];
}

function personalizedNextSteps(a: QuizAnswers): string[] {
  const steps: string[] = [];
  steps.push(a.cycle === "unsure"
    ? "Set up your cycle to unlock daily insights"
    : "Log your cycle for 7 days to spot your fertile window");
  steps.push(a.support === "nutrition"
    ? "Review your personalised nutrition focus"
    : a.support === "supplements"
      ? "Review your supplement plan"
      : a.support === "emotional"
        ? "Take a calm 2-minute breathing break today"
        : "Review your personalised nutrition focus");
  steps.push("Save the free fertility nutrition guide");
  return steps;
}

export function QuizResults({
  onUnlock,
  onContinue,
  onBack,
  answers,
}: {
  onUnlock: () => void;
  onContinue: () => void;
  onBack: () => void;
  answers?: QuizAnswers;
}) {
  const insights = useMemo(() => personalizedInsights(answers ?? {}), [answers]);
  const nextSteps = useMemo(() => personalizedNextSteps(answers ?? {}), [answers]);

  return (
    <div className="gx-screen flex min-h-full flex-col px-6 pt-2 pb-8">
      <button onClick={onBack} className="-ml-2 flex h-11 w-11 items-center justify-center text-foreground">
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="mt-2 flex flex-col items-center text-center">
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

      <div className="mt-7 rounded-3xl bg-card gx-soft-shadow p-5 gx-card-shadow">
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
          {nextSteps.map((s) => (
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
          Create account & unlock guide
        </Button>
        <button
          onClick={onContinue}
          className="block w-full py-3 text-center text-sm font-medium text-foreground/80 hover:text-foreground"
        >
          Continue as guest
        </button>
      </div>
    </div>
  );
}

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const pwSchema = z.string().min(8, "Use at least 8 characters").max(72);

/**
 * Post-quiz account creation. Replaces the old waitlist-only email capture so
 * users get a real authenticated session before they try to save anything.
 */
export function WaitlistScreen({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ep = emailSchema.safeParse(email);
    if (!ep.success) { toast.error(ep.error.issues[0].message); return; }
    const pp = pwSchema.safeParse(password);
    if (!pp.success) { toast.error(pp.error.issues[0].message); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: ep.data,
        password: pp.data,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { display_name: name.trim() || undefined },
        },
      });
      if (error) {
        // If account exists, try sign-in with same password to keep the flow moving.
        if (/already registered|already exists/i.test(error.message)) {
          const { error: signErr } = await supabase.auth.signInWithPassword({
            email: ep.data,
            password: pp.data,
          });
          if (signErr) {
            toast.error("That email is already registered. Try signing in.");
            return;
          }
          toast.success("Welcome back");
          onContinue();
          return;
        }
        throw error;
      }
      if (data.session) {
        toast.success("Account created");
        onContinue();
      } else {
        // Email confirmation flow
        setNeedsConfirm(true);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    onContinue();
  };

  if (needsConfirm) {
    return (
      <div className="gx-screen flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--electric-lavender)_12%,white)] text-primary">
          <Check className="h-10 w-10" />
        </div>
        <h2 className="mt-6 font-display text-[24px] font-semibold tracking-tight">Check your email</h2>
        <p className="mt-2 max-w-[28ch] text-[14px] text-muted-foreground">
          We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
          Confirm your email to save your cycle and daily logs.
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

      <div className="mt-4 flex flex-col items-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[color-mix(in_oklab,var(--electric-lavender)_10%,white)] text-primary" aria-hidden>
          <Mail className="h-8 w-8" />
        </div>

        <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.16em] text-primary">Save your journey</p>
        <h1 className="mt-2 max-w-[20ch] text-center font-display text-[26px] font-semibold leading-[1.1] tracking-tight">
          Create your account
        </h1>
        <p className="mt-2 max-w-[30ch] text-center text-[13.5px] leading-relaxed text-muted-foreground">
          Save your cycle, daily logs, and unlock the free fertility nutrition guide.
        </p>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="wl-name" className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Name (optional)</Label>
          <Input
            id="wl-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Your name"
            className="h-12 rounded-2xl border-transparent bg-card text-[15px] gx-hairline focus-visible:border-primary focus-visible:ring-0"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wl-email" className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="wl-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-2xl border-transparent bg-card pl-11 text-[15px] gx-hairline focus-visible:border-primary focus-visible:ring-0"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wl-pw" className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Password</Label>
          <Input
            id="wl-pw"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-2xl border-transparent bg-card text-[15px] gx-hairline focus-visible:border-primary focus-visible:ring-0"
            required
          />
        </div>

        <Button
          type="submit"
          disabled={busy}
          size="lg"
          className="mt-2 h-14 w-full rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create account & continue"}
        </Button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
        <div className="relative flex justify-center"><span className="bg-background px-2 text-[11px] uppercase tracking-wider text-muted-foreground">or</span></div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogle}
        disabled={busy}
        className="h-12 w-full rounded-2xl text-[14px] font-medium"
      >
        Continue with Google
      </Button>

      <button
        type="button"
        onClick={onContinue}
        className="mt-3 block w-full py-2 text-center text-[13px] font-medium text-muted-foreground hover:text-foreground"
      >
        Skip for now — continue as guest
      </button>

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-muted-foreground">
        <Lock className="h-3 w-3" />
        Your data is private and you can delete your account anytime.
      </p>
    </div>
  );
}
