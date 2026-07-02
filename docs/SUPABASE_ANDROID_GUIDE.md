# Supabase × Android (genesyx-android) — Integration Reference

Production-safe setup for Kotlin + Hilt + supabase-kt. Client uses **only**
`SUPABASE_URL` + `SUPABASE_ANON_KEY`; anything privileged runs in **Edge Functions**.
The service-role key never appears in the app, the repo, or chat.

---

## 1. Expose local.properties → BuildConfig

`local.properties` (git-ignored — never committed):
```properties
SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
SUPABASE_ANON_KEY=eyJ...your-anon-key...
```

`app/build.gradle.kts`:
```kotlin
import java.util.Properties

val localProps = Properties().apply {
    rootProject.file("local.properties").takeIf { it.exists() }?.inputStream()?.use { load(it) }
}
fun prop(name: String): String =
    localProps.getProperty(name) ?: System.getenv(name) ?: ""   // env fallback for CI

android {
    defaultConfig {
        buildConfigField("String", "SUPABASE_URL", "\"${prop("SUPABASE_URL")}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${prop("SUPABASE_ANON_KEY")}\"")
    }
    buildFeatures { buildConfig = true }
}
```
Note: the anon key is *designed* to be public (RLS is the security boundary), so
BuildConfig is acceptable. local.properties keeps it out of git history, and the
env-var fallback covers CI builds.

## 2. Dependencies (version catalog)

`gradle/libs.versions.toml`:
```toml
[versions]
supabase = "2.6.1"          # supabase-kt BOM (2.x line; use latest 2.x)
ktor = "2.3.12"             # must match the ktor major used by supabase-kt 2.x
credentials = "1.3.0"
googleid = "1.1.1"

[libraries]
supabase-bom = { module = "io.github.jan-tennert.supabase:bom", version.ref = "supabase" }
supabase-auth = { module = "io.github.jan-tennert.supabase:gotrue-kt" }
supabase-postgrest = { module = "io.github.jan-tennert.supabase:postgrest-kt" }
supabase-functions = { module = "io.github.jan-tennert.supabase:functions-kt" }
ktor-android = { module = "io.ktor:ktor-client-android", version.ref = "ktor" }
androidx-credentials = { module = "androidx.credentials:credentials", version.ref = "credentials" }
androidx-credentials-play = { module = "androidx.credentials:credentials-play-services-auth", version.ref = "credentials" }
googleid = { module = "com.google.android.libraries.identity.googleid:googleid", version.ref = "googleid" }
```

`app/build.gradle.kts`:
```kotlin
dependencies {
    implementation(platform(libs.supabase.bom))
    implementation(libs.supabase.auth)        // Auth (GoTrue)
    implementation(libs.supabase.postgrest)   // DB
    implementation(libs.supabase.functions)   // Edge Functions
    implementation(libs.ktor.android)         // HTTP engine
    implementation(libs.androidx.credentials)
    implementation(libs.androidx.credentials.play)
    implementation(libs.googleid)
}
```
(If the session finds supabase-kt 3.x is current, module names become `auth-kt` etc. —
check the installed version's docs; don't mix 2.x/3.x artifacts.)

## 3. Hilt SupabaseModule

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object SupabaseModule {

    @Provides @Singleton
    fun provideSupabaseClient(): SupabaseClient = createSupabaseClient(
        supabaseUrl = BuildConfig.SUPABASE_URL,
        supabaseKey = BuildConfig.SUPABASE_ANON_KEY,
    ) {
        install(Auth) {
            // session persisted automatically (encrypted settings storage)
        }
        install(Postgrest)
        install(Functions)
    }

    @Provides @Singleton fun provideAuth(c: SupabaseClient): Auth = c.auth
    @Provides @Singleton fun providePostgrest(c: SupabaseClient): Postgrest = c.postgrest
    @Provides @Singleton fun provideFunctions(c: SupabaseClient): Functions = c.functions
}
```
Session bootstrap: in `GenesyxApplication`/a startup ViewModel, observe
`auth.sessionStatus: StateFlow<SessionStatus>` and gate navigation on
`Authenticated` / `NotAuthenticated` — supabase-kt restores persisted sessions and
refreshes tokens automatically.

## 4. Google sign-in: Credential Manager → Supabase

Flow (recommended by both Google and Supabase):
1. Google Cloud Console → create **Web** OAuth client (this ID = `serverClientId`)
   AND an **Android** OAuth client (package `com.genesyx.app` + your SHA-1/SHA-256 —
   include BOTH your upload key's SHA and the **Play App Signing** key's SHA from
   Play Console → Setup → App signing).
2. Supabase Dashboard → Auth → Providers → Google → enable, set the **Web client ID**
   (+ secret), and add the Web client ID to "Authorized Client IDs".
3. Android:
```kotlin
val option = GetGoogleIdOption.Builder()
    .setServerClientId(WEB_CLIENT_ID)        // the WEB client id, not the Android one
    .setFilterByAuthorizedAccounts(false)
    .setNonce(hashedNonce)                   // sha-256 of a random nonce
    .build()
