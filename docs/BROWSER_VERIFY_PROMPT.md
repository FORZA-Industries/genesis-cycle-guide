# Verify the launch setup in YOUR Chrome — with local Claude Code

This gives your **local** Claude Code (on your PC, where Chrome is signed in to
Supabase / Google Cloud / Play Console) the ability to drive your browser and audit
everything, read-only. Cloud sessions can't do this — local can.

---

## Part 1 — One-time setup (~3 min)

**1. Quit Chrome completely** (all windows; on Windows also check the tray icon).

**2. Relaunch Chrome with remote debugging ON:**
- **macOS** (Terminal):
  ```bash
  open -a "Google Chrome" --args --remote-debugging-port=9222
  ```
- **Windows** (PowerShell):
  ```powershell
  & "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
  ```
Chrome opens normally, with your logged-in profile. Leave it running.

**3. Register the browser MCP server** — in a terminal, inside your `genesyx-android`
project folder (needs Node 22+):
```bash
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest --browser-url http://127.0.0.1:9222
```

**4. Start Claude Code** (`claude`) in that folder and paste the prompt below.
Claude will ask permission before each browser action — that's expected.

> Security note: remote debugging exposes your browser to local programs. Do the
> audit, then fully quit and reopen Chrome normally to close the debug port.

---

## Part 2 — Paste this prompt into local Claude Code

```
You have Chrome browser access via the chrome-devtools MCP tools, connected to MY
logged-in Chrome. Perform a STRICTLY READ-ONLY audit of my app-launch setup for the
Genesyx Android app and produce a report.

HARD SAFETY RULES — follow exactly:
- READ ONLY: never click Save, Create, Delete, Submit, Roll out, or any button that
  changes state. Navigation, scrolling, and expanding read-only views only.
- NEVER print, screenshot, or copy secrets: mask every API key, client secret, or
  token to its first 8 characters + "…". The service_role key must never be
  displayed at all.
- Stay ONLY on these domains: supabase.com, console.cloud.google.com,
  play.google.com/console, lucasdvsf02626.github.io. Do not open anything else.
- If a page needs login/2FA, pause and tell me instead of trying to authenticate.

AUDIT CHECKLIST — verify each item, then output a table: item | ✅/❌/⚠️ | exact fix.

A. SUPABASE (https://supabase.com/dashboard — open the Genesyx project)
 1. Table Editor lists exactly these tables: profiles, cycle_settings, daily_logs,
    ph_readings, partner_invites.
 2. Every one of those tables shows RLS ENABLED.
 3. Policies (Database → Policies) match the app schema (docs/schema.sql in this
    repo): profiles has SELECT (own-or-partner), INSERT (own), UPDATE (own, and
    partner_id must be unchangeable); cycle_settings/daily_logs/ph_readings each
    have 4 own-row CRUD policies; partner_invites has inviter SELECT, invitee-by-
    email SELECT, inviter INSERT, and an UPDATE restricted to status='revoked'.
 4. Database → Functions: handle_new_user exists (signup profile trigger).
 5. Authentication → Sign In / Providers: Email is ENABLED. Note whether "Confirm
    email" is on or off. Google provider: note enabled/disabled, and if enabled
    whether a Web client ID is set.
 6. Project Settings → API: project URL and anon/publishable key exist (mask them).

B. GOOGLE CLOUD (https://console.cloud.google.com → APIs & Services → Credentials)
 7. A Web application OAuth 2.0 client exists (its ID is what Supabase Google auth
    and Android serverClientId need — mask it).
 8. An Android OAuth client exists with package name com.genesyx.app and a SHA-1
    registered. Note whether it's present; if missing, say so.
 9. OAuth consent screen is configured (app name, support email). If publishing
    status = Testing, confirm my Gmail is in test users.

C. PLAY CONSOLE (https://play.google.com/console → the Genesyx app)
 10. Testing → Internal testing: a release exists — report its status (draft /
     rolled out) and versionCode.
 11. App content (Policy → App content): report the status of each: Privacy policy
     URL, App access, Ads, Content rating, Target audience, Data safety.
     Expected for the CURRENT local-only build: policy URL set; App access = all
     functionality available; Ads = No; rating completed; audience 18+; Data
     safety = "No data collected".
 12. Store listing: name "Genesyx: Fertility Prep"; short + full description
     filled; 512×512 icon uploaded; 1024×500 feature graphic uploaded; at least
     2 phone screenshots.
 13. Dashboard: list every remaining task Play says must be completed before the
     Internal testing release can be rolled out (or confirm it's already live).

D. PRIVACY POLICY HOSTING
 14. Open https://lucasdvsf02626.github.io — confirm it loads the Genesyx privacy
     policy page (title "Privacy Policy — Genesyx").

E. LOCAL REPO (terminal, not browser — run from the genesyx-android root)
 15. local.properties contains SUPABASE_URL and SUPABASE_ANON_KEY (mask values);
     confirm local.properties is git-ignored (git check-ignore local.properties).
 16. git grep -il "service_role" -- app/ returns NOTHING (no service key in app code).
 17. ./gradlew assembleDebug completes successfully.

OUTPUT FORMAT:
1. A single table: # | Item | ✅/❌/⚠️ | What I saw | Exact fix if not ✅.
2. A short "Do next" list ordered by impact (what unblocks rolling out Internal
   testing first).
3. Nothing else. Do not fix anything yourself in the dashboards; report only.
   (Repo-side fixes from section E you may propose but not apply.)
```

---

## After the audit
- Fix any ❌ it reports (the table tells you exactly where to click).
- Re-run the same prompt to confirm all-green.
- When A–D are green: click **Roll out** on Internal testing yourself, install from
  the opt-in link, and take your 2 store screenshots.
- Then quit + reopen Chrome normally (closes the debug port).
