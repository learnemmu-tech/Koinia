const errorMessages: Record<string, string> = {
  "auth/user-not-found": "No account found with this email address.",
  "auth/wrong-password": "Incorrect password. Please try again.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/too-many-requests": "Too many attempts. Please try again later.",
  "auth/network-request-failed": "Network error. Please check your connection.",
  "auth/popup-closed-by-user": "Sign-in popup was closed. Please try again.",
  "auth/cancelled-popup-request": "Another sign-in is in progress.",
  "auth/account-exists-with-different-credential":
    "An account with this email exists with a different sign-in method.",
  "auth/invalid-credential":
    "Invalid credentials. Please check your email and password.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/requires-recent-login": "Please sign in again to continue.",
  "auth/popup-blocked":
    "Sign-in popup was blocked by the browser. Please allow popups.",
  form_identifier_not_found: "No account found with this email address.",
  form_password_incorrect: "Incorrect password. Please try again.",
  form_identifier_exists: "An account with this email already exists.",
  form_password_pwned: "This password is not allowed. Please choose another.",
  form_password_length_too_short:
    "Password must be at least 8 characters.",
  form_param_format_invalid: "Please enter a valid email address.",
  too_many_requests: "Too many attempts. Please try again later.",
  identifier_already_signed_in: "You are already signed in.",
};

function clerkErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const record = error as {
    code?: string;
    message?: string;
    longMessage?: string;
    errors?: Array<{ code?: string; message?: string; longMessage?: string }>;
  };

  const first = record.errors?.[0];
  const code = first?.code ?? record.code;
  const userMessage =
    first?.longMessage ??
    record.longMessage ??
    first?.message ??
    (typeof record.message === "string" ? record.message : null);

  if (userMessage) return userMessage;
  if (code && errorMessages[code]) {
    return errorMessages[code];
  }
  return null;
}

export function getFirebaseAuthErrorMessage(error: unknown): string {
  const clerkMessage = clerkErrorMessage(error);
  if (clerkMessage) return clerkMessage;

  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}
