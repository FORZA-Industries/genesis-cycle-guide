import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BrandLogo } from "@/components/genesyx/BrandLogo";
import { AppShell } from "@/components/genesyx/AppShell";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Genesyx" },
      { name: "description", content: "Set a new password for your Genesyx account." },
    ],
  }),
  component: ResetPasswordPage,
});

const pwSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase recovery link arrives with #type=recovery and sets a temporary session.
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const isRecovery = params.get("type") === "recovery";

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecovery(true);
        setReady(true);
      }
    });

    // Fallback: check existing session in case the event already fired.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && isRecovery) setRecovery(true);
      setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pw = pwSchema.safeParse(password);
    if (!pw.success) return toast.error(pw.error.issues[0].message);
    if (password !== confirm) return toast.error("Passwords don't match");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw.data });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell>
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-8"><BrandLogo size={32} /></div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-center">
            Set a new password
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Choose a strong password you haven't used before.
          </p>

          {!ready ? (
            <div className="mt-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !recovery ? (
            <div className="mt-8 rounded-2xl bg-card p-5 text-center text-sm text-muted-foreground gx-soft-shadow">
              This link looks invalid or has expired. Request a new password reset email from the sign-in page.
              <div className="mt-4">
                <Button asChild className="h-11 rounded-xl"><Link to="/auth">Back to sign in</Link></Button>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-4">
              <div>
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" className="mt-1.5 h-12 rounded-xl" />
              </div>
              <div>
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" className="mt-1.5 h-12 rounded-xl" />
              </div>
              <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl text-base font-semibold">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            <Link to="/auth" className="hover:underline">Back to sign in</Link>
          </p>
        </div>
      </div>
    </AppShell>
  );
}
