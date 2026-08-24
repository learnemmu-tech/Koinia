/**
 * Detect mobile browsers and in-app WebViews where signInWithPopup fails.
 */
export function isMobileOrInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || navigator.vendor || "";

  const inAppPatterns = [
    /Instagram/i,
    /FBAN|FBAV|FB_IAB/i,
    /WhatsApp/i,
    /Twitter/i,
    /LinkedInApp/i,
    /Snapchat/i,
    /Line\//i,
  ];

  if (inAppPatterns.some((pattern) => pattern.test(ua))) {
    return true;
  }

  const isMobileSafari =
    /iPhone|iPad|iPod/i.test(ua) &&
    /Safari/i.test(ua) &&
    !/CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);

  if (isMobileSafari) {
    return true;
  }

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  return isMobile;
}
