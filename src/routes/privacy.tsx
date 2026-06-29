import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/genesyx/AppShell";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Genesyx" },
      { name: "description", content: "How Genesyx collects, stores, and protects your fertility wellness data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <AppShell>
      <LegalLayout title="Privacy Policy" updated="June 2026">
        <p>
          Genesyx ("we", "us") provides educational fertility wellness tracking. This policy explains what
          personal data we collect, how we use it, and the choices you have.
        </p>
        <h2>Data we collect</h2>
        <ul>
          <li>Account info: email address, display name, optional profile photo.</li>
          <li>Wellness data you enter: cycle settings, daily logs (mood, energy, symptoms, sleep, hydration, supplements, notes), urine pH readings, and partner connection info.</li>
          <li>Basic device and session info needed to keep you signed in.</li>
        </ul>
        <h2>How we use it</h2>
        <p>
          We use your data only to operate the app for you — saving your entries, syncing across your devices,
          generating personalised insights, and connecting you with a partner if you choose to.
        </p>
        <h2>Storage and security</h2>
        <p>
          Your data is stored in our secure cloud backend with row-level security so only you (and your linked
          partner, if you connect one) can read your records. Access is gated by authenticated sessions.
        </p>
        <h2>Sharing</h2>
        <p>
          We do not sell your data. We do not share your data with advertisers. We share data with infrastructure
          providers (hosting, database, authentication) strictly to run the service.
        </p>
        <h2>Your choices</h2>
        <ul>
          <li>Edit or delete entries any time from the app.</li>
          <li>Delete your account from the Profile screen — this permanently removes your data.</li>
          <li>Contact us at the support address below for any other request.</li>
        </ul>
        <h2>Children</h2>
        <p>Genesyx is intended for adults. We do not knowingly collect data from anyone under 18.</p>
        <h2>Contact</h2>
        <p>
          Questions? Reach us via the <Link to="/support" className="text-primary underline">support page</Link>.
        </p>
      </LegalLayout>
    </AppShell>
  );
}

export function LegalLayout({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="gx-screen px-5 pt-3 pb-10">
      <Link to="/" className="-ml-2 mb-2 inline-flex h-11 w-11 items-center justify-center text-foreground">
        <ChevronLeft className="h-5 w-5" />
      </Link>
      <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">Last updated {updated}</p>
      <div className="prose prose-sm mt-6 max-w-none space-y-4 text-[14px] leading-relaxed text-foreground/85 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-[16px] [&_h2]:font-semibold [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-primary [&_a]:underline">
        {children}
      </div>
    </div>
  );
}
