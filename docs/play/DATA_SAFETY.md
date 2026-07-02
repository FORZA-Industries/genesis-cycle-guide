# Genesyx — Play Console "Data safety" answer sheets

Two sheets. Use **Sheet 1 now** (local-only build). Switch to **Sheet 2** the moment a
Supabase-wired build (accounts/cloud sync) ships — updating this form then is
**mandatory**, not optional.

---

## Sheet 1 — CURRENT build (local-only, no accounts)

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Is all of the user data collected by your app encrypted in transit? | (not asked when "No" above) |
| Do you provide a way for users to request that their data is deleted? | (not asked) |

That's the whole form. "Collected" means transmitted off the device — Genesyx stores
everything locally, so **nothing is collected**. Data stored only on-device does not
need to be declared.

---

## Sheet 2 — SUPABASE build (accounts + cloud sync) — use when Stage B ships

**Overall:** Yes, the app collects data. Encrypted in transit: **Yes**. Deletion
mechanism: **Yes** (in-app account deletion).

Data types to declare (all **Collected**, none **Shared**, none used for ads):

| Play category | Data | Required? | Purpose |
|---|---|---|---|
| Personal info → Email address | account email | Required | Account management |
| Personal info → Name | display name | Optional | App functionality |
| Personal info → User IDs | account id, partner id | Required | App functionality |
| Health & fitness → Health info | cycle dates & settings, mood, energy, symptoms, sleep, water, supplements, pH readings, notes | Optional | App functionality, Personalisation |
| Photos (only if avatar upload ships) | profile photo | Optional | App functionality |

Key answers:
- **Shared with third parties: No.** (Supabase is a service provider/processor, not
  "sharing" under Play's definition. Partner linking shares only display name/avatar
  with a user-chosen partner — health logs are never shared.)
- **Encrypted in transit: Yes** (HTTPS/TLS).
- **User can request deletion: Yes** — in-app "Delete account" removes profile, cycle
  settings, daily logs, pH readings, and invites. *(Requires the ph_readings deletion
  bug fix to be true — it's in the Stage-B task list.)*
- **Data processed ephemerally: No.**
- **Independent security review: No.**

Also update at the same time:
1. Swap the hosted privacy policy to the full version (`docs/PRIVACY_POLICY.md`).
2. Complete the **Health apps** declaration (fertility tracking) in App content.
3. Add reviewer **test login credentials** (App access → restricted → provide a test
   account) since the app will then require sign-in.
