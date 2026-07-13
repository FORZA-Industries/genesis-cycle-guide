# Genesyx — Connection Roadmap: from "real UI + real backend, unconnected" to a real working app

> **What we're trying to achieve**: the iOS app (build 8) is feature-complete but runs on
> stub backends — mock auth, no sync, accounts don't persist. The real backend already
> exists and is live: the Supabase project in THIS repo (`lfyjeoqiqtmtcwnpekmi`), which the
> web app + Android WebView shell use in production today. This roadmap connects the two.
> Last updated: July 11, 2026.

---

## 0. Code custody — what exists where

| Codebase | Location | Accessible to this session | State |
|---|---|---|---|
| Web app + backend definition | `FORZA-Industries/genesis-cycle-guide` (this repo) | ✅ | **Live.** Supabase URL + publishable key in `.env`; 10 migrations; RLS; all server-function logic |
| iOS native (SwiftUI) | `/Users/lucasvalenca_sf/genesyx_apple.V1.02` | ❌ not yet | Build 8 submitted; stub backend; mock auth |
| Android native (Kotlin) | `/Users/lucasvalenca_sf/genesyx-android` | ❌ not yet | Source of truth for parity |

**The deployed Supabase schema (already migrated, RLS-protected):**
`profiles` (display_name, avatar_url, partner_id, theme) · `cycle_settings` (1/user;
last_period_date, cycle_length 21–35, period_length 1–10) · `daily_logs` (unique
user_id+date; mood ≤20, energy enum, symptoms[], sleep_minutes 0–1440, water_ml 0–10000,
supplements[], notes ≤2000) · `ph_readings` (ph_value 4.5–9.0 1dp, recorded_at, notes ≤500)
· `partner_invites` (code, status, expires_at) · Storage bucket `avatars`.

**Schema parity note:** iOS keeps 7 local tables — the extra two (`clients`,
`partner_links`) stay local-only (their flags are OFF); everything else maps 1:1.

---

## Phase 0 — Get the iOS code into a shared session  ⏱ 10 min · BLOCKER for phases 1–3

- If `genesyx_apple` is on GitHub: provide `owner/repo` → it gets added to this session and
  all further guides edit the real files instead of `// INTEGRATE:` placeholders.
- If not: from the Mac —
  ```bash
  cd /Users/lucasvalenca_sf/genesyx_apple.V1.02
  git remote add origin git@github.com:<org>/genesyx-apple.git   # create repo first
  git push -u origin --all && git push --tags
  ```
- Same for `genesyx-android` if Android parity work is wanted later.

## Phase 1 — Compile in the real backend  ⏱ ~0.5 day

1. Add `supabase-swift` (SPM) to `project.yml`; `xcodegen generate`.
2. Inject credentials via build configuration, never hard-coded:
   ```
   // Config/Genesyx.xcconfig  (values from this repo's .env — same project)
   SUPABASE_URL = https:/$()/lfyjeoqiqtmtcwnpekmi.supabase.co
   SUPABASE_PUBLISHABLE_KEY = <publishable key — safe to embed; RLS protects data>
   ```
   Read them from Info.plist keys at startup.
3. `SupabaseBackend` constructs a real `SupabaseClient` when both keys are present;
   otherwise falls back to today's stubs (keeps simulators/CI working offline).

## Phase 2 — Real auth  ⏱ ~1 day   (pull forward from v1.2 — everything else depends on it)

- **Email/password**: `auth.signUp(email:password:data:[display_name])`,
  `auth.signIn(email:password:)`. Map "already registered" → sign-in attempt (web parity).
- **Sign in with Apple** (already wired natively): exchange the credential —
  ```swift
  let credential = authorization.credential as! ASAuthorizationAppleIDCredential
  let idToken = String(data: credential.identityToken!, encoding: .utf8)!
  try await supabase.auth.signInWithIdToken(
      credentials: .init(provider: .apple, idToken: idToken, nonce: rawNonce))
  ```
  Enable the Apple provider in Supabase Auth settings (Services ID + key).
- **Google**: same `signInWithIdToken(provider: .google, ...)` once a client ID exists.
- **Session**: supabase-swift persists + refreshes; `SessionRepository` reads from it.
- Mock auth becomes `#if DEBUG`-only. Release builds never accept unverified passwords.

## Phase 3 — Wire repositories to the live tables  ⏱ 1–2 days

Keep the local-first architecture and the three offline behaviours exactly as designed;
only the "mirror" calls become real:

| iOS repository | Table / call | Contract to honour |
|---|---|---|
| `CycleRepository` | `cycle_settings` upsert `onConflict: user_id` | 21–35 / 1–10 / date ≤ today; offline = quiet fail, server wins next read |
| `DailyLogRepository` | `daily_logs` upsert `onConflict: user_id,date` | offline = refuse save ("reconnect to save"); server wins next read |
| `PhRepository` | `ph_readings` insert/update/delete by id | offline = queue + retry/backoff; merge by id last-updated-wins; tombstoned deletes |
| `ProfileRepository` | `profiles` select/update; `avatars` bucket signed URLs | theme, display_name write-through |

All zod validation ranges from the web server functions are re-implemented client-side
(documented in `IOS_REBUILD_SPEC.md` §5.2); the DB + RLS is the final guard.

## Phase 4 — Edge Functions for the 4 service-role operations  ⏱ ~1 day · CAN START NOW

These need the service-role key, so they cannot ship inside the app. Their complete
TypeScript logic already exists in this repo and ports nearly verbatim:

| Edge Function | Port from | Behaviour to preserve |
|---|---|---|
| `accept-partner-invite` | `src/lib/partner.functions.ts` | validate pending/expiry/email/self, atomic accept, symmetric `partner_id` link |
| `unlink-partner` | `src/lib/partner.functions.ts` | symmetric clear, guarded by caller identity |
| `change-password` | `src/lib/account.functions.ts` | re-authenticate with current password before admin update |
| `delete-account` | `src/lib/account.functions.ts` | remote-first admin delete; local wipe only after success |

Deploy with `supabase functions deploy`; iOS calls them with the user's JWT
(`supabase.functions.invoke("delete-account")`). Only `delete-account` is needed for the
current feature set (`partnerInvites` is OFF; change-password is a parity fake) — build it
first, stub the rest until their flags flip.

## Phase 5 — Acceptance test: "a real app working"

- [ ] Create an account on iPhone → row appears in Supabase `auth.users` + `profiles`
- [ ] Sign in with Apple on iPhone → same
- [ ] Set cycle + log water + log a pH reading on iPhone → rows in `cycle_settings`,
      `daily_logs`, `ph_readings`
- [ ] Open the web app with the same account → identical data renders
- [ ] Airplane mode: daily log refuses politely; pH queues; back online → pH syncs
- [ ] Sign in on a second device → data pulls down
- [ ] Delete account on iPhone → user + rows gone server-side, app returns to Splash

When every box ticks, the iOS app is real end-to-end.

---

## Sequencing against the release roadmap

| When | Work | Depends on |
|---|---|---|
| Now (no iOS code needed) | Phase 4 Edge Functions (`delete-account` first) | this repo only |
| Now | Phase 0 — push/point me at the iOS repo | you |
| After v1.0 clears review | v1.0.1 + v1.1 as planned (local-only, no conflict) | — |
| v1.2 window (pull auth forward) | Phases 1–3, then Phase 5 acceptance | Phase 0 |

Total estimated connection effort once the iOS repo is accessible: **3–5 working days.**
