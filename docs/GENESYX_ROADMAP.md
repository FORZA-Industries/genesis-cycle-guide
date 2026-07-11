# Genesyx — Complete App Roadmap (A to Z)

> The single source document for the Genesyx app: what it is, what's built, what ships when, and the brand contract that governs every feature. Compiled from the iOS build (build 8, `c258921`), the Android source of truth (`APP_INVENTORY.md`), and stored project context.
> Last updated: Saturday, July 11, 2026.

---

## A. PROJECT OVERVIEW

**Genesyx** is a calm, fertility-aware daily companion for women on the conception and fertility-prep journey. It helps a woman understand her cycle, eat in sync with it, track the small signals that matter (mood, energy, symptoms, urine pH, hydration), and learn what her data actually means — without pressure, without fake certainty, and without medical overclaiming.

- **Positioning:** a gentle, personalised companion for the conception and fertility-prep journey with educational fertility-wellness support.
- **Owner business:** Supplement Factory (mysupplementfactory.com) — the Genesyx client project runs under its Klaviyo account for email/marketing.
- **Brand:** the "G" logo mark (white stylised G with a dot) on a diagonal brand gradient: powder-blue `#AFDDEE` → `#8FA8D9` → electric-lavender `#8C7FC9` → electric-pink `#E0A9D6`.
- **Support email:** info@genesyx.co.uk · **Site:** genesyx.co.uk

---

## B. ARCHITECTURE

- **Dual native apps:** Android (Kotlin, Jetpack Compose) + iOS (SwiftUI). Not a cross-platform codebase — each is a faithful port of a shared spec.
- **Backend:** Supabase (Postgres, auth, realtime, storage, functions). Device is the source of truth; the server is a mirror.
- **Local-first:** every write lands on-device first; UI updates from local state. The app runs fully offline; remote calls are no-op stubs when no Supabase credentials are compiled in.
- **Repos:**
  - Android (source of truth): `/Users/lucasvalenca_sf/genesyx-android`
  - iOS: `/Users/lucasvalenca_sf/genesyx_apple.V1.02` (folder spelled genesxy, ends in xy)
- **iOS config:** Bundle ID `com.genesyx.app`, Team `M5L3MM75SG` (SF MEDIA & PR LTD), automatic signing, deployment target iOS 16, `xcodegen` from `project.yml`, `ITSAppUsesNonExemptEncryption: false`.

---

## C. THE BRAND CONTRACT (governs every feature)

The product is built to keep a specific promise to every woman:

1. **Patterns, not causes.** It can spot that low energy tracks bad sleep; it cannot say which caused which.
2. **No guaranteed-conception or sex-selection claims.** The Learn articles explicitly debunk these. No food/supplement/pH change is claimed to influence the sex of a future child.
3. **Tells her when to see a clinician.** Persistent, new, or frightening trends belong with a professional — and her logs make that conversation better.
4. **Respects her time.** The daily loop is minutes, not evenings. Boring consistent entries beat detailed abandoned ones.
5. **Keeps her data.** Local-first, syncs when signed in, never loses an entry to a bad connection (pH queues/retries; logs refuse offline saves so the server never overwrites them).
6. **Calm, non-nagging tone.** Streaks don't shame. Notifications (when shipped) are weekly nudges, not daily buzzes. Missing a day costs almost nothing.

Every feature, prompt, and article is measured against this contract.

---

## D. FEATURE SET (A to Z, current state)

