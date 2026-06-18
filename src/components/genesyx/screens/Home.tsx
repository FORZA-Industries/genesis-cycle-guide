import { Button } from "@/components/ui/button";
import { ArrowRight, Droplets, Plus, Leaf } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCycleSettings } from "@/hooks/use-cycle";
import { useDailyLog, useStreak } from "@/hooks/use-daily-log";
import {
  getPhaseSubLabel,
  getPhaseHeroText,
  getPhaseHeroSubtext,
  getPhaseTags,
  getTodaysFocus,
} from "@/lib/cycleEngine";
import { CycleSettingsDialog } from "../CycleSettingsDialog";
import homeBg from "@/assets/genesyx-home-bg.jpg.asset.json";

const WATER_TARGET_ML = 2400;

export function HomeScreen({
  onLog, onPregnancy, onProfile, quizAnswers,
}: {
  onLog: () => void;
  onPregnancy: () => void;
  onProfile?: () => void;
  quizAnswers?: Record<string, string>;
}) {
  const { user } = useAuth();
  const { settings, cycleInfo, loading } = useCycleSettings();
  const { log } = useDailyLog();
  const { streak } = useStreak();
  const [cycleOpen, setCycleOpen] = useState(false);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Guest";
  const initial = displayName.slice(0, 1).toUpperCase();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const topLabel = !settings || !cycleInfo
    ? "TODAY"
    : `DAY ${cycleInfo.dayOfCycle} · ${getPhaseSubLabel(cycleInfo.phase, cycleInfo.fertileWindow).toUpperCase()}`;
  const heroHeading = !settings || !cycleInfo
    ? "Set up your cycle"
    : getPhaseHeroText(cycleInfo.phase, cycleInfo.fertileWindow);
  const heroSub = !settings || !cycleInfo
    ? "Add your last period date to get personalised insights."
    : getPhaseHeroSubtext(cycleInfo.phase, cycleInfo.fertileWindow);
  const tags = !settings || !cycleInfo ? [] : getPhaseTags(cycleInfo.phase, cycleInfo.fertileWindow);
  const baseFocus = cycleInfo ? getTodaysFocus(cycleInfo.phase) : null;
  // Light personalization: nudge focus title when the user said nutrition is their top priority.
  const focus = baseFocus && quizAnswers?.support === "nutrition"
    ? { ...baseFocus, title: `${baseFocus.title} (your priority)` }
    : baseFocus;

  return (
    <div
      className="gx-screen bg-cover bg-center bg-no-repeat px-5 pt-3 pb-4"
      style={{ backgroundImage: `url(${homeBg.url})` }}
    >
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[13px] text-muted-foreground">{greeting}</p>
          <h1 className="mt-0.5 font-display text-[26px] font-semibold leading-tight tracking-tight">{displayName}</h1>
        </div>
        <button
          aria-label="Profile"
          onClick={onProfile}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-[13px] font-semibold text-foreground gx-hairline"
        >
          {initial}
        </button>
      </div>

      {loading ? (
        <div className="relative mt-6 h-[220px] w-full overflow-hidden rounded-[28px] bg-muted gx-card-shadow">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCycleOpen(true)}
          className="relative mt-6 block w-full overflow-hidden rounded-[28px] bg-card p-6 text-left gx-card-shadow"
        >
          <div className="relative">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">{topLabel}</p>
            <p className="mt-3 max-w-[14ch] font-display text-[26px] font-semibold leading-[1.1] tracking-tight">
              {heroHeading}
            </p>
            <p className="mt-2 max-w-[24ch] text-[13.5px] leading-relaxed text-muted-foreground">{heroSub}</p>
            {tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5 text-[11.5px]">
                {tags.map((t, i) => (
                  <span
                    key={t}
                    className={
                      i === 0
                        ? "rounded-full bg-[color-mix(in_oklab,var(--electric-lavender)_8%,white)] px-2.5 py-1 text-primary"
                        : "rounded-full bg-[color-mix(in_oklab,var(--powder-blue)_22%,white)] px-2.5 py-1 text-foreground/75"
                    }
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </button>
      )}

      {/* Today's focus */}
      <div className="mt-3 rounded-[24px] bg-card p-5 gx-soft-shadow">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Today's focus</p>
        {!settings || !focus ? (
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
            Complete your cycle setup to see focus foods.
          </p>
        ) : (
          <>
            <p className="mt-1.5 font-display text-[17px] font-semibold tracking-tight">{focus.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{focus.description}</p>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] bg-card p-4 gx-soft-shadow">
          <Droplets className="h-4 w-4 text-[var(--color-electric-blue)]" />
          <p className="mt-3 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Hydration</p>
          <p className="mt-0.5 font-display text-[18px] font-semibold leading-tight">
            {log && log.waterMl > 0 ? (log.waterMl / 1000).toFixed(1) + "L" : "—"}
            <span className="text-muted-foreground text-[12px] font-normal"> / {(WATER_TARGET_ML / 1000).toFixed(1)}L</span>
          </p>
        </div>
        <div className="rounded-[20px] bg-card p-4 gx-soft-shadow">
          <Leaf className="h-4 w-4 text-primary" />
          <p className="mt-3 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Streak</p>
          <p className="mt-0.5 font-display text-[18px] font-semibold leading-tight">
            {streak ?? "—"} <span className="text-muted-foreground text-[12px] font-normal">days</span>
          </p>
        </div>
      </div>

      <Button
        onClick={onLog}
        size="lg"
        className="mt-5 h-14 w-full rounded-2xl bg-primary text-[15px] font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="mr-1 h-5 w-5" />
        Log today
      </Button>

      <button
        onClick={onPregnancy}
        className="mt-3 flex w-full items-center justify-between px-2 py-3 text-left"
      >
        <span className="text-[13px] text-muted-foreground">Preview pregnancy pathway</span>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </button>

      <CycleSettingsDialog open={cycleOpen} onOpenChange={setCycleOpen} />
    </div>
  );
}
