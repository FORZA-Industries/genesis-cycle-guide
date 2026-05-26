import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScreenHeader } from "../ScreenHeader";
import { symptoms as defaultSymptoms } from "../mockData";
import { cn } from "@/lib/utils";
import { Smile, Meh, Frown, Heart, Plus, Droplets, Moon, Pill, Apple, Check } from "lucide-react";
import { toast } from "sonner";
import { useDailyLog } from "@/hooks/use-daily-log";
import { supabase } from "@/integrations/supabase/client";


const SUPPLEMENTS = ["Folic acid", "Vitamin D", "Iron", "Omega-3"];
const WATER_TARGET = 2400;

export function LogScreen({ onClose }: { onClose: () => void }) {
  const { log, loading, save } = useDailyLog();
  const [mood, setMood] = useState<string | null>(null);
  const [energy, setEnergy] = useState<"low" | "normal" | "high" | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [sleepMin, setSleepMin] = useState<number | null>(null);
  const [waterMl, setWaterMl] = useState<number>(0);
  const [supplements, setSupplements] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [sleepOpen, setSleepOpen] = useState(false);
  const [waterOpen, setWaterOpen] = useState(false);
  const [suppOpen, setSuppOpen] = useState(false);
  const [sleepH, setSleepH] = useState("7");
  const [sleepM, setSleepM] = useState("0");
  const [waterInput, setWaterInput] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!log) return;
    setMood(log.mood);
    setEnergy((log.energy as "low" | "normal" | "high" | null) ?? null);
    setChosen(log.symptoms);
    setNotes(log.notes ?? "");
    setSleepMin(log.sleepMinutes);
    setWaterMl(log.waterMl);
    setSupplements(log.supplements);
    if (log.sleepMinutes != null) {
      setSleepH(String(Math.floor(log.sleepMinutes / 60)));
      setSleepM(String(log.sleepMinutes % 60));
    }
    setWaterInput(String(log.waterMl));
  }, [log]);

  const toggle = (s: string) =>
    setChosen(chosen.includes(s) ? chosen.filter((x) => x !== s) : [...chosen, s]);
  const toggleSupp = (s: string) =>
    setSupplements(supplements.includes(s) ? supplements.filter((x) => x !== s) : [...supplements, s]);

  const allSymptoms = Array.from(new Set([...defaultSymptoms, ...chosen]));

  const addCustomSymptom = () => {
    const v = customSymptom.trim();
    if (v && !chosen.includes(v)) setChosen([...chosen, v]);
    setCustomSymptom("");
    setShowAdd(false);
  };

  const moods = [
    { id: "great", Icon: Heart, label: "Great" },
    { id: "good", Icon: Smile, label: "Good" },
    { id: "ok", Icon: Meh, label: "Okay" },
    { id: "low", Icon: Frown, label: "Low" },
  ];

  const onSave = async () => {
    setSaving(true);
    try {
      await save({
        mood,
        energy,
        symptoms: chosen,
        sleepMinutes: sleepMin,
        waterMl,
        supplements,
        notes: notes || null,
      });
      toast.success("Log saved", { description: "Today's entry has been added." });
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save log");
    } finally {
      setSaving(false);
    }
  };

  const sleepLabel = sleepMin != null ? `${Math.floor(sleepMin / 60)}h ${sleepMin % 60}m` : "—";
  const waterLabel = waterMl > 0 ? `${(waterMl / 1000).toFixed(1)}L` : "—";
  const suppLabel = `${supplements.length} of ${SUPPLEMENTS.length}`;

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
            {allSymptoms.map((s) => {
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
            {showAdd ? (
              <input
                autoFocus
                value={customSymptom}
                onChange={(e) => setCustomSymptom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addCustomSymptom();
                  if (e.key === "Escape") { setShowAdd(false); setCustomSymptom(""); }
                }}
                onBlur={addCustomSymptom}
                placeholder="Add symptom"
                className="min-h-[36px] rounded-full border border-primary bg-card px-3.5 text-[13px] outline-none"
              />
            ) : (
              <button
                onClick={() => setShowAdd(true)}
                className="flex min-h-[36px] items-center gap-1 rounded-full border border-dashed border-border bg-transparent px-3.5 text-[13px] text-muted-foreground"
              >
                <Plus className="h-3.5 w-3.5" /> Add
              </button>
            )}
          </div>
        </Section>

        <div className="grid grid-cols-2 gap-3">
          <MiniCard Icon={Moon} label="Sleep" value={sleepLabel} tone="lavender" onClick={() => setSleepOpen(true)} />
          <MiniCard Icon={Droplets} label="Water" value={waterLabel} tone="blue" onClick={() => setWaterOpen(true)} />
          <MiniCard Icon={Pill} label="Supplements" value={suppLabel} tone="lavender" onClick={() => setSuppOpen(true)} />
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
          onClick={onSave}
          disabled={saving || loading}
          size="lg"
          className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {saving ? "Saving…" : "Save log"}
        </Button>
      </div>

      {/* Sleep dialog */}
      <Dialog open={sleepOpen} onOpenChange={setSleepOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Sleep</DialogTitle></DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="mb-1 text-[12px] text-muted-foreground">Hours</p>
              <Input type="number" min={0} max={24} value={sleepH} onChange={(e) => setSleepH(e.target.value)} />
            </div>
            <div className="flex-1">
              <p className="mb-1 text-[12px] text-muted-foreground">Minutes</p>
              <Input type="number" min={0} max={59} value={sleepM} onChange={(e) => setSleepM(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSleepOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              const h = Math.max(0, Math.min(24, parseInt(sleepH || "0", 10) || 0));
              const m = Math.max(0, Math.min(59, parseInt(sleepM || "0", 10) || 0));
              setSleepMin(h * 60 + m);
              setSleepOpen(false);
            }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Water dialog */}
      <Dialog open={waterOpen} onOpenChange={setWaterOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Water (ml)</DialogTitle></DialogHeader>
          <Input type="number" min={0} max={10000} step={100} value={waterInput} onChange={(e) => setWaterInput(e.target.value)} />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWaterOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              const v = Math.max(0, Math.min(10000, parseInt(waterInput || "0", 10) || 0));
              setWaterMl(v);
              setWaterOpen(false);
            }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Supplements dialog */}
      <Dialog open={suppOpen} onOpenChange={setSuppOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Supplements</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {SUPPLEMENTS.map((s) => {
              const checked = supplements.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSupp(s)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors",
                    checked ? "border-primary bg-[color-mix(in_oklab,var(--electric-lavender)_8%,white)]" : "border-border/60"
                  )}
                >
                  <span className="text-[14px] font-medium">{s}</span>
                  {checked && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button onClick={() => setSuppOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function MiniCard({ Icon, label, value, tone, onClick }: { Icon: typeof Moon; label: string; value: string; tone: "lavender" | "blue" | "pink"; onClick?: () => void }) {
  const map = {
    lavender: "bg-[color-mix(in_oklab,var(--electric-lavender)_10%,white)] text-primary",
    blue: "bg-[color-mix(in_oklab,var(--powder-blue)_30%,white)] text-[var(--color-electric-blue)]",
    pink: "bg-[color-mix(in_oklab,var(--powder-pink)_28%,white)] text-[var(--color-electric-pink)]",
  };
  return (
    <button type="button" onClick={onClick} className="rounded-2xl bg-card gx-soft-shadow p-4 text-left">
      <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", map[tone])}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="mt-2.5 text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="font-display text-[16px] font-semibold leading-tight">{value}</p>
    </button>
  );
}

export { WATER_TARGET };
