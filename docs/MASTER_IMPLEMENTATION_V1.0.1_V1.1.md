# Genesyx — Achieve the App's Promise: Master Implementation Doc (v1.0.1 → v1.1)

> **For the Claude/Fable coding agent:** solve everything in CODE now. Anything that requires the Supabase dashboard or Google Cloud console is collected into a human checklist at the end (Section 9) — write the code so it works the moment those manual steps are done.
>
> **The goal — the public promise of the app (as posted):**
> "With Genesyx, you can: track your cycle in one clear daily view · log pH, symptoms, hydration, and wellness habits · follow personalized insights based on your journey · access gentle guidance for preconception wellness and daily routines · keep your health information organized in one place. Genesyx combines supportive insights, phase-aware wellness guidance, and a simple, modern experience."
>
> This doc closes every gap between that promise and the shipped v1.0 (build 8, in App Store review).

---

## 1. GAP ANALYSIS — promise vs. reality

| Promise | v1.0 status | Gap to close |
|---|---|---|
| Track your cycle in one clear daily view | ✅ Home + Track, CycleEngine | None |
| Log pH, symptoms, hydration, wellness habits | ✅ Log + pH tracker + Hydration Coach | None in UI; data doesn't persist to cloud |
| Personalized insights based on your journey | ✅ 5 real-data Insights cards | Needs richer data-density (§5) + real multi-device data (§6) |
| Gentle guidance for wellness + routines | ✅ 16 Learn articles + GUIDES | None |
| Keep health info organized in one place | ⚠️ On-device only | Real cloud persistence (§6) — data lost on device loss |
| (Implied) Reminders that keep her engaged | ❌ No notifications | Push notifications system (§4) |
| (Implied) Streaks that motivate | ⚠️ Daily water streak only | Daily hydration streak ✅ + NEW weekly streak (§3) |

**The three workstreams, in build order:**
- **WS1 — Streak engine v2** (daily + weekly, all-habit) — pure code, no backend
- **WS2 — Push notifications** (hydration, pH, phase, nutrition, Learn, streak milestones) — code + one manual checklist item
- **WS3 — Real linked data** (Supabase/Postgres + Google Cloud) — code now, manual checklist to activate

---

## 2. ARCHITECTURE (the logic behind it)

```
┌─────────────────────────── iOS APP ───────────────────────────┐
│  UI (SwiftUI)                                                  │
│   Home · Track · Nutrition · Insights · Learn · Profile        │
│        │                                                        │
│  Services (new/extended)                                        │
│   StreakEngine ──── reads DailyLogRepository + PhRepository     │
│   NotificationService ── schedules via UNUserNotificationCenter │
│        │ reads StreakEngine for milestones                      │
│        │ reads CycleEngine for phase copy                       │
│  Repositories (existing, local-first — device = truth)          │
│   CycleRepository · DailyLogRepository · PhRepository           │
│   PreferencesRepository · SessionRepository                     │
│        │ push-after-save / pull-on-signin                       │
│  SupabaseBackend (currently stubs → becomes real client)        │
└────────┼───────────────────────────────────────────────────────┘
         │ HTTPS (anon key, RLS-scoped)
┌────────▼──────────── SUPABASE (on Google Cloud) ───────────────┐
│  Auth: email/password · Google · Sign in with Apple            │
│  Postgres: profiles · cycle_settings · daily_logs · ph_readings│
│    (RLS: auth.uid() = user_id on every table)                  │
│  Edge Function: delete-account (service role key lives here)   │
│  Storage bucket: learn/ (future content updates)               │
└────────────────────────────────────────────────────────────────┘
```

**Principles (unchanged from v1.0):** device is the source of truth; cloud is a mirror. The three offline behaviours are product decisions: daily logs refuse offline saves; pH queues + retries; cycle settings fail quietly. Notifications are local (no APNs server needed — everything schedules on-device).

---

## 3. WS1 — STREAK ENGINE v2 (build first; everything else reads it)

### What exists
`DailyLogRepository.streak(today:)` — consecutive days with any water logged. Shown in the Hydration Coach ("Daily streak — start today" / "Day 1 — great start" / "{n}-day daily streak").

