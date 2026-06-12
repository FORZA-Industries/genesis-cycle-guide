import { useEffect, useState } from "react";

/**
 * True only when the page is running inside the Capacitor native shell
 * (the Android/iOS app), as opposed to a normal mobile browser.
 *
 * Capacitor injects its bridge (`window.Capacitor`) into the WebView even in
 * hosted mode (server.url), so this works for the live Lovable site loaded
 * inside the app. Returns false during SSR and on first paint, then resolves
 * after mount — guard UI that must differ between web and native with it.
 */
export function useIsNativeApp(): boolean {
  const [native, setNative] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!cancelled) setNative(Capacitor.isNativePlatform());
      } catch {
        if (!cancelled) setNative(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return native;
}
