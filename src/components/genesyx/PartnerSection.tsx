import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Copy, Mail, Heart, X } from "lucide-react";
import { z } from "zod";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  sendPartnerInvite,
  revokePartnerInvite,
  unlinkPartner,
} from "@/lib/partner.functions";

type Profile = { id: string; display_name: string | null; partner_id: string | null };
type Invite = { id: string; invitee_email: string; code: string; status: string; created_at: string; expires_at: string };

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

export function PartnerSection() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const sendInviteFn = useServerFn(sendPartnerInvite);
  const revokeInviteFn = useServerFn(revokePartnerInvite);
  const unlinkPartnerFn = useServerFn(unlinkPartner);

  const load = async () => {
    if (!user) { setLoading(false); return; }
    const { data: prof } = await supabase
      .from("profiles")
      .select("id,display_name,partner_id")
      .eq("id", user.id)
      .maybeSingle();
    setProfile(prof as Profile | null);
    if (prof?.partner_id) {
      const { data: p } = await supabase
        .from("profiles")
        .select("id,display_name,partner_id")
        .eq("id", prof.partner_id)
        .maybeSingle();
      setPartner(p as Profile | null);
    } else {
      setPartner(null);
    }
    const { data: inv } = await supabase
      .from("partner_invites")
      .select("id,invitee_email,code,status,created_at,expires_at")
      .eq("inviter_id", user.id)
      .order("created_at", { ascending: false });
    setInvites((inv as Invite[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (authLoading || loading) {
    return (
      <div className="rounded-2xl bg-card gx-soft-shadow p-5 flex items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl bg-card gx-soft-shadow p-5 text-center">
        <Heart className="mx-auto h-6 w-6 text-primary mb-2" />
        <p className="text-[14px] font-semibold">Add your partner</p>
        <p className="mt-1 text-[12.5px] text-muted-foreground">Sign in to invite a partner to join your journey.</p>
        <Button asChild className="mt-3 h-11 rounded-xl">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  const sendInvite = async () => {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    if (parsed.data.toLowerCase() === user.email?.toLowerCase()) {
      return toast.error("You can't invite yourself");
    }
    setBusy(true);
    const code = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const { error } = await supabase.from("partner_invites").insert({
      inviter_id: user.id,
      invitee_email: parsed.data,
      code,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setEmail("");
    toast.success("Invite created — copy the link to share");
    load();
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("partner_invites").update({ status: "revoked" }).eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  const unlink = async () => {
    if (!confirm("Remove partner link?")) return;
    const { error } = await supabase.from("profiles").update({ partner_id: null }).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Partner unlinked");
    load();
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  };

  return (
    <div>
      <p className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">Partner</p>
      <div className="rounded-2xl bg-card gx-soft-shadow p-5 space-y-4">
        {partner ? (
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-[var(--color-baby-lavender)] to-[var(--color-electric-pink)] text-sm font-semibold text-white">
              {(partner.display_name ?? "P").slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold truncate">{partner.display_name ?? "Your partner"}</p>
              <p className="text-[12px] text-muted-foreground">Linked partner</p>
            </div>
            <button onClick={unlink} className="text-[12px] font-medium text-destructive hover:underline">
              Remove
            </button>
          </div>
        ) : (
          <>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-primary" />
                <p className="text-[14px] font-semibold">Add your partner</p>
              </div>
              <p className="text-[12.5px] text-muted-foreground">
                Send an invite — when they accept, you'll be linked and can share your journey.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-email" className="sr-only">Partner email</Label>
              <Input
                id="partner-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@example.com"
                maxLength={255}
                className="h-11 rounded-xl"
              />
              <Button onClick={sendInvite} disabled={busy} className="h-11 w-full rounded-xl">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="mr-2 h-4 w-4" /> Send invite</>}
              </Button>
            </div>
            {invites.filter(i => i.status === "pending").length > 0 && (
              <div className="border-t border-border/50 pt-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pending invites</p>
                {invites.filter(i => i.status === "pending").map(inv => (
                  <div key={inv.id} className="flex items-center gap-2 text-[12.5px]">
                    <span className="flex-1 truncate">{inv.invitee_email}</span>
                    <button onClick={() => copyLink(inv.code)} className="rounded-md p-1.5 hover:bg-muted" title="Copy link">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => revoke(inv.id)} className="rounded-md p-1.5 hover:bg-muted text-destructive" title="Revoke">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
