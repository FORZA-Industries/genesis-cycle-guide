import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScreenHeader } from "../ScreenHeader";
import { symptoms } from "../mockData";
import { cn } from "@/lib/utils";
import { Smile, Meh, Frown, Heart, Plus, Droplets, Moon, Pill, Apple, Check } from "lucide-react";
import { toast } from "sonner";

export function LogScreen({ onClose }: { onClose: () => void }) {
  const [mood, setMood] = useState<string | null>(null);
  const [energy, setEnergy] = useState<"low" | "normal" | "high" | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const toggle = (s: string) => setChosen(chosen.includes(s) ? chosen.filter((x) => x !== s) : [...chosen, s]);

  const moods = [
    { id: "great", Icon: Heart, label: "Great" },
    { id: "good", Icon: Smile, label: "Good" },
    { id: "ok", Icon: Meh, label: "Okay" },
    { id: "low", Icon: Frown, label: "Low" },
  ];

  const save = () => {
    toast.success("Log saved", { description: "Today's entry has been added to your insights." });
    onClose();
  };

  return (
    <div className="gx-screen pb-8">
      <ScreenHeader title="Log Today" subtitle="Quick notes about how you're feeling." onBack={onClose} />

      <div className="px-5 space-y-4">
        <Section title="Mood">
          <div className="grid grid-cols-4 gap-2">
            {moods.map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => setMood(id)}
                className={cn(
                  "flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border bg-card p-3 transition-all",
                  mood === id ? "border-primary bg-[color-mix(in_oklab,var(--electric-lavender)_8%,white)]" : "border-border/60"
                )}
              >
                <Icon className={cn("h-5 w-5", mood === id ? "text-primary" : "text-foreground/70")} />
                <span className={cn("text-[11.5px] font-medium", mood === id ? "text-primary" : "text-foreground/80")}>{label}</span>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Energy">
          <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-muted p-1">
            {(["low","normal","high"] as const).map((e) => (
              <button
                key={e}
                onClick={() => setEnergy(e)}
                className={cn(
                  "rounded-xl py-2.5 text-[13px] font-medium capitalize transition-all min-h-[44px]",
                  energy === e ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Symptoms">
          <div className="flex flex-wrap gap-2">
            {symptoms.map((s) => {
              const sel = chosen.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggle(s)}
                  className={cn(
                    "min-h-[36px] rounded-full border px-3.5 text-[13px] font-medium transition-all",
                    sel
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/60 bg-card text-foreground/80 hover:border-foreground/30"
                  )}
                >
                  {sel && <Check className="mr-1 inline h-3.5 w-3.5" />}
                  {s}
                </button>
              );
            })}
            <button className="flex min-h-[36px] items-center gap-1 rounded-full border border-dashed border-border bg-transparent px-3.5 text-[13px] text-muted-foreground">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </Section>

        <div className="grid grid-cols-2 gap-3">
          <MiniCard Icon={Moon} label="Sleep" value="7h 20m" tone="lavender" />
          <MiniCard Icon={Droplets} label="Water" value="1.6L" tone="blue" />
          <MiniCard Icon={Pill} label="Supplements" value="3 of 4" tone="lavender" />
          <MiniCard Icon={Apple} label="Nutrition" value="On track" tone="pink" />
        </div>

        <Section title="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="A short note for future you…"
            rows={3}
            className="w-full resize-none rounded-2xl bg-card gx-soft-shadow p-4 text-[14px] outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </Section>

        <Button
          onClick={save}
          size="lg"
          className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Save log
        </Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function MiniCard({ Icon, label, value, tone }: { Icon: typeof Moon; label: string; value: string; tone: "lavender" | "blue" | "pink" }) {
  const map = {
    lavender: "bg-[color-mix(in_oklab,var(--electric-lavender)_10%,white)] text-primary",
    blue: "bg-[color-mix(in_oklab,var(--powder-blue)_30%,white)] text-[var(--color-electric-blue)]",
    pink: "bg-[color-mix(in_oklab,var(--powder-pink)_28%,white)] text-[var(--color-electric-pink)]",
  };
  return (
    <button className="rounded-2xl bg-card gx-soft-shadow p-4 text-left gx-soft-shadow">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", map[tone])}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="mt-2.5 text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-[16px] font-semibold leading-tight">{value}</p>
    </button>
  );
}
