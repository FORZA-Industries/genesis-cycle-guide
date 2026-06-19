import { Button } from "@/components/ui/button";
import { ArrowRight, Droplets, Plus, Leaf, LogIn, User, Settings } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCycleSettings } from "@/hooks/use-cycle";
import { useDailyLog, useStreak } from "@/hooks/use-daily-log";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getPhaseSubLabel,
  getPhaseHeroText,
  getPhaseHeroSubtext,
  getPhaseTags,
  getTodaysFocus,
} from "@/lib/cycleEngine";
import { CycleSettingsDialog } from "../CycleSettingsDialog";
import homeBg from "@/assets/genesyx-home-bg-v2.jpg.asset.json";

const WATER_TARGET_ML = 2400;

export function HomeScreen({
  onLog, onPregnancy, onProfile, onRequireAuth, quizAnswers,
}: {
  onLog: () => void;
  onPregnancy: () => void;
  onProfile?: () => void;
  onRequireAuth?: () => void;
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
    <>
      <style>{`
        @keyframes gx-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-14px) scale(1.03); }
        }
        @keyframes gx-float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-10px) translateX(6px); }
          66% { transform: translateY(6px) translateX(-4px); }
        }
        @keyframes gx-float-delay {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-18px) scale(0.97); }
        }
      `}</style>
      <div
        className="gx-screen relative overflow-hidden bg-cover bg-center bg-no-repeat px-5 pt-3 pb-4"
        style={{ backgroundImage: `url(${homeBg.url})` }}
      >
        {/* Floating egg/bubble overlays */}
        <div
          className="pointer-events-none absolute -right-6 top-24 h-28 w-28 rounded-full opacity-60 blur-sm"
          style={{ background: 'radial-gradient(circle at 30% 30%, #c4b5fd, #a78bfa)', animation: 'gx-float 5s ease-in-out infinite' }}
        />
        <div
          className="pointer-events-none absolute -left-8 top-56 h-20 w-20 rounded-full opacity-50 blur-sm"
          style={{ background: 'radial-gradient(circle at 30% 30%, #bae6fd, #7dd3fc)', animation: 'gx-float-slow 7s ease-in-out infinite' }}
        />
        <div
          className="pointer-events-none absolute right-8 bottom-40 h-24 w-24 rounded-full opacity-55 blur-sm"
          style={{ background: 'radial-gradient(circle at 30% 30%, #e9d5ff, #c084fc)', animation: 'gx-float-delay 6s ease-in-out infinite 1s' }}
        />
        <div
          className="pointer-events-none absolute left-4 top-[420px] h-16 w-16 rounded-full opacity-45 blur-sm"
          style={{ background: 'radial-gradient(circle at 30% 30%, #fbcfe8, #f472b6)', animation: 'gx-float 4.5s ease-in-out infinite 0.5s' }}
        />
        <div
          className="pointer-events-none absolute -right-4 bottom-20 h-14 w-14 rounded-full opacity-40 blur-sm"
          style={{ background: 'radial-gradient(circle at 30% 30%, #bfdbfe, #60a5fa)', animation: 'gx-float-slow 8s ease-in-out infinite 2s' }}
        />
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[13px] text-muted-foreground">{greeting}</p>
          <h1 className="mt-0.5 font-display text-[26px] font-semibold leading-tight tracking-tight">{displayName}</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-[13px] font-semibold text-foreground gx-hairline"
            >
              {initial}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-2xl p-2">
            <DropdownMenuLabel className="px-2 py-2">
              <span className="block text-[13px] font-semibold">{displayName}</span>
              <span className="block truncate text-[12px] font-normal text-muted-foreground">
                {user?.email ?? "Guest session"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {!user && (
              <DropdownMenuItem onSelect={onRequireAuth} className="rounded-xl py-2.5">
                <LogIn className="h-4 w-4" />
                Sign in or create account
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onProfile} className="rounded-xl py-2.5">
              <User className="h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setCycleOpen(true)} className="rounded-xl py-2.5">
              <Settings className="h-4 w-4" />
              Cycle setup
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {!user && (
        <button
          type="button"
          onClick={onRequireAuth}
          className="mt-4 flex w-full items-center justify-between rounded-2xl bg-primary px-5 py-3 text-left text-primary-foreground gx-card-shadow"
        >
          <span>
            <span className="block text-[14px] font-semibold">Sign in to save your journey</span>
            <span className="block text-[12px] opacity-85">Cycle setup, logs, pH readings, and profile sync.</span>
          </span>
          <LogIn className="h-5 w-5 shrink-0" />
        </button>
      )}

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

      <CycleSettingsDialog open={cycleOpen} onOpenChange={setCycleOpen} onRequireAuth={onRequireAuth} />
    </div>
    </>
  );
}
