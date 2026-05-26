# Google Play Store Release Checklist — Genesyx

This is a step-by-step, security-first checklist to take Genesyx from preview to a Play Store listing.

---

## 1. Wrap the web app as an Android app (Capacitor)

The web app is already configured. To produce an `.aab` you build on **your** machine (Capacitor needs Android Studio + JDK, which can't run inside Lovable).

```bash
# one-time, on your local machine
npm install -D @capacitor/cli @capacitor/core @capacitor/android
npx cap add android
npx cap sync android
npx cap open android   # opens Android Studio
```

`capacitor.config.ts` is already set to:
- **App ID**: `app.lovable.genesyx`  ← change to your reverse-domain ID before first publish (cannot be changed after)
- **App name**: `Genesyx`
- **Strategy**: loads `https://genesis-cycle-guide.lovable.app` inside a WebView. Ship web updates → app updates instantly. No need to resubmit to Google for content changes.

Inside Android Studio:
1. `Build` → `Generate Signed Bundle / APK` → **Android App Bundle (.aab)**
2. Create a new upload keystore (back it up — losing it means losing the app)
3. Choose `release` build variant
4. The `.aab` lands in `android/app/release/`

---

## 2. Google Play Console setup

1. Create a Google Play developer account ($25 one-time).
2. Create a new app → name **Genesyx**, default language English, app/game = App, free/paid.
3. Complete every section flagged "Set up your app":
   - **App access** — if any feature is behind login, give Google a test account.
   - **Ads** — choose "No, my app does not contain ads" (unless you add them).
   - **Content rating** — fill the IARC questionnaire. Genesyx is health/wellness, not medical advice.
   - **Target audience** — adults 18+ (sensitive reproductive health content).
   - **News app** — No.
   - **COVID-19 contact tracing** — No.
   - **Data safety** — see §4 below.
   - **Government app** — No.
   - **Financial features** — No.
   - **Health apps declaration** — declare it's a wellness/educational tracker, not a medical device.

---

## 3. Store listing assets you need to upload

| Asset | Spec | Notes |
|---|---|---|
| App icon | 512×512 PNG, 32-bit | Use brand orb on solid background |
| Feature graphic | 1024×500 PNG/JPG | Hero image with tagline |
| Phone screenshots | 2–8, min 320px, max 3840px | Capture Splash, Quiz, Home, Track, Insights, Profile |
| 7" / 10" tablet | optional | recommended |
| Short description | ≤80 chars | "Gentle, personalised fertility prep companion." |
| Full description | ≤4000 chars | Features, what it does, what it doesn't (no medical advice) |
| Privacy policy URL | required | host at `https://genesis-cycle-guide.lovable.app/privacy` |
| App category | Health & Fitness | |

---

## 4. Data Safety form (required, take seriously)

Declare what you collect via Lovable Cloud:
- **Email address** — for account/auth. Linked to user. Required.
- **Name** — optional, for personalisation. Linked to user.
- **Health & fitness info** (menstrual cycle, supplements, gender preference) — for the core feature. Linked to user. **Encrypted in transit** ✅. **User can request deletion** ✅.
- **App interactions / crashes** — diagnostics. Not linked to user.
- **No data sold to third parties.**
- **No data shared with third parties** (besides Lovable Cloud / Supabase as processor).

You must provide:
- A way for users to **request data deletion** from inside the app or via email.
- A **privacy policy URL** that lists every item above.

---

## 5. Security checklist (do BEFORE upload)

- [x] Row-Level Security enabled on `profiles` and `partner_invites` (done).
- [x] Profiles, invites scoped to `auth.uid()`.
- [x] Trigger functions revoked from `PUBLIC`, `anon`, `authenticated`.
- [x] Email + password validated client-side with zod (min 8 chars).
- [x] Partner invite links use random codes, expire after 14 days, can be revoked.
- [ ] **Enable HIBP leaked-password protection** in Lovable Cloud → Users → Auth Settings → Email (recommended before launch).
- [ ] **Email confirmation ON** (default). Do NOT enable auto-confirm in production.
- [ ] **Set up custom domain** for emails (Cloud → Emails) so verification mails come from your brand, not a generic sender.
- [ ] Add `/privacy` and `/terms` routes with real policies.
- [ ] In the Android `network_security_config.xml`, deny cleartext (Capacitor config already does this).
- [ ] In Google Play → App content → **Sensitive permissions**: none are requested by default. If you later add notifications, explain the use case.
- [ ] Add **app-level account deletion** (Google requires this for any app with sign-in since 2024). A "Delete my account" button in Profile that calls a server function which removes the user from Cloud.

---

## 6. Pre-launch test

1. Internal testing track first — invite 1–5 testers by email.
2. Run Google Play's pre-launch report (automatic when you upload to a test track) — it crawls the app on real Android devices and flags crashes, accessibility, and security issues.
3. Smoke-test on a real device:
   - sign up → email confirmation → sign in
   - Google sign-in
   - quiz flow with both popups (Cycle + Gender)
   - partner invite: send → copy link → open in another account → accept → both linked
   - dark mode toggle
   - log out → log back in
4. Promote to **Closed testing** (20+ testers, 14 days) before **Production**. Google now requires this for new personal developer accounts.

---

## 7. Submission

- Upload the signed `.aab` to the chosen track.
- Fill release notes ("Initial release — fertility prep companion").
- Submit for review. First review usually takes 1–7 days.

---

## 8. After launch

- Monitor Play Console → Quality → Android vitals weekly.
- Watch the Lovable Cloud dashboard for auth errors and failed invites.
- Each web update auto-deploys to the published URL — no new Play submission needed unless you change the native shell, permissions, or App ID.

---

**Done.** Once the AAB is signed and the Data Safety + Privacy Policy are in place, you're ready to submit.
