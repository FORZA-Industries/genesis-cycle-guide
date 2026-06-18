import { toast } from "sonner";

export function rememberAppEntry() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("genesyx:openApp", "true");
  }
}

export function showSignInRequired(message: string, onSignIn?: () => void) {
  toast.error(message, {
    description: "Sign in or create an account to keep your Genesyx data saved.",
    action: onSignIn
      ? {
          label: "Sign in",
          onClick: onSignIn,
        }
      : undefined,
  });
}