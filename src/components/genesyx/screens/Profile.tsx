import { useEffect, useState, useRef } from "react";
import { ScreenHeader } from "../ScreenHeader";
import { Switch } from "@/components/ui/switch";
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
import { ChevronRight, LogOut, Loader2, Trash2, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "../ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate, Link } from "@tanstack/react-router";
import { PartnerSection } from "../PartnerSection";
import { useServerFn } from "@tanstack/react-start";
import { updateDisplayName, deleteAccount, changePassword } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";
import { getAvatarSignedUrl, uploadAvatar } from "@/lib/avatar";
import { toast } from "sonner";

export function ProfileScreen({ onSignIn }: { onPregnancy?: () => void; onSignIn?: () => void }) {
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { setAvatarUrl(null); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const signed = await getAvatarSignedUrl(data?.avatar_url ?? null);
      if (!cancelled) setAvatarUrl(signed);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const path = await uploadAvatar(user.id, file);
      const signed = await getAvatarSignedUrl(path);
      setAvatarUrl(signed);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const goSignIn = () => (onSignIn ? onSignIn() : navigate({ to: "/auth" }));

  return (
    <div className="gx-screen pb-4">
      <ScreenHeader title="Profile" />

      <div className="px-5 space-y-4">
        <div className="flex items-center gap-4 rounded-3xl bg-card p-5 gx-card-shadow">
          <button
            type="button"
            onClick={() => user ? fileInputRef.current?.click() : goSignIn()}
            className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-[var(--color-baby-lavender)] to-[var(--color-electric-pink)] text-lg font-semibold text-white"
            aria-label="Change profile photo"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
            <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-card text-foreground shadow ring-1 ring-border">
              {uploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickAvatar}
          />
          <div className="flex-1 min-w-0">
            <p className="font-display text-[17px] font-semibold tracking-tight truncate">{displayName}</p>
            <p className="text-[13px] text-muted-foreground truncate">{emailLine}</p>
          </div>
        </div>

        <PartnerSection />

        <div>
          <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
          <div className="overflow-hidden rounded-2xl bg-card gx-soft-shadow">
            <button
              type="button"
              onClick={() => user ? setNameOpen(true) : goSignIn()}
              className="flex min-h-[52px] w-full items-center justify-between border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-muted/40"
            >
              <span className="text-[14.5px] text-foreground">Edit name</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              onClick={() => user ? setPwOpen(true) : goSignIn()}
              className="flex min-h-[52px] w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40"
            >
              <span className="text-[14.5px] text-foreground">Change password</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div>
          <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Appearance</p>
          <div className="overflow-hidden rounded-2xl bg-card gx-soft-shadow">
            <Row label="Dark Mode" last>
              <Switch checked={dark} onCheckedChange={toggle} />
            </Row>
          </div>
        </div>

        <div>
          <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">About</p>
          <div className="overflow-hidden rounded-2xl bg-card gx-soft-shadow">
            <LinkRow to="/privacy" label="Privacy policy" />
            <LinkRow to="/terms" label="Terms of service" />
            <LinkRow to="/health-disclaimer" label="Health disclaimer" />
            <LinkRow to="/support" label="Help & support" last />
          </div>
        </div>

        <button
          onClick={async () => {
            if (user) { await signOut(); }
            goSignIn();
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

  useEffect(() => { if (open) setName(initial); }, [open, initial]);

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

  const changePasswordFn = useServerFn(changePassword);

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
      await changePasswordFn({ data: { currentPassword: current, newPassword: next } });
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

function LinkRow({ to, label, last }: { to: string; label: string; last?: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "flex min-h-[52px] w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/40",
        !last && "border-b border-border/50",
      )}
    >
      <span className="text-[14.5px] text-foreground">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
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
