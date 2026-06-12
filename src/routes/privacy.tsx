import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

// ── EDIT THESE before publishing ──────────────────────────────────────────
const CONTACT_EMAIL = "support@genesyx.app"; // must be a real, monitored inbox
const LAST_UPDATED = "12 June 2026";
const COMPANY = "FORZA Industries";
// ──────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Genesyx" },
      { name: "description", content: "How Genesyx collects, uses, and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to app
        </Link>

        <h1 className="font-display text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-foreground/90">
          <section>
            <h2 className="font-display text-lg font-semibold">1. Who we are</h2>
            <p className="mt-2">
              Genesyx ("the app", "we", "us") is a fertility-preparation wellness companion operated by {COMPANY}.
              This policy explains what personal data we collect, why, and the choices you have. If you do not agree
              with this policy, please do not use the app.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">2. Information we collect</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Account data:</strong> your email address and, optionally, your display name.</li>
              <li><strong>Health &amp; wellness data:</strong> menstrual-cycle details, daily logs, urine-pH readings, nutrition and supplement preferences, and quiz responses that you choose to enter.</li>
              <li><strong>Partner data:</strong> if you invite a partner, the email address you enter for the invitation, and the link between your accounts once accepted.</li>
              <li><strong>Preferences:</strong> settings such as your theme choice.</li>
              <li><strong>Diagnostics:</strong> basic technical and crash information used to keep the app working. This is not linked to your identity.</li>
            </ul>
            <p className="mt-2">We do not collect precise location, contacts, photos, or device identifiers for advertising. The app contains no advertising.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">3. How we use your information</h2>
            <p className="mt-2">
              We use your data solely to provide the app's features: authenticating you, saving and syncing your
              cycle, nutrition and partner information across devices, and personalising the guidance you see. We do
              not use your health data for advertising, and we do not sell your data.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">4. How your data is stored and protected</h2>
            <p className="mt-2">
              Your data is stored on managed cloud infrastructure (Supabase, provisioned via Lovable Cloud), which
              acts as our data processor. Data is encrypted in transit (HTTPS/TLS). Access is restricted by
              row-level security so each account can only reach its own records.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">5. Sharing</h2>
            <p className="mt-2">
              We do not sell your personal data and we do not share it with third parties for their own purposes. Data
              is processed only by the infrastructure providers named above on our behalf, and shared with a partner
              account only when you explicitly send and they accept an invitation.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">6. Your rights and choices</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Access &amp; correction:</strong> view and edit your information inside the app.</li>
              <li><strong>Deletion:</strong> permanently delete your account and associated data at any time from
                Profile → Delete account. This removes your profile, logs, cycle settings, and partner links, and
                deletes your authentication record. Deletion is immediate and cannot be undone.</li>
              <li><strong>Withdraw consent:</strong> stop using the app and delete your account to withdraw consent.</li>
            </ul>
            <p className="mt-2">To exercise any right or ask a question, contact us at {CONTACT_EMAIL}.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">7. Data retention</h2>
            <p className="mt-2">
              We keep your data for as long as your account exists. When you delete your account, your associated
              data is removed promptly from our active systems.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">8. Children</h2>
            <p className="mt-2">
              Genesyx is intended for adults aged 18 and over and is not directed to children. We do not knowingly
              collect data from anyone under 18.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">9. Not medical advice</h2>
            <p className="mt-2">
              Genesyx provides general wellness and educational information to support conception preparation. It is
              not a medical device and does not provide medical advice, diagnosis, or treatment, and is not a
              contraceptive. Always consult a qualified healthcare professional for medical decisions.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">10. Changes to this policy</h2>
            <p className="mt-2">
              We may update this policy from time to time. Material changes will be reflected by the "Last updated"
              date above and, where appropriate, communicated in the app.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">11. Contact</h2>
            <p className="mt-2">Questions about this policy or your data: {CONTACT_EMAIL}.</p>
          </section>

          <p className="pt-4 text-xs text-muted-foreground">
            See also our <Link to="/terms" className="underline">Terms of Service</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
