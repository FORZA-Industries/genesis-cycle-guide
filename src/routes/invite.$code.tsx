import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { toast, Toaster } from "sonner";
import { BrandLogo } from "@/components/genesyx/BrandLogo";
import { Heart, Loader2 } from "lucide-react";

export const Route = createFileRoute("/invite/$code")({
  head: () => ({ meta: [{ title: "Partner invite — Genesyx" }] }),
  component: InvitePage,
});

type Invite = {
  id: string;
  inviter_id: string;
  invitee_email: string;
  status: string;
  expires_at: string;
};

function InvitePage() {
  const { code } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      if (!user) { setLoading(false); return; }
      const { data, error } = await supabase
        .from("partner_invites")
        .select("id,inviter_id,invitee_email,status,expires_at")
        .eq("code", code)
        .maybeSingle();
      if (error) setError(error.message);
      else if (!data) setError("Invite not found or already used");
      else if (data.status !== "pending") setError(`This invite is ${data.status}`);
      else if (new Date(data.expires_at) < new Date()) setError("This invite has expired");
      else if (data.invitee_email.toLowerCase() !== user.email?.toLowerCase()) {
        setError(`This invite is for ${data.invitee_email}. Sign in with that email to accept.`);
      } else {
        setInvite(data as Invite);
      }
      setLoading(false);
    })();
  }, [user, authLoading, code]);

  const accept = async () => {
    if (!invite || !user) return;
    setBusy(true);
    const { error: updErr } = await supabase
      .from("partner_invites")
      .update({ status: "accepted", accepted_by: user.id, accepted_at: new Date().toISOString() })
      .eq("id", invite.id);
    if (updErr) { setBusy(false); return toast.error(updErr.message); }
    // Link both profiles
    const { error: p1 } = await supabase.from("profiles").update({ partner_id: invite.inviter_id }).eq("id", user.id);
    const { error: p2 } = await supabase.from("profiles").update({ partner_id: user.id }).eq("id", invite.inviter_id);
    setBusy(false);
    if (p1 || p2) return toast.error((p1 ?? p2)!.message);
    toast.success("You're linked!");
    navigate({ to: "/", replace: true });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <BrandLogo size={32} />
        <h1 className="mt-6 font-display text-2xl font-semibold text-center">You've been invited</h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">Sign in or create an account to accept this partner invite.</p>
        <Button asChild className="mt-6 h-12 rounded-xl px-8">
          <Link to="/auth">Sign in to continue</Link>
        </Button>
        <Toaster position="top-center" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <BrandLogo size={32} />
      <Heart className="mt-8 h-10 w-10 text-primary" />
      <h1 className="mt-4 font-display text-2xl font-semibold text-center">Partner invite</h1>
      {error ? (
        <>
          <p className="mt-3 max-w-xs text-center text-sm text-muted-foreground">{error}</p>
          <Button asChild variant="outline" className="mt-6 h-12 rounded-xl px-8"><Link to="/">Back to app</Link></Button>
        </>
      ) : (
        <>
          <p className="mt-3 max-w-xs text-center text-sm text-muted-foreground">
            Accept to link your account so you can share your fertility-prep journey together.
          </p>
          <Button onClick={accept} disabled={busy} className="mt-6 h-12 rounded-xl px-8 text-base font-semibold">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Accept invite"}
          </Button>
          <Button asChild variant="ghost" className="mt-2"><Link to="/">Not now</Link></Button>
        </>
      )}
      <Toaster position="top-center" />
    </div>
  );
}
