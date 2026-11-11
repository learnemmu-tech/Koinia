const PHONE_ALLOWED = /^[+\d\s().-]+$/;

/** International phone: optional leading +, 8–15 digits, common separators allowed. */
export function validateChurchPhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Church phone number is required";
  if (!PHONE_ALLOWED.test(trimmed)) {
    return "Enter a valid phone number, including the country code if it is outside your local format";
  }
  const digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+") && (digits.length < 8 || digits.length > 15)) {
    return "Enter a valid international phone number with 8 to 15 digits";
  }
  if (!trimmed.startsWith("+") && (digits.length < 8 || digits.length > 15)) {
    return "Enter a valid phone number with 8 to 15 digits";
  }
  return null;
}

export function validateChurchAddress(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Church address is required";
  if (trimmed.length < 5) return "Enter a complete church address";
  if (trimmed.length > 300) return "Church address must be 300 characters or fewer";
  return null;
}
