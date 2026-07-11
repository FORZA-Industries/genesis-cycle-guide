# Genesyx — Execution Guide: v1.0.1 + v1.1 Notifications (build 9)

> **Format contract**: every guide in this series contains (1) *what we're trying to achieve*,
> (2) *the step-by-step plan*, and (3) *the full code*. Code targets the iOS repo
> (`/Users/lucasvalenca_sf/genesyx_apple.V1.02`, SwiftUI, iOS 16, xcodegen) and follows the
> project's conventions: pure `*Logic.swift` files with unit tests, content-safety scan over
> all user-facing strings, `FeatureFlags` gating, local-first repositories.
>
> ⚠️ Integration points are marked `// INTEGRATE:` — the surrounding code in your repo may
> name things slightly differently (this guide was written against `APP_INVENTORY.md` +
> the A-to-Z roadmap, not the live Xcode project). Diff against `feature/notifications`
> (`3365223`), which is already ~90% built — prefer keeping your existing code where it
> matches, and use this as the checklist + reference implementation for the missing 10%.

---

# PART 1 — v1.0.1 (Monday–Tuesday)

## 1.1 What we're trying to achieve

Resolve `wip/v1.0.1-extras` (`0f696c3`) into a small, clean patch release:

1. **Track pH quick-log card** — a woman on the Track tab can log a pH reading right there,
   not only from Nutrition. Same repository, same validation (4.5–9.0, 1 dp), same offline
   queue. No new patterns.
