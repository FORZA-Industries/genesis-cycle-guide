import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Genesyx — Capacitor configuration
 *
 * Strategy: hosted WebView. Because the app is a TanStack Start SSR app
 * (not a static export), the native shell loads the published URL inside
 * a WebView. This keeps your published web app and the Android app in
 * lockstep — ship a web update, the app updates.
 *
 * For a fully offline-capable build, switch to a static export and point
 * `webDir` at the build output instead of using `server.url`.
 */
const config: CapacitorConfig = {
  appId: "app.lovable.genesyx",
  appName: "Genesyx",
  webDir: "dist", // not used while server.url is set; required by the CLI
  server: {
    url: "https://genesis-cycle-guide.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#FAFAFA",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
