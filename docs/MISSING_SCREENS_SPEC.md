# Missing Screens — Build Spec (from live web source)

> Source of truth: the Lovable web app (`src/routes/*`, `src/components/genesyx/screens/*`).
> This spec captures the **5 not-yet-built screens** + PartnerSection + the server
> functions they call, so the native (Kotlin/Compose) versions match the real app.
> Build order: **Auth → Profile (+Partner) → Log → Invite → Pregnancy**, then re-diff
> Track/Insights/pH (see §8).

Design tokens, components (`GxPrimaryButton`, `GxOptionPill`, `Eyebrow`, `tintOnWhite`,
`ScreenHeader`, `BrandOrb`/`BrandLogo`) already exist — reuse them. Lavender tint =
`color-mix(electric-lavender 10%, white)` → `ElectricLavender.tintOnWhite(0.10f)`.

---

## 0. Auth model (applies to all screens)
- Backend = **Supabase Auth** (email/password) + **Google OAuth**.
- A `use-auth` equivalent is needed: expose `user` (id, email, user_metadata.display_name/full_name), `loading`, `signOut()`. On Android use supabase-kt `Auth` with a session flow → `StateFlow<UserSession?>`.
- Most screens have a **signed-out state** that routes to Auth. Profile, Log, Partner all check `user == null`.
- Password rules: **min 8, max 72** chars. Email: valid, max 255.

---

## 1. Auth screen  (`/auth`)
**Purpose:** sign in / create account; redirect to Home when already authed.

**Layout (centered column, max-width ~360dp, bg = background):**
- `BrandLogo(size=32)` centered, 32dp bottom margin.
- H1 (display, 30sp, semibold, centered): `signin` → **"Welcome back"**, `signup` → **"Create your account"**.
- Sub (14sp muted, centered): `signin` → "Sign in to sync your journey across devices." · `signup` → "Save your cycle, nutrition, and partner info securely."
- Form (top margin 32):
  - **Name** field (signup only): label "Name", placeholder "Your name", maxLength 80.
  - **Email** field: label "Email", type email, required.
  - **Password** field: label "Password", type password, required.
  - All inputs: **h-48dp, rounded 12**, 6dp top margin under label.
  - Submit button (h-48, rounded-12, full-width, semibold): `signin` → "Sign in" · `signup` → "Create account". Shows spinner when busy.
- Divider with centered **"OR"** (uppercase, tracking, muted).
- Outline button (h-48, full-width): **"Continue with Google"**.
- Footer toggle (centered, 14sp): signin → "New here? **Create account**" · signup → "Already have an account? **Sign in**" (the bold part is a text button toggling `mode`).
- Bottom link (12sp muted): **"Back to app"** → Home.

**Behavior:**
- `signUp`: `supabase.auth.signUp(email, password, data={display_name: name})`, emailRedirect to app origin. On success toast: **"Check your email to confirm your account."** (stays on screen).
- `signIn`: `signInWithPassword(email, password)` → on success navigate Home (replace).
- Google: OAuth `google` (supabase-kt `signInWith(Google)`) → on success Home.
- Validation errors and auth errors → toast (top-center). Validate **before** calling: bad email → "Enter a valid email"; short pw → "Password must be at least 8 characters".

**Native notes:** this is a full-screen route, **no bottom nav**. Use `Toaster`→ Snackbar/Toast. Google OAuth needs the supabase-kt OAuth flow + a redirect/deep link.

---

## 2. Invite accept screen  (`/invite/{code}`)
**Purpose:** deep-link target to accept a partner invite.

**States:**
1. **Loading** (auth or fetch) → centered spinner.
2. **Signed out** → `BrandLogo`, H1 "You've been invited", sub "Sign in or create an account to accept this partner invite.", primary button **"Sign in to continue"** → `/auth` (preserve the invite code so it returns here after login).
3. **Signed in** → `BrandLogo`, `Heart` icon (primary, 40dp), H1 "Partner invite":
   - **Error variant** (see checks below): show error text + outline button "Back to app" → Home.
   - **Valid variant**: body "Accept to link your account so you can share your fertility-prep journey together.", primary button **"Accept invite"** (spinner when busy), ghost button **"Not now"** → Home.

**Preview validation (read `partner_invites` by `code`, before accepting):**
- not found / null → "Invite not found or already used"
- `status != 'pending'` → "This invite is {status}"
- `expires_at < now` → "This invite has expired"
- `invitee_email != user.email` (case-insensitive) → "This invite is for {email}. Sign in with that email to accept."
- else → show the valid variant.

**Accept action:** call server fn **`acceptPartnerInvite({ code })`** (atomic, re-validates). Success → toast "You're linked!" → Home. Error → toast message.

