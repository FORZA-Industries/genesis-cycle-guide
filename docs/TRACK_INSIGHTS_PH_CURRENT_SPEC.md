# Track / Insights / pH — CURRENT web spec (re-diff reference)

The web app reworked these screens **after** the native versions were built. This is
the definitive current state, extracted from source. In the genesyx-android session:
diff each native screen against this and fix mismatches (target: versionCode 2).

---

## 1. Track screen

**Header** (`ScreenHeader`): title = **current month label** ("June 2026"), subtitle =
**"Cycle {n} · Day {d}"** (loading → "Loading…", no settings → "Set up your cycle"),
trailing = 36dp round **pencil** button → CycleSettingsDialog.
> ⚠️ `Cycle {n}` uses `cycleNumberFor(lastPeriodDate, cycleLength)` — a cycle counter
> (# of full cycles since last period start + 1). Verify the native engine has it.

**Calendar card** (rounded-28, padding 20):
- Month nav row: ‹ / › chevron buttons (32dp round, muted bg) + centered month label.
- Weekday header: S M T W T F S (10sp uppercase, tracking).
- **Loading state:** 35 pulsing circles. **No-settings state:** dashed-border button
  "Add your cycle" / "Tell us when your last period started to see your phases here."
  → opens CycleSettingsDialog.
- Day cells: aspect-square, **rounded-xl** (not circle), 13sp medium. Colors by DayType:
  | type | style |
  |---|---|
  | period | powder-pink 55% tint bg |
  | follicular | card bg + border |
  | fertile | powder-blue 55% tint bg |
  | ovulation | **primary bg, white text, 2dp primary ring w/ offset** |
  | luteal | baby-lavender 25% tint bg |
  Today = extra 2dp foreground ring. Press = scale .95.
- **Tap a day → detail dialog:** title = "Monday, June 15"; description =
  "Day {n} · {Phase label}[ · Fertile]"; body: past day → "No log yet for this day.
  Open Log to add your mood, energy, and symptoms." future/today → "Predicted:
  {Phase}[ · Fertile window]".
- Legend (2×2, 11.5sp): Period · Fertile window · Ovulation · Luteal (swatches match cells).

**Current phase card** (rounded-28): eyebrow "CURRENT PHASE" (primary), phase label
(22sp display semibold), copy: in fertile window → *"You're in your fertile window.
Stay hydrated and prioritise rest."* else → *"About {daysUntilNextPeriod} days until
your next period."* (no settings → "Set up your cycle to see today's phase.")

**CTA:** h-56 primary "＋ Add to today's log" → Log screen. Then **PhTrackerCard** below.

## 2. PhTrackerCard (embedded in Track)

- Header: eyebrow "TRACK YOUR PH", title "Urine Tracker", right: pill button "＋ Log pH".
- **Latest reading tile** (muted/40 rounded-2xl): 48dp icon tile tinted by status
  (droplet icon in status color), "LATEST READING" eyebrow, value `%.1f` (22sp,
  tabular), "Jun 15 · 9:41 AM", status chip on the right (status-tinted bg + text).
- **Data window:** current web defaults to the last **30 days** (range state exists
  for 7/30/90/all but no visible selector is rendered). Native's explicit 7d/30d/90d/All
  chips are an acceptable superset — keep them, default to 30.
- **Chart** (200dp tall): Y domain **4.5–9.0**, ticks [4.5, 6.0, 7.5, 9.0]; X = time.
  Background reference bands: acidic 4.5–6.0 (pink @12%), optimal 6.0–7.5 (green @14%),
  alkaline 7.5–9.0 (lavender @12%). Line: electric-lavender, 2.5dp, dots r=3
  (active r=5), dashed grid.
- **Status model** (`phStatus`): `< 6.0` acidic · `6.0–7.5` optimal · `> 7.5` alkaline.
  Colors: acidic **#D85A8A** · optimal **#3FA37A** · alkaline **#4D4DAA**.
- Legend dots: "Acidic <6.0" / "Optimal 6.0–7.5" / "Alkaline >7.5".
- **Empty states** (in chart area, dashed rounded box + droplet): signed out →
  "Sign in to track your pH"; no data → "No readings yet" + button "Log your first pH".
- **History** ("HISTORY" eyebrow, scrollable max 260dp): rows = 40dp value tile
  (status-tinted, `%.1f`), "Jun 15 · 9:41 AM", "{Status}[ · notes]", chevron.
  **Tap row → edit dialog** (same PhLogDialog, prefilled, with Delete).

## 3. PhLogDialog

- Title: "Log pH reading" / "Edit pH reading". Description: *"Track your urine pH
  from 4.5 to 9.0."*
- Big value readout: `%.1f` at ~48sp, **colored by status**, status chip below.
- Control row: **− button · slider (4.5–9.0, step 0.1) · + button** (44dp round,
  clamp + round to 1 decimal). Default value **6.5**.
- "When" = date+time picker (default now). "Notes (optional)" = multiline, max 500,
  placeholder *"Hydration, meal, time of day…"*.
- Footer: [Delete (destructive, edit-mode only)] … [Cancel] [Save].
- Toasts: "pH logged" / "Reading updated" / "Reading deleted".

## 4. Insights screen

Header: title "Your Insights" (large), subtitle *"Understanding your patterns helps
you make informed, empowered decisions for your wellbeing."*
Empty state (no data yet): sparkles icon, "Your patterns will appear here",
"Keep logging for a few days and we'll start sharing gentle observations."

Card order: **1) PhInsightsSection 2) Cycle regularity 3) Symptom patterns 4) Nutrition consistency.**

