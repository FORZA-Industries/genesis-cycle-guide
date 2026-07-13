// NotificationContent.swift
// Target path: App/Genesyx/Notifications/NotificationContent.swift
//
// WS2 §4 as amended by the Phase-4 ruling (July 13, 2026): the 10:00 morning
// hydration nudge is RETIMED into a single user-configurable evening reminder
// (default 19:00) with two-branch content — replace, not add. One daily slot
// total. Copy rules: behavioural invitations only; the never-guilt invariant
// WINS over any spec wording — copy never names what she lost or hasn't done.

import Foundation

public enum NotificationID {
    /// Weekday-specific evening reminder ids (a single repeating daily trigger
    /// can't skip weekly-push days, so the planner schedules per-weekday).
    public static func eveningReminder(weekday: Int) -> String { "genesyx.daily.reminder.\(weekday)" }
    public static let weeklyPh = "genesyx.weekly.ph"
    public static let weeklyPhase = "genesyx.weekly.phase"
    public static let weeklyNutrition = "genesyx.weekly.nutrition"
    public static let weeklyLearn = "genesyx.weekly.learn"
    public static func milestone(_ m: Milestone) -> String { "genesyx.milestone.\(m.rawValue)" }

    /// Legacy id from the superseded 10:00 design — kept ONLY so refresh() can
    /// cancel stale pending requests left by earlier builds.
    public static let legacyDailyHydration = "genesyx.daily.hydration"

    public static var all: [String] {
        (1...7).map(eveningReminder(weekday:))
            + [weeklyPh, weeklyPhase, weeklyNutrition, weeklyLearn, legacyDailyHydration]
            + Milestone.allCases.map(milestone)
    }
}

public struct NotificationSpec: Equatable {
    public let id: String
    public let title: String
    public let body: String
    public let route: NotificationRoute
    public let schedule: DateComponents?   // nil = one-shot (milestones)
}

public enum NotificationRoute: Equatable {
    case home, track, nutrition, insights
    case log                                // evening log invitation opens the Log sheet
    case learn(slug: String?)

    public var userInfo: [String: String] {
        switch self {
        case .home: return ["route": "home"]
        case .track: return ["route": "track"]
        case .nutrition: return ["route": "nutrition"]
        case .insights: return ["route": "insights"]
        case .log: return ["route": "log"]
        case .learn(let slug):
            var info = ["route": "learn"]
            if let slug { info["slug"] = slug }
            return info
        }
    }

    public static func from(userInfo: [AnyHashable: Any]) -> NotificationRoute? {
        switch userInfo["route"] as? String {
        case "home": return .home
        case "track": return .track
        case "nutrition": return .nutrition
        case "insights": return .insights
        case "log": return .log
        case "learn": return .learn(slug: userInfo["slug"] as? String)
        default: return nil
        }
    }
}

/// The user's daily reminder time (Profile → Notifications). Default 19:00.
public struct ReminderTime: Codable, Equatable {
    public var hour: Int
    public var minute: Int
    public static let `default` = ReminderTime(hour: 19, minute: 0)
    public init(hour: Int, minute: Int) { self.hour = hour; self.minute = minute }
}

/// Which branch of the evening reminder applies (decided at schedule time,
/// re-checked in willPresent).
public enum EveningReminderBranch: Equatable {
    case logInvitation      // no meaningful log today
    case hydrationTopUp     // meaningful log exists, water < goal
    case none               // fully logged, goal met → no notification
}

public enum NotificationContent {

    private static func weekly(_ weekday: Int, _ hour: Int) -> DateComponents {
        var c = DateComponents(); c.weekday = weekday; c.hour = hour; c.minute = 0; return c
    }

    // MARK: Evening reminder (the ONE daily slot — replaces the 10:00 nudge)

    /// Copy for each branch. Invitations only — never "you haven't", never what
    /// she missed. British English, matches the app's existing tone.
    public static func eveningReminder(
        branch: EveningReminderBranch,
        weekday: Int,
        time: ReminderTime
    ) -> NotificationSpec? {
        var schedule = DateComponents()
        schedule.weekday = weekday
        schedule.hour = time.hour
        schedule.minute = time.minute

        switch branch {
        case .logInvitation:
            return NotificationSpec(
                id: NotificationID.eveningReminder(weekday: weekday),
                title: "A quiet minute to log today?",
                body: "One small entry — mood, water, anything — keeps your picture going.",
                route: .log,
                schedule: schedule
            )
        case .hydrationTopUp:
            return NotificationSpec(
                id: NotificationID.eveningReminder(weekday: weekday),
                title: "A gentle top-up?",
                body: "A glass of water this evening sits nicely with your day.",
                route: .nutrition,
                schedule: schedule
            )
        case .none:
            return nil
        }
    }

    // MARK: Weekly set (unchanged by the ruling)

    public static let weeklyPh = NotificationSpec(
        id: NotificationID.weeklyPh,
        title: "Log your pH",
        body: "A weekly reading keeps your trend honest.",
        route: .track,
        schedule: weekly(2, 9)
    )

