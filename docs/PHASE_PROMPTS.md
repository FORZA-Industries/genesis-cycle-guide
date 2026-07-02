# Genesyx — Paste-Ready Phase Prompts (run in the genesyx-android session)

Work top to bottom. After each phase: review the diff, confirm it compiles, commit, then paste
the next. Run these in **Claude Code inside Android Studio's Terminal** (best), or a genesyx-android
cloud session with `maven.google.com` + `dl.google.com` allow-listed.

**Locked decisions (already baked into every prompt):** package `com.genesyx.app` · Kotlin +
Compose + Material 3 + Hilt + Room + DataStore + supabase-kt · Single-Activity + Compose Nav +
MVVM/Clean · Edge Functions for privileged ops · Credential Manager for Google · online-first +
basic Room cache · onboarding in DataStore · pregnancy = preview stub · **no service_role key in app**.

---

## PHASE 1 — Foundation / theme
```
Work in the genesyx-android repo. IMPLEMENT the documented architecture, don't redesign it.
Read ARCHITECTURE.md, README.md, docs/ (DESIGN_TOKENS.md, UIUX_SPEC.md, MISSING_SCREENS_SPEC.md,
DATA_LAYER.md, schema.sql). Run `git log --oneline -15` and `ls -R app/src/main` first.
Package com.genesyx.app. Small logical commits.

PHASE 1 = foundation/theme cleanup:
- Fix Color.kt to the verified tokens (electric-lavender primary, full light+dark parity).
- Fix Type.kt for Outfit + Inter — if .ttf not in res/font, use Compose downloadable fonts.
- Fix Theme.kt light/dark parity; standardize shape/radius/elevation tokens.
- Align shared app bar / bottom nav / card styles to the theme.
- ENSURE IT COMPILES: run ./gradlew assembleDebug and fix errors.
STOP and report: files changed, what compiles now, remaining blockers.
```

## PHASE 2 — Auth + Supabase
```
PHASE 2 = auth + Supabase foundation.
- Load SUPABASE_URL/SUPABASE_ANON_KEY from local.properties into BuildConfig.
- Hilt SupabaseModule providing SupabaseClient (install Auth, Postgrest, Functions).
- Session bootstrap on app start; AuthRepository; email sign up / sign in / sign out.
- Google sign-in via Android Credential Manager + Supabase token exchange (serverClientId = Web client ID).
- Auth UI state + ViewModel; production-safe AuthScreen (per MISSING_SCREENS_SPEC.md §1).
- Wire auth gating into navigation; AndroidManifest deep link for auth/invite if needed.
Constraints: follow supabase-kt + Credential Manager docs; NO service_role key; don't start
partner/delete flows yet; app must compile (./gradlew assembleDebug).
STOP and report: changed files, working flows, setup steps still required from me.
```

## PHASE 3 — Repositories + data layer
```
PHASE 3 = repositories + local data layer (per ARCHITECTURE.md / DATA_LAYER.md).
- data/local (Room: entities, DAOs, GenesyxDatabase) for cycle_settings, daily_logs, ph_readings,
  profile cache; DataStore for session/theme/onboarding.
- data/remote (DTOs + mappers + Postgrest calls per table).
- data/repository: CycleRepository, DailyLogRepository, PhRepository, ProfileRepository,
  NutritionRepository, PartnerRepository (scaffold). Online-first reads with cache fallback.
- Hilt DatabaseModule + RepositoryModule. Replace the in-memory repos.
Keep it production-safe and minimal; app must compile.
STOP and report remaining blockers before UI wiring.
```

## PHASE 4 — Wire all screens to real data
```
PHASE 4 = core screen completion. Wire in order: Home, Daily Log, Track (+cycle settings sheet),
Nutrition, Insights, pH tracker, Profile (+PartnerSection), Invite deep-link. Pregnancy = preview stub.
- Remove placeholder behavior; connect real ViewModels + repositories; dark mode supported.
- Match MISSING_SCREENS_SPEC.md + SCREEN_LAYOUTS.md; charts only where needed.
- If a screen can't fully complete, leave a clearly labeled production-safe fallback (not a TODO).
App must compile and run.
STOP and report: working journey first-launch → daily use, still-missing features, release blockers.
```

## PHASE 5 — Edge Functions + bug fixes
```
PHASE 5 = privileged ops via Supabase Edge Functions (Deno) under supabase/functions/, plus fixes.
Implement per DATA_LAYER.md: acceptPartnerInvite, unlinkPartner, deleteAccount, sendPartnerInvite,
revokePartnerInvite, updateDisplayName. service_role key stays in the function env only.
Fixes: deleteAccount MUST also delete ph_readings; make the partner-link write atomic (single
plpgsql SECURITY DEFINER RPC). Wire the Android PartnerRepository/Profile actions to invoke these.
Give me the exact `supabase functions deploy` commands to run.
STOP and report: functions added, what I must deploy, what's wired in-app.
```

## PHASE 6 — Release build (signed AAB)
```
PHASE 6 = release readiness.
- Validate manifest, applicationId=com.genesyx.app, versionCode=1, versionName="1.0.0", permissions,
  deep link genesyx://invite/{code}.
- Confirm signing config / build variants; ensure bundleRelease works with an upload keystore
  (I will create the keystore in Android Studio — tell me exactly what to put in build.gradle.kts
  and how to reference it without committing secrets).
- Replace placeholder strings; flag missing assets.
Output: (1) exact steps for me, (2) exact commands for debug + release build (assembleDebug,
bundleRelease), (3) exact blockers to a Play Internal-testing upload.
Do not invent marketing copy; do not change core architecture.
```

## QA — end-to-end pass (run before uploading)
```
Do a QA pass and report pass/fail for each, with the failing detail:
1. Fresh install → onboarding → email sign-up → email confirm (if enabled) → lands on Home.
2. Home shows correct phase/day + hydration/streak for the signed-in user.
3. Log a day (mood/energy/symptoms/sleep/water/supplements/notes) → persists in Supabase daily_logs
   → survives app restart.
4. Track: change cycle settings → phase colors + Home update. pH: add a reading → chart + Insights update.
5. Nutrition + Insights render real data; dark mode correct on every screen.
6. (If wired) Google sign-in; send/accept partner invite via deep link; delete account clears all
   rows including ph_readings, then routes to Auth.
7. ./gradlew testDebugUnitTest and bundleRelease both succeed.
List anything that blocks an Internal-testing upload.
```
