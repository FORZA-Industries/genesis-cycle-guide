# Genesyx — iOS Rebuild Specification & App Analysis

> **Purpose of this document**: a complete, screen-by-screen and logic-by-logic description
> of the current Genesyx app (Android / web build) so it can be rebuilt natively for iOS.
> It also contains a duplicate/inconsistency audit of the current codebase, the spec for the
> **new "Learn" tab**, and a phased rebuild roadmap.
>
> Sources analysed:
> 1. This repository (`TanStack Start + React 19 + Supabase + Capacitor` — the Android app is a
>    hosted WebView shell loading `https://genesis-cycle-guide.lovable.app`).
> 2. 15 production screenshots from the Android build (July 2026).
>
> ⚠️ The deployed build shown in the screenshots is **ahead of / different from this repo
> snapshot** in a few places. Every such delta is flagged with **[DELTA]** so nothing is lost
> in the rebuild.

---

## 1. Product overview

**Genesyx** ("Genesis Cycle Guide") is a calm, premium **fertility-preparation companion**:

- **Cycle awareness** — period/phase prediction from last period date + cycle length.
- **Daily wellbeing logging** — mood, energy, symptoms, sleep, water, supplements, notes.
- **Urine pH tracking** — readings 4.5–9.0 with status bands, chart, history, insights.
- **Phase-aware nutrition** — focus foods per cycle phase, hydration goal, supplement plan.
- **Insights** — patterns computed from the user's real logs.
- **Partner linking** — email invite → shared journey.
- **Pregnancy mode** — a second app mode ("Current Focus": Fertility Prep ↔ Pregnancy).

**Positioning / tone**: "gently guided", pastel palette (electric lavender `#4D4DAA` primary,
powder pink/blue, baby lavender), rounded 24–28 px cards, soft shadows, serif-ish display font
for headings, uppercase tracked micro-labels. Light + dark theme.

**Backend**: Supabase (Postgres + Auth + Storage + RLS). All reads/writes go through
TanStack server functions with zod validation — on iOS these map 1:1 to direct
`supabase-swift` calls (the validation rules below must be re-implemented client-side or kept
behind an API).

---

## 2. Navigation architecture

The app is a single-activity shell with two layers:

### 2.1 Flow state machine (pre-app + overlays)

```
splash → intro → quiz (4 steps) → results → waitlist(account creation) → app
   ↘ Sign in → /auth ─────────────────────────────────────────────────↗
app ─ "Log today" → log (full-screen overlay, back to app)
app ─ "Pregnancy pathway" → pregnancy transition screen → pregnancy home (mode switch)
```

- Persisted flag `genesyx:openApp` (localStorage): once the user has entered the app (or is
  authenticated), the splash/quiz funnel is skipped on next launch.
  **iOS**: `UserDefaults` bool + Supabase session check.
- Guest mode is allowed everywhere; any write action prompts a "Sign in required" toast with a
  Sign-in action button (`showSignInRequired`).

### 2.2 Bottom tab bar (5 tabs, current)

| Tab | Icon (lucide) | Screen |
|---|---|---|
| Home | `Home` | Daily dashboard (prep or pregnancy variant) |
| Track | `CalendarDays` | Cycle calendar + phase + pH tracker |
| Nutrition | `Leaf` | Hydration, focus foods, supplements, articles |
| Insights | `BarChart3` | Patterns from real data |
| Profile | `User` | Account, partner, settings, legal |

**New version requirement**: add a **Learn** tab (see §8). Recommended final tab set:
`Home · Track · Nutrition · Learn · Insights · Profile` is too many (6) — recommendation:
**Home · Track · Learn · Insights · Profile**, moving Nutrition inside Learn *or* keeping
Nutrition and folding Insights' entry into Home. Decision needed; default proposal in §8.

### 2.3 Standalone routes (outside tabs)

| Route | Purpose |
|---|---|
| `/auth` | Sign in / sign up (email+password, Google OAuth, resend confirmation, password reset) |
| `/reset-password` | Set new password from email link |
| `/invite/$code` | Partner invite acceptance |
| `/privacy`, `/terms`, `/health-disclaimer`, `/support` | Legal/help static pages |

---

## 3. Screen-by-screen specification

### 3.1 Splash / Welcome
**File**: `screens/Onboarding.tsx → SplashScreen` · Background image `genesyx-splash-bg`.

- Centered brand logo (64 px) top.
- Micro-label: `STEP INTO THE FUTURE OF FERTILITY` (lavender, tracked uppercase).
- H1 (32 px display): "Feel informed, supported and ready for your conception journey."
- Subcopy: "A premium, gently-guided companion blending cycle awareness, nutrition and supplement support."
- Primary CTA (56 px, rounded-16): **Start Your Personalised Quiz** →
- Text button: **Sign in** → `/auth`.
- Footer caption with ✨ icon: "Educational fertility wellness support, tailored to you."

**iOS notes**: native `LaunchScreen` + this as first SwiftUI view; Capacitor splash config
(2 s, `#171614` bg) is replaced by native launch storyboard.

### 3.2 Onboarding intro ("benefits")
**File**: `OnboardingIntro`.

- Back chevron (top-left, 44 pt target).
- H1: "Your fertility preparation, gently guided" + subcopy.
- 3 benefit cards (icon tile 48 px, tinted lavender/blue/pink):
  1. Heart — "Understand your cycle" / "Recognise patterns with calm, clear guidance."
  2. Leaf — "Support fertility nutrition" / "Cycle-aware food and supplement focus."
  3. BarChart — "Receive tailored insights" / "Gentle observations based on your tracking."
