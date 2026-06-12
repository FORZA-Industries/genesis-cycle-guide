# Genesyx — Native Android (Kotlin) Architecture

> **Source of truth** for the native Kotlin rebuild of Genesyx.
> Captured from `genesyxandroidblueprint.pdf`. Update this file as the app evolves —
> every Claude session should start by reading it.

- **Package / appId:** `com.genesyx.app`
- **UI toolkit:** Jetpack Compose + Material 3
- **Architecture:** Single-Activity + Compose Navigation + **MVVM** over **Clean Architecture** (`data` / `domain` / `ui`)
- **DI:** Hilt
- **Local storage:** Room (structured data) + DataStore (preferences)
- **Remote:** Retrofit + Gson (generic `GenesyxApi`) — see [Open Decisions](#open-decisions)
- **SDK:** `compileSdk = 35`, `targetSdk = 35`, `minSdk = 26`, Java 17
- **Versioning:** `versionCode = 1`, `versionName = "1.0.0"`
- **No ads.** AdMob is intentionally excluded.

---

## Design Tokens

Extracted from the Genesyx screenshots. Defined in `ui/theme/Color.kt`.

| Token | Hex | Use |
|---|---|---|
| Primary | `#5B4FCF` | Deep indigo-purple — primary brand |
| Primary Light | `#8B7FE8` | Mid purple — buttons |
| Primary Container | `#C8C0F5` | Light purple — containers / gradient end |
| Surface | `#F5F5F8` | Off-white background |
| Card | `#FFFFFF` | Card surfaces |
| Text Primary | `#1A1A2E` | Near-black text |
| Text Secondary | `#6B6B80` | Muted grey text |
| Accent Blue | `#4AB3E8` | Hydration / nutrition charts |
| Gradient Start | `#8B7FE8` | Decorative blobs |
| Gradient End | `#C8C0F5` | Decorative blobs |
| Error Red | `#E05C5C` | Errors |

### Typography (`ui/theme/Type.kt`)

Font: **Inter** (Google Fonts) — `inter_regular.ttf`, `inter_medium.ttf`, `inter_bold.ttf` in `res/font/`.

| Role | Material3 slot | Weight | Size | Line height |
|---|---|---|---|---|
| Display | `displayLarge` | Bold | 32sp | 38sp |
| Heading | `headlineMedium` | Bold | 22sp | 28sp |
| Title | `titleLarge` | Bold | 18sp | 24sp |
| Body | `bodyLarge` | Normal | 16sp | 22sp |
| Body (sm) | `bodyMedium` | Normal | 14sp | 20sp |
| Label / caption | `labelSmall` | Medium | 11sp | letter-spacing 0.08 |

ALL-CAPS section headers use `labelSmall` with `letterSpacing = 0.08.sp`.

---

## Project Structure

```
genesyx-android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── kotlin/com/genesyx/app/
│   │   │   ├── MainActivity.kt              ← Single-activity host (Scaffold + bottom nav)
│   │   │   ├── GenesyxApplication.kt        ← @HiltAndroidApp
│   │   │   │
│   │   │   ├── di/                          ← Hilt modules
│   │   │   │   ├── DatabaseModule.kt
│   │   │   │   ├── NetworkModule.kt
│   │   │   │   └── RepositoryModule.kt
│   │   │   │
│   │   │   ├── data/
│   │   │   │   ├── local/
│   │   │   │   │   ├── GenesyxDatabase.kt    ← Room database
│   │   │   │   │   ├── dao/
│   │   │   │   │   │   ├── CycleDao.kt
│   │   │   │   │   │   ├── LogDao.kt
│   │   │   │   │   │   └── UserDao.kt
│   │   │   │   │   └── entity/
│   │   │   │   │       ├── CycleEntity.kt
│   │   │   │   │       ├── DailyLogEntity.kt
│   │   │   │   │       └── UserEntity.kt
│   │   │   │   ├── remote/
│   │   │   │   │   ├── GenesyxApi.kt         ← Retrofit interface
│   │   │   │   │   └── dto/                  ← API DTOs
│   │   │   │   └── repository/
│   │   │   │       ├── CycleRepository.kt
│   │   │   │       ├── NutritionRepository.kt
│   │   │   │       └── UserRepository.kt
│   │   │   │
│   │   │   ├── domain/
│   │   │   │   ├── model/                    ← Pure Kotlin models
│   │   │   │   │   ├── CyclePhase.kt
│   │   │   │   │   ├── DailyLog.kt
│   │   │   │   │   ├── NutritionFocus.kt
│   │   │   │   │   ├── Supplement.kt
│   │   │   │   │   └── User.kt
│   │   │   │   └── usecase/
│   │   │   │       ├── GetCycleInsightsUseCase.kt
│   │   │   │       ├── GetNutritionFocusUseCase.kt
│   │   │   │       └── LogDailyEntryUseCase.kt
│   │   │   │
│   │   │   ├── ui/
│   │   │   │   ├── theme/
│   │   │   │   │   ├── Color.kt              ← Design tokens
│   │   │   │   │   ├── Theme.kt              ← Material3 theme
│   │   │   │   │   └── Type.kt               ← Typography scale
│   │   │   │   ├── navigation/
│   │   │   │   │   ├── GenesyxNavGraph.kt    ← NavHost
│   │   │   │   │   └── Screen.kt             ← Sealed route definitions
│   │   │   │   ├── components/               ← Shared composables
│   │   │   │   │   ├── GenesyxBottomNav.kt
│   │   │   │   │   ├── PurpleCard.kt
│   │   │   │   │   ├── BarChart.kt
│   │   │   │   │   ├── DidYouKnowModal.kt
│   │   │   │   │   └── SupplementBadge.kt
│   │   │   │   ├── home/        { HomeScreen.kt, HomeViewModel.kt }
│   │   │   │   ├── track/       { TrackScreen.kt, TrackViewModel.kt }
│   │   │   │   ├── nutrition/   { NutritionScreen.kt, NutritionViewModel.kt }
│   │   │   │   ├── insights/    { InsightsScreen.kt, InsightsViewModel.kt }
│   │   │   │   ├── profile/     { ProfileScreen.kt, ProfileViewModel.kt }
│   │   │   │   └── onboarding/
│   │   │   │       ├── SplashScreen.kt
│   │   │   │       ├── OnboardingScreen.kt        ← Quiz flow (5 steps)
│   │   │   │       ├── OnboardingViewModel.kt
│   │   │   │       └── ReadinessSummaryScreen.kt
│   │   │   │
│   │   │   └── util/  { DateUtils.kt, Extensions.kt }
│   │   │
│   │   └── res/
│   │       ├── drawable/                     ← SVG icons, splash bg
│   │       ├── font/                         ← inter_regular/medium/bold.ttf
│   │       ├── values/  { strings.xml, themes.xml (splash theme) }
│   │       └── xml/     { backup_rules.xml }
│   │
│   └── build.gradle.kts
├── build.gradle.kts
└── settings.gradle.kts
```

---

## Dependencies (`app/build.gradle.kts`)

Compose BOM pins all Compose versions. Using version catalog (`libs.versions.toml`).

- **Compose:** `compose.bom`, `compose.ui`, `compose.ui.graphics`, `compose.material3`, `compose.ui.tooling.preview` (+ `debug` tooling)
- **Navigation:** `navigation.compose`
- **Lifecycle/ViewModel:** `lifecycle.runtime.ktx`, `lifecycle.viewmodel.compose`
- **Hilt:** `hilt.android`, `hilt.compiler` (ksp), `hilt.navigation.compose`
- **Room:** `room.runtime`, `room.ktx`, `room.compiler` (ksp)
- **Retrofit:** `retrofit`, `retrofit.converter.gson`, `okhttp.logging.interceptor`
- **DataStore:** `datastore.preferences`
- **Splash:** `core.splashscreen`
- **Coroutines:** `kotlinx.coroutines.android`

Plugins: `android.application`, `kotlin.android`, `kotlin.compose`, `hilt.android`, `ksp`.

---

## Navigation

Single `NavHost`, start destination `Splash`. Routes defined as a sealed class `Screen`.

**Flow:** `Splash → OnboardingIntro → OnboardingQuiz → ReadinessSummary → Home`
(each onboarding step pops itself off the back stack).

**Routes** (`Screen.kt`):
- Onboarding: `splash`, `onboarding_intro`, `onboarding_quiz`, `readiness_summary`
- Main tabs: `home`, `track`, `nutrition`, `insights`, `profile`

**Bottom nav** (`GenesyxBottomNav`) shows on main tabs only; hidden on the onboarding routes (`noNavRoutes` set in `MainActivity`). Tabs:

| Tab | Route | Icon (Material Outlined) |
|---|---|---|
| Home | `home` | `Home` |
| Track | `track` | `CalendarMonth` |
| Nutrition | `nutrition` | `Eco` |
| Insights | `insights` | `BarChart` |
| Profile | `profile` | `Person` |

---

## Screen Build Order

Build one screen at a time, each with its screenshot. Status:

| # | Screen | Status | Notes / source images |
|---|---|---|---|
| — | Theme (Color/Type/Theme) | ✅ in blueprint | Ready to copy |
| — | Navigation (Screen, NavGraph) | ✅ in blueprint | NavGraph needs `modifier` param (see Known Gaps) |
| — | MainActivity + GenesyxBottomNav | ✅ in blueprint | Ready to copy |
| — | HomeScreen + HomeViewModel | ✅ in blueprint | Full impl provided (stub ViewModel data) |
| 1 | OnboardingScreen | ⬜ to build | 5-step quiz + DidYouKnow modals (Images 6, 8, 10, 3, 11) |
| 2 | ReadinessSummaryScreen | ⬜ to build | Readiness summary + unlock CTA (Images 14, 15) |
| 3 | InsightsScreen | ⬜ to build | Cycle regularity bar chart + symptom grid (Images 1, 16) |
| 4 | NutritionScreen | ⬜ to build | Hydration tracker, focus foods, supplement plan (Image 2) |
| 5 | TrackScreen | ⬜ to build | Daily logging form |
| 6 | ProfileScreen | ⬜ to build | Settings, focus toggle, partner invite (Images 4, 7) |

Also still to wire: data layer (Room entities/DAOs, repositories), domain use cases, DI modules, remaining shared components (`PurpleCard`, `BarChart`, `DidYouKnowModal`, `SupplementBadge`), `GenesyxApplication`, `AndroidManifest`, splash theme, `backup_rules.xml`.

### Per-screen prompt template

```
Build [ScreenName].kt in Jetpack Compose for the Genesyx app.
Match this screenshot exactly.
Design tokens: Primary #5B4FCF, Surface #F5F5F8, Card #FFFFFF,
TextPrimary #1A1A2E, TextSecondary #6B6B80.
Use Material3, MVVM with a companion ViewModel, and our shared
GenesyxTheme and GenesyxBottomNav components.
```

---

## Domain Model (initial)

- **User** — profile (name, etc.)
- **CyclePhase** — cycle state / fertile window (e.g. "Day 14 · Fertile window")
- **DailyLog** — daily entry (hydration, symptoms, etc.)
- **NutritionFocus** — focus foods for the current phase
- **Supplement** — supplement plan items

Home UI state (reference): `userName`, `cycleSetUp: Boolean`, `todayFocus: String`, `hydrationLitres: Float` (target 2.4L), `streakDays: Int`, `isLoading: Boolean`.

---

## Known Gaps / Fixes to apply when scaffolding

1. **`GenesyxNavGraph` signature** — the blueprint defines it as `GenesyxNavGraph(navController)` but `MainActivity` calls it with a `modifier = Modifier.padding(innerPadding)` argument. Add a `modifier: Modifier = Modifier` parameter and apply it to the `NavHost`.
2. **`OnboardingIntroScreen`** — referenced inside `GenesyxNavGraph` for `onboarding_intro`, but not listed in the file tree (which has `OnboardingScreen`, `SplashScreen`, `ReadinessSummaryScreen`). Add an `OnboardingIntroScreen.kt` (feature-list / intro screen, "Image 17").
3. **Home "Log today" / "Preview pregnancy pathway"** buttons have `onClick` stubs (`/* ... */`) — wire to a log bottom sheet and a pregnancy-preview route once those exist.
4. **HomeViewModel** ships with stubbed data; inject `UserRepository` / `CycleRepository` once the data layer is built.

---

## Open Decisions

- **Backend / remote source.** The blueprint uses a generic `Retrofit GenesyxApi`. The existing web app uses **Supabase** (auth, partner sync, cloud cycle/log/pH data). Decide whether the native app:
  - (a) keeps Supabase as the remote (auth + partner sync + cloud sync), wrapping it behind the repositories, or
  - (b) is local-first only (Room + DataStore), with the Retrofit layer added later, or
  - (c) Room-local-first with a thin Retrofit sync layer to a Genesyx API.
  > _Pending — to confirm with screen-share/context._
- **pH tracker & partner features** from the current web app are not yet represented in the blueprint's structure. Confirm whether they're in scope for v1 of the native app.

---

## Conventions

- Complete files only — no partial snippets; all imports at the top.
- Kotlin only, no Java.
- ViewModel + `StateFlow<UiState>` per screen; collect with `collectAsState()`.
- Compose-first; no XML layouts (XML only for `themes.xml`, `backup_rules.xml`, splash).
- One screen per build step, matched to its screenshot.
