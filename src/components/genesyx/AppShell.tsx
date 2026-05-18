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
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-0 sm:p-8">
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
          <div className={cn("min-h-full", tabBar && "pb-28")}>{children}</div>
        </div>

        {tabBar}
      </div>
    </div>
  );
}
