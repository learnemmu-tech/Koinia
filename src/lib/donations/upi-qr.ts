import jsQR from "jsqr";
import sharp from "sharp";

import { parseUpiPaymentPayload } from "./receiving-validation";

export type DecodedUpiQr = {
  upiId: string;
  payeeName: string;
};

export async function decodeUpiQrImage(bytes: Buffer): Promise<DecodedUpiQr> {
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  if (!code?.data) {
    throw new Error("This image does not contain a readable QR code.");
  }
  const payment = parseUpiPaymentPayload(code.data);
  if (!payment) {
    throw new Error("This QR is not a supported UPI payment code. Decoding does not prove who owns the account.");
  }
  return payment;
}
