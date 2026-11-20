import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

export const CHURCH_RECEIVING_METHODS = [
  "upi_qr",
  "upi_id",
  "bank_transfer",
  "offline",
] as const;

export type ChurchReceivingMethod = (typeof CHURCH_RECEIVING_METHODS)[number];

const UPI_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{1,255}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ACCOUNT = /^\d{9,18}$/;

export function isUpiIdFormat(value: string): boolean {
  return UPI_ID.test(value.trim());
}

export function isIfscFormat(value: string): boolean {
  return IFSC.test(value.trim().toUpperCase());
}

export function isIndianAccountNumber(value: string): boolean {
  return ACCOUNT.test(value.trim());
}

export function maskAccountNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return last4 ? `•••• ${last4}` : "";
}

export function accountLast4(value: string): string {
  return value.replace(/\D/g, "").slice(-4);
}

/** Two decimal places, stored as integer paise. Rejects non-finite and extra precision. */
export function inrAmountToPaise(amount: number): number | null {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return null;
  const normalized = amount.toFixed(2);
  if (Math.abs(Number(normalized) - amount) > 1e-8) return null;
  return Math.round(Number(normalized) * 100);
}

export function paiseToInrString(paise: number): string {
  const sign = paise < 0 ? "-" : "";
  const abs = Math.abs(paise);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];

export function imageBytesMatchDeclaredType(mimeType: string, bytes: Uint8Array): boolean {
  if (mimeType === "image/jpeg") return JPEG.every((byte, index) => bytes[index] === byte);
  if (mimeType === "image/png") return PNG.every((byte, index) => bytes[index] === byte);
  if (mimeType === "image/webp") {
    return (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }
  return false;
}

export function sameDonationSubmission(
  existing: { campaignId: string; amount: string; donorEmail: string },
  next: { campaignId: string; amountPaise: number; donorEmail: string }
): boolean {
  return (
    existing.campaignId === next.campaignId &&
    existing.donorEmail === next.donorEmail.trim().toLowerCase() &&
    existing.amount === paiseToInrString(next.amountPaise)
  );
}

function key(): Buffer {
  const secret = process.env.DONATION_FIELD_KEY?.trim();
  if (!secret || secret.length < 16) {
    throw new Error("Donation field encryption is not configured.");
  }
  return scryptSync(secret, "koinia-donation-bank-v1", 32);
}

export function encryptDonationField(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${ciphertext.toString("base64")}`;
}

export function decryptDonationField(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Stored account details are unreadable.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key(),
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
