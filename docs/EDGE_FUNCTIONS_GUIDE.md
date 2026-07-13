# Genesyx — Edge Functions Guide (Connection Roadmap · Phase 4)

> **What we're trying to achieve**: the four operations that need the Supabase
> **service-role key** cannot ship inside a native app. This guide deploys them as Supabase
> Edge Functions so the iOS (and Android) apps can call them with the user's JWT. Logic is
> ported 1:1 from the web app's server functions (`src/lib/account.functions.ts`,
> `src/lib/partner.functions.ts`), so web and native share identical behaviour.

## What was built (code in `supabase/functions/`)

| Function | Source port | Needed when |
|---|---|---|
| `delete-account` | `account.functions.ts → deleteAccount` | **Now** — live feature (Profile → Delete account). Remote-first: server deletes, client wipes local only after `ok`. DB rows cascade via `ON DELETE CASCADE` from `auth.users`. |
| `change-password` | `account.functions.ts → changePassword` | When the iOS change-password parity fake becomes real (v1.2 real-auth work). Verifies the current password with a throwaway anon sign-in before the admin update. |
| `accept-partner-invite` | `partner.functions.ts → acceptPartnerInvite` | When `FeatureFlags.partnerInvites` flips on (v2.0). Full validation (pending/expiry/email-match/not-self), atomic accept, symmetric profile linking. |
| `unlink-partner` | `partner.functions.ts → unlinkPartner` | Same as above. Guarded symmetric clear. |
| `_shared/http.ts` | — | CORS, JWT verification (`auth.getUser`), admin/anon clients, safe error logging (full detail server-side, generic message to client). |

All four: POST-only, `Authorization: Bearer <user JWT>` required (401 otherwise), JSON in/out,
CORS enabled for the web app.

## Step-by-step: deploy

```bash
# 1. Log in and link the project (one-time, from this repo's root)
supabase login
supabase link --project-ref lfyjeoqiqtmtcwnpekmi

# 2. Deploy all four functions
supabase functions deploy delete-account
supabase functions deploy change-password
supabase functions deploy accept-partner-invite
supabase functions deploy unlink-partner

# Note: SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected
# automatically into the Edge runtime — no secrets to configure manually.
```

## Step-by-step: verify with curl

```bash
# Get a user JWT (sign in as a test user via the web app and copy the access token,
# or use the auth API):
ACCESS_TOKEN=$(curl -s "https://lfyjeoqiqtmtcwnpekmi.supabase.co/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r .access_token)

# change-password (safe to test):
curl -s -X POST "https://lfyjeoqiqtmtcwnpekmi.supabase.co/functions/v1/change-password" \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"currentPassword":"password123","newPassword":"password1234"}'
# → {"ok":true}     wrong current password → 403 {"error":"Current password is incorrect"}

# delete-account (destroys the test user — run last):
curl -s -X POST "https://lfyjeoqiqtmtcwnpekmi.supabase.co/functions/v1/delete-account" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# → {"ok":true}; verify the user + all rows are gone in the dashboard
```

## Step-by-step: call from iOS (supabase-swift)

```swift
// Delete account — remote-first per the brand contract:
struct OkResponse: Decodable { let ok: Bool }

func deleteAccountRemoteFirst() async throws {
    // 1. Server first. Throws on failure -> user stays signed in, nothing wiped.
    let _: OkResponse = try await supabase.functions.invoke("delete-account")
    // 2. Only after success: wipe local stores + sign out.
    try await localStores.wipeCurrentUser()
    try? await supabase.auth.signOut()
}

// Change password (when the parity fake becomes real):
struct ChangePasswordBody: Encodable { let currentPassword: String; let newPassword: String }
let _: OkResponse = try await supabase.functions.invoke(
    "change-password",
    options: .init(body: ChangePasswordBody(currentPassword: current, newPassword: new))
)
// The functions client attaches the current session JWT automatically.
```

The web app can also migrate to these endpoints later (`supabase.functions.invoke` from
`@supabase/supabase-js`), replacing the TanStack server functions one at a time — but that's
optional; both paths hit the same database with the same rules.

## Behaviour contracts preserved (from the web implementation)

- **delete-account**: admin `deleteUser`; data removal relies on FK cascades (verified in
  migrations: `profiles`, `daily_logs`, invites reference `auth.users ON DELETE CASCADE`).
- **change-password**: current password verified by real sign-in on a non-persistent client;
  8–200 char new password; caller's session untouched.
- **accept-partner-invite**: 404 unknown code · 409 non-pending / lost race · 410 expired ·
  403 wrong email · 400 self-accept; accept is atomic (`eq status=pending` guard); linking is
  symmetric via service role only.
- **unlink-partner**: clears caller's `partner_id` always; clears the partner's only if it
  still points back at the caller.
- All errors: full detail to function logs, generic message to the client (same `safeThrow`
  discipline as the web code).

## Next in the Connection Roadmap

Phase 4 ✅ (this guide) → Phase 0: add the iOS repo to the session → Phases 1–3: real
Supabase client, real auth (email / Apple / Google), repository-to-table wiring → Phase 5
acceptance checklist (`docs/CONNECTION_ROADMAP.md`).
