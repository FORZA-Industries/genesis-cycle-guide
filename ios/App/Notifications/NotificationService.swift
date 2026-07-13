// NotificationService.swift
// Target path: App/Genesyx/Notifications/NotificationService.swift
//
// WS2 §4 as amended by the Phase-4 ruling: single daily evening reminder
// (user-configurable, default 19:00) replacing the 10:00 hydration nudge.
// All planning decisions live in NotificationPlanner (pure); this file is the
// only one touching UNUserNotificationCenter.
//
// Invariants (asserted by tests): ≤1 push per day; never two hydration-
// flavoured notifications on one day; never-guilt copy; permission requested
// contextually from the Profile toggle's pre-prompt, never at launch;
// milestones fire once with lapse/re-fire.

import Foundation
import UserNotifications

@MainActor
public final class NotificationService: NSObject, ObservableObject, UNUserNotificationCenterDelegate {

    public static let shared = NotificationService()

    // INTEGRATE: swap for the app's real dependency wiring.
    var preferences: PreferencesRepository = .shared
    var dailyLogs: DailyLogRepository = .shared
    var phRepository: PhRepository = .shared
    var cycleEngine: () -> String? = { CycleEngine.currentPhaseDisplayName() }
    var learnSlugs: () -> [String] = { LearnLibrary.all.map(\.slug) }
    var router: NotificationRouter = .init()

    private let center = UNUserNotificationCenter.current()

    @Published public private(set) var systemAuthorized = false

    // MARK: - Permission (contextual only — from the pre-prompt sheet)

    public func requestPermission() async -> Bool {
        guard FeatureFlags.pushNotifications else { return false }
        let granted = (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        systemAuthorized = granted
        preferences.pushEnabled = granted
        if granted { await refresh() }
        return granted
    }

    public func isSystemDenied() async -> Bool {
        await center.notificationSettings().authorizationStatus == .denied
    }

    // MARK: - Reminder time preference (Profile → Notifications)

    /// Changing the time reschedules the pending evening reminders immediately.
    public func setReminderTime(_ time: ReminderTime) async {
        preferences.reminderTime = time
        await refresh()
    }

    // MARK: - Reconcile + schedule (call on every app foreground)

    public func refresh(
        today: CalendarDate = .today(),
        isoWeek: Int = Calendar(identifier: .iso8601).component(.weekOfYear, from: Date())
    ) async {
        guard FeatureFlags.pushNotifications else { return }

        let settings = await center.notificationSettings()
        systemAuthorized = settings.authorizationStatus == .authorized
            || settings.authorizationStatus == .provisional

        guard systemAuthorized, preferences.pushEnabled else {
            await cancelAll()
            return
        }

        // Evening branch is evaluated NOW (schedule/refresh time). If state
        // changes before the fire time, willPresent re-checks and suppresses.
        // (Optional hardening: a BGAppRefreshTask nearer the reminder time can
        // re-run this refresh so the branch copy is fresher.)
        let branch = NotificationPlanner.eveningBranch(
            hasMeaningfulLogToday: dailyLogs.hasMeaningfulLog(on: today),
            waterMlToday: dailyLogs.waterMl(on: today),
            waterGoalMl: preferences.waterGoalMl // default 2400
        )

        let plan = NotificationPlanner.plan(
            phaseName: cycleEngine(),
            articleSlugs: learnSlugs(),
            isoWeek: isoWeek,
            branch: branch,
            reminderTime: preferences.reminderTime
        )

        // Replace-in-place; also clears the superseded 10:00 legacy request and
        // any evening slots the current branch/plan no longer wants.
        center.removePendingNotificationRequests(withIdentifiers: NotificationID.all
            .filter { !$0.hasPrefix("genesyx.milestone.") })
        for spec in plan {
            guard let schedule = spec.schedule else { continue }
            let content = UNMutableNotificationContent()
            content.title = spec.title
            content.body = spec.body
            content.sound = .default
            content.userInfo = spec.route.userInfo
            let trigger = UNCalendarNotificationTrigger(dateMatching: schedule, repeats: true)
            try? await center.add(UNNotificationRequest(identifier: spec.id, content: content, trigger: trigger))
        }

        await fireMilestonesIfCrossed(today: today)
    }

    public func cancelAll() async {
        center.removePendingNotificationRequests(withIdentifiers: NotificationID.all)
    }

    // MARK: - Milestones (unchanged: fire once, lapse re-arms)

    private func fireMilestonesIfCrossed(today: CalendarDate) async {
        let state = StreakEngine.compute(
            logsByDate: dailyLogs.logsByDate(),
            phByDate: phRepository.readingDates(),
            today: today,
            celebrated: preferences.celebratedMilestones
        )
        for key in state.lapsedCelebrations {
            preferences.celebratedMilestones.remove(key)
        }
        for milestone in state.milestones {
            let spec = NotificationContent.milestone(milestone)
            let content = UNMutableNotificationContent()
            content.title = spec.title
            content.body = spec.body
            content.sound = .default
            content.userInfo = spec.route.userInfo
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 60, repeats: false)
            try? await center.add(UNNotificationRequest(identifier: spec.id, content: content, trigger: trigger))
            preferences.celebratedMilestones.insert(milestone.flagKey)
        }
    }

    // MARK: - UNUserNotificationCenterDelegate

    /// Fire-time re-check for the evening reminder while the app is foreground:
    /// if the scheduled branch no longer applies (she logged / met goal since
    /// the last refresh), present nothing.
    public nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let id = notification.request.identifier
        if id.hasPrefix("genesyx.daily.reminder") || id == NotificationID.legacyDailyHydration {
            Task { @MainActor in
                let today = CalendarDate.today()
                let branch = NotificationPlanner.eveningBranch(
                    hasMeaningfulLogToday: self.dailyLogs.hasMeaningfulLog(on: today),
                    waterMlToday: self.dailyLogs.waterMl(on: today),
                    waterGoalMl: self.preferences.waterGoalMl
                )
                completionHandler(branch == .none ? [] : [.banner, .sound])
            }
            return
        }
        completionHandler([.banner, .sound])
    }

    public nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        Task { @MainActor in
            if let route = NotificationRoute.from(userInfo: userInfo) {
                self.router.open(route)
            }
            completionHandler()
        }
    }
}
