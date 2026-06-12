package com.genesyx.app.ui.onboarding

import androidx.compose.runtime.Composable
import com.genesyx.app.ui.components.PlaceholderScreen

// Onboarding flow stubs — to be built per docs/SCREEN_LAYOUTS.md (Splash..Waitlist).
// Each exposes the navigation callbacks the GenesyxNavGraph wires up.

@Composable
fun SplashScreen(onStart: () -> Unit, onSignIn: () -> Unit) =
    PlaceholderScreen("Genesyx", "Splash — Start Quiz / Sign in")

@Composable
fun OnboardingIntroScreen(onContinue: () -> Unit, onBack: () -> Unit) =
    PlaceholderScreen("Your fertility preparation", "Onboarding intro — 3 benefits")

@Composable
fun OnboardingQuizScreen(onComplete: () -> Unit, onBack: () -> Unit) =
    PlaceholderScreen("Quiz", "5-step quiz + Did you know?")

@Composable
fun ReadinessSummaryScreen(onUnlockGuide: () -> Unit, onContinue: () -> Unit, onBack: () -> Unit) =
    PlaceholderScreen("A thoughtful starting point", "Readiness summary")

@Composable
fun WaitlistScreen(onContinue: () -> Unit, onBack: () -> Unit) =
    PlaceholderScreen("Join the waiting list", "Waitlist — free guide")