### What to build: `Sources/GenesyxCore/Streaks/StreakEngine.swift` (pure, testable)

```swift
struct StreakState {
    let dailyHydration: Int        // consecutive days with any water (existing behaviour)
    let weeklyStreak: Int          // consecutive COMPLETE weeks (see rule)
    let daysLoggedThisWeek: Int    // 0–7, any log activity (water, mood, symptom, pH…)
    let bestDailyStreak: Int       // all-time best (persisted)
    let milestones: [Milestone]    // newly crossed, not yet celebrated
}

enum Milestone: String, CaseIterable {
    case day7 = "milestone_7"      // 1-week daily streak
    case day14 = "milestone_14"    // 2-week daily streak
    case week1 = "milestone_w1"    // first complete week
    case week4 = "milestone_w4"    // four complete weeks
}

enum StreakEngine {
    static func compute(
        logsByDate: [CalendarDate: DailyLog],
        phByDate: Set<CalendarDate>,
        today: CalendarDate,
        celebrated: Set<String>          // persisted milestone flags
    ) -> StreakState
}
```

**Rules:**
- **Daily hydration streak** — unchanged semantics (consecutive days back from today with `waterMl > 0`). Keep the existing de-pressured copy.
- **Weekly streak** — a week counts as complete when she logged ANYTHING (water, mood, energy, symptom, sleep, note, or a pH reading) on ≥5 of its 7 days (Mon–Sun). `weeklyStreak` = consecutive complete weeks ending with the current or previous week. The 5-of-7 threshold is deliberate: perfection is not required — this matches the brand contract ("missing a day costs almost nothing").
- **Milestones fire once** — flags persist in `PreferencesRepository` (`milestone_7_sent` etc.); reset when the underlying streak drops below the threshold so re-achieving re-fires.
- All computation is pure — repositories feed it; nothing async inside.

### Where it surfaces
1. **Hydration Coach (Nutrition)** — existing daily pill unchanged; add a second muted line when `weeklyStreak >= 1`: "{n} steady weeks".
2. **Home hydration tile** — daily streak flame (exists); tooltip/subtitle shows weekly streak.
3. **Insights — NEW "Consistency" card** (see §5).
4. **NotificationService** — reads milestones for celebration pushes (§4).

### Tests
Buckets and boundaries: 4-of-7 days ≠ complete week; 5-of-7 = complete; streak resets; milestone fires once; re-achieve re-fires; pH-only days count toward weekly; empty history → zeros.

---

## 4. WS2 — PUSH NOTIFICATIONS (local, no server)

Branch `feature/notifications` already has ~90% of this. Finish it against the new StreakEngine.

### The notification set

| ID | Trigger | Copy (title / body) | Tap → |
|---|---|---|---|
| `genesyx.daily.hydration` | Daily 10:00, ONLY if `waterMl(today) == 0` at schedule time (see logic below) | "A glass to start" / "Nothing logged yet today — one tap on the coach and you're going." | Nutrition (Hydration Coach) |
| `genesyx.weekly.ph` | Mon 09:00 | "Log your pH" / "A weekly reading keeps your trend honest." | Track (pH section) |
| `genesyx.weekly.phase` | Wed 08:00 | "Where are you in your cycle?" / dynamic: "You're in your {phase} phase — see what to expect." | Track |
| `genesyx.weekly.nutrition` | Fri 12:00 | "Check your nutrition" / "Small phase-aware shifts this week." | Nutrition |
| `genesyx.weekly.learn` | Sun 09:00 | "A new read for your week" / rotates the 16 articles by ISO week | Learn → that article |
| `genesyx.milestone.*` | fires once on crossing (from StreakEngine) | day7: "One week strong" · day14: "Two weeks in" · week1: "A full steady week" · week4: "Four weeks of showing up" | Insights |

**Daily hydration logic (the one you asked for):** a repeating daily trigger at 10:00. In `userNotificationCenter(_:willPresent:)` and at schedule-refresh time (every app foreground), check `DailyLogRepository.waterMl(on: .today())` — if she's already logged water, cancel/suppress today's instance. Result: she is nudged only on days she hasn't started. Never more than one hydration push per day. Evening follow-up: none (deliberate — no nagging).

