# Genesyx — Deployment Plan: iOS v1.1 (build 9)

> **The goal: ship iOS v1.1.** Decisions locked July 13, 2026:
> ① PR #3 merged → web fixes live to Android WebView users.
> ② Evening reminder **yields on weekly-push days** — the habit loop is: Sun Learn ·
> Mon pH · Tue evening reminder · Wed phase · Thu evening reminder · Fri nutrition ·
> Sat evening reminder. Exactly one push per day, every day has one touchpoint.
> ③ **Reuse the existing Supabase project** (`lfyjeoqiqtmtcwnpekmi`) — no genesyx-prod.

---

## Current state (verified July 13)

| Track | State |
|---|---|
| iOS v1.0 (build 8) | In App Store review since July 10 — **check App Store Connect daily** |
| WS1 streaks + WS3a Insights | ✅ done on `feature/streaks-v2`, 61 tests green |
| Contract Phases 1–4 (vectors, semantics, Weekly Summary, evening reminder) | ⚠️ status unconfirmed — awaiting iOS session report |
| WS3b real-data code | ✅ reference complete; integration + activation pending |
| Web contract-v2 parity + audit fixes | ✅ merged to main via PR #3 |
| Edge Functions | ✅ coded in `supabase/functions/`; deployment pending (human) |

## The path to build 9 (critical path in order)

1. **iOS session** → status report (prompt in §Prompts below). ⏳ NOW
2. **iOS session** → finish remaining contract phases with the locked decisions:
   - evening reminder yields on Sun/Mon/Wed/Fri (already the reference default);
   - `contractVersion: 2` + changelog in `tracking_test_vectors.json`;
   - all tests green, meaning-changed tests relabelled and listed.
3. **iOS session** → merge feature branches into a release branch off the frozen
   baseline (`claude/blissful-carson-wsdb54` @ c258921), bump `MARKETING_VERSION 1.1.0` /
   `CURRENT_PROJECT_VERSION 9` in project.yml, `xcodegen generate`, full suite green, push.
4. **Human (physical device, ~30 min)** — manual test checklist:
   - [ ] Reminder fires at the configured time (permission granted)
   - [ ] Denied path: toggle reflects OFF + "Enable in Settings" link works
   - [ ] Exactly ONE notification on a no-log day; NONE on a fully-logged goal-met day
   - [ ] Changing reminder time reschedules without duplicates
   - [ ] Streak grace across midnight (log yesterday, check flame this morning)
   - [ ] Calendar bounds + faded predictions on a fresh account
   - [ ] Weekly Summary renders: bars vs goal line, dots, deltas, narrative, empty week
   - [ ] Cycle setup: date field empty, Save disabled until chosen
5. **Human** → archive → validate → upload to TestFlight.
6. **⛔ GATE** — submit build 9 only after v1.0 clears review.
7. **Submit** with What's New: gentle evening reminder (configurable), weekly summary,
   smarter streaks, clearer calendar predictions.

## Parallel (not blocking build 9): WS3b activation on the EXISTING project

- Existing project already has: 5 tables + RLS + migrations, avatars bucket, live web
  users. Verification prompt in §Prompts.
- Remaining human checklist (§9 of the Master Doc, adjusted for reuse — ~30 min):
  - [ ] Auth → Providers → **Apple**: Services ID + SiwA key (Team M5L3MM75SG) — required
  - [ ] Auth → Providers → Google iOS client ID — optional, can ship without
  - [ ] `supabase functions deploy delete-account change-password accept-partner-invite unlink-partner`
  - [ ] Storage → create `learn` bucket (public read) — future content updates
  - [ ] `SUPABASE_URL` + `SUPABASE_PUBLISHABLE_KEY` env vars in the iOS build environment
  - [ ] Schema deltas for reuse: existing `profiles.theme` is 'dark'-default with a
        light/dark check — iOS wants system/light/dark and a `focus_mode` column; apply
        a small migration before activation (write it when WS3b integrates)
- Acceptance: two devices, one account — log on one, see it on the other; delete
  account, both gone.

## Dependencies summary

- **Apple review of v1.0** — external; gates SUBMISSION of build 9 only, not the work.
- **iOS session completion** — gates steps 3–5.
- **Human manual work** — device test (~30 min) + Supabase checklist (~30 min).
- Nothing in this repo blocks anything: docs, reference code, Edge Functions, and web
  fixes are all merged.