**Native notes:** register an Android **deep link** `https://<host>/invite/{code}` (and/or app scheme) in the manifest; route to this screen with the `code` arg.

---

## 3. Profile screen  (bottom-tab "Profile")
`ScreenHeader(title="Profile")`. Vertical scroll, 20dp horizontal padding, 16dp gaps.

**a) Identity card** (rounded-3xl, card bg, padding 20):
- 56dp circle avatar with gradient (baby-lavender → electric-pink), white initial (first letter of display name, uppercase).
- Name (display 17sp semibold) + email line (13sp muted). If signed out, email line = "Sign in to sync your data".
- If `user`: a **"Premium"** Badge (lavender tint, primary text) on the right.
- `displayName` source: `user_metadata.display_name ?? full_name ?? email-prefix ?? "Guest"`.

**b) Current focus** toggle (eyebrow "Current focus"): 2-segment pill (bg muted, p-1):
- **"Fertility Prep"** (default selected) | **"Pregnancy"**. Selecting Pregnancy also navigates to the **Pregnancy** screen (§5). Selected segment = card bg + shadow.

**c) PartnerSection** — see §4 (full block).

**d) Account** group (eyebrow "Account", rounded-2xl card):
- Row **"Edit name"** → if `user` open Edit-name dialog, else go `/auth`. Trailing chevron.
- Row **"Change password"** → if `user` open Change-password dialog, else `/auth`. Trailing chevron.
- Rows are min 52dp, divider between.

**e) Tracking** menu group (eyebrow "Tracking") — items from `profileMenu.account` (label + chevron, non-functional links). Pull labels from `mockData.ts` `profileMenu`.

**f) Preferences** group (eyebrow "Preferences"):
- Row "Push Notifications" + **Switch** (local state, default on).
- Row "Dark Mode" + **Switch** bound to the theme toggle (`dark = theme=="dark"`).

**g) About** menu group (eyebrow "About") — items from `profileMenu.about`.

**h) Log out / Sign in button** (full-width, card, destructive text, `LogOut` icon): if `user` → signOut then `/auth`; else label "Sign in" → `/auth`.

**i) Delete account** (only if `user`): outline destructive button, `Trash2` icon, "Delete account" → opens confirm **AlertDialog**: title "Delete your account?", body "This will permanently delete your account and all your data. This cannot be undone.", Cancel + destructive "Delete". On confirm: `deleteAccount()` server fn → `signOut()` → toast "Account deleted" → `/auth`.

**Edit Name dialog:** title "Edit name", desc "This is how you'll appear across the app.", one field "Display name" (maxLength 80, autofocus, prefilled). Save → `updateDisplayName({ displayName })`, toast "Name updated". Empty → toast "Name cannot be empty".

**Change Password dialog:** title "Change password", desc "Choose a new password of at least 8 characters." Fields: Current / New / Confirm. Validation: new ≥8 ("New password must be at least 8 characters"), new==confirm ("Passwords don't match"). Flow: re-auth with `signInWithPassword(email, current)` (wrong → "Current password is incorrect"), then `updateUser(password=new)`, toast "Password updated".

---

## 4. PartnerSection  (component inside Profile)
Eyebrow "Partner", card (rounded-2xl, padding 20).

**Signed-out:** `Heart` icon, "Add your partner", "Sign in to invite a partner to join your journey.", button "Sign in" → `/auth`.

**Loading:** spinner.

**Linked (profile.partner_id set):** row with 44dp gradient avatar (partner initial), name (`partner.display_name ?? "Your partner"`), "Linked partner" sub, and a destructive text button **"Remove"** → confirm → `unlinkPartner()` → reload, toast "Partner unlinked".

**Not linked:**
- `Heart` + "Add your partner" + "Send an invite — when they accept, you'll be linked and can share your journey."
- Email `Input` (placeholder "partner@example.com", maxLength 255) + **"Send invite"** button (`Mail` icon, spinner when busy).
  - Validate email; if == own email → "You can't invite yourself".
  - `sendPartnerInvite({ email })` → clear field, toast "Invite created — copy the link to share", reload.
- **Pending invites** list (only pending): each row = invitee_email + **Copy** (copies `<origin>/invite/{code}` → toast "Invite link copied") + **Revoke** X (`revokePartnerInvite({ id })` → reload).

**Data loads (user-scoped Supabase reads):**
- `profiles` where id=user.id → `{id, display_name, partner_id}`.
- if partner_id: `profiles` where id=partner_id → partner.
- `partner_invites` where inviter_id=user.id order by created_at desc.

---