- Bottom-pinned **Continue**.

### 3.3 Quiz (4 questions)
**File**: `screens/Quiz.tsx`, data in `mockData.quizQuestions`.

Layout: back button + linear progress bar + `n/4` counter; question (26 px), helper text,
4 single-select option rows (radio-style check circle on right, 60 pt min height);
bottom **Continue** (disabled until selection). Last step label: "See My Summary".

| id | Question | Options (id → label) |
|---|---|---|
| `stage` | Where are you in your conception journey? | exploring / preparing / trying / support |
| `cycle` | How regular does your cycle usually feel? | very / mostly / irregular / unsure |
| `supplements` | Are you currently taking fertility supplements? | yes / some / no / guidance |
| `support` | What would you like the most support with? | nutrition / tracking / supplements / emotional |

- The `cycle` question has an attached **"Did you know?"** modal (Sparkles icon) shown after
  answering, before advancing: *"Only about 13% of cycles are exactly 28 days. A healthy cycle
  can range from 21 to 35 days…"*.
- After step 4: fake-loading screen (~1.6 s) with animated brand orb, "Preparing your
  personalised summary…".
- Answers are held in memory only (`Record<string,string>`) — **not persisted**. [GAP] On iOS,
  persist quiz answers to the profile so personalisation survives restarts.

### 3.4 Quiz results ("readiness summary")
**File**: `screens/Conversion.tsx → QuizResults`.

- Badge: `YOUR READINESS SUMMARY`; H1 "A thoughtful starting point".
- Card of 3 personalised rows (icon + label + value). Personalisation logic:
  - **Cycle awareness** from `cycle`: very → "Your cycle is steady — easy to build a tracking
    rhythm"; mostly → "…tracking will reveal your fertile window"; irregular → "…daily logging
    will surface patterns"; else → "We'll help you learn your unique cycle rhythm".
  - **Nutrition focus** from `support`: nutrition → "Folate, omega-3, zinc, and iron-forward
    meals"; else "Folate, omega-3, and zinc-rich foods".
  - **Daily support** from `supplements`: yes → "Your routine is on track…"; some → "We'll
    suggest the few additions that matter most"; no → "A simple starter routine — folate
    first"; else "Personalised supplement guidance, step by step".
- "Suggested next steps" tinted card, 3 checked bullets (also personalised by `cycle` and `support`).
- CTA: **Create account & unlock guide** → account-creation screen; secondary "Continue as guest".

### 3.5 Account creation (post-quiz)
**File**: `Conversion.tsx → WaitlistScreen` (name is legacy; it is a real sign-up now).

- Mail icon tile, label `SAVE YOUR JOURNEY`, H1 "Create your account".
- Fields: Name (optional, ≤80), Email (validated), Password (min 8, max 72).
- Supabase `auth.signUp` with `display_name` metadata; if "already registered", it silently
  attempts sign-in with the same credentials; if email confirmation is required → "Check your
  email" success state with **Continue to app**.
- "or" divider → **Continue with Google** (OAuth via Lovable wrapper → native
  `SignInWithApple` should be ADDED on iOS; App Store requires Apple sign-in if Google exists).
- "Skip for now — continue as guest"; privacy caption with lock icon.

### 3.6 Auth screen (`/auth`)
Sign in / sign up toggle, email+password, Google OAuth, resend-confirmation and
reset-password helpers, redirect to app when session exists. Same validation as above.

### 3.7 Home (Fertility Prep mode) — screenshot 1
**File**: `screens/Home.tsx`. Background: photo/gradient image + 5 floating blurred pastel
orbs (CSS keyframe float animations — replicate with SwiftUI `TimelineView`/`Animation`).

Top bar: greeting by local hour (<12 "Good morning", <18 "Good afternoon", else
"Good evening"), display name (26 px), avatar-initial button → dropdown menu:
- (guest) Sign in or create account
- Profile (switches to Profile tab)
- Cycle setup (opens Cycle Settings dialog)

Guest banner (only when signed out): "Sign in to save your journey / Cycle setup, logs, pH
readings, and profile sync." → `/auth`.

**Hero card (Today)** — tap opens Cycle Settings dialog:
- No cycle configured: label `TODAY`, title "Set up your cycle", sub "Add your last period
  date to get personalised insights."
- With cycle: label `DAY {n} · {PHASE/FERTILE WINDOW}` and phase-specific hero copy + 2–3 tag
  chips (see §4.2 copy tables).
- Loading state: shimmer skeleton card.

**Today's focus card**: phase-specific focus food suggestion (title + description).
If quiz answer `support == "nutrition"`, title gets suffix " (your priority)".
Empty state: "Complete your cycle setup to see focus foods."

**Stats row** (2 tiles):
- Hydration: `{waterMl/1000}L / 2.4L` from today's log (— when 0).
- Streak: consecutive days logged incl. today (`getStreak`, — when signed out).

**CTA**: `+ Log today` → Log overlay. Link "Preview pregnancy pathway →" → Pregnancy
transition screen. *(Present in screenshot; in repo code the link is currently not rendered —
the flow exists via `flow === "pregnancy"`.)* **[DELTA]** Keep it: screenshot shows it under
the Log button.

### 3.8 Track — screenshots 2, 3, 15
**File**: `screens/Track.tsx`.

