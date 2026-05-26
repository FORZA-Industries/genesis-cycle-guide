import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, ChevronLeft, Sparkles } from "lucide-react";
import { quizQuestions } from "../mockData";
import { cn } from "@/lib/utils";
import { BrandOrb } from "../BrandLogo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function QuizFlow({
  onComplete,
  onBack,
}: {
  onComplete: (answers: Record<string, string>) => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [factOpen, setFactOpen] = useState(false);

  const total = quizQuestions.length;
  const q = quizQuestions[step];
  const selected = answers[q.id];
  const fact = "fact" in q ? (q as { fact?: { title: string; body: string } }).fact : undefined;

  const advance = () => {
    if (step + 1 < total) {
      setStep(step + 1);
    } else {
      setLoading(true);
      setTimeout(() => onComplete(answers), 1600);
    }
  };

  const next = () => {
    if (fact) {
      setFactOpen(true);
    } else {
      advance();
    }
  };

  const closeFact = () => {
    setFactOpen(false);
    advance();
  };

  const back = () => {
    if (step === 0) onBack();
    else setStep(step - 1);
  };

  if (loading) {
    return (
      <div className="gx-screen flex h-full flex-col items-center justify-center px-8 text-center">
        <div className="relative">
          <BrandOrb className="h-32 w-32 animate-pulse" />
        </div>
        <p className="mt-10 font-display text-xl font-semibold">Preparing your personalised summary…</p>
        <p className="mt-2 text-sm text-muted-foreground">Reviewing your answers with care.</p>
      </div>
    );
  }

  return (
    <div className="gx-screen flex h-full flex-col px-6 pt-2 pb-8">
      <div className="flex items-center gap-3">
        <button onClick={back} className="-ml-2 flex h-11 w-11 items-center justify-center text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <Progress value={((step + 1) / total) * 100} className="h-1.5 bg-muted [&>div]:bg-primary" />
        </div>
        <span className="text-[12px] font-medium text-muted-foreground">{step + 1}/{total}</span>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-[26px] font-semibold leading-[1.15] tracking-tight">
          {q.question}
        </h2>
        <p className="mt-2 text-[14px] text-muted-foreground">{q.helper}</p>
      </div>

      <div className="mt-7 space-y-2.5">
        {q.options.map((opt) => {
          const isSel = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAnswers({ ...answers, [q.id]: opt.id })}
              className={cn(
                "flex w-full items-center justify-between rounded-2xl border bg-card px-5 py-4 text-left transition-all min-h-[60px]",
                isSel
                  ? "border-primary bg-[color-mix(in_oklab,var(--electric-lavender)_8%,white)] gx-card-shadow"
                  : "border-border/70 hover:border-foreground/20"
              )}
            >
              <span className={cn("text-[15px] font-medium", isSel ? "text-primary" : "text-foreground")}>
                {opt.label}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                  isSel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                )}
              >
                {isSel && <Check className="h-3.5 w-3.5" />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-8">
        <Button
          disabled={!selected}
          size="lg"
          onClick={next}
          className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
        >
          {step + 1 === total ? "See My Summary" : "Continue"}
        </Button>
      </div>

      <Dialog open={factOpen} onOpenChange={(o) => !o && closeFact()}>
        <DialogContent className="max-w-[340px] rounded-3xl border-0 bg-card p-6 gx-card-shadow">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--electric-lavender)_14%,white)]">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="font-display text-[20px] font-semibold tracking-tight">
              {fact?.title ?? "Did you know?"}
            </DialogTitle>
            <DialogDescription className="text-[14px] leading-relaxed text-foreground/75">
              {fact?.body}
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={closeFact}
            className="mt-2 h-12 w-full rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
