import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import { useIsNativeApp } from "@/hooks/use-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "sonner";
import { BrandLogo } from "@/components/genesyx/BrandLogo";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Genesyx" },
      { name: "description", content: "Sign in or create your Genesyx account to save your cycle, nutrition and partner info." },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const pwSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isNativeApp = useIsNativeApp();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/", replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailP = emailSchema.safeParse(email);
    const pwP = pwSchema.safeParse(password);
    if (!emailP.success) return toast.error(emailP.error.issues[0].message);
    if (!pwP.success) return toast.error(pwP.error.issues[0].message);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: emailP.data,
          password: pwP.data,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { display_name: name.trim() || undefined },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailP.data,
          password: pwP.data,
        });
        if (error) throw error;
        navigate({ to: "/", replace: true });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return; // browser navigating
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8"><BrandLogo size={32} /></div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-center">
          {mode === "signin" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to sync your journey across devices." : "Save your cycle, nutrition, and partner info securely."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {mode === "signup" && (
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" maxLength={80} className="mt-1.5 h-12 rounded-xl" />
            </div>
          )}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" className="mt-1.5 h-12 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete={mode === "signin" ? "current-password" : "new-password"} className="mt-1.5 h-12 rounded-xl" />
          </div>
          <Button type="submit" disabled={busy} className="h-12 w-full rounded-xl text-base font-semibold">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        {/* Google OAuth is blocked inside embedded WebViews (the native app),
            so only offer it on the web. Email/password works everywhere. */}
        {!isNativeApp && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-2 text-xs uppercase tracking-wider text-muted-foreground">or</span></div>
            </div>

            <Button variant="outline" onClick={handleGoogle} disabled={busy} className="h-12 w-full rounded-xl text-base font-medium">
              Continue with Google
            </Button>
          </>
        )}

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="font-semibold text-primary hover:underline">
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">Back to app</Link>
          <span className="mx-2">·</span>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          <span className="mx-2">·</span>
          <Link to="/terms" className="hover:underline">Terms</Link>
        </p>
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