Header: current month title ("July 2026"), subtitle `Cycle {k} · Day {n}` (or "Set up your
cycle"), pencil edit button → Cycle Settings dialog.

**Calendar card**:
- Month nav (‹ month ›), weekday header `S M T W T F S` (Sunday-first).
- Empty state (no cycle): dashed card "Add your cycle / Tell us when your last period started
  to see your phases here." → opens Cycle Settings.
- Day cells (rounded-12, aspect-square) coloured by predicted day type:
  - `period` — powder-pink tint
  - `follicular` — plain card + border
  - `fertile` — powder-blue tint
  - `ovulation` — solid primary + ring
  - `luteal` — baby-lavender tint
  - today — 2 px foreground ring
- Tapping a day opens a **day detail dialog**: weekday+date title, `Day n · Phase · Fertile`,
  body: past day → "No log yet for this day. Open Log to add your mood, energy and symptoms.";
  future/today → "Predicted: {phase} · Fertile window".
  [GAP] The dialog does not surface an existing saved log for past days — iOS should fetch
  and display the actual log for that date.
- Legend grid (Period / Fertile window / Ovulation / Luteal).

**Current phase card**: label `CURRENT PHASE`, phase name (22 px), body: fertile → "You're in
your fertile window. Stay hydrated and prioritise rest."; else "About {d} days until your next
period."; unset → "Set up your cycle to see today's phase."

**CTA** `+ Add to today's log` → Log overlay (same destination as Home's "Log today").

**pH tracker card** (shared component, see §3.13).

### 3.9 Nutrition — screenshot 4
**File**: `screens/Nutrition.tsx`.

Header: label `TODAY · {PHASE}` (or `SET UP YOUR CYCLE`), H1 "Your nutrition focus",
phase description line (per-phase strings, §4.3).

**Hydration card**: big value `{x.x} / 2.4 L`, − / + steppers (±200 ml, clamp 0–10 000),
progress bar, caption `{remaining}ml to go` / "Target reached — nice work".
Writes are debounced 500 ms → `upsertDailyLog({waterMl})`. Guests get sign-in toast.

**pH tracker card** (same shared component as Track — see duplication audit §6).

**Focus foods card**: phase-driven expandable list (3–4 rows): coloured dot, name, short
description; tap expands long description (accordion, only one open). Full food copy per
phase lives in `PHASE_FOODS` (period/follicular/ovulatory/luteal × 3–4 items, each with
`shortDesc` + `expandedDesc` — port verbatim).

**Supplement plan card**: pill icon, "Your supplement plan", "Folate, Omega-3, Vitamin D, and
Zinc — taken with breakfast.", avatar cluster `F O D Z`, caption "3 of 4 taken today"
(**hard-coded — fake**, see §6), **Review Plan** button → dialog listing:
Folate 400–800 mcg · Omega-3 (DHA/EPA) · Vitamin D 600–1000 IU · Zinc 8–11 mg, each with a
one-line benefit.

**Learn more section**: 3 article rows (title + "n min read") → currently opens a dialog with
one generic paragraph (placeholder). Articles: "Eating for your luteal phase" (4 min),
"How hydration shapes fertility" (3 min), "A gentle guide to supplements" (6 min).
→ This whole section **moves to the new Learn tab** (§8).

### 3.10 Insights — screenshots 5, 6 vs repo code **[DELTA — two versions]**

**Deployed build (screenshots)** shows:
1. **My logs** row card ("See everything you've tracked" →) — leads to a **My Logs screen**
   (screenshot 7): title "My logs", subtitle "Everything you've tracked, newest first.",
   day cards listing Mood/Energy/Symptoms/Water key-value rows.
2. **Urine pH** card ("Open tracker", "No pH readings yet…").
3. **Cycle regularity** — bar chart "Last 7 cycles" (C1…C7) + reassurance caption.
4. **Symptom patterns** — 7×5 heat-map grid + insight caption ("Fatigue tends to ease in the
   second half of your cycle…").
5. **Nutrition consistency** — 7-day bar chart (M…S) + caption ("You've stayed close to your
   hydration goal four days this week…").

**Repo code** (`screens/Insights.tsx`) renders instead, from **real data** (30-day window):
1. `PhInsightsSection` (see §3.13.3).
2. **Hydration** — last-7-days bar chart from `listDailyLogs`, avg caption.
3. **Top symptoms** — top-6 frequency bars from logged symptoms.
4. **Logging consistency** — "You've logged N days out of the last 30…".
Sign-out state: sparkles icon + "Sign in to see your insights". Loading: skeletons.

**iOS spec**: build the repo (real-data) version as the base, **plus**:
- Add the **My logs** entry + screen (from screenshots; back arrow, newest-first day cards;
  data = `listDailyLogs(sinceDays: 365)` grouped by date).
- Keep "Cycle regularity" and "Symptom patterns" as *future* cards once ≥2 cycles of data
  exist (the screenshot versions render mock arrays `insightBars`/heat-map — do not ship
  fake data; gate on real data availability).

### 3.11 Log Today (full-screen overlay)
**File**: `screens/Log.tsx`. Header with back chevron, "Log Today / Quick notes about how
you're feeling."

Sections:
- **Mood** — 4 tiles: Great(Heart) / Good(Smile) / Okay(Meh) / Low(Frown); single-select.
- **Energy** — segmented control: low / normal / high.
- **Symptoms** — chip multi-select from defaults [Headache, Fatigue, Cramps, Nausea,
  Bloating, Acne, Backache, Tender breasts] + custom "Add" chip → inline text input
  (Enter commits, Esc cancels, blur commits). Custom symptoms merge into the chip list.
- **Mini-cards grid (2×2)**:
  - Sleep → dialog with Hours/Minutes number inputs (0–24 / 0–59), stored as minutes.
  - Water → dialog with ml number input (0–10 000, step 100).
  - Supplements → dialog with 4 check rows: **Folic acid, Vitamin D, Iron, Omega-3**
    (⚠ inconsistent with Nutrition's F/O/D/Z plan — see §6).
  - Nutrition → static "On track" (no action). [GAP] dead tile; either wire or drop.
- **Notes** — free textarea "A short note for future you…" (≤2000).
- **Save log** button: requires session (else sign-in toast). Saves via
  `upsertDailyLog` (upsert on `user_id+date`, local-timezone `YYYY-MM-DD`), success toast,
  closes overlay. Loads today's existing log on open and pre-fills everything.

A tiny pub/sub (`emitLogChange`) refreshes Home/Insights/etc. after save — on iOS use a
shared observable store instead.

### 3.12 Cycle Settings dialog
**File**: `CycleSettingsDialog.tsx`. Fields:
- "First day of your last period" — date picker, max = today.
- "Cycle length (days)" — 21–35 (default 28).
- "Period length" — 1–10 (default 5).
Validation mirrors server zod schema; save → `upsertCycleSettings` (single row per user),
toast "Cycle updated". Guests → sign-in toast.

### 3.13 pH tracking suite

#### 3.13.1 PhTrackerCard (embedded on Track *and* Nutrition)
- Header `TRACK YOUR PH / Urine Tracker` + **Log pH** pill button.
- **Latest reading** tile: droplet icon tinted by status, value (1 dp), date · time,
  status badge (ACIDIC/OPTIMAL/ALKALINE).
- Range segmented control: 7d / 30d / 90d / All.
- Line chart (recharts → Swift Charts): X time, Y domain 4.5–9.0 with ticks
  4.5/6.0/7.5/9.0, three tinted reference bands (acidic 4.5–6.0, optimal 6.0–7.5, alkaline
  7.5–9.0), monotone line + dots, tooltip with datetime + value.
- Empty states: signed-out → "Sign in to track your pH"; no data → "No readings yet / Log
  your first pH" (+ button — this is the duplicate CTA visible in screenshot 3).
- Legend: Acidic <6.0 · Optimal 6.0–7.5 · Alkaline >7.5.
- **History** list (newest first, scrolls, max-height): value tile, date·time, status
  ± note; tap → edit dialog.
- Screenshot caption "pH entries are stored on this device for now." is **stale copy** —
  the repo persists to Supabase. Remove on iOS (or implement offline-first cache honestly).

#### 3.13.2 PhLogDialog — screenshot 15
- Title "Log pH reading" / "Edit pH reading"; description "Track your urine pH from 4.5 to 9.0."
- Big value display (5xl, coloured by status) + status badge.
- − / + buttons (±0.1) around a slider (4.5–9.0, step 0.1, clamp + round to 1 dp).
- "When" — datetime picker (defaults to now).
- Notes (optional, ≤500) "Hydration, meal, time of day…".
- Footer: Delete (edit mode only) · Cancel · Save. Create/update/delete via server fns.

#### 3.13.3 PhInsightsSection (Insights tab)
- Card "Urine pH" + "Open tracker →" (switches to Track tab).
- Current value + status badge + trend arrow vs previous reading (±0.1 threshold).
- Stats: 7-day avg, 30-day avg (2 dp).
- Insight + recommendation derived from 7-day average status (needs ≥2 readings in 7 days):
  - acidic → "…trending acidic this week." / "Try more leafy greens, citrus, and steady hydration…"
  - alkaline → "…trending alkaline this week." / "Balance with whole grains, lean protein, reduce excess mineral water."
  - optimal → "…sitting comfortably in the optimal range — lovely work." / "Keep your current hydration and meal rhythm…"
  - else → "Log a few more readings and we'll share gentle observations."

### 3.14 Profile — screenshots 8, 10, 11 vs repo **[DELTA — two versions]**

**Repo code** (`screens/Profile.tsx`):
- Header "Profile"; avatar card: photo upload (image picker → Supabase Storage `avatars`
  bucket, signed URL), display name, email (or "Sign in to sync your data").
- **Partner section** (§3.15).
- **Account**: Edit name (dialog, ≤80, updates auth metadata + profiles row);
  Change password (dialog: current + new + confirm, min 8; server re-authenticates with
  current password before admin update).
- **Appearance**: Dark Mode switch (theme persisted in localStorage `gx-theme` + `profiles.theme`).
- **About**: Privacy policy, Terms of service, Health disclaimer, Help & support (static routes).
- **Log out** (destructive-tinted card button) / **Delete account** (outlined destructive →
  confirm alert → admin delete + sign out → `/auth`).

**Deployed build (screenshots)** additionally/differently shows:
- **PREMIUM** badge on the profile card. [DELTA — no premium/entitlement logic in repo;
  iOS must add an entitlement flag + StoreKit if premium is real.]
- **CURRENT FOCUS** segmented toggle: **Fertility Prep | Pregnancy** — switching to Pregnancy
  opens the pregnancy transition screen (screenshots 9, 12/13). In repo the mode switch only
  exists via Home flow state; put the toggle on Profile as the deployed build does.
- **TRACKING** group: Personal Details ›, Health Profile ›, Tracking Preferences ›
  (in repo these exist only as `profileMenu` mock data — destination screens are **missing**;
  spec them as simple forms: personal details = name/DOB/height/weight; health profile =
  conditions/medications; tracking preferences = default cycle/period length, water goal,
  reminder toggles).
- **PREFERENCES**: Push Notifications toggle. [DELTA — no push in repo; iOS: APNs +
  permission flow + reminder scheduling.]
- **THEME**: 3-way segmented System / Light / Dark (repo has only a binary toggle; iOS should
  ship the 3-way version incl. "System").
- **ABOUT**: Privacy & Data ›, Help & Support › (2 rows vs repo's 4 — keep repo's 4 legal
  pages, screenshot labels are a condensed variant).

### 3.15 Partner section (inside Profile)
**File**: `PartnerSection.tsx` + `partner.functions.ts` + `/invite/$code` route.

States:
- Signed out → "Add your partner / Sign in to invite a partner…" + Sign in button.
- No partner → heart header "Add your partner", copy "Send an invite — when they accept,
  you'll be linked and can share your journey.", email input + **Send invite**.
  - Validations: valid email, not your own email (checked client & server).
  - Creates `partner_invites` row with 16-char code; toast "Invite created — copy the link to
    share"; pending invites listed with copy-link (`{origin}/invite/{code}`) and revoke buttons.
- Linked → partner avatar/initial, name, "Linked partner", **Remove** (confirm) → unlinks both
  profiles (service-role, symmetric `partner_id` clear).

Invite acceptance (`/invite/$code`): requires sign-in with the invited email; validates
pending status, expiry, not-self; atomically marks accepted and cross-links both
`profiles.partner_id`. Errors surfaced: not found / already used / expired / wrong email.

**iOS**: universal link `https://…/invite/{code}` → app route; share sheet for the invite link.

### 3.16 Pregnancy transition — screenshots 9, 12, 13
**File**: `screens/Pregnancy.tsx → PregnancyTransition`.

- Back arrow; heart tile; H1 "Support for the next chapter"; copy "Whenever you're ready,
  Genesyx can gently shift to support you through pregnancy — at your pace."
- Feature cards: Trimester tracking ("Week-by-week guidance with calm, clear updates."),
  Prenatal nutrition ("Updated focus foods and supplement guidance.").
- CTA **Switch to pregnancy mode** (requires sign-in; toast "Switched to pregnancy mode") /
  "Not yet, keep tracking".

### 3.17 Pregnancy Home (mode = pregnancy)
`PregnancyHome`: header "Pregnancy mode / {name}"; hero card "Week-by-week / Gentle prenatal
guidance" (asks for due date — **due-date capture not implemented** [GAP]); stat tiles
Trimester (—) and Focus (Folate); "Prenatal essentials" checklist card (Folate 400–800 mcg,
Vitamin D 600 IU, Omega-3 DHA 200 mg, hydration/rest); **Switch back to fertility prep**.
Mode is **not persisted** [GAP] — persist `profiles.mode` on iOS.

### 3.18 Static/legal screens
`/privacy`, `/terms`, `/health-disclaimer`, `/support` — plain scrollable text pages, linked
from Profile → About. Reproduce as local content or webviews.

---

## 4. Core business logic (port exactly)

### 4.1 Cycle engine (`src/lib/cycle.ts`)
All date math is **local-timezone, date-only** (`YYYY-MM-DD` parsed as local; never UTC ISO).

```
dayOfCycle    = ((daysBetween(lastPeriodStart, target) mod cycleLength) + cycleLength) mod cycleLength + 1
ovulationDay  = cycleLength − 14
fertileWindow = ovulationDay − 5 … ovulationDay + 1   (inclusive)
phase         = dayOfCycle ≤ periodLength   → period
                dayOfCycle == ovulationDay  → ovulatory
                dayOfCycle <  ovulationDay  → follicular
                else                        → luteal
daysUntilNextPeriod = cycleLength − dayOfCycle   (0 when dayOfCycle == 1… see code edge case)
cycleNumber   = floor(max(0, daysBetween(lastPeriodStart, today)) / cycleLength) + 1
calendar dayType: period → period; ==ovulationDay → ovulation; fertileWindow → fertile;
                  luteal → luteal; else follicular
```
Note: prediction **wraps forever** (modular), i.e. all future/past months render predictions.
Constraints: cycleLength 21–35, periodLength 1–10, lastPeriodDate ≤ today.

### 4.2 Phase copy (Home hero / tags / focus) — port verbatim from `phaseHeroCopy`
| Phase | Hero | Sub | Tags | Focus |
|---|---|---|---|---|
| period | Rest and replenish your body | Energy is naturally lower — choose iron-rich, warming meals. | Low estrogen · Restore iron | Add a warm iron-rich meal / Lentils, beef, or dark greens… |
| follicular | Building energy for ovulation | Estrogen is rising. Focus on fresh, nutrient-dense foods. | Estrogen rising · Building energy | Add 2 cups of leafy greens / Folate-forward foods support egg quality. |
| ovulatory | High chance of conception today | Ovulation expected in 1–2 days. Stay hydrated and rested. | High estrogen · Peak energy | Hydrate and prioritise protein / Eggs, salmon, and avocado… |
| luteal | Slow down and nourish | Progesterone rises. Choose magnesium-rich foods to ease symptoms. | Progesterone rising · Lower energy | Try a magnesium-rich snack / Pumpkin seeds, dark chocolate, or bananas… |

Fertile-window override (when in window but not ovulatory day): hero "Fertile window is
open", sub "Conception chances are rising — stay hydrated and prioritise rest.", tag
"Fertile window" prepended; sub-label "Fertile window".

### 4.3 Nutrition phase descriptions (`PHASE_DESCRIPTION`) + `PHASE_FOODS` — port verbatim.

### 4.4 pH status
`< 6.0 acidic` (pink) · `6.0–7.5 optimal` (green `#3FA37A`) · `> 7.5 alkaline` (lavender).
Value clamp 4.5–9.0, rounded to 0.1. Trend arrow threshold ±0.1 vs previous reading.

### 4.5 Streak
Streak = number of consecutive calendar days with a `daily_logs` row, **counting back from
today; 0 if today has no log**. (Server scans last 400 log dates.)

### 4.6 Hydration
Goal 2 400 ml (constant, duplicated in 4 files — make it one configurable value; the
"Tracking Preferences" screen should let users change it). Step 200 ml; hard cap 10 000 ml.

---

## 5. Data model & API surface

### 5.1 Supabase tables (RLS per-user; see `supabase/migrations`)
- **profiles**: id (auth uid), display_name, avatar_url, partner_id (FK→profiles, service-role
  writes only), theme ('dark' default), timestamps.
- **cycle_settings**: user_id (unique), last_period_date (date), cycle_length (int, def 28),
  period_length (int, def 5).
- **daily_logs**: user_id + date (unique pair), mood (str ≤20), energy ('low'|'normal'|'high'),
  symptoms text[] (≤50 × ≤40 chars), sleep_minutes (0–1440), water_ml (0–10000, def 0),
  supplements text[], notes (≤2000).
- **ph_readings**: id, user_id, ph_value (4.5–9.0, 1 dp), recorded_at (timestamptz), notes ≤500.
- **partner_invites**: inviter_id, invitee_email, code (16 chars), status
  pending|accepted|revoked, expires_at, accepted_by/at.
- Storage bucket `avatars` (signed URLs).

### 5.2 Server functions → iOS equivalents
| Function | Contract |
|---|---|
| getCycleSettings / upsertCycleSettings | single row per user; zod ranges as §4.1 |
| getDailyLog(date) / upsertDailyLog | upsert on (user_id,date); partial updates allowed |
| getStreak | §4.5 |
| listDailyLogs(sinceDays 1–365) | date asc; used by Insights & My Logs |
| listPhReadings(sinceDays?≤3650) / create / update / delete | limit 2000, asc |
| sendPartnerInvite / revokePartnerInvite / acceptPartnerInvite / unlinkPartner | §3.15; accept + unlink require service role (keep server-side — Edge Function on iOS) |
| getProfilePrefs / updateTheme | theme light|dark |
| updateDisplayName | trims, 1–80 |
| changePassword | verifies current pw by re-auth, then admin update (server-side only) |
| deleteAccount | admin delete (server-side only) |

⚠️ `acceptPartnerInvite`, `unlinkPartner`, `changePassword`, `deleteAccount` use the
**service-role key** — these must stay behind Supabase Edge Functions for the iOS app;
everything else can be direct PostgREST calls guarded by RLS.

---

## 6. Duplicate & inconsistency audit (fix during rebuild)

**Duplicated data/logic**
1. **Two parallel food datasets**: `PHASE_FOODS` (Nutrition.tsx, used) vs `phaseFoods`
   (lib/cycle.ts, **unused**) vs `nutritionFocus` (mockData, **unused**). → keep one source
   (content file / CMS), delete the rest.
2. **`cycleEngine.ts` is a pass-through facade** over `cycle.ts` (re-exports + 5 tiny
   helpers). Merge into one module on iOS.
3. **`WATER_TARGET` (2400) declared 4×** (Home, Nutrition, Log, Insights). → one constant /
   user preference.
4. **Supplement list mismatch**: Log dialog tracks *Folic acid, Vitamin D, Iron, Omega-3*;
   Nutrition plan advertises *Folate, Omega-3, Vitamin D, Zinc*. Same feature, two lists —
   unify (recommended: Folate, Omega-3, Vitamin D, Zinc, + user-editable).
5. **"3 of 4 taken today" in Nutrition is hard-coded** while real supplement intake lives in
   `daily_logs.supplements`. Wire the card to the log.
6. **PhTrackerCard rendered on two tabs** (Track + Nutrition) — full duplicate surface incl.
   two "Log pH" CTAs per screen (header + empty state, visible in screenshot 3). Recommend:
   full tracker on Track only; Nutrition shows a compact summary linking to Track.
7. **Display-name derivation duplicated 3×** (index.tsx, Home.tsx, Profile.tsx — with
   different metadata precedence: Home prefers `full_name`, Profile prefers `display_name`!).
   → single helper, single precedence.
8. **`safeThrow` helper copy-pasted in 4 server-function files**.
9. **Date helpers duplicated**: `todayISO` (use-daily-log) ≡ `formatDateOnly` (cycle.ts);
   Insights builds ISO dates with `toISOString().slice(0,10)` (**UTC — timezone bug**, the
   rest of the app uses local dates). Unify on local date-only helpers.
10. **Two identical pub/sub implementations** (use-daily-log.ts, use-ph.ts).
11. **Unused mock data**: `cycleDays`, `insightBars`, `nutritionBars`, `profileMenu` (repo) —
    but the deployed build's Insights/Profile screens appear to still render these mocks
    **[DELTA]**. Do not ship mock charts on iOS; gate real charts on data availability.
12. **Duplicate "Log today" CTA** on Home ("Log today") and Track ("Add to today's log") —
    same destination; fine UX-wise, but keep one label string.
13. **Stale copy**: "pH entries are stored on this device for now." (deployed) contradicts
    Supabase persistence. Remove.
14. **Duplicate conversion screenshots (12, 13)** confirm the pregnancy transition screen is
    reachable from two entry points (Home link + Profile toggle) — one screen, two entries;
    keep a single component.

**Inconsistencies / gaps**
- Quiz answers not persisted (lost on restart) though Home personalisation depends on them.
- Pregnancy mode not persisted; no due-date capture; pregnancy stats are placeholders.
- Track day-detail dialog doesn't show saved logs for past days.
- "Nutrition — On track" mini card in Log is inert.
- Insights `sinceDays=30` uses UTC date keys → off-by-one around midnight for non-UTC users.
- Profile screens "Personal Details / Health Profile / Tracking Preferences" exist in the
  deployed UI but have no backing screens/tables in repo.
- PREMIUM badge shown with no entitlement system.
- Articles open a placeholder paragraph — no real content model (fixed by Learn tab).

---

## 7. What the iOS rebuild must ADD (missing today)

1. **Learn tab** (new requirement — §8).
2. **Sign in with Apple** (App Store requirement given Google OAuth exists).
3. Push notifications (deployed UI already shows the toggle): daily log reminder, phase
   transitions ("Fertile window starts tomorrow"), supplement reminder.
4. Persisted quiz answers, persisted app mode (prep/pregnancy), due date for pregnancy mode.
5. Personal Details / Health Profile / Tracking Preferences screens (deployed UI stubs).
6. Premium entitlement (StoreKit 2) if the PREMIUM badge is to mean anything.
7. Offline-first caching (native app should not require network to view cycle predictions —
   cycle math is pure local; cache last-known settings/logs).
8. HealthKit (optional, phase 2): sleep + water + menstrual data sync.
9. My Logs history screen (exists in deployed build, not in repo).

---

## 8. NEW: Learn tab specification

**Goal**: a dedicated "place to learn" — today's education content is scattered (3 article
stubs at the bottom of Nutrition, one quiz "Did you know?" fact, supplement dialog copy).

**Proposed tab layout** (`Learn`, leaf/book icon, between Nutrition and Insights — or replace
Nutrition's article section entirely):

1. **Header**: "Learn" + subtitle "Understand your body, one calm read at a time."
2. **Continue reading** row (last opened article, progress).
3. **For you today** — 1 card selected by current cycle phase (e.g. luteal → "Eating for your
   luteal phase").
4. **Topics** (horizontally scrollable chips / grid): Cycle basics · Nutrition · Supplements ·
   pH & hydration · Trying to conceive · Pregnancy prep · Emotional wellbeing.
5. **Article list** per topic: cover tint, title, read time, premium lock badge where relevant.
6. **Article reader**: title, read time, hero tint, rich text sections, sources/disclaimer
   footer ("Educational content, not medical advice" — reuse health-disclaimer), share button.
7. **Did-you-know facts**: surface the quiz fact bank as swipeable cards at the list footer.

**Content model** (new table `articles` or bundled JSON in v1):
```
article { id, slug, topic, title, readMinutes, heroTint, isPremium, body(markdown),
          phases: Phase[] (for "For you today"), publishedAt }
```
Seed with the 3 existing article titles + supplement guide + one per phase from the existing
`expandedDesc` food copy (already written — reuse it).

**Migration note**: remove "Learn more" section from Nutrition once Learn ships; Nutrition
keeps hydration + focus foods + supplement plan.

---

## 9. iOS rebuild roadmap

**Recommended stack**: SwiftUI (iOS 17+), Swift Charts, `supabase-swift`, StoreKit 2, APNs.
Keep Supabase project as-is; add Edge Functions for the 4 service-role operations (§5.2).

| Phase | Scope | Exit criteria |
|---|---|---|
| **0. Foundation** (1–2 wk) | Design system (colors, type, card, chip, segmented, dialogs, tab bar), Supabase auth (email+pw, Google, **Apple**), session persistence, guest mode + sign-in prompts | Sign in/up/out, themed shell with 5 tabs |
| **1. Cycle core** (2 wk) | Port cycle engine (pure Swift + unit tests against §4.1 formulas), Cycle Settings, Track calendar + phase card + day dialog, Home hero/focus/stats | Predictions pixel-match web for same inputs |
| **2. Logging** (2 wk) | Log Today overlay (all sections), daily-log repository, streak, hydration steppers (Home/Nutrition), shared observable store | Save/edit today's log, streak correct across midnight/timezone |
| **3. pH suite** (1–2 wk) | Tracker card (Track only), log/edit/delete dialog, Swift Charts with bands, pH insights section | Parity with §3.13 |
| **4. Nutrition + Learn** (2 wk) | Nutrition (hydration, focus foods, supplement plan wired to real log), **Learn tab** with content model + reader, remove duplicates from §6 | Learn v1 shipped with seeded content |
| **5. Insights + My Logs** (1–2 wk) | Real-data insights (pH, hydration 7d, top symptoms, consistency), My Logs history screen | No mock data anywhere |
| **6. Profile & Partner** (2 wk) | Profile (avatar upload, name, password, theme System/Light/Dark, delete account via Edge Fn), Partner invite/accept/unlink + universal links, Tracking Preferences (water goal, defaults), notifications toggle + APNs reminders | Invite flow E2E between two accounts |
| **7. Pregnancy mode + Premium** (2 wk) | Persisted mode, due-date capture, trimester calc, prenatal content; StoreKit entitlement behind PREMIUM | Mode survives restart; purchase restores |
| **8. Hardening / submission** (1–2 wk) | Offline cache, HealthKit (optional), accessibility (Dynamic Type, VoiceOver labels — web already sets aria-labels; mirror them), App Privacy nutrition labels (health data!), App Review prep (medical-disclaimer prominent) | TestFlight → App Store |

**App Review cautions**: reproductive-health data → App Privacy declarations, optional
Face ID app lock recommended, clear "not medical advice" disclaimers (already present as
`/health-disclaimer` — surface during onboarding on iOS).

---

## 10. Design tokens quick reference

- Primary / electric lavender `#4D4DAA`; electric pink `#D85A8A`; optimal green `#3FA37A`;
  pastels: powder-pink, powder-blue, baby-lavender (see `styles.css` oklch vars).
- Radii: cards 24–28, buttons 16, chips/full pills; hairline borders; soft layered shadows.
- Type: display serif-ish semibold for headings (26–32 px), 13–15 px body, 10.5–12 px
  uppercase tracked labels (+0.14–0.16 em).
- Tap targets ≥44 pt (web already enforces `min-h-[44px]`).
- Dark theme: true-black shell, `#171614` splash, cards elevated dark gray (screenshot 11).

---

## 11. Appendix — Reconciliation with the actual iOS build (V1.02 build 7)

> Added after receiving the product inventory of the real iOS codebase
> (`genesyx_apple.V1.02`, branch `feature/learn-parity`, ported from Android
> `release/learn-v1` @ `ac59b3a`). The iOS app already exists; this appendix maps this
> spec against that build and records the agreed state.

### 11.1 Confirmed shipped on iOS (supersedes the "to build" framing above)
- **Learn tab shipped** (§8 goal met): 10 bundled compile-time articles, 1 featured,
  5 category chips, in-memory search (title/excerpt/tags), hand-authored related lists
  that *replace* (not stack), share = title + excerpt + site root, medical disclaimer on
  6 pinned slugs, per-article CTAs into Log/Track/Nutrition/Insights, one-time intro hint
  (`@AppStorage("learn_intro_seen")`). Nutrition "Learn more" feeds real Learn articles
  + "See all articles" → Learn tab (RED-1 fix).
- **Six-tab custom bottom bar** (Home, Track, Nutrition, Insights, Learn, Profile) —
  custom because native TabView collapses the 6th tab into "More". Bar hidden off-tab;
  per-tab state preserved (ZStack opacity/hitTesting).
- **Log History screen** (= "My logs" from the deployed screenshots): merges daily logs +
  pH readings per day, newest first.
- **Offline-first architecture**: device is source of truth; Supabase is an optional
  mirror (no-op + mock auth when unconfigured). Per-feature sync: daily logs refuse
  offline save; pH queues/retries, merges by id last-updated-wins, tombstoned deletes;
  cycle settings fail quietly, server wins on next read; account deletion remote-first.
- **Feature flags** (`FeatureFlags` in `LearnModels.swift`): `phTracking` on;
  `partnerInvites`, `pushNotifications`, `adminClients` off. Note: the
  `genesyx://invite/{code}` deep link stays registered even with `partnerInvites` off.
- **Intentional parity fakes** (replicate faithfully, do not "fix" silently):
  change-password validates then no-ops; waitlist email validated then discarded;
  quiz answers discarded; 3 of 4 Insights charts are sample data (only pH real);
  PREMIUM is a label; pregnancy mode is a hidden placeholder.

### 11.2 Pre-submission blockers (agreed)
1. **Quiz Q4 (baby's sex) fact** claims diet/pH influences a baby's sex — removed on
   Android, contradicts the Learn articles and the banned-phrase scan, and is an
   unsupported health claim App Review can reject. Remove.
2. **Dashboard gating**: iOS enters the tabs without an account; Android requires
   register/login, and the web build replaced the waitlist with real account creation
   (§3.5). Decide + align (also affects account deletion journey).
3. **Sign in with Apple**: entitlement present but wiring unverified — mandatory since
   Google sign-in is offered.
4. Splash egg artwork uses placeholder orbs; `egg_female`/`egg_male` assets bundled but
   not wired.

### 11.3 Spec sections upgraded by the iOS build (use iOS behaviour as truth)
- §3.3 Quiz: iOS has **5** questions (adds baby's sex) and 2 fact modals — subject to
  blocker #1 above.
- §3.5: iOS "waitlist" is email capture (discarded), not account creation — subject to
  blocker #2.
- §3.10 Insights: iOS ships the mock-chart variant; the real-data version (pH insights,
  hydration 7d, top symptoms, logging consistency) specified in §3.10 remains the target;
  avoid the UTC/local date-key bug noted in §6.
- §9 roadmap phases 0–5 are largely complete in V1.02; remaining work = blockers above +
  dormant features (partner, push, pregnancy, premium) when their flags turn on.
