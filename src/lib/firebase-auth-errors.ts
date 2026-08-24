import { FirebaseError } from "firebase/app";

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
};

export function getFirebaseAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return errorMessages[error.code] ?? "An error occurred. Please try again.";
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred. Please try again.";
}
