import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import eggMale from "@/assets/egg-male.png";
import eggFemale from "@/assets/egg-female.png";

interface AppShellProps {
  children: React.ReactNode;
  showTabBar?: boolean;
  tabBar?: React.ReactNode;
  bgClassName?: string;
  showThemeToggle?: boolean;
}

/**
 * Mobile device frame. Centered iPhone-style viewport on desktop,
 * full-bleed on actual mobile devices.
 */
export function AppShell({ children, tabBar, bgClassName, showThemeToggle }: AppShellProps) {
  return (
    <div className="min-h-screen w-full bg-[oklch(0.93_0.005_280)] dark:bg-black flex items-center justify-center p-0 sm:p-8">
      <div
        className={cn(
          "relative mx-auto w-full max-w-[420px] overflow-hidden bg-background",
          "h-[100dvh] sm:h-[860px] sm:rounded-[48px]",
          "sm:shadow-[0_40px_100px_-30px_rgba(20,20,40,0.35),0_0_0_1px_rgba(0,0,0,0.06)]",
          bgClassName
        )}
      >
        {/* Scrollable content */}
        <div
          className="gx-scroll relative h-full w-full overflow-y-auto"
          style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
        >
          {/* Subtle branded floating eggs for all screens */}
          <div className="pointer-events-none fixed inset-y-0 left-1/2 w-full max-w-[420px] -translate-x-1/2 overflow-hidden opacity-35" aria-hidden>
            <img src={eggFemale} alt="" className="absolute -right-16 top-16 h-36 w-36 rotate-[-24deg] select-none object-contain" draggable={false} />
            <img src={eggMale} alt="" className="absolute -left-14 top-[42%] h-32 w-32 rotate-[18deg] select-none object-contain" draggable={false} />
            <img src={eggFemale} alt="" className="absolute bottom-20 right-8 h-24 w-24 rotate-[32deg] select-none object-contain" draggable={false} />
          </div>
          <div className={cn("relative z-10 min-h-full", tabBar && "pb-28")}>{children}</div>
        </div>

        {showThemeToggle && (
          <div className="pointer-events-none absolute right-4 z-50" style={{ top: "max(env(safe-area-inset-top), 16px)" }}>
            <div className="pointer-events-auto">
              <ThemeToggle />
            </div>
          </div>
        )}

        {tabBar}
      </div>
    </div>
  );
}
