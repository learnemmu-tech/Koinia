export const AUTH_COOKIE_NAME = "firebase_auth";
export const AUTH_ROLE_COOKIE_NAME = "firebase_user_role";
/** Hint for middleware only — workspace access is enforced from Firestore client-side. */
export const AUTH_ADMIN_COOKIE_NAME = "firebase_user_is_admin";
/** Hint for middleware only — onboarding state is read from Firestore, not this cookie. */
export const AUTH_ONBOARDING_COMPLETE_COOKIE_NAME =
  "firebase_onboarding_complete";
