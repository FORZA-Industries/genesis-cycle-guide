// SyncCoordinator.swift
// Target path: App/Genesyx/Sync/SyncCoordinator.swift
//
// WS3b §6.3–6.6 — push-after-save / pull-on-signin wiring around the existing
// repositories. The THREE OFFLINE BEHAVIOURS ARE PRESERVED EXACTLY (§8):
//   · daily logs REFUSE to save offline (block + "reconnect to save")
//   · pH readings queue with pending_sync and retry with backoff
//   · cycle settings fail quietly (server copy wins on next pull)
// Device stays the source of truth; the cloud is a mirror.

import Foundation
import Network

@MainActor
public final class SyncCoordinator: ObservableObject {

    public static let shared = SyncCoordinator()

    // INTEGRATE: real dependency wiring.
    var backend: GenesyxBackend = BackendFactory.make()
    var dailyLogs: DailyLogRepository = .shared
    var phRepository: PhRepository = .shared
    var cycleRepository: CycleRepository = .shared
    var profileRepository: ProfileRepository = .shared
    var preferences: PreferencesRepository = .shared

    @Published public private(set) var isOnline = true
    private let pathMonitor = NWPathMonitor()

    private init() {
        pathMonitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                let wasOffline = self?.isOnline == false
                self?.isOnline = path.status == .satisfied
                // Regained connectivity → drain the pH queue (§F: queue + retry).
                if wasOffline && path.status == .satisfied {
                    await self?.drainPhQueue()
                }
            }
        }
        pathMonitor.start(queue: DispatchQueue(label: "genesyx.sync.path"))
    }

    // MARK: - Daily logs: refuse offline, push after save

    /// Called by the Log screen's save path. Throws `SyncError.offline` when the
    /// device is offline OR the remote write fails — the log is NOT saved locally
    /// in that case ("reconnect to save"), so the server copy is never silently
    /// overwritten later. Signed-out saves stay purely local (unchanged).
    public func saveDailyLog(_ log: DailyLog, userId: UUID?) async throws {
        guard backend.isConfigured, let userId else {
            dailyLogs.saveLocal(log)   // local-only mode: unchanged v1.0 behaviour
            return
        }
        guard isOnline else { throw SyncError.offline }
        do {
            try await backend.upsertDailyLog(log.asRemote(userId: userId))
            dailyLogs.saveLocal(log)   // remote accepted → commit locally
        } catch {
            throw SyncError.offline    // one message, one behaviour: reconnect to save
        }
    }

    // MARK: - pH: save locally always, queue + retry with backoff

    public func savePhReading(_ reading: PhReading, userId: UUID?) async {
        phRepository.saveLocal(reading, pendingSync: true)
        guard backend.isConfigured, let userId else { return }
        await pushPh(reading, userId: userId, attempt: 0)
    }

    public func deletePhReading(id: UUID, userId: UUID?) async {
        phRepository.markDeletedLocal(id: id) // tombstone locally too
        guard backend.isConfigured, let userId else { return }
        do {
            try await backend.deletePhReading(id: id)
            phRepository.clearPendingSync(id: id)
        } catch {
            // stays pending; drained on next connectivity/foreground
            _ = userId
        }
    }

    private func pushPh(_ reading: PhReading, userId: UUID, attempt: Int) async {
        do {
            try await backend.upsertPhReading(reading.asRemote(userId: userId))
            phRepository.clearPendingSync(id: reading.id)
        } catch {
            guard attempt < 5 else { return } // stays pending_sync; retried on foreground
            let delay = pow(2.0, Double(attempt)) // 1,2,4,8,16 s backoff
            try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            await pushPh(reading, userId: userId, attempt: attempt + 1)
        }
    }

    public func drainPhQueue() async {
        guard backend.isConfigured, let userId = await backend.currentUserID() else { return }
        for reading in phRepository.pendingSyncReadings() {
            if reading.isDeleted {
                try? await backend.deletePhReading(id: reading.id)
                phRepository.clearPendingSync(id: reading.id)
            } else {
                await pushPh(reading, userId: userId, attempt: 0)
            }
        }
    }

    // MARK: - Cycle settings: quiet fail

    public func saveCycleSettings(_ settings: CycleSettings, userId: UUID?) async {
        cycleRepository.saveLocal(settings)     // local truth, always
        guard backend.isConfigured, let userId else { return }
        // Quiet: no retry, no error surfaced; next sign-in pull wins (§F).
        try? await backend.upsertCycleSettings(settings.asRemote(userId: userId))
    }

    // MARK: - Pull on sign-in + one-time local→cloud migration (§6.6)

    public func onSignedIn(userId: UUID) async {
        guard backend.isConfigured else { return }

        // One-time migration: the FIRST real sign-in pushes existing local data up
        // before pulling, so nothing recorded pre-account is lost.
        let migrationKey = "sync.migrated.\(userId.uuidString)"
        if !preferences.bool(forKey: migrationKey) {
            await migrateLocalDataUp(userId: userId)
            preferences.set(true, forKey: migrationKey)
        }

        await pullAll(userId: userId)
    }

    private func migrateLocalDataUp(userId: UUID) async {
        if let settings = cycleRepository.localSettings() {
            try? await backend.upsertCycleSettings(settings.asRemote(userId: userId))
        }
        for log in dailyLogs.allLocalLogs() {
            try? await backend.upsertDailyLog(log.asRemote(userId: userId))
        }
        for reading in phRepository.allLocalReadings() where !reading.isDeleted {
            try? await backend.upsertPhReading(reading.asRemote(userId: userId))
        }
    }

    private func pullAll(userId: UUID) async {
        // Cycle + daily logs: server copy wins on read (§F conflict rule).
        if let remote = try? await backend.fetchCycleSettings(userId: userId) {
            cycleRepository.applyServerCopy(remote)
        }
        if let logs = try? await backend.fetchDailyLogs(userId: userId, sinceDays: 365) {
            dailyLogs.applyServerCopies(logs)
        }
        // pH: merge by id, last-updated wins, NEVER overwrite pending_sync=true (§6.4).
        if let readings = try? await backend.fetchPhReadings(userId: userId) {
            phRepository.merge(remote: readings) { local, remote in
                if local.pendingSync { return .keepLocal }
                let localStamp = local.updatedAt ?? .distantPast
                let remoteStamp = remote.updatedAt ?? .distantPast
                return remoteStamp >= localStamp ? .takeRemote : .keepLocal
            }
        }
    }

    // MARK: - Account deletion: remote-first (§2/§D7)

    public func deleteAccount() async throws {
        try await backend.deleteAccount()      // throws → user stays signed in, nothing wiped
        wipeAllLocalData()                     // only after remote success
        try? await backend.signOut()
    }

    private func wipeAllLocalData() {
        dailyLogs.wipeCurrentUser()
        phRepository.wipeCurrentUser()
        cycleRepository.wipeCurrentUser()
        profileRepository.wipeCurrentUser()
        preferences.wipeUserScoped()
    }
}

public enum SyncError: LocalizedError {
    case offline
    public var errorDescription: String? {
        // The v1.0 message, unchanged (§F: logs block offline).
        "You're offline — reconnect to save today's log."
    }
}
