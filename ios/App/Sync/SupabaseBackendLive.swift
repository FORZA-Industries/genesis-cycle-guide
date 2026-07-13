// SupabaseBackendLive.swift
// Target path: App/Genesyx/Sync/SupabaseBackendLive.swift
//
// WS3b §6.1 — SupabaseBackend becomes a real client. Requires the supabase-swift
// package (add to project.yml packages: Supabase from https://github.com/supabase/supabase-swift).
//
// Selection rule (§6.2): empty Secrets → today's stub backend, so nothing changes
// until the human checklist provides real values. Mock auth is #if DEBUG only (§6.5).

import Foundation
import Supabase

// MARK: - Backend selection

enum BackendFactory {
    /// The one place the app decides stub vs live.
    static func make() -> GenesyxBackend {
        guard let url = URL(string: Secrets.supabaseURL),
              !Secrets.supabaseURL.isEmpty,
              !Secrets.supabaseAnonKey.isEmpty
        else {
            #if DEBUG
            return StubBackend() // INTEGRATE: today's stub type
            #else
            // Release with no credentials: still local-first and functional,
            // but no mock auth pretending to be real (§6.5).
            return StubBackend(allowMockAuth: false)
            #endif
        }
        return SupabaseBackendLive(client: SupabaseClient(
            supabaseURL: url,
            supabaseKey: Secrets.supabaseAnonKey
        ))
    }
}

// MARK: - DTOs (snake_case ↔ camelCase via CodingKeys)

struct RemoteProfile: Codable {
    var id: UUID
    var displayName: String?
    var theme: String
    var focusMode: String
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case displayName = "display_name"
        case theme
        case focusMode = "focus_mode"
        case updatedAt = "updated_at"
    }
}

struct RemoteCycleSettings: Codable {
    var userId: UUID
    var lastPeriodDate: String   // "YYYY-MM-DD"
    var cycleLength: Int
    var periodLength: Int

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case lastPeriodDate = "last_period_date"
        case cycleLength = "cycle_length"
        case periodLength = "period_length"
    }
}

struct RemoteDailyLog: Codable {
    var userId: UUID
    var date: String             // "YYYY-MM-DD"
    var mood: String?
    var energy: String?
    var symptoms: [String]
    var sleepMinutes: Int?
    var waterMl: Int
    var supplements: [String]
    var notes: String?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case date, mood, energy, symptoms, notes
        case sleepMinutes = "sleep_minutes"
        case waterMl = "water_ml"
        case supplements
        case updatedAt = "updated_at"
    }
}

struct RemotePhReading: Codable {
    var id: UUID
    var userId: UUID
    var phValue: Double
    var recordedAt: Date
    var notes: String?
    var deletedAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case phValue = "ph_value"
        case recordedAt = "recorded_at"
        case notes
        case deletedAt = "deleted_at"
        case updatedAt = "updated_at"
    }
}

// MARK: - Live backend

/// Real Supabase client implementing the same protocol the stubs implement.
/// INTEGRATE: align method names with the existing `GenesyxBackend` protocol.
final class SupabaseBackendLive: GenesyxBackend {
    let client: SupabaseClient

    init(client: SupabaseClient) {
        self.client = client
    }

    var isConfigured: Bool { true }

    // MARK: Auth (§6.1)

    func signUp(email: String, password: String, displayName: String?) async throws -> UUID {
        let response = try await client.auth.signUp(
            email: email,
            password: password,
            data: displayName.map { ["display_name": AnyJSON.string($0)] } ?? [:]
        )
        return response.user.id
    }

    func signIn(email: String, password: String) async throws -> UUID {
        let session = try await client.auth.signIn(email: email, password: password)
        return session.user.id
    }