### D1. Onboarding & entry
- **Splash** — brand lockup, "Start Your Personalised Quiz" / "Sign in", educational-not-medical footnote.
- **Onboarding Intro** — three benefit cards (cycle, nutrition, insights).
- **5-question Quiz** — stage, cycle regularity, supplements, baby's sex, support need. Two "Did you know?" modals. Answers deliberately discarded (no false personalisation).
- **Readiness Summary** — three insights + three next steps; routes to Auth ("Register / Login to continue").
- **Waitlist** — email capture for a free nutrition guide; email validated then discarded.
- **Auth gating (full parity, v1.0)** — dashboard reachable only through an account. Both onboarding exits → Auth → Home (stack cleared, back can't return to gate).

### D2. Core tracking
- **Cycle phase engine** (`CycleEngine`) — derives phase, cycle day, fertile window, ovulation day, next period from `CycleSettings` (last period + lengths). Nothing stored; pure derivation.
- **Cycle settings** — last period date, cycle length, period length. Local truth, written through to Supabase.
- **Daily log** — mood, energy, symptoms (incl. custom), sleep, water, supplements, notes. All optional. Offline: refuses to save ("reconnect to save"). Local truth, backend optional.
- **Hydration tracking + streak** — facet of the daily log. Streak = consecutive days with any water logged.
- **Log history** — per-day cards merging daily logs + pH readings, newest first.

### D3. Urine pH tracking
- Readings stored `{value rounded to 1dp, timestamp, notes}`, range 4.5–9.0 enforced. Status: acidic <6.0, optimal 6.0–7.5, alkaline >7.5.
- Offline: queues + retries with backoff. Deletions tombstoned. Conflict resolution by last-updated.
- Guest readings never sync (known dormant behaviour).
- Present on Track and Nutrition (Nutrition placement is deliberate — hydration context).

### D4. Hydration Coach (in-app, shipped v1.0)
- Time-of-day-aware coaching card at the top of Nutrition. Names the part of day ("Morning —", "Midday —", etc.) + action.
- Phase-aware context line. "Why hydration?" explainer (debunks the eight-glass myth). Always-visible daily streak (de-pressured, no shame at zero).
- In-app only — no notifications, no permissions.

### D5. Learn section (shipped v1.0)
- 6th tab (custom bottom bar so all 6 stay visible — native TabView collapses a 6th tab into "More").
- 16 articles total: 10 original + 6 GUIDES (how-to manuals), all verbatim, bundled (not fetched).
- Typed body blocks: heading/paragraph/bulletList/callout. No Markdown dependency.
- Search (title/excerpt/tags), 6 category chips, featured hero, related (replace not stack), share (title + excerpt + site root — no per-article URL).
- Medical disclaimer pinned to exactly the articles making health claims.
- Content-safety tests: banned-phrase scan over all visible strings, CTA-target guard, library integrity, disclaimer pinning, featured check.

### D6. Insights (all real data, shipped v1.0)
- **Urine pH** — current value, status colour, trend badge, 7-/30-day averages, insight + recommendation.
- **Hydration** — 7-day bar chart from logged water, goal line at 2.4L, 7-day total + days-on-goal tiles, derived insight.
- **Cycle regularity** — cycle length vs typical 21–35 day range (honest single-cycle; multi-cycle is v1.2).
- **Symptom patterns** — 4×7 heatmap (28 days) from logged symptoms, top-symptom insight, "early days" guard when data thin.
- **Ovulation** — cycle timeline (period/fertile/ovulation/today markers), always labelled "predicted" (estimated as cycleLength − 14, never confirmed).
- The three Android mock charts (hardcoded bars, sine-wave heatmap) were replaced with real data; "Nutrition consistency" dropped (Hydration covers it honestly).

### D7. Account & profile
- Email/password auth (Supabase when configured, else local mock that doesn't verify passwords).
- Google sign-in (reports "not configured" without a client ID).
- **Sign in with Apple** (wired, `ASAuthorizationAppleIDCredential` — required by Apple when Google is offered).
- Display-name editing, theme (System/Light/Dark, persisted), focus mode (prep/pregnancy).
- Account deletion: remote-first (server deletes, then local wiped; failure leaves user signed in).
- Deep link `genesyx://invite/{code}` + Universal Links.

### D8. Feature flags (compile-time, `FeatureFlags`)
| Flag | Default | Controls |
|---|---|---|
| `phTracking` | ON | pH tracking surfaces + sync |
| `adminClients` | OFF | Client management (unreachable) |
| `partnerInvites` | OFF | Partner invites/linking (deep link stays registered; placeholder partner) |
| `pushNotifications` | OFF → ON in v1.1 | Push notifications system |

---

## E. SCREEN INVENTORY (19 destinations)

Splash · Onboarding Intro · Quiz · Readiness Summary · Waitlist · Home · Track · Nutrition · Insights · Learn · Learn Search · Article Detail · Log · Log History · Pregnancy (placeholder) · Profile · Auth · Invite · Clients (gated off).

Six appear as a custom bottom bar: Home · Track · Nutrition · Insights · Learn · Profile.

---

## F. DATA & SYNC

- **Local store:** 7 per-user tables — cycle settings, daily logs, pH readings, profile, clients, partner invites, partner links. Scoped per user.
- **Preferences:** session, theme, push toggle, focus mode, onboarding-complete, Learn-intro-dismissed, hydration anchor.
- **What syncs:** profile, cycle, daily logs, pH — only when Supabase credentials are compiled in.
- **Offline behaviour (three distinct, by design):**
  - Daily logs refuse to save offline (block + message).
  - pH readings queue and retry with backoff.
  - Cycle settings fail quietly (no retry; next sign-in pulls server copy).
- **Conflict resolution:** pH merges by id, prefers last-updated, never overwrites unsynced local edits. Cycle + daily logs let the server copy win on next read.
- **Deletion:** account deletion remote-first; pH deletions tombstoned.

---

## G. CURRENT RELEASE STATE (July 11, 2026)

### v1.0 — SUBMITTED (build 8)
- Branch: `claude/blissful-carson-wsdb54`, commit `c258921`.
- Learn section + 6-tab nav + 16 articles, all 20 image assets, G-logo app icon, Hydration Coach, real-data Insights, GUIDES, auth gating, Sign in with Apple, quiz fix.
- 60/60 tests green. Three App Store blockers fixed (quiz gender fact, auth gating, SiwA).
- Archive validated and uploaded Friday July 10; **status pending App Store review (24–48h+).**

### Parked branches
- `feature/notifications` (`3365223`) — weekly nudges + streak milestones. 90% built.
- `wip/v1.0.1-extras` (`0f696c3`) — scope-crept WIP: 3 pH articles + unfinished Track hydration card. Needs a decision Monday (finish or drop).
- `feature/hydration-coach`, `feature/learn-parity` — merged into v1.0.

---

## H. ROADMAP BY VERSION

### v1.0 — DONE (in review)
Learn + Hydration Coach + real-data Insights + GUIDES + auth gating + SiwA + build 8.

### v1.0.1 (quick, Monday–Tuesday)
- **Resolve `wip/v1.0.1-extras`:** finish the Track pH card (log pH from Track, not just Nutrition) + ship the 3 pH articles into the Learn library. Or drop if it creeps.
- Small polish only.

### v1.1 (this week)
- **Notifications — finish, test on device, ship.** Four weekly pushes: LEARN (primary, Sunday), pH (Monday), phase (Wednesday, dynamic copy), nutrition (Friday). 1-week + 2-week streak milestones (fire once, reset on break, non-guilt). Pre-prompt before the system dialog. Deep-link routing via `TabRouter`. Gate behind `FeatureFlags.pushNotifications`, build 9.
- **No separate hydration push** — the in-app Hydration Coach handles daily water; a push would duplicate and nag.

### v1.2 (next 2–4 weeks)
- **Real cycle history** — store per-cycle history so Cycle regularity becomes a genuine multi-cycle chart (currently honest single-cycle only).
- **Supplement plan personalisation** — phase + data-aware suggestions via a `SupplementPlanService` (the nutrition nudge is already structured to allow this).
- **Real Supabase auth** — replace the local-only mock with real credentials so accounts actually persist across devices.
- **Real Insights polish** — symptom heatmap trends, ovulation confidence indicators.

### v2.0 (larger bets)
- **Pregnancy mode (real)** — due date entry, trimester tracking, post-conception content track (currently a placeholder).
- **Partner invites (real)** — actual partner linking + shared data (currently placeholder partner "Your partner").
- **Premium tier / billing** — "PREMIUM" is currently a label only; build real subscription + entitlements.
- **Client management (admin)** — currently gated off; build for practitioner use case.

---

## I. BUSINESS & MARKETING

- **Owner:** Supplement Factory (mysupplementfactory.com).
- **Marketing stack:** Klaviyo (email), Google Ads, TikTok Shop mentioned in the user's toolkit.
- **Market research in progress:** competitor benchmarking, audience research, message testing, positioning validation.
- **Monetisation:** currently free; Premium tier is a v2.0 build (label only today).
- **App Store / Play:** near submission-ready on both stores; iOS v1.0 submitted July 10, 2026.

---

## J. DEVELOPMENT WORKFLOW

- **Tooling:** Xcode + xcodegen (`project.yml` → `Genesyx.xcodeproj`), Android Studio, SwiftPM for `GenesyxCore`, GitHub.
- **AI-assisted dev:** Claude Code (extensive), Codex, the Xcode Claude agent. Prompts are written as detailed build briefs (like the Insights/Notifications prompts) and handed to the agent.
- **Testing discipline:** pure logic files (`*Logic.swift`) + unit tests for every derived insight; content-safety (banned-phrase) tests for all user-facing copy; 60+ tests green.
- **Branch hygiene:** feature branches off the release baseline; `xcodegen generate` after merges (don't hand-merge `project.pbxproj`); the release baseline stays frozen during feature work.

---

## K. THE HONESTY STANDARD (content-safety)

All user-facing copy — articles, insights, notifications, coach lines, quiz facts — must pass the banned-phrase scan:
`"alkaline diet"`, `"balance your ph"`, `"boy or girl"`, `"sex selection"`, `"gender sway"`, `"sway the sex"`, `"choose the sex"`, `"detox"`, `"flush toxins"`.

No claim may state that a supplement, food, or pH change can influence the sex of a baby or guarantee conception. Ovulation is always "predicted," never "confirmed." Thin data is called thin ("early days — too soon to read patterns"). "Typical range" not "normal"; "worth a clinician" not "abnormal." This is enforced by tests, not just good intentions.

---

## L. ONE-LINE STATUS

v1.0 (build 8) is submitted and pending App Store review. Monday: ship Notifications v1.1 (build 9) after v1.0 clears review, resolve the `wip/v1.0.1-extras`, then begin the v1.2 real-data-depth work (cycle history, supplement personalisation, real Supabase auth). Pregnancy mode, partner linking, and Premium billing are the v2.0 bets.