2. **3 pH Learn articles** — ship the pH education set into the Learn library (16 → 19
   articles), each passing the banned-phrase scan, disclaimer pinned, honest about what urine
   pH does and does not mean (Brand Contract #1, #2; Honesty Standard).

**Drop rule** (decide Monday morning): if either item needs > half a day of new work beyond
what's on the WIP branch, drop it from v1.0.1 and fold it into v1.1. v1.0.1 is polish, not a
feature release.

## 1.2 Step-by-step

```bash
# Step 0 — preconditions
#  - v1.0 (build 8) still in App Store review: do NOT touch the release baseline.
#  - Work happens on a fresh branch off the baseline, cherry-picking from the WIP branch.
cd /Users/lucasvalenca_sf/genesyx_apple.V1.02
git fetch origin
git checkout claude/blissful-carson-wsdb54          # release baseline (c258921)
git checkout -b feature/v1.0.1

# Step 1 — audit what the WIP branch actually contains
git log --oneline claude/blissful-carson-wsdb54..wip/v1.0.1-extras
git diff --stat claude/blissful-carson-wsdb54..wip/v1.0.1-extras

# Step 2 — bring over ONLY the pH articles + Track card commits (no drive-by changes)
git cherry-pick <sha-of-ph-articles> <sha-of-track-card>   # resolve conflicts, keep baseline style

# Step 3 — finish the Track pH card (code in §1.3 below if the WIP version is incomplete)
# Step 4 — add the 3 articles to LearnContent + pin disclaimers (code in §1.4)
# Step 5 — regenerate project + run the full suite
xcodegen generate
xcodebuild test -scheme Genesyx -destination 'platform=iOS Simulator,name=iPhone 15'
#   Must stay green: banned-phrase scan, library integrity, disclaimer pinning,
#   CTA-target guard, featured check + all existing 60.

# Step 6 — bump ONLY the patch version, keep build number for TestFlight sanity
#   project.yml: MARKETING_VERSION 1.0.1 (CURRENT_PROJECT_VERSION stays until archive)
# Step 7 — archive → TestFlight → device pass (log pH from Track, offline queue, article
#   rendering incl. disclaimer + related links) → hold submission until v1.0 clears review.
```

## 1.3 Full code — Track pH quick-log card

`UI/Track/TrackPhCard.swift` — mirrors the Nutrition pH section's behaviour with a compact
Track-appropriate layout: latest reading + status + one-tap log.

```swift
import SwiftUI

/// Compact pH card for the Track tab: latest reading, status, and a quick-log entry point.
/// Same repository + validation as the Nutrition pH section; no new persistence paths.
struct TrackPhCard: View {
    // INTEGRATE: match the observable type used by the Nutrition pH section
    // (e.g. @EnvironmentObject var phRepository: PhRepository or a view model).
    @ObservedObject var viewModel: TrackPhCardViewModel
    @State private var showLogSheet = false

    var body: some View {
        // Entire card is feature-gated exactly like every other pH surface.
        if FeatureFlags.phTracking {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .top) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("TRACK YOUR PH")
                            .font(.caption2.weight(.medium))
                            .tracking(1.6)
                            .foregroundStyle(Color.brandLavender) // INTEGRATE: theme token
                        Text("Urine pH")
                            .font(.headline)
                    }
                    Spacer()
                    Button {
                        showLogSheet = true
                    } label: {
                        Label("Log pH", systemImage: "plus")
                            .font(.footnote.weight(.semibold))
                    }
                    .buttonStyle(.borderedProminent)
                    .clipShape(Capsule())
                }

                if let latest = viewModel.latestReading {
                    HStack(spacing: 12) {
                        Text(latest.value, format: .number.precision(.fractionLength(1)))
                            .font(.title2.weight(.semibold).monospacedDigit())
                            .foregroundStyle(latest.status.color)
                        PhStatusBadge(status: latest.status) // INTEGRATE: reuse Nutrition badge
                        Spacer()
                        Text(latest.recordedAt, format: .dateTime.month(.abbreviated).day().hour().minute())
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding(12)
                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
                } else {
                    Text("No readings yet. Log your first pH to start your chart.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .padding(20)
            .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 24))
            .sheet(isPresented: $showLogSheet) {
                // INTEGRATE: the existing pH log sheet used from Nutrition — do not fork it.
                PhLogSheet(repository: viewModel.repository)
            }
            .accessibilityElement(children: .contain)
            .accessibilityLabel("Urine pH tracker")
        }
    }
}
```

```swift
import Foundation
import Combine

/// Thin adapter over PhRepository so the card stays dumb and testable.
@MainActor
final class TrackPhCardViewModel: ObservableObject {
    @Published private(set) var latestReading: PhReading?
    let repository: PhRepository
    private var cancellables = Set<AnyCancellable>()

    init(repository: PhRepository) {
        self.repository = repository
        // INTEGRATE: subscribe to whatever change publisher PhRepository exposes.
        repository.readingsPublisher
            .map { $0.max(by: { $0.recordedAt < $1.recordedAt }) }
            .receive(on: DispatchQueue.main)
            .assign(to: &$latestReading)
    }
}
```

Integration: insert `TrackPhCard(viewModel:)` in `TrackView` **below the current-phase card**
(matching Android's placement) and remove nothing from Nutrition — the double placement is
deliberate (roadmap D3).

## 1.4 Full code — 3 pH articles (LearnContent additions)

Append to the articles array in `UI/Learn/LearnContent.swift`. All three carry the medical
disclaimer (they discuss a health measurement) and pass the banned-phrase scan — note the
copy never says "balance your pH", never links pH to conception odds or a baby's sex, and
calls thin data thin.

```swift
// MARK: - pH education set (v1.0.1)

LearnArticle(
    id: "ph-what-it-measures",
    slug: "what-urine-ph-actually-measures",
    category: .ph, // INTEGRATE: add `.ph` to LearnCategory if not present; update chips
    title: "What urine pH actually measures",
    excerpt: "A calm look at what the number on the strip can — and can't — tell you.",
    heroAsset: "learn_hero_ph_basics", // INTEGRATE: reuse urine diagram asset if no new art
    readMinutes: 4,
    isFeatured: false,
    showsMedicalDisclaimer: true,
    tags: ["ph", "hydration", "basics"],
    body: [
        .paragraph("Urine pH describes how acidic or alkaline your urine is at the moment you test — nothing more. It shifts through the day with meals, hydration, sleep, and time since you last ate."),
        .heading("The range Genesyx uses"),
        .bulletList([
            "Below 6.0 — acidic. Common after protein-heavy meals or first thing in the morning.",
            "6.0 to 7.5 — the typical range for most readings.",
            "Above 7.5 — alkaline. Often follows plant-heavy meals or lots of fluids.",
        ]),
        .callout("One reading is a snapshot, not a verdict. Trends over weeks are what's worth watching."),
        .heading("What it doesn't measure"),
        .paragraph("Urine pH is not a fertility score, and it says nothing about the pH anywhere else in your body. No food or supplement choice you make to shift it has been shown to change your chances of conceiving."),
        .paragraph("If your readings sit persistently outside the typical range, that's worth a conversation with a clinician — bring your log history along; it makes the conversation better."),
    ],
    relatedIDs: ["ph-clean-reading", "ph-reading-trends"],
    cta: .init(label: "Log a pH reading", target: .track)
),

LearnArticle(
    id: "ph-clean-reading",
    slug: "how-to-take-a-clean-ph-reading",
    category: .ph,
    title: "How to take a clean pH reading",
    excerpt: "Small habits that make your readings comparable from day to day.",
    heroAsset: "learn_hero_ph_howto",
    readMinutes: 3,
    isFeatured: false,
    showsMedicalDisclaimer: true,
    tags: ["ph", "how-to", "tracking"],
    body: [
        .paragraph("The value of pH tracking comes from comparing like with like. A few small habits make your numbers meaningful."),
        .heading("Keep the conditions steady"),
        .bulletList([
            "Test at the same time of day — mid-morning is a good default.",
            "Note anything unusual in the reading's notes: a big meal, a workout, poor sleep.",
            "Follow your strip's timing instructions exactly; reading late skews the colour.",
            "Log the reading straight away — Genesyx rounds to one decimal and keeps the timestamp.",
        ]),
        .callout("Genesyx stores every reading on your device first. If you're offline, it queues and syncs later — you never lose one."),
        .heading("When a reading looks odd"),
        .paragraph("A single surprising number is usually just a surprising moment — yesterday's dinner, a hard workout, a short night. Log it, note the context, and let the 7-day average do the judging."),
    ],
    relatedIDs: ["ph-what-it-measures", "ph-reading-trends"],
    cta: .init(label: "Log a pH reading", target: .track)
),

LearnArticle(
    id: "ph-reading-trends",
    slug: "reading-your-ph-trend-over-time",
    category: .ph,
    title: "Reading your pH trend over time",
    excerpt: "How Genesyx turns single strips into a 7- and 30-day picture, and what to do with it.",
    heroAsset: "learn_hero_ph_trends",
    readMinutes: 4,
    isFeatured: false,
    showsMedicalDisclaimer: true,
    tags: ["ph", "insights", "trends"],
    body: [
        .paragraph("On the Insights tab, Genesyx shows your current value, a trend marker against your previous reading, and 7- and 30-day averages. Here's how to read them."),
        .heading("Patterns, not causes"),
        .paragraph("Your chart can show that acidic mornings track short sleep, or that readings settle when hydration is steady. It can't say which caused which — treat it as a pattern-spotter, not a diagnosis."),
        .bulletList([
            "Fewer than a handful of readings? It's early days — too soon to read patterns.",
            "A drifting 7-day average is more meaningful than any single reading.",
            "Steady readings in the typical range mostly mean: keep doing what you're doing.",
        ]),
        .callout("Persistent readings outside the typical range are worth a clinician's eyes. Your log history is exactly what they'll want to see."),
    ],
    relatedIDs: ["ph-what-it-measures", "ph-clean-reading"],
    cta: .init(label: "See your pH insights", target: .insights)
),
```

Test updates (same file conventions as the existing content-safety suite):

```swift
// LearnContentTests.swift — extend the pinned-disclaimer set and the count check.
func testLibraryCount() {
    XCTAssertEqual(LearnLibrary.all.count, 19) // was 16
}

func testPhArticlesCarryDisclaimer() {
    for slug in ["what-urine-ph-actually-measures",
                 "how-to-take-a-clean-ph-reading",
                 "reading-your-ph-trend-over-time"] {
        XCTAssertTrue(LearnLibrary.bySlug(slug)!.showsMedicalDisclaimer, slug)
    }
}
// The existing banned-phrase scan + CTA-target guard pick the new articles up automatically
// as long as they iterate LearnLibrary.all — verify they do, don't special-case.
```

---

# PART 2 — v1.1 Notifications (build 9)

## 2.1 What we're trying to achieve

Ship the notifications system that `feature/notifications` (`3365223`) is 90% of, gated
behind `FeatureFlags.pushNotifications` flipped **ON**, as **build 9**:

- **Four weekly local nudges** (not daily — Brand Contract #6):
  | Day | Slot | Nudge | Deep link |
  |---|---|---|---|
  | Sunday 10:00 | `learn` (primary) | one Learn article tease | Learn tab / article |
  | Monday 09:00 | `ph` | gentle pH log reminder | Track tab |
  | Wednesday 09:00 | `phase` | dynamic copy from current cycle phase | Home tab |
  | Friday 12:00 | `nutrition` | phase-aware food focus | Nutrition tab |
- **Streak milestones**: 7-day and 14-day hydration-streak notifications; each fires **once
  per streak**, resets when the streak breaks, copy is congratulation-only (no guilt at zero,
  no "don't break it!").
- **Pre-prompt** before the iOS system permission dialog (one shot at the system dialog —
  don't waste it).
- **Deep-link routing** through `TabRouter` so a tapped notification lands on the right tab.
- **No hydration push** — the in-app Hydration Coach owns daily water. Adding a push would
  duplicate and nag (explicit roadmap decision; enforce with a test that no nudge id is
  `hydration`).
- All copy passes the banned-phrase scan (it iterates these strings too).

Everything is **local notifications** (`UNUserNotificationCenter`) — no server, no APNs
infrastructure needed for v1.1. The `pushEnabled` preference finally gets its consumer.

## 2.2 Step-by-step

1. `git checkout feature/notifications && git rebase claude/blissful-carson-wsdb54`
   (or merge baseline in; then `xcodegen generate` — never hand-merge `project.pbxproj`).
2. Diff the branch against §2.3's reference implementation; fill gaps (typically: milestone
   reset logic, Wednesday dynamic-copy rescheduling, pre-prompt, tests).
3. Flip the flag: `FeatureFlags.pushNotifications = true`.
4. Wire the Profile toggle: ON → run permission flow (§2.3.4) then schedule; OFF → cancel
   all pending Genesyx notifications (§2.3.3 `cancelAll`).
5. Re-schedule on every app foreground (`scenePhase == .active`): refreshes the Wednesday
   phase copy and repairs anything iOS pruned.
6. Add `NotificationLogicTests` + copy-scan coverage (§2.3.6); run full suite — target is
   all green including the existing 60.
7. **Device test** (simulator won't cut it for permission UX):
   - fresh install → toggle ON → pre-prompt → system dialog → accept → check
     `pending` list contains 4 weekly requests;
   - deny path → toggle shows OFF + "enable in Settings" affordance;
   - tap each nudge → correct tab opens;
   - log water 7 days (or temporarily shrink the milestone constant) → milestone fires once;
   - break streak, rebuild → milestone can fire again.
8. Bump `CURRENT_PROJECT_VERSION` to 9, `MARKETING_VERSION` 1.1.0 in `project.yml`,
   `xcodegen generate`, archive.
9. **Hold submission until v1.0 clears review**, then submit build 9.

## 2.3 Full code

### 2.3.1 `Notifications/NotificationCopy.swift` — the copy catalog

```swift
import Foundation

/// All notification copy lives here so the content-safety scan can iterate one surface.
/// Tone rules: calm, non-nagging, no guilt, no health claims, ovulation is "predicted".
enum NotificationCopy {

    struct Nudge: Identifiable, Equatable {
        let id: String            // stable — used as UNNotificationRequest identifier
        let weekday: Int          // 1 = Sunday … 7 = Saturday (Calendar.current)
        let hour: Int
        let title: String
        let body: String
        let deepLink: NotificationDeepLink
    }

    static let learn = Nudge(
        id: "nudge.learn", weekday: 1, hour: 10,
        title: "Five calm minutes",
        body: "One short read this week: understanding your cycle, one gentle step at a time.",
        deepLink: .learn
    )

    static let ph = Nudge(
        id: "nudge.ph", weekday: 2, hour: 9,
        title: "A quick pH check-in",
        body: "If you have a strip handy, one reading keeps your trend honest. Thirty seconds, done.",
        deepLink: .track
    )

    /// Wednesday phase nudge — body is dynamic, resolved at scheduling time.
    static func phase(for phase: CyclePhase?) -> Nudge {
        let body: String
        switch phase {
        case .period:
            body = "A gentler stretch of your cycle. Rest counts as progress this week."
        case .follicular:
            body = "Energy often builds in this phase. A good week to notice what feels easier."
        case .ovulatory:
            body = "You're near your predicted fertile window. Your calendar has the details."
        case .luteal:
            body = "The winding-down phase. Slower days here are typical — your log tells the story."
        case nil:
            body = "Add your last period date and Genesyx can show you where you are in your cycle."
        }
        return Nudge(
            id: "nudge.phase", weekday: 4, hour: 9,
            title: "Where you are this week",
            body: body,
            deepLink: .home
        )
    }

    static let nutrition = Nudge(
        id: "nudge.nutrition", weekday: 6, hour: 12,
        title: "This week's food focus",
        body: "Your phase has a food focus waiting — small additions, no overhauls.",
        deepLink: .nutrition
    )

    /// Streak milestones — congratulation only. Never mention breaking or losing a streak.
    static func milestone(days: Int) -> (id: String, title: String, body: String)? {
        switch days {
        case 7:  return ("milestone.7",
                         "A full week of check-ins",
                         "Seven days of steady hydration logging. Quiet consistency — that's the whole game.")
        case 14: return ("milestone.14",
                         "Two weeks strong",
                         "Fourteen days of showing up for yourself. Your insights get sharper with every one.")
        default: return nil
        }
    }

    /// Every string the scan should see, in one place.
    static func allVisibleStrings(sampledPhases: [CyclePhase?] = [.period, .follicular, .ovulatory, .luteal, nil]) -> [String] {
        var strings: [String] = []
        for n in [learn, ph, nutrition] { strings += [n.title, n.body] }
        for p in sampledPhases { let n = phase(for: p); strings += [n.title, n.body] }
        for d in [7, 14] { if let m = milestone(days: d) { strings += [m.title, m.body] } }
        return strings
    }
}

enum NotificationDeepLink: String {
    case home, track, nutrition, insights, learn
}
```

### 2.3.2 `Notifications/NotificationLogic.swift` — pure, testable

```swift
import Foundation

/// Pure decisions: what should be scheduled, and whether a milestone may fire.
/// No UNUserNotificationCenter, no I/O — mirrors the *Logic.swift testing discipline.
enum NotificationLogic {

    /// The weekly set. Exactly four; never a hydration nudge (Hydration Coach owns water).
    static func weeklyNudges(currentPhase: CyclePhase?) -> [NotificationCopy.Nudge] {
        [
            NotificationCopy.learn,
            NotificationCopy.ph,
            NotificationCopy.phase(for: currentPhase),
            NotificationCopy.nutrition,
        ]
    }

    /// Milestone gating: fire once per streak, re-armed only after the streak breaks.
    /// - streak: current consecutive-day hydration streak (0 when broken)
    /// - lastFiredStreakStart: the streak-start date for which each milestone last fired
    struct MilestoneState: Codable, Equatable {
        var firedSevenForStreakStart: Date?
        var firedFourteenForStreakStart: Date?
    }

    struct MilestoneDecision: Equatable {
        let days: Int
        let newState: MilestoneState
    }

    static func milestoneToFire(
        streak: Int,
        streakStart: Date?,
        state: MilestoneState
    ) -> MilestoneDecision? {
        guard let start = streakStart, streak > 0 else { return nil }
        if streak >= 14, state.firedFourteenForStreakStart != start {
            var s = state; s.firedFourteenForStreakStart = start
            return MilestoneDecision(days: 14, newState: s)
        }
        if streak >= 7, streak < 14, state.firedSevenForStreakStart != start {
            var s = state; s.firedSevenForStreakStart = start
            return MilestoneDecision(days: 7, newState: s)
        }
        return nil
    }

    /// Next trigger date components for a weekly nudge (repeating calendar trigger).
    static func triggerComponents(for nudge: NotificationCopy.Nudge) -> DateComponents {
        var c = DateComponents()
        c.weekday = nudge.weekday
        c.hour = nudge.hour
        c.minute = 0
        return c
    }
}
```

### 2.3.3 `Notifications/NotificationScheduler.swift` — the only file touching UNUserNotificationCenter

```swift
import Foundation
import UserNotifications

/// Owns scheduling. Call `refresh()` on app foreground and after the Profile toggle changes.
@MainActor
final class NotificationScheduler {
    static let shared = NotificationScheduler()
    private let center = UNUserNotificationCenter.current()
    private let genesyxIDs = ["nudge.learn", "nudge.ph", "nudge.phase", "nudge.nutrition"]

    // INTEGRATE: inject real dependencies (PreferencesRepository, CycleEngine/CycleRepository,
    // DailyLogRepository) instead of reaching for singletons if your DI differs.
    var preferences: PreferencesRepository = .shared
    var cycleProvider: () -> CyclePhase? = { CycleEngine.currentPhase() }
    var streakProvider: () -> (streak: Int, start: Date?) = { DailyLogRepository.shared.hydrationStreak() }

    private let milestoneStateKey = "notifications.milestoneState"

    func refresh() async {
        guard FeatureFlags.pushNotifications, preferences.pushEnabled else {
            await cancelAll()
            return
        }
        let settings = await center.notificationSettings()
        guard settings.authorizationStatus == .authorized ||
              settings.authorizationStatus == .provisional else { return }

        await scheduleWeeklyNudges()
        await fireMilestoneIfDue()
    }

    private func scheduleWeeklyNudges() async {
        // Replace-in-place: removing + re-adding keeps the Wednesday phase copy current.
        center.removePendingNotificationRequests(withIdentifiers: genesyxIDs)
        for nudge in NotificationLogic.weeklyNudges(currentPhase: cycleProvider()) {
            let content = UNMutableNotificationContent()
            content.title = nudge.title
            content.body = nudge.body
            content.sound = .default
            content.userInfo = ["deepLink": nudge.deepLink.rawValue]
            let trigger = UNCalendarNotificationTrigger(
                dateMatching: NotificationLogic.triggerComponents(for: nudge),
                repeats: true
            )
            try? await center.add(UNNotificationRequest(
                identifier: nudge.id, content: content, trigger: trigger))
        }
    }

    private func fireMilestoneIfDue() async {
        let (streak, start) = streakProvider()
        var state = loadMilestoneState()
        guard let decision = NotificationLogic.milestoneToFire(
            streak: streak, streakStart: start, state: state),
              let copy = NotificationCopy.milestone(days: decision.days) else { return }

        state = decision.newState
        saveMilestoneState(state)

        let content = UNMutableNotificationContent()
        content.title = copy.title
        content.body = copy.body
        content.sound = .default
        content.userInfo = ["deepLink": NotificationDeepLink.home.rawValue]
        // Short delay so it doesn't fire mid-interaction the instant the log saves.
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 60, repeats: false)
        try? await center.add(UNNotificationRequest(
            identifier: copy.id, content: content, trigger: trigger))
    }

    func cancelAll() async {
        center.removePendingNotificationRequests(
            withIdentifiers: genesyxIDs + ["milestone.7", "milestone.14"])
    }

    // MARK: milestone state persistence (UserDefaults via preferences store)
    private func loadMilestoneState() -> NotificationLogic.MilestoneState {
        guard let data = UserDefaults.standard.data(forKey: milestoneStateKey),
              let s = try? JSONDecoder().decode(NotificationLogic.MilestoneState.self, from: data)
        else { return .init() }
        return s
    }
    private func saveMilestoneState(_ s: NotificationLogic.MilestoneState) {
        UserDefaults.standard.set(try? JSONEncoder().encode(s), forKey: milestoneStateKey)
    }
}
```

### 2.3.4 `Notifications/NotificationPrePromptView.swift` — one shot at the system dialog

```swift
import SwiftUI
import UserNotifications

/// Shown when the user flips the Profile toggle ON and we've never asked the system.
/// Explains value first; only the "Turn on" button triggers the real permission dialog.
struct NotificationPrePromptView: View {
    let onDecision: (Bool) -> Void   // true = user accepted the system dialog
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "bell.badge")
                .font(.system(size: 40))
                .foregroundStyle(Color.brandLavender) // INTEGRATE: theme token
                .padding(.top, 32)

            Text("Gentle weekly nudges")
                .font(.title3.weight(.semibold))

            VStack(alignment: .leading, spacing: 10) {
                bullet("One short read on Sundays")
                bullet("A pH check-in on Mondays")
                bullet("Where you are in your cycle, midweek")
                bullet("Your food focus on Fridays")
            }
            .padding(.horizontal, 8)

            Text("Four a week, never daily. You can switch them off anytime.")
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)

            Button {
                Task {
                    let granted = (try? await UNUserNotificationCenter.current()
                        .requestAuthorization(options: [.alert, .sound, .badge])) ?? false
                    onDecision(granted)
                    dismiss()
                }
            } label: {
                Text("Turn on notifications")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)

            Button("Not now") {
                onDecision(false)
                dismiss()
            }
            .font(.subheadline)
            .foregroundStyle(.secondary)
            .padding(.bottom, 16)
        }
        .padding(24)
        .presentationDetents([.medium])
    }

    private func bullet(_ text: String) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Image(systemName: "checkmark").font(.caption.weight(.bold))
                .foregroundStyle(Color.brandLavender)
                .padding(.top, 2)
            Text(text).font(.subheadline)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}
```

Profile toggle wiring (in `ProfileView`):

```swift
Toggle("Push Notifications", isOn: $pushEnabled)
    .onChange(of: pushEnabled) { enabled in
        if enabled {
            Task {
                let status = await UNUserNotificationCenter.current()
                    .notificationSettings().authorizationStatus
                switch status {
                case .notDetermined:
                    showPrePrompt = true                 // sheet → NotificationPrePromptView
                case .denied:
                    pushEnabled = false                   // revert; system-level off
                    showSettingsAlert = true              // "Enable in Settings" + openURL
                default:
                    preferences.pushEnabled = true
                    await NotificationScheduler.shared.refresh()
                }
            }
        } else {
            preferences.pushEnabled = false
            Task { await NotificationScheduler.shared.cancelAll() }
        }
    }
.sheet(isPresented: $showPrePrompt) {
    NotificationPrePromptView { granted in
        pushEnabled = granted
        preferences.pushEnabled = granted
        if granted { Task { await NotificationScheduler.shared.refresh() } }
    }
}
```

### 2.3.5 Deep-link routing (App delegate → `TabRouter`)

```swift
// In the UNUserNotificationCenterDelegate (App or dedicated delegate object):
func userNotificationCenter(_ center: UNUserNotificationCenter,
                            didReceive response: UNNotificationResponse) async {
    guard let raw = response.notification.request.content.userInfo["deepLink"] as? String,
          let link = NotificationDeepLink(rawValue: raw) else { return }
    // INTEGRATE: TabRouter is the existing navigation coordinator used by article CTAs.
    await MainActor.run {
        switch link {
        case .home:      TabRouter.shared.select(.home)
        case .track:     TabRouter.shared.select(.track)
        case .nutrition: TabRouter.shared.select(.nutrition)
        case .insights:  TabRouter.shared.select(.insights)
        case .learn:     TabRouter.shared.select(.learn)
        }
    }
}

// App foreground refresh (in the App struct):
.onChange(of: scenePhase) { phase in
    if phase == .active { Task { await NotificationScheduler.shared.refresh() } }
}
```

### 2.3.6 Tests — `NotificationLogicTests.swift`

```swift
import XCTest
@testable import Genesyx

final class NotificationLogicTests: XCTestCase {

    // Exactly four weekly nudges; hydration must never be one of them (roadmap decision).
    func testWeeklySetIsFourAndHasNoHydrationNudge() {
        let nudges = NotificationLogic.weeklyNudges(currentPhase: .luteal)
        XCTAssertEqual(nudges.count, 4)
        XCTAssertFalse(nudges.contains { $0.id.localizedCaseInsensitiveContains("hydration") })
        XCTAssertEqual(Set(nudges.map(\.id)).count, 4) // unique ids
    }

    func testScheduleMatchesRoadmap() {
        let byID = Dictionary(uniqueKeysWithValues:
            NotificationLogic.weeklyNudges(currentPhase: nil).map { ($0.id, $0) })
        XCTAssertEqual(byID["nudge.learn"]?.weekday, 1)      // Sunday
        XCTAssertEqual(byID["nudge.ph"]?.weekday, 2)         // Monday
        XCTAssertEqual(byID["nudge.phase"]?.weekday, 4)      // Wednesday
        XCTAssertEqual(byID["nudge.nutrition"]?.weekday, 6)  // Friday
    }

    func testPhaseNudgeCopyIsDynamic() {
        let period = NotificationCopy.phase(for: .period).body
        let luteal = NotificationCopy.phase(for: .luteal).body
        XCTAssertNotEqual(period, luteal)
        XCTAssertTrue(NotificationCopy.phase(for: .ovulatory).body
            .localizedCaseInsensitiveContains("predicted")) // honesty standard
    }

    func testMilestoneFiresOncePerStreak() {
        let start = Date(timeIntervalSince1970: 1_700_000_000)
        var state = NotificationLogic.MilestoneState()

        let first = NotificationLogic.milestoneToFire(streak: 7, streakStart: start, state: state)
        XCTAssertEqual(first?.days, 7)
        state = first!.newState

        // Same streak, day 8 → nothing.
        XCTAssertNil(NotificationLogic.milestoneToFire(streak: 8, streakStart: start, state: state))

        // Day 14 of the same streak → the 14-day milestone.
        let second = NotificationLogic.milestoneToFire(streak: 14, streakStart: start, state: state)
        XCTAssertEqual(second?.days, 14)
        state = second!.newState

        // Streak breaks (0) → nothing; new streak (new start) re-arms the 7-day.
        XCTAssertNil(NotificationLogic.milestoneToFire(streak: 0, streakStart: nil, state: state))
        let newStart = start.addingTimeInterval(30 * 86_400)
        let rearmed = NotificationLogic.milestoneToFire(streak: 7, streakStart: newStart, state: state)
        XCTAssertEqual(rearmed?.days, 7)
    }

    // Content safety: notification copy goes through the same banned-phrase scan.
    func testNotificationCopyPassesBannedPhraseScan() {
        // INTEGRATE: reuse the project's existing banned-phrase list/helper.
        let banned = ["alkaline diet", "balance your ph", "boy or girl", "sex selection",
                      "gender sway", "sway the sex", "choose the sex", "detox", "flush toxins"]
        for string in NotificationCopy.allVisibleStrings() {
            for phrase in banned {
                XCTAssertFalse(string.localizedCaseInsensitiveContains(phrase),
                               "\"\(string)\" contains banned phrase \"\(phrase)\"")
            }
        }
    }

    // Tone guard: milestones never guilt.
    func testMilestoneCopyNeverGuilts() {
        for d in [7, 14] {
            let m = NotificationCopy.milestone(days: d)!
            for word in ["break", "lose", "don't miss", "streak at risk"] {
                XCTAssertFalse(m.body.localizedCaseInsensitiveContains(word))
            }
        }
    }
}
```

## 2.4 Ship checklist (build 9)

- [ ] `FeatureFlags.pushNotifications = true`
- [ ] All tests green (existing 60 + NotificationLogicTests + updated content counts)
- [ ] Device pass per §2.2 step 7 (permission accept/deny, 4 pending requests, deep links, milestone once-per-streak)
- [ ] Toggle OFF cancels everything (`center.pendingNotificationRequests` empty of Genesyx ids)
- [ ] `project.yml`: `MARKETING_VERSION 1.1.0`, `CURRENT_PROJECT_VERSION 9` → `xcodegen generate`
- [ ] Archive, validate, upload; **submit only after v1.0 clears review**
- [ ] App Store "What's New": weekly nudges framing ("Four gentle weekly check-ins — never daily")

---

# What comes after (queued guides, same format)

1. **v1.2 guide** — real cycle history schema + multi-cycle regularity chart, `SupplementPlanService`, real Supabase credentials swap (mock → live auth), Insights polish.
2. **v2.0 briefs** — pregnancy mode (due date → trimester engine), partner linking (Supabase invites, the deep link is already registered), StoreKit 2 premium entitlements, admin clients.

Say which one you want next and it will arrive as: goal → step-by-step → full code.
