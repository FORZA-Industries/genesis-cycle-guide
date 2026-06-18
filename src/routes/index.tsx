import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/genesyx/AppShell";
import { BottomTabBar, type TabKey } from "@/components/genesyx/BottomTabBar";
import { SplashScreen, OnboardingIntro } from "@/components/genesyx/screens/Onboarding";
import { QuizFlow } from "@/components/genesyx/screens/Quiz";
import { QuizResults, WaitlistScreen } from "@/components/genesyx/screens/Conversion";
import { HomeScreen } from "@/components/genesyx/screens/Home";
import { TrackScreen } from "@/components/genesyx/screens/Track";
import { NutritionScreen } from "@/components/genesyx/screens/Nutrition";
import { InsightsScreen } from "@/components/genesyx/screens/Insights";
import { ProfileScreen } from "@/components/genesyx/screens/Profile";
import { LogScreen } from "@/components/genesyx/screens/Log";
import { PregnancyTransition } from "@/components/genesyx/screens/Pregnancy";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Genesyx — Fertility prep, gently guided" },
      { name: "description", content: "A premium, calm fertility-preparation companion: cycle awareness, nutrition guidance, and personalised insights." },
      { property: "og:title", content: "Genesyx — Fertility prep, gently guided" },
      { property: "og:description", content: "Personalised cycle, nutrition, and supplement support for your conception journey." },
    ],
  }),
  component: Index,
});

type Flow = "splash" | "intro" | "quiz" | "results" | "waitlist" | "app" | "log" | "pregnancy";

function Index() {
  const [flow, setFlow] = useState<Flow>("splash");
  const [tab, setTab] = useState<TabKey>("home");
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSwitchToPregnancy = () => {
    if (!user) {
      toast.error("Please sign in to switch to pregnancy mode.");
      navigate({ to: "/auth" });
      return;
    }
    toast.success("Pregnancy mode is coming soon — we'll let you know.");
    setFlow("app");
  };

  const isApp = flow === "app";

  return (
    <>
      <AppShell
        tabBar={isApp ? <BottomTabBar active={tab} onChange={setTab} /> : undefined}
      >
        {flow === "splash" && (
          <SplashScreen onStart={() => setFlow("intro")} onSignIn={() => navigate({ to: "/auth" })} />
        )}
        {flow === "intro" && (
          <OnboardingIntro onContinue={() => setFlow("quiz")} onBack={() => setFlow("splash")} />
        )}
        {flow === "quiz" && (
          <QuizFlow onComplete={() => setFlow("results")} onBack={() => setFlow("intro")} />
        )}
        {flow === "results" && (
          <QuizResults
            onUnlock={() => setFlow("waitlist")}
            onContinue={() => setFlow("app")}
            onBack={() => setFlow("intro")}
          />
        )}
        {flow === "waitlist" && (
          <WaitlistScreen onContinue={() => setFlow("app")} onBack={() => setFlow("results")} />
        )}
        {flow === "log" && <LogScreen onClose={() => setFlow("app")} />}
        {flow === "pregnancy" && (
          <PregnancyTransition onSwitch={() => setFlow("app")} onLater={() => setFlow("app")} />
        )}
        {isApp && (
          <>
            {tab === "home" && (
              <HomeScreen
                onLog={() => setFlow("log")}
                onPregnancy={() => setFlow("pregnancy")}
                onProfile={() => setTab("profile")}
              />
            )}
            {tab === "track" && <TrackScreen onLog={() => setFlow("log")} />}
            {tab === "nutrition" && <NutritionScreen />}
            {tab === "insights" && <InsightsScreen onOpenTracker={() => setTab("track")} />}
            {tab === "profile" && <ProfileScreen onPregnancy={() => setFlow("pregnancy")} />}
          </>
        )}
      </AppShell>
    </>
  );
}
