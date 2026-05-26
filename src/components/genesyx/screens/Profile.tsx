import { useState } from "react";
import { ScreenHeader } from "../ScreenHeader";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { profileMenu } from "../mockData";
import { ChevronRight, LogOut, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { PartnerSection } from "../PartnerSection";
import { useServerFn } from "@tanstack/react-start";
import { updateDisplayName, deleteAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ProfileScreen({ onPregnancy }: { onPregnancy: () => void }) {
  const [focus, setFocus] = useState<"prep" | "preg">("prep");
  const [notif, setNotif] = useState(true);
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const deleteAccountFn = useServerFn(deleteAccount);

  const initialName =
    (user?.user_metadata?.display_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Guest";
  const [displayName, setDisplayName] = useState(initialName);
  const emailLine = user?.email ?? "Sign in to sync your data";
  const initial = displayName.slice(0, 1).toUpperCase();

  const [nameOpen, setNameOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="gx-screen pb-4">
      <ScreenHeader title="Profile" />

      <div className="px-5 space-y-4">
        <div className="flex items-center gap-4 rounded-3xl bg-card p-5 gx-card-shadow">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-[var(--color-baby-lavender)] to-[var(--color-electric-pink)] text-lg font-semibold text-white">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display text-[17px] font-semibold tracking-tight truncate">{displayName}</p>
            <p className="text-[13px] text-muted-foreground truncate">{emailLine}</p>
          </div>
          {user && (
            <Badge className="rounded-full border-none bg-[color-mix(in_oklab,var(--electric-lavender)_10%,white)] text-[10.5px] font-semibold uppercase tracking-wider text-primary">
              Premium
            </Badge>
          )}
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

        <PartnerSection />

        <div>
          <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
          <div className="overflow-hidden rounded-2xl bg-card gx-soft-shadow">
            <button
              type="button"
              onClick={() => user ? setNameOpen(true) : navigate({ to: "/auth" })}
              className="flex min-h-[52px] w-full items-center justify-between border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/40"
            >
              <span className="text-[14.5px] text-foreground">Edit name</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => user ? setPwOpen(true) : navigate({ to: "/auth" })}
              className="flex min-h-[52px] w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40"
            >
              <span className="text-[14.5px] text-foreground">Change password</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <MenuGroup title="Tracking" items={profileMenu.account} />

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

        <button
          onClick={async () => {
            if (user) { await signOut(); }
            navigate({ to: "/auth" });
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card gx-soft-shadow py-4 text-[14px] font-semibold text-destructive"
        >
          <LogOut className="h-4 w-4" /> {user ? "Log out" : "Sign in"}
        </button>

        {user && (
          <button
            onClick={() => setDelOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/40 bg-transparent py-4 text-[14px] font-semibold text-destructive transition-colors hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" /> Delete account
          </button>
        )}
      </div>

      <EditNameDialog
        open={nameOpen}
        onOpenChange={setNameOpen}
        initial={displayName}
        onSaved={(n) => setDisplayName(n)}
      />
      <ChangePasswordDialog
        open={pwOpen}
        onOpenChange={setPwOpen}
        email={user?.email ?? ""}
      />
      <AlertDialog open={delOpen} onOpenChange={setDelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all your data. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={async (e) => {
                e.preventDefault();
                setDeleting(true);
                try {
                  await deleteAccountFn({});
                  await supabase.auth.signOut();
                  toast.success("Account deleted");
                  navigate({ to: "/auth" });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Could not delete account");
                } finally {
                  setDeleting(false);
                  setDelOpen(false);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditNameDialog({
  open, onOpenChange, initial, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: string;
  onSaved: (name: string) => void;
}) {
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);
  const save = useServerFn(updateDisplayName);

  // Reset value when opened
  if (open && name === "" && initial) setName(initial);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const res = await save({ data: { displayName: trimmed } });
      onSaved(res.displayName);
      toast.success("Name updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update name");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Edit name</DialogTitle>
          <DialogDescription>This is how you'll appear across the app.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              autoFocus
            />
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

function ChangePasswordDialog({
  open, onOpenChange, email,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  email: string;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setCurrent(""); setNext(""); setConfirm(""); };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (next !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setSaving(true);
    try {
      // Verify current password by re-authenticating
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (signErr) {
        toast.error("Current password is incorrect");
        setSaving(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
      toast.success("Password updated");
      reset();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (saving) return;
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Choose a new password of at least 8 characters.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cur-pw">Current password</Label>
            <Input id="cur-pw" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-pw">New password</Label>
            <Input id="new-pw" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={8} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="conf-pw">Confirm new password</Label>
            <Input id="conf-pw" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" minLength={8} />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => { reset(); onOpenChange(false); }}
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
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Update
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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

