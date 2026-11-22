export const AUTH_INPUT_CLASS =
  "h-[52px] min-h-[52px] rounded-[10px] border-[#E2D9CC] bg-white px-4 py-0 text-sm text-[#1C2B3A] shadow-none placeholder:text-[#6B7280] focus-visible:border-[#C0623A] focus-visible:ring-[#C0623A]/25 sm:h-[52px] sm:min-h-[52px]";

export const AUTH_INPUT_WITH_ICON_CLASS = `${AUTH_INPUT_CLASS} pl-11`;

export const AUTH_PRIMARY_BUTTON_CLASS =
  "relative inline-flex h-[52px] min-h-[52px] w-full items-center justify-center rounded-[10px] bg-[#C0623A] px-0 py-0 text-sm font-semibold text-white shadow-none hover:bg-[#A8522F] active:bg-[#923F22] focus-visible:ring-[#C0623A]/35 sm:h-[52px] sm:min-h-[52px]";

/** Label centered on the full button width â€” independent of the arrow. */
export const AUTH_PRIMARY_LABEL_CLASS =
  "absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2";

/** Arrow independently pinned to the right edge. */
export const AUTH_PRIMARY_ARROW_CLASS =
  "pointer-events-none absolute right-4 top-1/2 size-4 shrink-0 -translate-y-1/2 sm:right-6";

export const AUTH_GOOGLE_BUTTON_CLASS =
  "inline-flex h-[52px] min-h-[52px] w-full items-center justify-center rounded-[10px] border border-[#E2D9CC] bg-white px-5 py-0 text-sm font-medium text-[#1C2B3A] shadow-none hover:bg-[#FBF8F3] focus-visible:ring-[#C0623A]/25 sm:h-[52px] sm:min-h-[52px]";

export const AUTH_LABEL_CLASS = "text-[13px] font-medium text-[#1C2B3A]";

export const AUTH_LINK_CLASS =
  "text-sm font-medium text-[#C0623A] underline-offset-4 transition-colors hover:text-[#A8522F] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0623A]/35";

export const AUTH_MUTED_TEXT_CLASS =
  "text-[15px] leading-snug text-[#4A5568] lg:text-base lg:leading-relaxed";

export const AUTH_DIVIDER_LABEL_CLASS =
  "relative bg-[#F6F1E7] px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6B7280]";

export const AUTH_FIELD_ICON_CLASS =
  "pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#6B7280]";

/** Compact vertical rhythm for auth forms (fits one desktop viewport). */
export const AUTH_FORM_STACK_CLASS = "flex flex-col gap-3.5 lg:gap-4";

export const AUTH_HEADING_CLASS =
  "font-heading text-[1.875rem] font-semibold leading-tight tracking-tight text-[#1C2B3A] lg:text-[2.5rem] lg:leading-[1.12]";

export const AUTH_FORM_FIELDS_CLASS = "grid gap-3.5 lg:gap-4";

export const AUTH_FIELD_GROUP_CLASS = "grid gap-1";

export type AuthFormAppearance = "default" | "heritage" | "parish";

export function isChurchAuthAppearance(appearance: AuthFormAppearance) {
  return appearance === "heritage" || appearance === "parish";
}

export const HERITAGE_AUTH_INPUT_CLASS =
  "h-11 min-h-11 rounded-md border-[#DDD5C6] bg-[#FFFDF9] px-3 py-0 text-sm text-[#202624] shadow-none placeholder:text-[#5A615E] focus-visible:border-[#641F32] focus-visible:!ring-[#B49A62]/40";

export const HERITAGE_AUTH_INPUT_WITH_ICON_CLASS = `${HERITAGE_AUTH_INPUT_CLASS} pl-10`;

export const HERITAGE_AUTH_PRIMARY_BUTTON_CLASS =
  "relative inline-flex h-12 min-h-12 w-full items-center justify-center rounded-md bg-[#641F32] px-0 py-0 text-sm font-semibold text-[#FFFDF9] shadow-none hover:!bg-[#7A2A40] active:!bg-[#4E1727] focus-visible:!ring-[#B49A62]/50";

export const HERITAGE_AUTH_GOOGLE_BUTTON_CLASS =
  "inline-flex h-12 min-h-12 w-full items-center justify-center rounded-md border border-[#DDD5C6] bg-[#FFFDF9] px-5 py-0 text-sm font-medium text-[#202624] shadow-none hover:!bg-[#F6F3EC] hover:!text-[#202624] focus-visible:!ring-[#B49A62]/40";

export const HERITAGE_AUTH_LABEL_CLASS =
  "text-[11px] font-semibold uppercase tracking-[0.1em] text-[#202624]";

export const HERITAGE_AUTH_LINK_CLASS =
  "text-sm font-medium text-[#7A6231] underline-offset-4 transition-colors hover:text-[#641F32] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B49A62]/40";

export const HERITAGE_AUTH_MUTED_TEXT_CLASS =
  "text-[15px] leading-snug text-[#5A615E] lg:text-base lg:leading-relaxed";

