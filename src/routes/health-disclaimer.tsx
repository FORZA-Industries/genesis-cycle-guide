import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/genesyx/AppShell";
import { LegalLayout } from "./privacy";

export const Route = createFileRoute("/health-disclaimer")({
  head: () => ({
    meta: [
      { title: "Health Disclaimer — Genesyx" },
      { name: "description", content: "Important information about the educational nature of Genesyx." },
    ],
  }),
  component: HealthDisclaimerPage,
});

function HealthDisclaimerPage() {
  return (
    <AppShell>
      <LegalLayout title="Health Disclaimer" updated="June 2026">
        <p>
          <strong>Genesyx is an educational wellness app, not a medical service.</strong> The information,
          insights, and suggestions provided in the app are intended for general informational and educational
          purposes only.
        </p>
        <h2>Not medical advice</h2>
        <p>
          Nothing in Genesyx constitutes medical advice, diagnosis, or treatment. Cycle phase estimates, fertile
          window indications, pH ranges, nutrition suggestions, and supplement information are general
          educational content — not a personalised medical recommendation.
        </p>
        <h2>Talk to your doctor</h2>
        <p>
          Always consult a qualified healthcare professional for questions about fertility, conception,
          pregnancy, menstruation, medications, supplements, or any medical concern. Do not delay seeking medical
          advice because of something you read in this app.
        </p>
        <h2>Not contraception, not diagnosis</h2>
        <p>
          Genesyx must not be used as a method of contraception or as a diagnostic tool. Cycle predictions are
          estimates based on the data you enter and biological averages — they can be wrong.
        </p>
        <h2>Emergencies</h2>
        <p>
          If you are experiencing a medical emergency, contact your local emergency services immediately. Do not
          rely on this app.
        </p>
        <h2>Questions</h2>
        <p>Reach us via the <Link to="/support">support page</Link>.</p>
      </LegalLayout>
    </AppShell>
  );
}