### Permission flow (review-critical)
- No prompt at launch. Profile toggle "Weekly reminders" → pre-prompt sheet explaining what she'll get → then the system dialog.
- Denied → toggle reflects system state + "Enable in Settings" deep link.
- Reconcile on every foreground: `getNotificationSettings()` vs `pushEnabled` vs scheduled set.
- All scheduling gated: `guard FeatureFlags.pushNotifications else { return }` — flip the flag to `true` in this build.

### Files

```
App/Genesyx/Notifications/
  NotificationService.swift      // center, permission, schedule/cancel, reconcile
  NotificationContent.swift      // all IDs + copy (single source, testable)
  NotificationRouter.swift       // tap → TabRouter selection + Learn slug deep-link
```

### Content-safety
`NotificationContentTests`: every title+body passes the banned-phrase scan ("alkaline diet", "balance your ph", "boy or girl", "sex selection", "gender sway", "sway the sex", "choose the sex", "detox", "flush toxins"). Nudges are behavioural ("log", "check", "read") — never medical claims, never guilt ("you broke your streak" is forbidden).

---

## 5. WS3a — INSIGHTS DATA-DENSITY ("so people know what is going on")

The five real cards shipped in v1.0 (pH, Hydration, Cycle regularity, Symptom patterns, Ovulation). Deepen them so the tab genuinely narrates her data:

1. **NEW Consistency card** (reads StreakEngine): daily streak, weekly streak, best-ever, days-logged-this-week as a 7-dot row. Insight copy: "You've logged {n} of 7 days this week — {weeklyStreak} steady weeks." De-pressured empty state.
2. **Hydration card +**: add week-over-week delta ("+300ml vs last week") computed from the two 7-day windows. Only when both weeks have data.
3. **pH card +**: add reading-count context ("{n} readings in 30 days") so she knows how solid the trend is; keep the "early days" guard.
4. **Symptom card +**: tap a heatmap cell → that day's Log History entry (wire the existing navigation).
5. **The log stays normal** — no changes to the Log screen itself ("must contain the log as normal"). Everything reads from the same DailyLogRepository; the log is the input, Insights is the mirror.

All additions are pure-logic extensions of the existing `*InsightLogic` files + unit tests. No new data models.

---

## 6. WS3b — REAL LINKED DATA (code now, activate later)

Implement everything in code against the schema below so the app works the moment the human checklist (§9) is done. Full details live in the companion doc `genesyx_v101_real_data_prompt.md` — summary of the code side:

