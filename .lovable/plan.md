## Plan

### 1. Fix the first-time user handoff so saves work
- Change the post-quiz email capture from a waitlist-only form into an account creation/sign-in step.
- Use the entered email to create an authenticated app session before continuing to the dashboard.
- Keep the route inside the existing mobile app shell.
- If auth requires email confirmation, show a clear “confirm your email to save” state instead of sending the user into a dashboard where saves silently fail.
- Preserve the existing sign-in page for returning users.

### 2. Persist quiz answers and use them for real personalization
- Store quiz answers in route-level state after `QuizFlow` completes.
- Pass those answers into the results/dashboard components instead of keeping output static.
- Personalize:
  - readiness summary cards
  - next steps
  - dashboard “today” copy
  - nutrition/supplement emphasis
  - support priority messaging
- Update the gender-preference copy/modal to be medically cautious and non-misleading: no promise that diet, timing, or pH can determine baby sex; frame it as personal preferences and emotional support only.

### 3. Save cycle setup and daily logs reliably
- Keep shared hooks generic; do not hardcode page behavior inside them.
- Add generic auth-gated save behavior/config where needed so callers can decide what message or action to show.
- Ensure cycle setup save uses the active session, refreshes the dashboard/track data after save, and gives friendly errors.
- Ensure daily log save works for signed-in users and updates dashboard hydration/streak immediately.
- For guest attempts, route users to the account step/sign-in with a clear reason rather than raw backend errors.

### 4. Wire dead navigation and buttons
- Bottom tabs already switch app sections in memory; keep that behavior and ensure actions inside tabs do something visible.
- Make “Review Plan” open an in-app supplement plan/detail dialog instead of doing nothing.
- Make profile menu rows open lightweight detail dialogs or sign-in prompts rather than being inert.
- Make pregnancy pathway actions resolve to a real in-app state: signed-out users are prompted to sign in; signed-in users can switch to a pregnancy preview/dashboard instead of a “coming soon” toast loop.

### 5. Fix modal/frame behavior and spacing regressions
- Adjust shared dialog styling so modals open centered inside the phone frame without briefly animating from outside it.
- Remove the excessive dashboard-to-bottom-nav empty gap while keeping enough safe-area room for the tab bar.
- Keep prior cleanup: no decorative floating motion elements in hero/home flows.

### 6. Backend checks
- Current access policies for cycle settings, daily logs, pH readings, partner invites, and profiles already allow signed-in users to manage their own rows.
- I do not plan to add guest database writes; guest data should be converted into a real signed-in session before save.
- If implementation reveals missing grants or profile trigger issues, I’ll add a focused migration with explicit grants and RLS policies.

### 7. Verification
- Run through the critical path in-browser:
  - homepage → quiz → account/email step → dashboard
  - cycle setup save → dashboard updates
  - log today save → dashboard hydration/streak updates
  - bottom tabs and profile actions
  - pregnancy pathway
  - returning sign-in
- Check console/network/server-function errors and fix anything blocking the core flow.