- **Cycle regularity:** header + "Last 7 cycles" (primary, right); 7 bars (h-128,
  rounded-top, vertical primary gradient 80%→40%), labels C1–C7; copy: *"Your cycles
  are tracking with steady consistency — a small day-to-day variation is completely
  typical."*
- **Symptom patterns:** 7×5 heatmap of rounded squares, lavender tint at 5/15/30/50%
  intensity; copy: *"Fatigue tends to ease in the second half of your cycle — useful
  to plan rest accordingly."*
- **Nutrition consistency:** 7 bars (h-112, electric-blue→powder-blue gradient),
  labels M T W T F S S; copy: *"You've stayed close to your hydration goal four days
  this week — gentle progress."*

## 5. PhInsightsSection (top card in Insights)

- **The whole card is tappable → navigates to Track** (opens the tracker).
- Header row: "Urine pH" + right link "Open tracker ›" (primary).
- Loaded state:
  - "CURRENT" eyebrow; value `%.1f` (30sp, status color) + status chip;
    right: trend arrow (↑/↓/→ when |Δ| vs previous > 0.1) + "vs previous".
  - Two stat tiles: "7-DAY AVG" and "30-DAY AVG", values `%.2f` (— if none).
  - **Insight + recommendation** (needs ≥2 readings in last 7 days, keyed on
    phStatus(avg7)):
    | avg7 status | insight | recommendation |
    |---|---|---|
    | acidic | "Your pH has been trending acidic this week." | "Try more leafy greens, citrus, and steady hydration to gently shift toward optimal." |
    | alkaline | "Your pH has been trending alkaline this week." | "Balance with whole grains, lean protein, and reduce excess mineral water." |
    | optimal | "Your pH is sitting comfortably in the optimal range — lovely work." | "Keep your current hydration and meal rhythm; consistency is the goal." |
    | (<2 readings) | "Log a few more readings and we'll share gentle observations." | — |
- Empty: droplet + "No pH readings yet. Tap to log your first one." Loading: pulse block.

## Re-diff checklist for the native session
- [ ] Track header shows month + **"Cycle n · Day d"** (implement `cycleNumberFor` if missing)
- [ ] Day-cell styles incl. **ovulation ring** + today ring; tap-day detail dialog with past/future copy
- [ ] Loading skeleton + "Add your cycle" empty state on the calendar
- [ ] Current-phase card copy exactly as above
- [ ] pH thresholds/colors/bands/legend exactly as §2 (incl. #3FA37A optimal green)
- [ ] pH history rows open the **edit** dialog; delete works
- [ ] PhLogDialog: −/slider/+ + big colored readout + datetime + 500-char notes
- [ ] Insights card order with PhInsights first; all verbatim copy
- [ ] PhInsights trend/avg/insight logic exactly as §5