## 5. Pregnancy screen  (`PregnancyTransition`, reached from Home preview / Profile focus toggle)
Small teaser, **not a full feature**. Column, back chevron top-left (`onLater`).
- `BrandOrb(96dp)` centered.
- H1 (display 26sp semibold, max ~18ch, centered): **"Support for the next chapter"**.
- Sub (14sp muted, ~30ch): "Whenever you're ready, Genesyx can gently shift to support you through pregnancy — at your pace."
- Two **FeatureCard**s (rounded-3xl, card, icon tile in powder-pink tint):
  1. `Baby` — **"Trimester tracking"** — "Week-by-week guidance with calm, clear updates."
  2. `Apple` — **"Prenatal nutrition"** — "Updated focus foods and supplement guidance."
- Bottom (pushed to end): primary button **"Switch to pregnancy mode"** (`onSwitch`) + ghost "Not yet, keep tracking" (`onLater`).

---

## 6. Log screen  (`LogScreen`, reached from Home "Log today")
`ScreenHeader(title="Log Today", subtitle="Quick notes about how you're feeling.", onBack=onClose)`. 20dp padding, 16dp gaps. Pre-fills from today's `daily_log` (via a `use-daily-log` equivalent).

**Sections (each has an uppercase eyebrow title):**
- **Mood** — 4-col grid of tiles (min 76dp, rounded-2xl, border; selected = primary border + lavender-8% bg). Options: `great`=Heart "Great", `good`=Smile "Good", `ok`=Meh "Okay", `low`=Frown "Low".
- **Energy** — 3-seg pill (bg muted): **low / normal / high** (capitalized). Selected = card bg + shadow.
- **Symptoms** — wrap of chips (rounded-full, min 36dp). Default list from `mockData.symptoms`; selected = primary fill + check. Plus an **"Add"** dashed chip → inline text input (Enter adds, Esc cancels, blur commits) for custom symptoms.
- **2×2 grid of MiniCards** (rounded-2xl card, icon tile):
  - `Moon` **Sleep** (lavender) → value `"{h}h {m}m"` or "—"; opens **Sleep dialog** (Hours 0–24 / Minutes 0–59 number inputs → sets `sleepMinutes`).
  - `Droplets` **Water** (blue) → `"{x.x}L"` or "—"; opens **Water dialog** (ml number input, step 100, 0–10000).
  - `Pill` **Supplements** (lavender) → `"{n} of 4"`; opens **Supplements dialog** (toggle list: Folic acid, Vitamin D, Iron, Omega-3).
  - `Apple` **Nutrition** (pink) → static "On track" (no action).
- **Notes** — multiline textarea (3 rows, placeholder "A short note for future you…").
- **Save log** primary button (h-56, rounded-2xl). Requires session — if signed out: toast "Please sign in to save your log." Save → `daily_log.save({mood, energy, symptoms, sleepMinutes, waterMl, supplements, notes})`, toast "Log saved / Today's entry has been added.", then `onClose()`. `WATER_TARGET = 2400`.

**Energy maps to** the schema `energy` enum `low|normal|high`. Mood ids are free strings (`great|good|ok|low`).

---

## 7. Server functions to implement (Edge Functions / RPC)
Beyond the 3 in `docs/DATA_LAYER.md`, the screens above also call:
- **`updateDisplayName({ displayName })`** → updates `profiles.display_name` (and ideally auth `user_metadata.display_name`); returns `{ displayName }`.
- **`sendPartnerInvite({ email })`** → insert `partner_invites` (inviter_id=me, invitee_email, 16-char hex code, status pending, expires +14d). Guard: can't invite yourself.
- **`revokePartnerInvite({ id })`** → set `status='revoked'` where inviter_id=me (matches RLS strict-revoke policy).
- **`acceptPartnerInvite({ code })`**, **`unlinkPartner()`**, **`deleteAccount()`** — already specced in DATA_LAYER.md.
- Password change + signUp/signIn/OAuth use Supabase Auth directly (client SDK), not server fns.

In the native app these become **supabase-kt `functions.invoke(...)`** calls (Edge Functions) or Postgres RPCs; until wired, the in-memory repos can stub them.

---

## 8. Re-diff TODO — screens that changed AFTER we built them
Recent web commits reworked these; native versions were built against the older spec. Before "done", diff native against current source:
- `src/components/genesyx/screens/Track.tsx`
- `src/components/genesyx/screens/Insights.tsx`
- `src/components/genesyx/PhTrackerCard.tsx`, `PhLogDialog.tsx`, `PhInsightsSection.tsx`
- `src/components/genesyx/BrandLogo.tsx` (logo changed — native still uses a text wordmark; swap to the real logo/`logo_g.png`).

(Ask the FORZA-session/me to extract these diffs when ready — only the session with the web source can.)
