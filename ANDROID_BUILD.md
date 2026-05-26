# Genesyx — Android (Capacitor) Setup & Play Store Build Guide

Capacitor is configured. The native `android/` folder is generated **on your local machine** (it can't live in this Lovable sandbox). Follow the steps below end-to-end.

---

## 0. Prerequisites (one-time, on your Mac/PC)

- **Node 20+** and **bun** (or npm)
- **Android Studio Ladybug (2024.2)+** with these SDKs installed via *SDK Manager*:
  - Android SDK Platform **35** (target)
  - Android SDK Platform **24** (min)
  - Android SDK Build-Tools 35.x
  - Android SDK Command-line Tools (latest)
- **JDK 21** (bundled with current Android Studio)
- Set env vars: `ANDROID_HOME` and `JAVA_HOME`

---

## 1. Pull the project locally

```bash
git clone <your-lovable-repo-url> genesyx
cd genesyx
bun install
bun run build                 # generates dist/ (required by cap)
npx cap add android           # creates the native android/ folder
npx cap sync android
```

`capacitor.config.ts` is already set:
- `appId`: `com.genesyx.fertilityprep`
- `appName`: `Genesyx`
- `webDir`: `dist`
- `androidScheme`: `https`
- Splash: `#171614`, 2000ms, no spinner

---

## 2. Replace the icon

Copy `android-assets/icon-512.png` (already generated in this repo) into Android Studio's **Image Asset Studio**:

1. Open `android/` in Android Studio
2. Right-click `app/res` → **New → Image Asset**
3. **Foreground Layer**: select `android-assets/icon-512.png`, set *Resize* to ~70%
4. **Background Layer**: choose **Color** → `#171614`
5. Click **Next → Finish** — this generates `ic_launcher` mipmaps + adaptive `ic_launcher.xml` for all densities

---

## 3. Edit `android/app/build.gradle`

Replace the `android { }` block contents (keep `apply plugin` lines as Capacitor generated them):

```gradle
android {
    namespace "com.genesyx.fertilityprep"
    compileSdk 35

    defaultConfig {
        applicationId "com.genesyx.fertilityprep"
        minSdkVersion 24
        targetSdkVersion 35
        versionCode 1
        versionName "1.0.0"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
        aaptOptions { ignoreAssetsPattern '!.svn:!.git:!.ds_store:!*.scc:.*:!CVS:!thumbs.db:!picasa.ini:!*~' }
    }

    // ---- SIGNING (replace placeholders with your keystore) -------------
    signingConfigs {
        release {
            // Generate once locally:
            //   keytool -genkey -v -keystore genesyx-release.jks \
            //     -keyalg RSA -keysize 2048 -validity 10000 \
            //     -alias genesyx
            // Put genesyx-release.jks in android/app/ (and add to .gitignore!)
            // Then set the four values below — or load them from
            // android/keystore.properties (recommended, see step 4).
            storeFile     file("genesyx-release.jks")
            storePassword "REPLACE_WITH_STORE_PASSWORD"
            keyAlias      "genesyx"
            keyPassword   "REPLACE_WITH_KEY_PASSWORD"
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true            // R8 / ProGuard ON
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'),
                          'proguard-rules.pro'
        }
        debug {
            // unsigned, no minification
        }
    }

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_21
        targetCompatibility JavaVersion.VERSION_21
    }
}

repositories { flatDir { dirs '../capacitor-cordova-android-plugins/src/main/libs', 'libs' } }
dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation "androidx.coordinatorlayout:coordinatorlayout:$androidxCoordinatorLayoutVersion"
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
    implementation project(':capacitor-android')
    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation project(':capacitor-cordova-android-plugins')
}

apply from: 'capacitor.build.gradle'
try { def servicesJSON = file('google-services.json'); if (servicesJSON.text) apply plugin: 'com.google.gms.google-services' } catch(Exception e) {}
```

### Safer alternative: load credentials from a properties file

Create `android/keystore.properties` (DO NOT commit):
```properties
storeFile=app/genesyx-release.jks
storePassword=...
keyAlias=genesyx
keyPassword=...
```

And in `android/app/build.gradle` (top of file, before `android { }`):
```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```
Then in `signingConfigs.release` reference them as `keystoreProperties['storePassword']` etc.

---

## 4. Edit `android/app/src/main/AndroidManifest.xml`

In the `<application>` opening tag, ensure these attributes (Capacitor includes most — add what's missing):

```xml
<application
    android:allowBackup="false"
    android:dataExtractionRules="@xml/data_extraction_rules"
    android:fullBackupContent="false"
    android:icon="@mipmap/ic_launcher"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:label="@string/app_name"
    android:theme="@style/AppTheme"
    android:usesCleartextTraffic="false"
    android:networkSecurityConfig="@xml/network_security_config">
```

Create `android/app/src/main/res/xml/network_security_config.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors><certificates src="system"/></trust-anchors>
    </base-config>
</network-security-config>
```

---

## 5. Splash screen colour

Edit `android/app/src/main/res/values/styles.xml`:
```xml
<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
    <item name="windowSplashScreenBackground">@color/splash_background</item>
    <item name="windowSplashScreenAnimatedIcon">@mipmap/ic_launcher_foreground</item>
    <item name="windowSplashScreenAnimationDuration">2000</item>
    <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
</style>
```

Create/update `android/app/src/main/res/values/colors.xml`:
```xml
<color name="splash_background">#171614</color>
<color name="colorPrimary">#171614</color>
<color name="colorPrimaryDark">#171614</color>
```

---

## 6. ProGuard rules

Append to `android/app/proguard-rules.pro`:
```proguard
# Capacitor + WebView
-keep class com.getcapacitor.** { *; }
-keep class com.genesyx.fertilityprep.** { *; }
-keepattributes JavascriptInterface
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
-dontwarn org.apache.cordova.**
```

---

## 7. Build the signed `.aab`

```bash
# from repo root
bun run build
npx cap sync android
cd android
./gradlew clean
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab` — this is what you upload to Google Play.

To test the signing locally first:
```bash
./gradlew assembleRelease
# Installs to a connected device:
adb install -r app/build/outputs/apk/release/app-release.apk
```

---

## 8. Google Play Store Readiness Checklist

### Account & Console
- [ ] Google Play Console account ($25 one-time)
- [ ] Created the app entry (App name: **Genesyx**, default language, free/paid)

### Build
- [x] `targetSdkVersion 35` (Play requirement from Aug 2025)
- [x] `minSdkVersion 24`
- [x] `versionCode 1`, `versionName "1.0.0"` — increment `versionCode` for every upload
- [x] Signed `.aab` (NOT `.apk`)
- [x] R8/ProGuard enabled
- [x] `usesCleartextTraffic="false"`
- [x] Network security config restricting cleartext

### Privacy & Data Safety (Google Play form)
- [ ] **Data collected**: email (account), partner email (invites), cycle data (health)
- [ ] **Encrypted in transit**: yes (HTTPS only, enforced by manifest)
- [ ] **Deletion mechanism**: REQUIRED — add in-app *Delete my account* button
- [ ] **Privacy Policy URL** (public, hosted) — required field
- [ ] **Health connect** declaration if you use Health Connect APIs (you don't currently)

### Content rating
- [ ] Complete IARC questionnaire in Play Console (expect *Everyone* / *Teen*)

### Store Listing assets (upload in Play Console)
- [ ] App icon: 512×512 PNG (use `android-assets/icon-512.png`)
- [ ] Feature graphic: 1024×500 PNG
- [ ] At least 2 phone screenshots (1080×1920 or larger)
- [ ] Short description (80 chars), Full description (4000 chars) — see store-listing.md
- [ ] App category: **Health & Fitness**

### Pre-launch testing
- [ ] Internal testing track first (up to 100 testers, instant)
- [ ] Pre-launch report passes (Play scans automatically)
- [ ] Closed testing → Open testing → Production

### Security / compliance
- [ ] Lovable Cloud: enable *Leaked Password Protection* (HIBP)
- [ ] All Supabase tables have RLS (verified ✓)
- [ ] No service-role key in client bundle (verified ✓)
- [ ] No hardcoded secrets (verified ✓)
- [ ] OAuth redirect URIs include your published URL

### Post-launch
- [ ] Set up crash reporting (Firebase Crashlytics recommended)
- [ ] Monitor pre-launch report each release
- [ ] Bump `versionCode` every upload

---

## 9. Updating the app later

Because the Capacitor config uses **hosted WebView mode** (`server.url`), shipping a web change to Lovable updates the app immediately — **no Play Store resubmission needed** for content/UI updates.

You only need to ship a new `.aab` when you change:
- `capacitor.config.ts`
- Native dependencies / plugins
- `AndroidManifest.xml` / icons / splash
- `versionCode` / `versionName`

---

Questions? Replace the placeholder keystore values, run the build commands in §7, and you'll have an `app-release.aab` ready for the Internal Testing track.
