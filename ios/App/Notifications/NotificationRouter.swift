// NotificationRouter.swift
// Target path: App/Genesyx/Notifications/NotificationRouter.swift
//
// WS2 §4 — tap → TabRouter selection (+ Learn slug deep-link). Kept as its own
// object so routing is testable without UNUserNotificationCenter.

import Foundation

@MainActor
public struct NotificationRouter {

    // INTEGRATE: TabRouter is the existing navigation coordinator used by the
    // Learn article CTAs; reuse it — do not add a second navigation path.
    var selectTab: (TabRouter.Tab) -> Void = { TabRouter.shared.select($0) }
    var openArticle: (String) -> Void = { TabRouter.shared.openLearnArticle(slug: $0) }

    public init() {}

    public func open(_ route: NotificationRoute) {
        switch route {
        case .home:
            selectTab(.home)
        case .track:
            selectTab(.track)
        case .nutrition:
            selectTab(.nutrition)
        case .insights:
            selectTab(.insights)
        case .learn(let slug):
            if let slug {
                openArticle(slug)     // Learn tab + push the article detail
            } else {
                selectTab(.learn)
            }
        }
    }
}