    /// Sign in with Apple: exchange the ASAuthorization credential's identity
    /// token. `nonce` is the RAW nonce whose SHA256 was set on the Apple request.
    func signInWithApple(idToken: String, nonce: String) async throws -> UUID {
        let session = try await client.auth.signInWithIdToken(
            credentials: .init(provider: .apple, idToken: idToken, nonce: nonce)
        )
        return session.user.id
    }

    /// Google: pass the ID token obtained from GoogleSignIn SDK (client ID from
    /// Secrets.googleClientID). Callers show "not configured" when the ID is empty.
    func signInWithGoogle(idToken: String, accessToken: String?) async throws -> UUID {
        let session = try await client.auth.signInWithIdToken(
            credentials: .init(provider: .google, idToken: idToken, accessToken: accessToken)
        )
        return session.user.id
    }

    func signOut() async throws {
        try await client.auth.signOut()
    }

    func currentUserID() async -> UUID? {
        try? await client.auth.session.user.id
    }

    /// Remote-first account deletion via the Edge Function (§2, §6.8):
    /// the caller wipes local data ONLY after this returns without throwing.
    func deleteAccount() async throws {
        struct Ok: Decodable { let ok: Bool }
        let _: Ok = try await client.functions.invoke("delete-account")
    }

    // MARK: Profiles

    func fetchProfile(userId: UUID) async throws -> RemoteProfile? {
        try await client.from("profiles")
            .select().eq("id", value: userId).limit(1)
            .execute().value(as: [RemoteProfile].self).first
    }

    func updateProfile(_ profile: RemoteProfile) async throws {
        try await client.from("profiles")
            .update(profile).eq("id", value: profile.id)
            .execute()
    }

    // MARK: Cycle settings (offline: quiet-fail is the CALLER's contract — this
    // method just throws; CycleRepository swallows the error, §F)

    func fetchCycleSettings(userId: UUID) async throws -> RemoteCycleSettings? {
        try await client.from("cycle_settings")
            .select().eq("user_id", value: userId).limit(1)
            .execute().value(as: [RemoteCycleSettings].self).first
    }

    func upsertCycleSettings(_ settings: RemoteCycleSettings) async throws {
        try await client.from("cycle_settings")
            .upsert(settings, onConflict: "user_id")
            .execute()
    }

    // MARK: Daily logs (offline: caller REFUSES to save before calling — §F)

    func fetchDailyLogs(userId: UUID, sinceDays: Int) async throws -> [RemoteDailyLog] {
        let since = Calendar.current.date(byAdding: .day, value: -sinceDays, to: Date())!
        let sinceString = ISO8601DateFormatter.dateOnly.string(from: since)
        return try await client.from("daily_logs")
            .select().eq("user_id", value: userId).gte("date", value: sinceString)
            .order("date", ascending: true)
            .execute().value(as: [RemoteDailyLog].self)
    }

    func upsertDailyLog(_ log: RemoteDailyLog) async throws {
        try await client.from("daily_logs")
            .upsert(log, onConflict: "user_id,date")
            .execute()
    }

    // MARK: pH readings (offline: caller queues + retries — §F)

    /// Includes tombstoned rows so deletions propagate; clients filter locally.
    func fetchPhReadings(userId: UUID) async throws -> [RemotePhReading] {
        try await client.from("ph_readings")
            .select().eq("user_id", value: userId)
            .order("recorded_at", ascending: true).limit(2000)
            .execute().value(as: [RemotePhReading].self)
    }

    func upsertPhReading(_ reading: RemotePhReading) async throws {
        try await client.from("ph_readings")
            .upsert(reading, onConflict: "id")
            .execute()
    }

    /// Tombstone, never hard-delete (§6.4): offline devices converge on next pull.
    func deletePhReading(id: UUID) async throws {
        try await client.from("ph_readings")
            .update(["deleted_at": Date().ISO8601Format()])
            .eq("id", value: id)
            .execute()
    }
}

extension ISO8601DateFormatter {
    static let dateOnly: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withFullDate]
        return f
    }()
}
