import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/genesyx/AppShell";
import { BottomTabBar, type TabKey } from "@/components/genesyx/BottomTabBar";
import { SplashScreen, OnboardingIntro } from "@/components/genesyx/screens/Onboarding";
import { QuizFlow } from "@/components/genesyx/screens/Quiz";
import { QuizResults, WaitlistScreen, type QuizAnswers } from "@/components/genesyx/screens/Conversion";
import { HomeScreen } from "@/components/genesyx/screens/Home";
import { TrackScreen } from "@/components/genesyx/screens/Track";
import { NutritionScreen } from "@/components/genesyx/screens/Nutrition";
import { InsightsScreen } from "@/components/genesyx/screens/Insights";
import { ProfileScreen } from "@/components/genesyx/screens/Profile";
import { LogScreen } from "@/components/genesyx/screens/Log";
import { PregnancyTransition, PregnancyHome } from "@/components/genesyx/screens/Pregnancy";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { rememberAppEntry, showSignInRequired } from "@/lib/authPrompt";

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
type Mode = "prep" | "pregnancy";

function Index() {
  const [flow, setFlow] = useState<Flow>("splash");
  const [tab, setTab] = useState<TabKey>("home");
  const [mode, setMode] = useState<Mode>("prep");
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers>({});
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedEntry = window.localStorage.getItem("genesyx:openApp");
    const shouldOpenApp = user || savedEntry === "true" || savedEntry === "1";
    if (shouldOpenApp) {
      setFlow((current) => (current === "splash" ? "app" : current));
    }
  }, [user]);

  const openApp = () => {
    rememberAppEntry();
    setFlow("app");
  };

  const openAuth = () => {
    rememberAppEntry();
    navigate({ to: "/auth" });
  };

  const handleSwitchToPregnancy = () => {
    if (!user) {
      showSignInRequired("Sign in to switch to pregnancy mode.", openAuth);
      return;
    }
    setMode("pregnancy");
    setFlow("app");
    setTab("home");
    toast.success("Switched to pregnancy mode");
  };

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Guest";

  const isApp = flow === "app";

  return (
    <AppShell
      tabBar={isApp ? <BottomTabBar active={tab} onChange={setTab} /> : undefined}
    >
      {flow === "splash" && (
        <SplashScreen onStart={() => setFlow("intro")} onSignIn={openAuth} />
      )}
      {flow === "intro" && (
        <OnboardingIntro onContinue={() => setFlow("quiz")} onBack={() => setFlow("splash")} />
      )}
      {flow === "quiz" && (
        <QuizFlow
          onComplete={(a) => { setQuizAnswers(a); setFlow("results"); }}
          onBack={() => setFlow("intro")}
        />
      )}
      {flow === "results" && (
        <QuizResults
          answers={quizAnswers}
          onUnlock={() => setFlow("waitlist")}
          onContinue={openApp}
          onBack={() => setFlow("intro")}
        />
      )}
      {flow === "waitlist" && (
        <WaitlistScreen onContinue={openApp} onBack={() => setFlow("results")} />
      )}
      {flow === "log" && <LogScreen onClose={() => setFlow("app")} onRequireAuth={openAuth} />}
      {flow === "pregnancy" && (
        <PregnancyTransition onSwitch={handleSwitchToPregnancy} onLater={() => setFlow("app")} />
      )}
      {isApp && (
        <>
          {tab === "home" && mode === "prep" && (
            <HomeScreen
              quizAnswers={quizAnswers}
              onLog={() => setFlow("log")}
              onProfile={() => setTab("profile")}
              onRequireAuth={openAuth}
            />
          )}
          {tab === "home" && mode === "pregnancy" && (
            <PregnancyHome displayName={displayName} onBackToPrep={() => setMode("prep")} />
          )}
          {tab === "track" && <TrackScreen onLog={() => setFlow("log")} onRequireAuth={openAuth} />}
          {tab === "nutrition" && <NutritionScreen onRequireAuth={openAuth} />}
          {tab === "insights" && <InsightsScreen onOpenTracker={() => setTab("track")} />}
          {tab === "profile" && <ProfileScreen onSignIn={openAuth} />}
        </>
      )}
    </AppShell>
  );
}