1. **`SupabaseBackend` becomes a real client** (supabase-swift package): auth (email/password, Google, `signInWithIdToken` for Apple), CRUD for the four syncable tables.
2. **`Secrets.swift`** — gitignored, generated from env at build; empty values → stubs (today's behaviour). Commit `Secrets.swift.example`.
3. **Push-after-save / pull-on-signin** wiring in the repositories, preserving the three offline behaviours exactly (logs block offline; pH queues with `pending_sync`; cycle quiet-fails).
4. **Conflict resolution** — pH merges by id, last-`updated_at` wins, never overwrite `pending_sync=true`.
5. **Mock auth** goes `#if DEBUG`-only.
6. **One-time migration** — first real sign-in pushes existing local data up.
7. **SQL migration file** — write `supabase/migrations/001_initial_schema.sql` in the repo with the full schema + RLS + triggers (profiles, cycle_settings, daily_logs, ph_readings; pH check constraint 4.5–9.0; tombstones). The human applies it via the dashboard/CLI (checklist).
8. **Edge Function** — write `supabase/functions/delete-account/index.ts` (Deno) in the repo; deployment is a checklist item.

---

## 7. IMPLEMENTATION ROADMAP (real coding order)

| Phase | Work | Branch | Build | Depends on |
|---|---|---|---|---|
| **P1 (day 1)** | StreakEngine v2 + tests + Consistency card + Hydration/pH card deepening | `feature/streaks-v2` | — | nothing |
| **P2 (day 1–2)** | Notifications finished against StreakEngine; device testing (7 scenarios); flag ON | `feature/notifications` (rebase) | 9 | P1 |
| **P3 (day 2–3)** | Real-data code: SupabaseBackend client, Secrets, sync wiring, migration SQL + Edge Function in-repo | `feature/real-data` | 10 | none (parallel OK) |
| **P4 (human)** | Supabase + Google Cloud checklist (§9) | — | — | P3 code merged |
| **P5** | Activate: real Secrets in CI/build, end-to-end sync test on two devices, ship | release | 10 | P4 |

Merge order: P1 → P2 → P3 into the release baseline (run `xcodegen generate` after each — never hand-merge `project.pbxproj`). Ship P2 as v1.1 once v1.0 clears review; P3+P5 ships as v1.1.x or rides along if timing aligns.

**Definition of done:** every marketing-promise row in §1 shows ✅; 60 existing tests + all new suites green; notifications verified on a physical device; two-device sync verified; no banned phrase anywhere; the log screen unchanged.

---

## 8. WHAT CLAUDE MUST NOT DO

- Don't change the Log screen's UX ("the log as normal").
- Don't change the three offline behaviours.
- Don't send more than one hydration push per day; no evening guilt push; no "streak broken" notifications.
- Don't ship mock auth in Release, commit credentials, or put the service role key in the app.
- Don't fabricate data in Insights — thin data is called thin ("early days").
- Don't touch `project.pbxproj` by hand — `xcodegen generate`.

---

## 9. HUMAN CHECKLIST — Supabase & Google Cloud (do later, ~45 min)

**Supabase dashboard (supabase.com):**
- [ ] 1. Create project `genesyx-prod` (EU region — UK users). Note the project URL + anon key.
- [ ] 2. SQL Editor → run `supabase/migrations/001_initial_schema.sql` (written by Claude in P3). Verify 4 tables + RLS policies exist.
- [ ] 3. Auth → Providers → enable **Email** (confirm-email ON for production).
- [ ] 4. Auth → Providers → enable **Google**: paste the iOS client ID from Google Cloud (step 8) + set the redirect.
- [ ] 5. Auth → Providers → enable **Apple**: create a Services ID + Sign in with Apple key at developer.apple.com; paste Service ID, Team ID (M5L3MM75SG), key ID + .p8 contents.
- [ ] 6. Edge Functions → deploy `delete-account` (`supabase functions deploy delete-account`); set `SUPABASE_SERVICE_ROLE_KEY` as its secret — never anywhere else.
- [ ] 7. Storage → create bucket `learn` (public read) — for future article content updates.

**Google Cloud console (console.cloud.google.com):**
- [ ] 8. Create/confirm project `genesyx` → OAuth consent screen (External, app name Genesyx, support email info@genesyx.co.uk) → Credentials → **OAuth 2.0 Client ID (iOS)** with bundle `com.genesyx.app`. Copy the client ID into Supabase (step 4) and into the app's Info (reversed client ID URL scheme).
- [ ] 9. (Only if self-hosting Supabase later) provision Cloud Run/Compute — NOT needed with Supabase Cloud; skip.

**Apple developer (developer.apple.com):**
- [ ] 10. Confirm Sign in with Apple capability is enabled on the `com.genesyx.app` App ID (was required at v1.0 validation — verify it stuck).

**Build system:**
- [ ] 11. Set `SUPABASE_URL` + `SUPABASE_ANON_KEY` env vars in your build environment; confirm `Secrets.swift` generates and is gitignored.
- [ ] 12. Build, sign in on two devices, log water on one, see it on the other. That's the moment the "one place" promise is real.

---

## 10. ONE-LINE SUMMARY

Three workstreams close the gap between the App Store promise and the code: a pure StreakEngine (daily hydration streak + 5-of-7 weekly streak + one-shot milestones), a finished local-notification system (daily smart hydration nudge + four weekly nudges + milestone celebrations, review-safe permission flow), and a real Supabase/Google-Cloud data layer written now and activated by a 12-step human checklist. Insights gains a Consistency card and deeper real-data context; the Log stays exactly as it is.
