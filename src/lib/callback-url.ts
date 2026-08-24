/**

 * Validates post-login redirect targets (same-origin paths only).

 */

export function sanitizeCallbackUrl(

  url: string | null | undefined,

  fallback = "/"

): string {

  if (!url?.trim()) return fallback;



  const trimmed = url.trim();



  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {

    return fallback;

  }



  return trimmed;

}



export function buildAuthHref(

  path: "/signin" | "/signup",

  callbackPath: string

): string {

  return `${path}?callbackUrl=${encodeURIComponent(callbackPath)}`;

}


