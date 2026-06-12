import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";
import { phStatus, PH_STATUS_LABEL, PH_STATUS_COLOR, usePhMutations } from "@/hooks/use-ph";
import type { PhReadingDTO } from "@/lib/ph.functions";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: PhReadingDTO | null;
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PhLogDialog({ open, onOpenChange, editing }: Props) {
  const { create, update, remove } = usePhMutations();
  const [phValue, setPhValue] = useState(6.5);
  const [when, setWhen] = useState(() => toLocalInput(new Date().toISOString()));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setPhValue(editing.phValue);
      setWhen(toLocalInput(editing.recordedAt));
      setNotes(editing.notes ?? "");
    } else {
      setPhValue(6.5);
      setWhen(toLocalInput(new Date().toISOString()));
      setNotes("");
    }
  }, [open, editing]);

  const status = phStatus(phValue);
  const clamp = (v: number) => Math.max(4.5, Math.min(9.0, Math.round(v * 10) / 10));

  const onSave = async () => {
    setSaving(true);
    try {
      const recordedAt = new Date(when).toISOString();
      const trimmed = notes.trim();
      if (editing) {
        await update({ id: editing.id, phValue, recordedAt, notes: trimmed || null });
        toast.success("Reading updated");
      } else {
        await create({ phValue, recordedAt, notes: trimmed || null });
        toast.success("pH logged");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!editing) return;
    setDeleting(true);
    try {
      await remove(editing.id);
      toast.success("Reading deleted");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit pH reading" : "Log pH reading"}</DialogTitle>
          <DialogDescription>Track your urine pH from 4.5 to 9.0.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-2xl bg-card p-4 gx-soft-shadow text-center">
            <div className="font-display text-5xl font-semibold tabular-nums" style={{ color: PH_STATUS_COLOR[status] }}>
              {phValue.toFixed(1)}
            </div>
            <div
              className={cn("mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider")}
              style={{ background: `color-mix(in oklab, ${PH_STATUS_COLOR[status]} 18%, white)`, color: PH_STATUS_COLOR[status] }}
            >
              {PH_STATUS_LABEL[status]}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Decrease"
              onClick={() => setPhValue((v) => clamp(v - 0.1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground/80 active:scale-95"
            >
              <Minus className="h-5 w-5" />
            </button>
            <Slider
              min={4.5}
              max={9.0}
              step={0.1}
              value={[phValue]}
              onValueChange={(v) => setPhValue(clamp(v[0] ?? 6.5))}
              className="flex-1"
            />
            <button
              type="button"
              aria-label="Increase"
              onClick={() => setPhValue((v) => clamp(v + 0.1))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-foreground/80 active:scale-95"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">When</label>
            <Input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="Hydration, meal, time of day…"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          {editing ? (
            <Button variant="ghost" onClick={onDelete} disabled={deleting || saving} className="text-destructive hover:text-destructive">
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
