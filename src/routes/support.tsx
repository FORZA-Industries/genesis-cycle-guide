import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/genesyx/AppShell";
import { LegalLayout } from "./privacy";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support — Genesyx" },
      { name: "description", content: "Get help with your Genesyx account or report an issue." },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  return (
    <AppShell>
      <LegalLayout title="Support" updated="June 2026">
        <p>We're a small team and we read every message. Here's how to get help.</p>
        <h2>Contact us</h2>
        <p>
          Email{" "}
          <a href="mailto:support@genesyx.app">support@genesyx.app</a> and tell us:
        </p>
        <ul>
          <li>The email address tied to your Genesyx account.</li>
          <li>What you were trying to do.</li>
          <li>What happened instead.</li>
          <li>A screenshot if you can.</li>
        </ul>
        <h2>Common questions</h2>
        <p>
          <strong>I didn't get my confirmation email.</strong> Check your spam folder, then use the "Resend"
          link on the sign-in screen.
        </p>
        <p>
          <strong>I forgot my password.</strong> On the sign-in screen tap "Forgot password?" — we'll email
          you a reset link. The reset link opens in your browser.
        </p>
        <p>
          <strong>How do I delete my account?</strong> Open Profile → Delete account. This permanently removes
          your data.
        </p>
        <h2>Privacy and terms</h2>
        <p>
          <Link to="/privacy">Privacy policy</Link> · <Link to="/terms">Terms of service</Link> ·{" "}
          <Link to="/health-disclaimer">Health disclaimer</Link>
        </p>
      </LegalLayout>
    </AppShell>
  );
}
