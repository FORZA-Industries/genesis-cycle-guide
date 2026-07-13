# Genesyx iOS Delivery Package — Master Implementation Doc code (WS1 + WS2 + WS3)

> Complete code for `docs/MASTER_IMPLEMENTATION_V1.0.1_V1.1.md`, staged here because the
> iOS repo (`genesyx_apple.V1.02`) is not connected to this session yet. Every file names
> its **target path** in its header. Copy files in, conform two small protocols, run
> `xcodegen generate`, run tests.

## File map

| File here | Target path in iOS repo | Workstream |
|---|---|---|
| `GenesyxCore/Streaks/StreakEngine.swift` | `Sources/GenesyxCore/Streaks/StreakEngine.swift` | WS1 |
| `GenesyxCoreTests/Streaks/StreakEngineTests.swift` | `Tests/GenesyxCoreTests/Streaks/StreakEngineTests.swift` | WS1 |
| `GenesyxCore/Insights/ConsistencyInsightLogic.swift` | `Sources/GenesyxCore/Insights/ConsistencyInsightLogic.swift` | WS3a |
| `GenesyxCoreTests/Insights/ConsistencyInsightLogicTests.swift` | `Tests/GenesyxCoreTests/Insights/ConsistencyInsightLogicTests.swift` | WS3a |
| `App/Notifications/NotificationContent.swift` | `App/Genesyx/Notifications/NotificationContent.swift` | WS2 |
| `App/Notifications/NotificationService.swift` | `App/Genesyx/Notifications/NotificationService.swift` | WS2 |
| `App/Notifications/NotificationRouter.swift` | `App/Genesyx/Notifications/NotificationRouter.swift` | WS2 |
| `AppTests/Notifications/NotificationContentTests.swift` | `Tests/GenesyxTests/Notifications/NotificationContentTests.swift` | WS2 |
| `App/Sync/Secrets.swift.example` | `App/Genesyx/Sync/Secrets.swift.example` | WS3b |
| `App/Sync/SupabaseBackendLive.swift` | `App/Genesyx/Sync/SupabaseBackendLive.swift` | WS3b |
| `App/Sync/SyncCoordinator.swift` | `App/Genesyx/Sync/SyncCoordinator.swift` | WS3b |
| `supabase/migrations/001_initial_schema.sql` | `supabase/migrations/001_initial_schema.sql` | WS3b |
| `supabase/functions/delete-account/index.ts` | `supabase/functions/delete-account/index.ts` | WS3b |

Note: this (web) repo also carries a richer 4-function Edge set under
`supabase/functions/` (delete-account, change-password, accept-partner-invite,
unlink-partner) targeting the EXISTING web project. The single-file copy above is the
standalone version for the fresh `genesyx-prod` project of checklist §9.

## Integration points (the only hand-written glue)

1. **`StreakLoggable` conformance** — one extension on the existing `DailyLog`:
   ```swift
   extension DailyLog: StreakLoggable {
       public var hasAnyEntry: Bool {
           waterMl > 0 || mood != nil || energy != nil || !symptoms.isEmpty
               || sleepMinutes != nil || !supplements.isEmpty || !(notes ?? "").isEmpty
       }
   }
   ```
2. **`CalendarDate`** — StreakEngine.swift ships a definition; if GenesyxCore already
   has one, delete the shipped struct and add the `isoWeekday` / `startOfWeek` /
   `addingDays` helpers to the existing type.
3. **Repository accessors** the new services expect (add thin wrappers if names differ):
   `DailyLogRepository.waterMl(on:)`, `.logsByDate()`, `.allLocalLogs()`, `.saveLocal(_:)`,
   `.applyServerCopies(_:)`, `.wipeCurrentUser()` · `PhRepository.readingDates()`,
   `.saveLocal(_:pendingSync:)`, `.pendingSyncReadings()`, `.clearPendingSync(id:)`,
   `.markDeletedLocal(id:)`, `.allLocalReadings()`, `.merge(remote:resolve:)` ·
   `PreferencesRepository.celebratedMilestones: Set<String>`, `.pushEnabled`.
4. **`GenesyxBackend` protocol** — align `SupabaseBackendLive`'s method names with the
   existing stub protocol (or adopt these signatures in the protocol).
5. **project.yml** — add the `Supabase` SPM package + the Secrets preBuildScript
   (documented inside `Secrets.swift.example`); gitignore `Secrets.swift`;
   `xcodegen generate`.
6. **Profile toggle** — "Weekly reminders": ON → pre-prompt sheet →
   `NotificationService.shared.requestPermission()`; OFF → `cancelAll()`.
   Denied at system level → toggle off + "Enable in Settings" link.
7. **App lifecycle** — on `scenePhase == .active`:
   `await NotificationService.shared.refresh()` and `await SyncCoordinator.shared.drainPhQueue()`.
   Set `UNUserNotificationCenter.current().delegate = NotificationService.shared` at launch.
8. **Flip `FeatureFlags.pushNotifications = true`** (build 9).

## Invariants encoded in this package (§8 — verified by tests)

- Log screen UX untouched — only `SyncCoordinator.saveDailyLog` wraps its save path.
- Three offline behaviours preserved: logs refuse offline (SyncError.offline), pH queues
  with backoff + pending_sync + tombstones, cycle quiet-fails.
- Max ONE hydration nudge per day; suppressed the moment water is logged (both at
  schedule-refresh and in `willPresent`); no evening follow-up.
- No "streak broken" notification exists anywhere; milestone copy is congratulation-only
  (tested against guilt markers).
- Every notification string passes the banned-phrase scan (tested).
- Milestones fire once; lapsed flags clear so re-achieving re-fires (tested).
- Service-role key exists only in the Edge Function; `Secrets.swift` is gitignored and
  empty values keep today's stub behaviour; mock auth pattern stays `#if DEBUG`.

## Supersession note

This package supersedes `docs/GUIDE_V1.0.1_V1.1.md` Part 2 where they conflict — the
master doc ADDS the smart daily hydration nudge (the earlier roadmap had "no hydration
push") and sets Learn=Sun 09:00, phase=Wed 08:00, milestones day7/day14/week1/week4.

## Test checklist (device, before build 9 submission — §4/§7)

1. Fresh install → Profile toggle ON → pre-prompt → system dialog accept →
   pending requests contain the weekly set (+ hydration if today unlogged).
2. Deny path → toggle reflects OFF + Settings link works.
3. Log water → pending hydration request disappears; next day it returns.
4. Tap each notification → lands on the right tab; Learn tap opens the rotated article.
5. 7-day hydration streak (shrink the constant temporarily) → one milestone, fires once.
6. Break streak, rebuild → milestone re-fires.
7. Toggle OFF → zero Genesyx requests pending.
Then WS3 activation (human checklist §9) → two-device sync test = the "one place" promise.
