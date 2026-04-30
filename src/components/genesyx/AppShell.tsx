import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  showTabBar?: boolean;
  tabBar?: React.ReactNode;
  bgClassName?: string;
}

/**
 * Mobile device frame. Centered iPhone-style viewport on desktop,
 * full-bleed on actual mobile devices.
 */
export function AppShell({ children, tabBar, bgClassName }: AppShellProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[oklch(0.94_0.01_285)] via-[oklch(0.96_0.005_285)] to-[oklch(0.93_0.02_330)] flex items-center justify-center p-0 sm:p-6">
      <div
        className={cn(
          "relative mx-auto w-full max-w-[420px] overflow-hidden bg-background shadow-none sm:shadow-[0_30px_80px_-20px_rgba(77,77,170,0.35)]",
          "h-[100dvh] sm:h-[860px] sm:rounded-[44px] sm:border sm:border-black/10",
          bgClassName
        )}
      >
        {/* Status bar spacer (iOS-style) */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between px-7 pt-3 text-[12px] font-semibold text-foreground"
          style={{ paddingTop: "max(env(safe-area-inset-top), 12px)" }}
        >
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-3 rounded-[2px] bg-foreground/80" />
            <span className="inline-block h-2 w-2 rounded-full bg-foreground/80" />
            <span className="inline-block h-2 w-5 rounded-[3px] border border-foreground/60" />
          </div>
        </div>

        {/* iOS notch */}
        <div className="pointer-events-none absolute left-1/2 top-2 z-40 h-6 w-28 -translate-x-1/2 rounded-full bg-black/90 hidden sm:block" />

        {/* Scrollable content */}
        <div
          className="gx-scroll relative h-full w-full overflow-y-auto"
          style={{ paddingTop: "max(env(safe-area-inset-top), 38px)" }}
        >
          <div className={cn("min-h-full", tabBar && "pb-28")}>{children}</div>
        </div>

        {tabBar}
      </div>
    </div>
  );
}