val request = GetCredentialRequest.Builder().addCredentialOption(option).build()
val result = CredentialManager.create(context).getCredential(activity, request)
val idToken = GoogleIdTokenCredential.createFrom(result.credential.data).idToken

supabase.auth.signInWith(IDToken) {
    provider = Google
    this.idToken = idToken
    this.nonce = rawNonce                    // raw (unhashed) nonce
}
```
No browser redirect, no deep link needed for Google sign-in (email/password needs
none either). Deep links are only needed for magic links / OAuth-via-browser — we
use neither.

## 5. What MUST go through Edge Functions (and why)

RLS locks these paths for clients — a direct client write will fail by design:
| Action | Why server-side |
|---|---|
| **Partner accept** (`acceptPartnerInvite`) | writes `profiles.partner_id` on BOTH users + flips invite to `accepted` — both forbidden to clients by RLS; must be atomic |
| **Partner unlink** (`unlinkPartner`) | clears `partner_id` on both sides — same RLS lock |
| **Account delete** (`deleteAccount`) | deletes rows across tables + the auth user (Admin API) — requires service role. MUST include `ph_readings` (known web bug to fix) |
| `sendPartnerInvite`, `revokePartnerInvite`, `updateDisplayName` | invite creation/revocation validation + auth-metadata update |

Pattern: each function verifies the caller's JWT, re-validates permissions
server-side, and uses the service-role client held **only** in function env vars
(`SUPABASE_SERVICE_ROLE_KEY` is auto-injected by Supabase). Client calls:
```kotlin
supabase.functions.invoke("accept-partner-invite") { setBody(AcceptBody(code)) }
```
Exact per-function logic: `docs/DATA_LAYER.md`. Make the two-sided partner-link write
a single `SECURITY DEFINER` plpgsql RPC for atomicity.

## 6. Minimal secure plan — dev vs production

**Local dev:** anon key in `local.properties`; email confirmation OFF in Supabase (faster
iteration); test against the real project (free tier) — RLS is on from day one because
the schema ships with it (`docs/schema.sql`).

**Production:**
- Same anon key path (safe by design), RLS as the only trust boundary — verify every
  table has RLS enabled + policies (they do, per schema.sql).
- Email confirmation ON; set Site URL; configure allowed redirect URLs (none needed
  for our flows, keep the list empty/tight).
- Edge Functions: `--no-verify-jwt` NEVER; keep default JWT verification ON.
- Never log tokens; ProGuard/R8 on release builds (default).
- Rotate the anon key only if leaked *together with* an RLS hole; rotate service-role
  immediately if it ever leaks.

---

## Dashboard self-check (5 min — since I can't browse your consoles)

**Supabase → verify:**
1. SQL Editor → `docs/schema.sql` ran without errors; Table Editor shows `profiles`,
   `cycle_settings`, `daily_logs`, `ph_readings`, `partner_invites`.
2. Each table: RLS **enabled** (shield icon) with the policies from the schema.
3. Auth → Providers: **Email ON**; Google ON with the Web client ID once created.
4. Project Settings → API: copy URL + anon key (NOT service_role) to local.properties.

**Google Cloud → verify:**
1. APIs & Services → Credentials: one **Web application** client + one **Android**
   client (package `com.genesyx.app`, your SHA-1).
2. OAuth consent screen: app name Genesyx, your support email, publishing status
   (Testing is fine for internal testing; add your Gmail as a test user).
3. The **Web** client ID is the one pasted into Supabase and used as `serverClientId`.
