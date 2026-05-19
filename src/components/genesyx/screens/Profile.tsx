import { useState } from "react";
import { ScreenHeader } from "../ScreenHeader";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { profileMenu } from "../mockData";
import { ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../ThemeToggle";

export function ProfileScreen({ onPregnancy }: { onPregnancy: () => void }) {
  const [focus, setFocus] = useState<"prep" | "preg">("prep");
  const [notif, setNotif] = useState(true);
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";

  return (
    <div className="gx-screen pb-4">
      <ScreenHeader title="Profile" />

      <div className="px-5 space-y-4">
        <div className="flex items-center gap-4 rounded-3xl bg-card p-5 gx-card-shadow">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-baby-lavender)] to-[var(--color-electric-pink)] text-lg font-semibold text-white">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-[17px] font-semibold tracking-tight">Amelia Chen</p>
            <p className="text-[13px] text-muted-foreground">amelia@example.com</p>
          </div>
          <Badge className="rounded-full border-none bg-[color-mix(in_oklab,var(--electric-lavender)_10%,white)] text-[10.5px] font-semibold uppercase tracking-wider text-primary">
            Premium
          </Badge>
        </div>

        <div>
          <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Current focus</p>
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-muted p-1">
            <button
              onClick={() => setFocus("prep")}
              className={cn("min-h-[44px] rounded-xl text-[13px] font-medium transition-all",
                focus === "prep" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
            >
              Fertility Prep
            </button>
            <button
              onClick={() => { setFocus("preg"); onPregnancy(); }}
              className={cn("min-h-[44px] rounded-xl text-[13px] font-medium transition-all",
                focus === "preg" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}
            >
              Pregnancy
            </button>
          </div>
        </div>

        <MenuGroup title="Account" items={profileMenu.account} />

        <div>
          <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Preferences</p>
          <div className="overflow-hidden rounded-2xl bg-card gx-soft-shadow">
            <Row label="Push Notifications">
              <Switch checked={notif} onCheckedChange={setNotif} />
            </Row>
            <Row label="Dark Mode" last>
              <Switch checked={dark} onCheckedChange={toggle} />
            </Row>
          </div>
        </div>

        <MenuGroup title="About" items={profileMenu.about} />

        <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card gx-soft-shadow py-4 text-[14px] font-semibold text-destructive">
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  );
}

function MenuGroup({ title, items }: { title: string; items: { label: string }[] }) {
  return (
    <div>
      <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="overflow-hidden rounded-2xl bg-card gx-soft-shadow">
        {items.map((it, i) => (
          <Row key={it.label} label={it.label} last={i === items.length - 1}>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Row>
        ))}
      </div>
    </div>
  );
}

function Row({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={cn("flex min-h-[52px] items-center justify-between px-4 py-3", !last && "border-b border-border/50")}>
      <span className="text-[14.5px] text-foreground">{label}</span>
      {children}
    </div>
  );
}