export const HERITAGE_AUTH_DIVIDER_LABEL_CLASS =
  "relative bg-[#FFFDF9] px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#5A615E]";

export const HERITAGE_AUTH_FIELD_ICON_CLASS =
  "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#5A615E]";

export const HERITAGE_AUTH_ERROR_CLASS =
  "rounded-md border border-[#641F32]/15 bg-[#641F32]/5 px-3 py-2 text-sm text-[#641F32]";

export const HERITAGE_AUTH_PASSWORD_TOGGLE_CLASS =
  "absolute inset-y-0 right-1 my-auto flex size-9 items-center justify-center rounded-md text-[#5A615E] transition-colors hover:text-[#202624] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B49A62]/40";

const PARISH_AUTH_INPUT_CLASS =
  "h-11 min-h-11 rounded-xl border-[#E6DCC8] bg-white px-3 py-0 text-sm text-[#17251D] shadow-none placeholder:text-[#68736B] focus-visible:border-[#174A32] focus-visible:ring-[#C49A45]/35";

export function authFormStyles(appearance: AuthFormAppearance = "default") {
  if (appearance === "parish") {
    return {
      input: PARISH_AUTH_INPUT_CLASS,
      inputWithIcon: `${PARISH_AUTH_INPUT_CLASS} pl-10`,
      primaryButton:
        "relative inline-flex h-12 min-h-12 w-full items-center justify-center rounded-full bg-[#174A32] px-0 py-0 text-sm font-semibold text-[#FBF8EF] shadow-none transition-colors hover:!bg-[#103B29] active:!bg-[#0C2E20] focus-visible:!ring-[#C49A45]/50",
      googleButton:
        "inline-flex h-12 min-h-12 w-full items-center justify-center rounded-full border border-[#E6DCC8] bg-white px-5 py-0 text-sm font-medium text-[#17251D] shadow-none hover:!bg-[#FBF8EF] hover:!text-[#17251D] focus-visible:!ring-[#C49A45]/40",
      label: "text-sm font-semibold text-[#17251D]",
      link: "text-sm font-semibold text-[#174A32] underline-offset-4 transition-colors hover:text-[#103B29] hover:underline",
      muted: "text-[15px] leading-snug text-[#68736B]",
      divider:
        "relative bg-[#FBF8EF] px-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#68736B]",
      fieldIcon: "pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#68736B]",
      error: "rounded-xl border border-[#174A32]/20 bg-[#174A32]/5 px-3 py-2 text-sm text-[#174A32]",
      passwordToggle:
        "absolute inset-y-0 right-1 my-auto flex size-9 items-center justify-center rounded-lg text-[#68736B] hover:text-[#174A32] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A45]/45",
      dividerLine: "w-full border-t border-[#E6DCC8]",
      heading: "parish-display text-4xl text-[#174A32]",
    };
  }

  if (appearance === "heritage") {
    return {
      input: HERITAGE_AUTH_INPUT_CLASS,
      inputWithIcon: HERITAGE_AUTH_INPUT_WITH_ICON_CLASS,
      primaryButton: HERITAGE_AUTH_PRIMARY_BUTTON_CLASS,
      googleButton: HERITAGE_AUTH_GOOGLE_BUTTON_CLASS,
      label: HERITAGE_AUTH_LABEL_CLASS,
      link: HERITAGE_AUTH_LINK_CLASS,
      muted: HERITAGE_AUTH_MUTED_TEXT_CLASS,
      divider: HERITAGE_AUTH_DIVIDER_LABEL_CLASS,
      fieldIcon: HERITAGE_AUTH_FIELD_ICON_CLASS,
      error: HERITAGE_AUTH_ERROR_CLASS,
      passwordToggle: HERITAGE_AUTH_PASSWORD_TOGGLE_CLASS,
      dividerLine: "w-full border-t border-[#DDD5C6]",
      heading: "heritage-display text-[length:var(--heritage-section)] text-[#202624]",
    };
  }

  return {
    input: AUTH_INPUT_CLASS,
    inputWithIcon: AUTH_INPUT_WITH_ICON_CLASS,
    primaryButton: AUTH_PRIMARY_BUTTON_CLASS,
    googleButton: AUTH_GOOGLE_BUTTON_CLASS,
    label: AUTH_LABEL_CLASS,
    link: AUTH_LINK_CLASS,
    muted: AUTH_MUTED_TEXT_CLASS,
    divider: AUTH_DIVIDER_LABEL_CLASS,
    fieldIcon: AUTH_FIELD_ICON_CLASS,
    error: "rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive",
    passwordToggle:
      "absolute inset-y-0 right-1 my-auto flex size-9 items-center justify-center rounded-md text-[#6B7280] transition-colors hover:text-[#1C2B3A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0623A]/35",
    dividerLine: "w-full border-t border-[#E2D9CC]",
    heading: AUTH_HEADING_CLASS,
  };
}
