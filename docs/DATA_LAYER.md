# Genesyx — Data Layer (server functions → native repositories)

> Exact backend contract from Lovable extraction "Answer 1". Reimplement these as native
> repository methods (supabase-kt + Postgrest), porting the Zod validation into Kotlin.
> Privileged ops (service-role) become **Supabase Edge Functions** the app calls.
> All web fns use `createServerFn` + `.middleware([requireSupabaseAuth])`; `context = { supabase, supabaseAdmin?, userId, claims }`.
> Error contract: DB errors funnel through `safeThrow(scope, err, userMessage)` → client sees only the generic message.

## cycle.functions.ts
- **getCycleSettings** `GET` · no input → `CycleSettingsDTO | null` = `{ cycleLength:Int 21–35, periodLength:Int 1–10, lastPeriodDate:'YYYY-MM-DD' }`. Err `"Could not load cycle settings."`
- **upsertCycleSettings** `POST` · `{ lastPeriodDate: /^\d{4}-\d{2}-\d{2}$/, cycleLength: int 21–35, periodLength?: int 1–10 (default 5) }` → upsert on `user_id` → `{ ok:true }`. Err `"Could not save cycle settings."`

## daily-log.functions.ts
- **getDailyLog** `GET` · `{ date: /^\d{4}-\d{2}-\d{2}$/ }` → `DailyLogDTO | null`:
  `{ date, mood:String?, energy:('low'|'normal'|'high')?, symptoms:String[] ([] when null), sleepMinutes:Int?, waterMl:Int (0 when null), supplements:String[] ([] when null), notes:String? }`. Err `"Could not load today's log."`
- **upsertDailyLog** `POST` · `UpsertSchema`:
  `{ date:/regex/, mood?:String≤20 nullable, energy?:enum(low,normal,high) nullable, symptoms?:Array<String 1–40>≤50, sleepMinutes?:Int 0–1440 nullable, waterMl?:Int 0–10000, supplements?:Array<String 1–40>≤50, notes?:String≤2000 nullable }`.
  Upsert on `(user_id,date)`; **only present fields are written (omitted ≠ null)** — partial patch. → `{ ok:true }`. Err `"Could not save log."`
- **getStreak** `GET` · no input → `{ streak:Int }`. Algorithm: pull up to last 400 dates desc; 0 if today missing, else count consecutive days back from today. Err `"Could not load streak."`

## ph.functions.ts
Shared: `PhValue = number 4.5–9.0`, `IsoDate = string 1–64`.
- **listPhReadings** `GET` · input may be omitted (`input ?? {}`): `{ sinceDays?: int 1–3650 nullable }` → `PhReadingDTO[]` ordered `recorded_at` asc, limit 2000; filters `recorded_at >= now - sinceDays*86400000`. DTO `{ id:uuid, phValue:Number, recordedAt:ISO, notes:String? }`. Err `"Could not load pH readings."`
- **createPhReading** `POST` · `{ phValue:4.5–9.0, recordedAt?:IsoDate (default now ISO), notes?:String≤500 trimmed nullable }`. Insert; `ph_value` rounded to 1 dp (`round(v*10)/10`). → `{ id:uuid }`. Err `"Could not save reading."`
- **updatePhReading** `POST` · `{ id:uuid, phValue:4.5–9.0, recordedAt:IsoDate, notes:String≤500 nullable (required, may be null) }`. Update where `id AND user_id`. → `{ ok:true }`. Err `"Could not update reading."`
- **deletePhReading** `POST` · `{ id:uuid }` → delete where `id AND user_id` → `{ ok:true }`. Err `"Could not delete reading."`

## partner.functions.ts
Shared: `emailSchema = string.trim().toLowerCase().email().max(255)`.
- **sendPartnerInvite** `POST` · `{ email:emailSchema }`; guard throws `"You can't invite yourself"` if `email === claims.email`. Insert `partner_invites { inviter_id, invitee_email, code }` where `code = randomUUID().replace(/-/g,'').slice(0,16)`. → `{ id, code }`. Err `"Could not create invite. Please try again."`
- **revokePartnerInvite** `POST` · `{ id:uuid }` → set `status='revoked'` where `id AND inviter_id` → `{ ok:true }`. Err `"Could not revoke invite."`
- **acceptPartnerInvite** `POST` · `{ code:string 8–64 }` — **service-role (Edge Function)**. Rules (each a distinct message): `"Email not verified on your account"` · `"Invite not found"` · `"Invite is <status>"` (if not pending) · `"Invite expired"` (expires_at<now) · `"This invite is for a different email address"` (invitee_email≠myEmail) · `"You can't accept your own invite"` (inviter_id===userId) · `"One of the accounts is already linked to a different partner"` · `"Invite was already accepted or revoked"` (race guard). Flow: verify neither profile has conflicting `partner_id` → conditional update invite→accepted (+accepted_by/at) → set `profiles.partner_id` both sides. → `{ ok:true }`.
- **unlinkPartner** `POST` · no input — **service-role**. Clears `profiles.partner_id` for userId; if partner set, also clears partner row (guarded `eq("partner_id", userId)`). → `{ ok:true }`. Err `"Could not unlink."`

## account.functions.ts
- **updateDisplayName** `POST` · `{ displayName: string.trim() 1–80 }` → update `profiles.display_name` where `id=userId` → `{ ok:true, displayName }`. Err `"Could not update your name."`
- **updateTheme** `POST` · `{ theme: enum(light,dark) }` → update `profiles.theme` → `{ ok:true }`. Err `"Could not save theme."`
- **getProfilePrefs** `GET` · no input → `{ displayName:String?, theme:'light'|'dark' (default 'dark') }`. Err `"Could not load profile."`
- **deleteAccount** `POST` · no input — **service-role**. Flow: null partner's `partner_id` if linked → delete from `daily_logs`, `cycle_settings`, `partner_links`, `partner_invites` (by inviter_id), `profiles` (tolerating missing-table errors) → `auth.admin.deleteUser(userId)`. → `{ ok:true }`. Err `"Could not delete account."` (only final auth-delete is fatal; per-table failures warn-logged).

## Cross-cutting notes / gotchas (carry into native)
- **Bug to fix in native:** `deleteAccount` does **not** delete `ph_readings` — they're orphaned. Native should delete pH rows too.
- `getDailyLog.energy` typed `String?` but constrained to `low|normal|high|null` on write — narrow the Kotlin type.
- `listPhReadings` is the only fn tolerating omitted input (`input ?? {}`).
- All POST handlers return `{ ok:true }`, `{ ok:true, ...field }`, or `{ id }` — never the full updated row; native repos should optimistically update local cache.
- Auth bridge `attachSupabaseAuth` (src/start.ts) attaches `Authorization: Bearer <token>`; native uses the supabase-kt session directly.

> **Native mapping:** non-privileged fns → direct Postgrest calls in repositories (RLS scopes to `auth.uid()`); the three **service-role** fns (`acceptPartnerInvite`, `unlinkPartner`, `deleteAccount`) → Supabase **Edge Functions** invoked via supabase-kt `functions.invoke(...)`.
