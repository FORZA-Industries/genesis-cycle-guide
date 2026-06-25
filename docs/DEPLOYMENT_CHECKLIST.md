# Genesyx — Deployment Checklist (current state → live on Google Play)

**Legend:** ✅ done · 🟡 partial · ⬜ todo  |  👤 = you (your PC / Supabase / Play Console) · 🤖 = me (code + specs, in a `genesyx-android` session)

---

## Phase 0 — Foundation  ✅ (done)
- ✅ `genesyx-android` repo live, Gradle wrapper, theme, navigation
- ✅ Cycle engine (phase math) + unit tests
- ✅ Onboarding flow (Splash, Intro, Quiz, Readiness, Waitlist)
- ✅ Home, Track + pH, Nutrition, Insights *(built — but not yet compiled or re-diffed)*
- ✅ DB schema + RLS + privileged-function logic captured (`docs/schema.sql`, `DATA_LAYER.md`)
- ✅ Privacy Policy drafted (`docs/PRIVACY_POLICY.md`)
- ✅ Missing-screens build spec (`docs/MISSING_SCREENS_SPEC.md`)

## Phase 1 — Finish the UI  🤖 (in a genesyx-android session, from the spec)
- ⬜ **Auth** screen (email/password + Google)
- ⬜ **Profile** (+ Edit name, Change password, Delete account)
- ⬜ **PartnerSection** (invite / pending / linked / unlink)
- ⬜ **Log** screen (mood, energy, symptoms, sleep, water, supplements, notes)
- ⬜ **Invite** deep-link screen (`/invite/{code}`)
- ⬜ **Pregnancy** teaser
- ⬜ **Re-diff** Track / Insights / pH against current web source (they changed after we built them)
- ⬜ Swap text wordmark → real **logo** (`logo_g.png` / `genesyx-logo.svg`)

## Phase 2 — Backend wiring  🤖 + 👤 (Supabase)
- ⬜ Create a **Supabase project** 👤 → get project URL + anon key
- ⬜ Apply `docs/schema.sql` (tables, RLS, signup trigger)
- ⬜ Wire **supabase-kt**: auth (email + Google) + Postgrest repos replacing the in-memory ones
- ⬜ Build **Edge Functions**: `acceptPartnerInvite`, `unlinkPartner`, `deleteAccount`, `sendPartnerInvite`, `revokePartnerInvite`, `updateDisplayName`
- ⬜ **Fix known bugs:** `deleteAccount` must also delete `ph_readings`; make the partner-link write **atomic** (single RPC)
- ⬜ Configure **Google OAuth** (Supabase provider + Android SHA-1 + redirect/deep link)

## Phase 3 — Build & sign the AAB  👤 (your PC) + 🤖 (fixes)
- ⬜ Open project in **Android Studio** → **Sync Gradle** (downloads SDK + deps)
- ⬜ **Build ▸ Make Project** → paste errors to me → fix until green ← *current real blocker*
- ⬜ Set release config: `applicationId`, `versionCode`/`versionName`, app icon, min/target SDK
- ⬜ Add `local.properties` with SDK path; put Supabase URL/key in `local.properties`/secrets (not committed)
- ⬜ Run on emulator/device → **smoke-test** every flow (sign up, log, pH, partner, delete)
- ⬜ Create **upload keystore** → ⚠️ back up the file + passwords (needed for all future updates)
- ⬜ **Build ▸ Generate Signed App Bundle ▸ release** → `app/release/app-release.aab`

## Phase 4 — Play Console setup  👤 (can run in parallel with Phase 1–2)
**Store presence**
- ⬜ App category + contact details
- ⬜ Store listing: app name, short + full description
- ⬜ Graphics: app **icon** (512px), **feature graphic** (1024×500), **phone screenshots** (≥2)
**App content / declarations**
- ✅ Privacy policy → host the file, paste URL
- ⬜ **Data safety** (🤖 I can draft from the schema)
- ⬜ **Content rating** questionnaire
- ⬜ **Target audience** + age groups (18+)
- ⬜ **Ads** declaration → No ads
- ⬜ **Health apps** declaration (fertility) → extra scrutiny, fill carefully
- ⬜ Government / Financial features → N/A
- ⬜ **Test login credentials** for Google's reviewers (app requires sign-in)

## Phase 5 — Release  👤
- ⬜ **Internal testing**: upload the AAB, install via the test link, verify
- ⬜ Select **countries / regions**
- ⬜ Create **Production release** → upload AAB
- ⬜ Preview & confirm → **Send for review**
- ⬜ Review passes → **Publish** (goes live)

---

## Critical path (what blocks what)
```
Phase 1 (screens) ─┐
                   ├─► Phase 3 (compile → signed AAB) ─► Phase 5 (production release)
Phase 2 (backend) ─┘                                        ▲
Phase 4 (Play paperwork, parallel) ────────────────────────┘
```
- The **AAB needs Phase 1 + 2** (a complete app with working login) — otherwise you'd ship a shell.
- **Production needs the AAB + Phase 4 declarations**.
- **Best parallelization:** 🤖 finishes screens (Phase 1) and wires backend (Phase 2) while 👤 sets up the Supabase project + does Play paperwork (Phase 4).

## Honest reality check
- The app is **~65% UI, 0% backend, not yet compiled**. Phases 1–3 are real work, not paperwork.
- Nearest milestone you can *see*: get it **compiling in Android Studio** (Phase 3, step 2) and run it on an emulator — that's the moment it becomes a real, testable app.
- Only after that does a meaningful AAB exist.
