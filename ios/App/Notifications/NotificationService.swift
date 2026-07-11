// NotificationService.swift
// Target path: App/Genesyx/Notifications/NotificationService.swift
//
// WS2 §4 — permission flow, scheduling, cancel, reconcile, and the smart daily
// hydration suppression. Everything is LOCAL (UNUserNotificationCenter) — no APNs.
//
// Invariants enforced here (§8):
//  - guard FeatureFlags.pushNotifications on every entry point
//  - never more than one hydration nudge per day; suppressed once water is logged
//  - milestones fire once; flags persist; lapsed flags cleared so re-achieving re-fires
//  - no prompt at launch — permission only via the Profile toggle's pre-prompt

import Foundation
import UserNotifications

@MainActor
public final class NotificationService: NSObject, ObservableObject, UNUserNotificationCenterDelegate {

    public static let shared = NotificationService()

    // INTEGRATE: swap these for the app's real dependency wiring.
    var preferences: PreferencesRepository = .shared
    var dailyLogs: DailyLogRepository = .shared
    var phRepository: PhRepository = .shared
    var cycleEngine: () -> String? = { CycleEngine.currentPhaseDisplayName() } // e.g. "luteal"
    var learnSlugs: () -> [String] = { LearnLibrary.all.map(\.slug) }
    var router: NotificationRouter = .init()

    private let center = UNUserNotificationCenter.current()

    @Published public private(set) var systemAuthorized = false

    // MARK: - Permission (review-critical flow, §4)

    /// Called ONLY from the pre-prompt sheet's "Turn on" button — never at launch.
    public func requestPermission() async -> Bool {
        guard FeatureFlags.pushNotifications else { return false }
        let granted = (try? await center.requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        systemAuthorized = granted
        preferences.pushEnabled = granted
        if granted { await refresh() }
        return granted
    }

    /// True when the user must be sent to Settings (system-denied).
    public func isSystemDenied() async -> Bool {
        await center.notificationSettings().authorizationStatus == .denied
    }

    // MARK: - Reconcile + schedule (call on every app foreground)

    /// Reconciles system permission vs the pushEnabled preference vs the pending
    /// set, refreshes dynamic copy (phase, Learn rotation), applies hydration
    /// suppression, and fires any newly crossed streak milestones.
    public func refresh(today: CalendarDate = .today(), isoWeek: Int = Calendar(identifier: .iso8601).component(.weekOfYear, from: Date())) async {
        guard FeatureFlags.pushNotifications else { return }

        let settings = await center.notificationSettings()
        systemAuthorized = settings.authorizationStatus == .authorized
            || settings.authorizationStatus == .provisional

        guard systemAuthorized, preferences.pushEnabled else {
            await cancelAll()
            return
        }

        await scheduleRepeating(today: today, isoWeek: isoWeek)
        await fireMilestonesIfCrossed(today: today)
    }

    public func cancelAll() async {
        center.removePendingNotificationRequests(withIdentifiers: NotificationID.all)
    }

    // MARK: - Repeating set

    private func scheduleRepeating(today: CalendarDate, isoWeek: Int) async {
        var specs: [NotificationSpec] = [
            NotificationContent.weeklyPh,
            NotificationContent.weeklyPhase(phaseName: cycleEngine()),
            NotificationContent.weeklyNutrition,
            NotificationContent.weeklyLearn(articleSlugs: learnSlugs(), isoWeek: isoWeek),
        ]

        // Smart hydration nudge: schedule the repeating 10:00 trigger only while
        // today's water is still zero. Once she logs water, the pending request is
        // removed for the rest of the day; tomorrow's refresh re-adds it.
        if dailyLogs.waterMl(on: today) == 0 {
            specs.append(NotificationContent.dailyHydration)
        } else {
            center.removePendingNotificationRequests(withIdentifiers: [NotificationID.dailyHydration])
        }

        // Replace-in-place keeps dynamic copy fresh without duplicating requests.
        center.removePendingNotificationRequests(withIdentifiers: specs.map(\.id))
        for spec in specs {
            guard let schedule = spec.schedule else { continue }
            let content = UNMutableNotificationContent()
            content.title = spec.title
            content.body = spec.body
            content.sound = .default
            content.userInfo = spec.route.userInfo
            let trigger = UNCalendarNotificationTrigger(dateMatching: schedule, repeats: true)
            try? await center.add(UNNotificationRequest(identifier: spec.id, content: content, trigger: trigger))
        }
    }

    // MARK: - Milestones (read from StreakEngine, fire once)

    private func fireMilestonesIfCrossed(today: CalendarDate) async {
        let state = StreakEngine.compute(
            logsByDate: dailyLogs.logsByDate(),
            phByDate: phRepository.readingDates(),
            today: today,
            celebrated: preferences.celebratedMilestones
        )

        // Clear lapsed flags so a re-achieved streak celebrates again (§3).
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
            // Small delay so a save that crossed the threshold isn't interrupted.
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 60, repeats: false)
            try? await center.add(UNNotificationRequest(identifier: spec.id, content: content, trigger: trigger))
            preferences.celebratedMilestones.insert(milestone.flagKey)
        }
    }

    // MARK: - UNUserNotificationCenterDelegate

    /// Foreground suppression: if the hydration nudge fires while the app is open
    /// and water is already logged, show nothing. All other nudges present normally.
    public nonisolated func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        let id = notification.request.identifier
        if id == NotificationID.dailyHydration {
            Task { @MainActor in
                let logged = self.dailyLogs.waterMl(on: .today()) > 0
                completionHandler(logged ? [] : [.banner, .sound])
            }
            return
        }
        completionHandler([.banner, .sound])
    }

    /// Tap → route.
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
