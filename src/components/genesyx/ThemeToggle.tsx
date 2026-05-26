import { useEffect, useState, useCallback } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { getProfilePrefs, updateTheme } from "@/lib/account.functions";

const STORAGE_KEY = "gx-theme";
type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function useTheme() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>("dark");
  const fetchPrefs = useServerFn(getProfilePrefs);
  const saveTheme = useServerFn(updateTheme);

  // Initial local read
  useEffect(() => {
    const saved = (typeof window !== "undefined"
      ? (localStorage.getItem(STORAGE_KEY) as Theme | null)
      : null) ?? "dark";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  // When signed in, hydrate from profile (source of truth)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    fetchPrefs()
      .then((p) => {
        if (cancelled) return;
        const t: Theme = p.theme === "light" ? "light" : "dark";
        setTheme(t);
        applyTheme(t);
        try { localStorage.setItem(STORAGE_KEY, t); } catch {}
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, fetchPrefs]);

  const toggle = useCallback(() => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
    if (user) {
      saveTheme({ data: { theme: next } }).catch(() => {});
    }
  }, [theme, user, saveTheme]);

  return { theme, toggle };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-full",
        "bg-card text-foreground gx-hairline transition-colors hover:opacity-90",
        className,
      )}
    >
      {isDark ? <Sun className="h-4.5 w-4.5" size={18} /> : <Moon size={18} />}
    </button>
  );
}
