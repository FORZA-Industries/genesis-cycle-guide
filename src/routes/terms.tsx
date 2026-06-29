import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/genesyx/AppShell";
import { LegalLayout } from "./privacy";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Genesyx" },
      { name: "description", content: "Terms governing your use of the Genesyx fertility wellness app." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <AppShell>
      <LegalLayout title="Terms of Service" updated="June 2026">
        <p>By using Genesyx you agree to these terms. If you do not agree, please don't use the app.</p>
        <h2>The service</h2>
        <p>
          Genesyx is an educational fertility wellness tracker. It is not a medical device, not a diagnostic
          tool, and not a replacement for advice from a qualified healthcare professional. See the{" "}
          <Link to="/health-disclaimer">health disclaimer</Link>.
        </p>
        <h2>Your account</h2>
        <p>
          You are responsible for your account credentials and for the accuracy of data you enter. Keep your
          password private and notify us if you suspect unauthorised access.
        </p>
        <h2>Acceptable use</h2>
        <ul>
          <li>Don't use Genesyx to harm others or to violate laws.</li>
          <li>Don't try to reverse engineer, attack, or scrape the service.</li>
          <li>Don't impersonate another person or share another person's data without consent.</li>
        </ul>
        <h2>Content</h2>
        <p>
          You own the data you enter. You grant us a limited licence to store and process it solely to run the
          service for you, as described in the privacy policy.
        </p>
        <h2>Changes</h2>
        <p>
          We may update the service and these terms. Material changes will be communicated in-app or by email.
        </p>
        <h2>Termination</h2>
        <p>
          You can delete your account at any time from the Profile screen. We may suspend accounts that violate
          these terms.
        </p>
        <h2>Liability</h2>
        <p>
          The service is provided "as is". To the maximum extent permitted by law, Genesyx is not liable for
          indirect or consequential damages arising from use of the app.
        </p>
        <h2>Contact</h2>
        <p>Reach us via the <Link to="/support">support page</Link>.</p>
      </LegalLayout>
    </AppShell>
  );
}
