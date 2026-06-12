import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

// ── EDIT THESE before publishing ──────────────────────────────────────────
const CONTACT_EMAIL = "lucas@mysupplementfactory.com";
const LAST_UPDATED = "12 June 2026";
const COMPANY = "FORZA Industries";
const GOVERNING_LAW = "England and Wales"; // set to your jurisdiction
// ──────────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Genesyx" },
      { name: "description", content: "The terms governing your use of Genesyx." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to app
        </Link>

        <h1 className="font-display text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-foreground/90">
          <section>
            <h2 className="font-display text-lg font-semibold">1. Acceptance</h2>
            <p className="mt-2">
              By creating an account or using Genesyx ("the app"), operated by {COMPANY}, you agree to these Terms of
              Service. If you do not agree, do not use the app.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">2. Eligibility</h2>
            <p className="mt-2">You must be at least 18 years old to use Genesyx.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">3. Not medical advice</h2>
            <p className="mt-2">
              Genesyx provides general wellness and educational information to support conception preparation. It is
              not a medical device and does not provide medical advice, diagnosis, treatment, or contraception. The
              app's insights, including cycle and pH information, are estimates and should not be relied upon for
              medical or family-planning decisions. Always consult a qualified healthcare professional.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">4. Your account</h2>
            <p className="mt-2">
              You are responsible for keeping your login credentials secure and for activity under your account.
              Provide accurate information and keep it up to date. You may delete your account at any time from within
              the app.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">5. Acceptable use</h2>
            <p className="mt-2">
              You agree not to misuse the app, including attempting to access other users' data, disrupting the
              service, reverse-engineering it, or using it for any unlawful purpose. Partner invitations may only be
              sent to people who consent to receive them.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">6. Intellectual property</h2>
            <p className="mt-2">
              The app, its design, and its content are owned by {COMPANY} and protected by applicable laws. Your
              own data remains yours; you grant us only the permissions needed to operate the service for you.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">7. Termination</h2>
            <p className="mt-2">
              You may stop using the app and delete your account at any time. We may suspend or terminate access if
              these terms are violated or to protect the service and its users.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">8. Disclaimers and limitation of liability</h2>
            <p className="mt-2">
              The app is provided "as is" without warranties of any kind. To the maximum extent permitted by law,
              {" "}{COMPANY} is not liable for any indirect, incidental, or consequential damages, or for decisions
              made in reliance on the app's information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">9. Governing law</h2>
            <p className="mt-2">These terms are governed by the laws of {GOVERNING_LAW}.</p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">10. Changes</h2>
            <p className="mt-2">
              We may update these terms from time to time. Continued use after changes take effect constitutes
              acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">11. Contact</h2>
            <p className="mt-2">Questions about these terms: {CONTACT_EMAIL}.</p>
          </section>

          <p className="pt-4 text-xs text-muted-foreground">
            See also our <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
