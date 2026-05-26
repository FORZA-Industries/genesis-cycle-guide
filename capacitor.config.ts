import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Genesyx — Capacitor configuration
 *
 * Strategy: hosted WebView. The native shell loads the published Lovable
 * URL inside a WebView so web updates ship instantly without re-submitting
 * to Google Play. For a fully offline build, switch to a static export and
 * remove the `server.url` block (webDir already points at `dist`).
 */
const config: CapacitorConfig = {
  appId: "com.genesyx.fertilityprep",
  appName: "Genesyx",
  webDir: "dist",
  server: {
    url: "https://genesis-cycle-guide.lovable.app",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [],
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#171614",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
