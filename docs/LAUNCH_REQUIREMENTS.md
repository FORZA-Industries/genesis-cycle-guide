# Genesyx — Launch Requirements (things YOU must provide)

Everything the build session **can't** invent — accounts, keys, assets, decisions.
Gather these so the session never stalls. ✅ = you have it · ⬜ = still needed.

---

## A. Accounts (one-time)
- ⬜ **Google Play Developer account** ($25 one-time) — you appear to have this (Play Console is open).
- ⬜ **Supabase account** + one **project** (free tier is fine) → supabase.com
- ⬜ **Google Cloud project** (for Google Sign-In OAuth) → console.cloud.google.com

## B. Supabase (needed for Phase 2 — auth/data)
From **Supabase → Project Settings → API**:
- ⬜ **Project URL** (e.g. `https://xxxx.supabase.co`) → goes in `local.properties`
- ⬜ **anon / publishable key** → goes in `local.properties` (safe in the app)
- ⬜ **service_role key** → ⚠️ **ONLY** for Edge Functions on the server. **Never** in the app or in chat.
- ⬜ **Apply the DB schema:** paste `docs/schema.sql` into Supabase → SQL Editor → Run (creates tables, RLS, signup trigger)
- ⬜ **Enable Email auth** (Auth → Providers → Email) — turn on; decide if email confirmation is required
- ⬜ **Deploy the 6 Edge Functions** later (acceptPartnerInvite, unlinkPartner, deleteAccount, sendPartnerInvite, revokePartnerInvite, updateDisplayName) — needs the Supabase CLI (the session can scaffold these)

## C. Google Sign-In (Credential Manager)
- ⬜ **Web OAuth client ID** — Google Cloud → APIs & Services → Credentials → Create → *Web application* → this is the `serverClientId` used for the Supabase token exchange
- ⬜ **Android OAuth client** — same place → *Android* → needs package `com.genesyx.app` + your **SHA-1**
- ⬜ **Enable Google provider in Supabase** (Auth → Providers → Google) with the Web client ID + secret
- ⬜ **SHA-1 & SHA-256** of your signing keys — from Android Studio: **Gradle panel → app → Tasks → android → signingReport** (get both debug and your release/upload key)

## D. Signing & build config
- ⬜ **Upload keystore** — create in Android Studio (Build ▸ Generate Signed Bundle ▸ Create new). ⚠️ **Back up the file + passwords + alias** — you need them for every future update.
- ⬜ Confirm **applicationId = `com.genesyx.app`**, and pick **versionCode 1 / versionName "1.0.0"**
- ⬜ Turn on **Play App Signing** in Play Console (recommended) — Play holds the app key, you keep the upload key
- ⬜ Decide **min SDK** (suggest 26) and **target SDK** (latest required by Play)

## E. Deep links (invite + auth callback)
- ⬜ Pick a scheme: simplest = **custom scheme** `genesyx://invite/{code}` (no domain needed).
  - If you want real web links `https://genesyx.app/invite/...`, you'll need to **own the domain** + host an `assetlinks.json`. Custom scheme is fine for v1.

## F. Play Store listing assets
- ⬜ **App icon** 512×512 PNG
- ⬜ **Feature graphic** 1024×500 PNG/JPG
- ⬜ **Phone screenshots** — min 2 (up to 8), from a real build/emulator
- ⬜ **Short description** (≤80 chars)
- ⬜ **Full description** (≤4000 chars)
- ⬜ **App category** — Health & Fitness (or Medical)
- ⬜ **Contact email**
- ✅ **Privacy policy URL** — host `docs/PRIVACY_POLICY.md` and paste the link

## G. Play Console declarations
- ⬜ **Data safety** form (I can draft the answers from the schema)
- ⬜ **Content rating** questionnaire
- ⬜ **Target audience** — 18+
- ⬜ **Ads** — declare **No ads**
- ⬜ **Health apps** declaration (fertility — extra scrutiny; answer carefully)
- ⬜ **Test login credentials** for Google's reviewers (a real test account email + password — the app requires sign-in)

## H. Content gaps (decide now)
- ⬜ **3 article bodies** for Nutrition are missing in the source. Either write them, or **hide the Articles section for v1**.
- ⬜ **Real logo** wired (you have `logo_g.png` / `genesyx-logo.svg`).

## I. Decisions to lock (paste into the session so it doesn't stall)
- ✅ v1 = **online-first + basic Room cache** (no full offline sync)
- ✅ **Pregnancy = preview/stub** in v1
- ✅ **Edge Functions** for privileged ops; **no service_role key in app**
- ✅ **Credential Manager** for Google sign-in
- ✅ Onboarding persisted in **DataStore**

---

## Minimum to reach INTERNAL TESTING (fastest milestone)
You do **not** need everything above to test internally. Bare minimum:
1. Supabase URL + anon key + schema applied  (B)
2. App compiles → signed AAB + upload keystore  (D)
3. Email auth working (Google can come later)  (B/C)
4. Upload to the Internal testing track — **no store listing/graphics required yet**

Store listing (F), full declarations (G), and Google sign-in (C) can be finished
before you promote to **Production**.
