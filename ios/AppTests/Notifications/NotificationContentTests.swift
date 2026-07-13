// NotificationContentTests.swift
// Target path: Tests/GenesyxTests/Notifications/NotificationContentTests.swift
//
// Content-safety + planner invariants, updated for the Phase-4 ruling
// (evening reminder replaces the 10:00 hydration nudge).
//
// MEANING-CHANGED tests (relabelled per the ruling, not deleted):
//   · testExactlyOneDailyNotificationExists → testSingleDailySlot_IsTheEveningReminder
//     (the daily slot moved 10:00 → user-configurable evening, two-branch content)
//   · the 10:00-schedule assertion is gone with the slot it tested.

import XCTest
@testable import Genesyx

final class NotificationContentTests: XCTestCase {

    private let bannedPhrases = [
        "alkaline diet", "balance your ph", "boy or girl", "sex selection",
        "gender sway", "sway the sex", "choose the sex", "detox", "flush toxins",
    ]

    // Never-guilt: forbidden even when the spec's own wording suggested it.
    private let guiltMarkers = [
        "you haven't", "haven't logged", "nothing logged", "you missed", "missed",
        "broke your streak", "streak broken", "don't lose", "at risk", "failed",
    ]

    func testEveryVisibleStringPassesBannedPhraseScan() {
        for string in NotificationContent.allVisibleStrings() {
            for phrase in bannedPhrases {
                XCTAssertFalse(string.localizedCaseInsensitiveContains(phrase),
                               "\"\(string)\" contains banned phrase \"\(phrase)\"")
            }
        }
    }

    func testNoGuiltLanguageAnywhere_IncludingEveningReminder() {
        for string in NotificationContent.allVisibleStrings() {
            for marker in guiltMarkers {
                XCTAssertFalse(string.localizedCaseInsensitiveContains(marker),
                               "\"\(string)\" reads as guilt: \"\(marker)\"")
            }
        }
    }

    // MARK: Evening reminder branches (new semantics)

    func testEveningBranchLogic() {
        XCTAssertEqual(NotificationPlanner.eveningBranch(
            hasMeaningfulLogToday: false, waterMlToday: 0, waterGoalMl: 2400), .logInvitation)
        XCTAssertEqual(NotificationPlanner.eveningBranch(
            hasMeaningfulLogToday: true, waterMlToday: 1200, waterGoalMl: 2400), .hydrationTopUp)
        XCTAssertEqual(NotificationPlanner.eveningBranch(
            hasMeaningfulLogToday: true, waterMlToday: 2400, waterGoalMl: 2400), .none)
    }

    func testEveningReminderRespectsConfiguredTime() {
        let spec = NotificationContent.eveningReminder(
            branch: .logInvitation, weekday: 3, time: ReminderTime(hour: 21, minute: 30))
        XCTAssertEqual(spec?.schedule?.hour, 21)
        XCTAssertEqual(spec?.schedule?.minute, 30)
        XCTAssertEqual(NotificationContent.eveningReminder(
            branch: .logInvitation, weekday: 3, time: .default)?.schedule?.hour, 19)
    }

    func testLogInvitationOpensTheLogSheet() {
        let spec = NotificationContent.eveningReminder(branch: .logInvitation, weekday: 3, time: .default)
        XCTAssertEqual(spec?.route, .log)
    }

    func testGoalMetDayProducesNoReminder() {
        XCTAssertNil(NotificationContent.eveningReminder(branch: .none, weekday: 3, time: .default))
    }

    // MEANING CHANGED (was testExactlyOneDailyNotificationExists at fixed 10:00):
    // the single daily slot is now the evening reminder at the user's time.
    func testSingleDailySlot_IsTheEveningReminder() {
        let plan = NotificationPlanner.plan(
            phaseName: "luteal", articleSlugs: ["a"], isoWeek: 1,
            branch: .logInvitation, reminderTime: .default)
        let dailyIDs = plan.map(\.id).filter { $0.hasPrefix("genesyx.daily.reminder") }
        XCTAssertFalse(dailyIDs.isEmpty)
        XCTAssertFalse(plan.map(\.id).contains(NotificationID.legacyDailyHydration),
                       "the superseded 10:00 nudge must never be scheduled")
    }

