import { Home, CalendarDays, Leaf, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabKey = "home" | "track" | "nutrition" | "insights" | "profile";

const tabs: { key: TabKey; label: string; Icon: typeof Home }[] = [
  { key: "home", label: "Home", Icon: Home },
  { key: "track", label: "Track", Icon: CalendarDays },
  { key: "nutrition", label: "Nutrition", Icon: Leaf },
  { key: "insights", label: "Insights", Icon: BarChart3 },
  { key: "profile", label: "Profile", Icon: User },
];

interface BottomTabBarProps {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

export function BottomTabBar({ active, onChange }: BottomTabBarProps) {
  return (
    <nav
      aria-label="Primary"
      className="absolute bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-xl"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 12px)" }}
    >
      <ul className="flex items-stretch justify-around px-2 pt-2">
        {tabs.map(({ key, label, Icon }) => {
          const isActive = active === key;
          return (
            <li key={key} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(key)}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl py-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.4]")} />
                <span className={cn("text-[11px] font-medium", isActive && "text-primary")}>
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