    public static func weeklyPhase(phaseName: String?) -> NotificationSpec {
        NotificationSpec(
            id: NotificationID.weeklyPhase,
            title: "Where are you in your cycle?",
            body: phaseName.map { "You're in your \($0) phase — see what to expect." }
                ?? "Set up your cycle to see where you are — it takes one date.",
            route: .track,
            schedule: weekly(4, 8)
        )
    }

    public static let weeklyNutrition = NotificationSpec(
        id: NotificationID.weeklyNutrition,
        title: "Check your nutrition",
        body: "Small phase-aware shifts this week.",
        route: .nutrition,
        schedule: weekly(6, 12)
    )

    public static func weeklyLearn(articleSlugs: [String], isoWeek: Int) -> NotificationSpec {
        let slug = articleSlugs.isEmpty ? nil
            : articleSlugs[((isoWeek % articleSlugs.count) + articleSlugs.count) % articleSlugs.count]
        return NotificationSpec(
            id: NotificationID.weeklyLearn,
            title: "A new read for your week",
            body: "A short article picked for this week is waiting in Learn.",
            route: .learn(slug: slug),
            schedule: weekly(1, 9)
        )
    }

    // MARK: Milestones (unchanged)

    public static func milestone(_ m: Milestone) -> NotificationSpec {
        let (title, body): (String, String)
        switch m {
        case .day7:
            (title, body) = ("One week strong",
                             "Seven days of hydration logging in a row. Quiet consistency — that's the whole game.")
        case .day14:
            (title, body) = ("Two weeks in",
                             "Fourteen straight days logged. Your insights get sharper with every one.")
        case .week1:
            (title, body) = ("A full steady week",
                             "You logged five or more days this week. That's exactly the rhythm that works.")
        case .week4:
            (title, body) = ("Four weeks of showing up",
                             "A month of steady weeks. Your patterns are becoming genuinely readable.")
        }
        return NotificationSpec(id: NotificationID.milestone(m), title: title, body: body,
                                route: .insights, schedule: nil)
    }

    /// Every visible string for the banned-phrase + never-guilt scans.
    public static func allVisibleStrings(
        samplePhases: [String?] = ["period", "follicular", "ovulatory", "luteal", nil],
        sampleSlugs: [String] = ["your-first-week-with-genesyx"]
    ) -> [String] {
        var specs: [NotificationSpec] = [weeklyPh, weeklyNutrition]
        specs += samplePhases.map { weeklyPhase(phaseName: $0) }
        specs.append(weeklyLearn(articleSlugs: sampleSlugs, isoWeek: 1))
        specs += Milestone.allCases.map(milestone)
        for branch in [EveningReminderBranch.logInvitation, .hydrationTopUp] {
            if let s = eveningReminder(branch: branch, weekday: 3, time: .default) {
                specs.append(s)
            }
        }
        return specs.flatMap { [$0.title, $0.body] }
    }
}

// MARK: - NotificationPlanner (pure, testable)

/// Decides the full repeating schedule while enforcing the global invariants:
///   · at most ONE push per calendar day
///   · never two hydration-flavoured notifications on the same day
/// Weekly nudges own their weekdays (Sun/Mon/Wed/Fri); the evening reminder is
/// scheduled only on the remaining weekdays (Tue/Thu/Sat). FLAGGED for product
/// confirmation: this literal reading of "never more than one push per day"
/// silences the evening reminder on weekly-push days — see the report.
public enum NotificationPlanner {

    /// Weekdays owned by the weekly set (Calendar weekday: 1=Sun…7=Sat).
    public static let weeklyNudgeWeekdays: Set<Int> = [1, 2, 4, 6]

    public static var eveningReminderWeekdays: [Int] {
        (1...7).filter { !weeklyNudgeWeekdays.contains($0) }
    }

    /// The branch that applies given today's state (evaluated at refresh time,
    /// re-checked in willPresent before presenting).
    public static func eveningBranch(
        hasMeaningfulLogToday: Bool,
        waterMlToday: Int,
        waterGoalMl: Int
    ) -> EveningReminderBranch {
        if !hasMeaningfulLogToday { return .logInvitation }
        if waterMlToday < waterGoalMl { return .hydrationTopUp }
        return .none
    }

    /// Full repeating plan for the current state.
    public static func plan(
        phaseName: String?,
        articleSlugs: [String],
        isoWeek: Int,
        branch: EveningReminderBranch,
        reminderTime: ReminderTime
    ) -> [NotificationSpec] {
        var specs: [NotificationSpec] = [
            NotificationContent.weeklyPh,
            NotificationContent.weeklyPhase(phaseName: phaseName),
            NotificationContent.weeklyNutrition,
            NotificationContent.weeklyLearn(articleSlugs: articleSlugs, isoWeek: isoWeek),
        ]
        for weekday in eveningReminderWeekdays {
            if let s = NotificationContent.eveningReminder(branch: branch, weekday: weekday, time: reminderTime) {
                specs.append(s)
            }
        }
        return specs
    }
}