    // MARK: Global invariants (the ruling's requirement 4)

    /// ≤1 push per weekday across the whole repeating plan.
    func testNeverMoreThanOnePushPerDay() {
        for branch in [EveningReminderBranch.logInvitation, .hydrationTopUp] {
            let plan = NotificationPlanner.plan(
                phaseName: nil, articleSlugs: ["a", "b"], isoWeek: 3,
                branch: branch, reminderTime: .default)
            var pushesPerWeekday: [Int: Int] = [:]
            for spec in plan {
                guard let weekday = spec.schedule?.weekday else {
                    return XCTFail("repeating plan must be weekday-scheduled: \(spec.id)")
                }
                pushesPerWeekday[weekday, default: 0] += 1
            }
            for (weekday, count) in pushesPerWeekday {
                XCTAssertLessThanOrEqual(count, 1, "weekday \(weekday) has \(count) pushes")
            }
        }
    }

    /// Never two hydration-flavoured notifications on one day: with the replace
    /// design only the evening hydration branch is hydration-flavoured, and it
    /// never shares a weekday with itself or the (removed) morning nudge.
    func testNeverTwoHydrationFlavouredPushesOnOneDay() {
        let plan = NotificationPlanner.plan(
            phaseName: nil, articleSlugs: [], isoWeek: 0,
            branch: .hydrationTopUp, reminderTime: .default)
        let hydrationFlavoured = plan.filter {
            $0.id.hasPrefix("genesyx.daily.reminder") || $0.id == NotificationID.legacyDailyHydration
        }
        let weekdays = hydrationFlavoured.compactMap { $0.schedule?.weekday }
        XCTAssertEqual(weekdays.count, Set(weekdays).count)
    }

    /// FLAGGED planner decision: evening reminder yields to weekly-push days.
    func testEveningReminderYieldsToWeeklyPushDays() {
        let plan = NotificationPlanner.plan(
            phaseName: nil, articleSlugs: ["a"], isoWeek: 1,
            branch: .logInvitation, reminderTime: .default)
        let reminderWeekdays = Set(plan
            .filter { $0.id.hasPrefix("genesyx.daily.reminder") }
            .compactMap { $0.schedule?.weekday })
        XCTAssertTrue(reminderWeekdays.isDisjoint(with: NotificationPlanner.weeklyNudgeWeekdays))
    }

    // MARK: Weekly set + milestones (unchanged semantics)

    func testWeeklyScheduleUnchanged() {
        XCTAssertEqual(NotificationContent.weeklyPh.schedule?.weekday, 2)
        XCTAssertEqual(NotificationContent.weeklyPh.schedule?.hour, 9)
        XCTAssertEqual(NotificationContent.weeklyPhase(phaseName: "luteal").schedule?.weekday, 4)
        XCTAssertEqual(NotificationContent.weeklyNutrition.schedule?.weekday, 6)
        XCTAssertEqual(NotificationContent.weeklyLearn(articleSlugs: ["a"], isoWeek: 1).schedule?.weekday, 1)
    }

    func testLearnRotationCoversTheLibraryAndDeepLinks() {
        let slugs = (1...16).map { "article-\($0)" }
        var seen = Set<String>()
        for week in 0..<16 {
            let spec = NotificationContent.weeklyLearn(articleSlugs: slugs, isoWeek: week)
            guard case .learn(let slug) = spec.route, let slug else {
                return XCTFail("Learn nudge must deep-link to an article")
            }
            seen.insert(slug)
        }
        XCTAssertEqual(seen.count, 16)
    }

    func testMilestoneCopyExistsForAllFourAndTargetsInsights() {
        for m in Milestone.allCases {
            let spec = NotificationContent.milestone(m)
            XCTAssertFalse(spec.title.isEmpty)
            XCTAssertFalse(spec.body.isEmpty)
            XCTAssertEqual(spec.route, .insights)
            XCTAssertNil(spec.schedule)
        }
    }

    func testRouteUserInfoRoundTrips() {
        let routes: [NotificationRoute] = [.home, .track, .nutrition, .insights, .log,
                                           .learn(slug: "some-article"), .learn(slug: nil)]
        for route in routes {
            XCTAssertEqual(NotificationRoute.from(userInfo: route.userInfo), route)
        }
    }
}
