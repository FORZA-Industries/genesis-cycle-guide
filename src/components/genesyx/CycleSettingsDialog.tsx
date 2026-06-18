import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCycleSettings } from "@/hooks/use-cycle";
import { useAuth } from "@/hooks/use-auth";
import { formatDateOnly } from "@/lib/cycle";

export function CycleSettingsDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { settings, save } = useCycleSettings();
  const todayStr = formatDateOnly(new Date());
  const [lastPeriod, setLastPeriod] = useState<string>(todayStr);
  const [cycleLen, setCycleLen] = useState<number>(28);
  const [periodLen, setPeriodLen] = useState<number>(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLastPeriod(settings?.lastPeriodDate ?? todayStr);
    setCycleLen(settings?.cycleLength ?? 28);
    setPeriodLen(settings?.periodLength ?? 5);
  }, [open, settings, todayStr]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastPeriod)) {
      toast.error("Please pick a valid date"); return;
    }
    if (cycleLen < 21 || cycleLen > 35) {
      toast.error("Cycle length must be 21–35 days"); return;
    }
    if (periodLen < 1 || periodLen > 10) {
      toast.error("Period length must be 1–10 days"); return;
    }
    setSaving(true);
    try {
      await save({ lastPeriodDate: lastPeriod, cycleLength: cycleLen, periodLength: periodLen });
      toast.success("Cycle updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Your cycle</DialogTitle>
          <DialogDescription>We use this to predict your phases and fertile window.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="last-period">First day of your last period</Label>
            <Input
              id="last-period"
              type="date"
              max={todayStr}
              value={lastPeriod}
              onChange={(e) => setLastPeriod(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cycle-len">Cycle length (days)</Label>
              <Input
                id="cycle-len"
                type="number"
                inputMode="numeric"
                min={21}
                max={35}
                value={cycleLen}
                onChange={(e) => setCycleLen(Number(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period-len">Period length</Label>
              <Input
                id="period-len"
                type="number"
                inputMode="numeric"
                min={1}
                max={10}
                value={periodLen}
                onChange={(e) => setPeriodLen(Number(e.target.value) || 0)}
                required
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="min-h-[44px] rounded-xl bg-muted px-4 text-sm font-medium text-foreground"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
