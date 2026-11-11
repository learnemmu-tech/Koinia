import type { BillingReceiptRecord } from "../../types/billing-receipt";

function minorUnitsToAmount(amountMinor: number, currency: string): number {
  const code = currency.trim().toUpperCase();
  return code === "JPY" || code === "KRW" ? amountMinor : amountMinor / 100;
}

function escapePdfText(value: string): string {
  return value.replace(/[^\x20-\x7E]/g, "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function formatReceiptAmount(amountMinor: number, currency: string): string {
  const code = currency.trim().toUpperCase();
  const amount = minorUnitsToAmount(amountMinor, code);
  const formatted = amount.toFixed(code === "JPY" || code === "KRW" ? 0 : 2);
  if (code === "INR") return `Rs. ${formatted}`;
  return `${code} ${formatted}`;
}

function formatWhen(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function line(text: string, x: number, y: number, size = 11, font = "F1"): string {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

export function renderReceiptPdf(
  receipt: BillingReceiptRecord,
  customer?: { legalName?: string }
): Uint8Array {
  const amount = formatReceiptAmount(receipt.amountMinor, receipt.currency);
  const paidOn = formatWhen(receipt.paidAt) ?? "Unavailable";
  const periodStart = formatWhen(receipt.periodStart);
  const periodEnd = formatWhen(receipt.periodEnd);
  const period =
    periodStart && periodEnd ? `${periodStart} - ${periodEnd}` : periodStart ?? periodEnd;
  const customerName = customer?.legalName?.trim() || receipt.customerName?.trim() || "";
  const plan = receipt.planId
    ? receipt.planId.charAt(0).toUpperCase() + receipt.planId.slice(1)
    : receipt.description;
  const commands = [
    line("FaithConnectHub", 48, 750, 18, "F2"),
    line("Payment receipt", 48, 728, 12),
    line("Payment Receipt - Not a Tax Invoice", 48, 710, 9),
    line("PAID", 500, 740, 14, "F2"),
    line(`Receipt ${receipt.receiptNumber}`, 48, 674, 11, "F2"),
    line(`Payment date ${paidOn}`, 48, 656, 10),
    ...(customerName ? [line(`Billed to ${customerName}`, 48, 628, 11)] : []),
    line("Description", 48, 590, 9),
    line("Period", 250, 590, 9),
    line("Amount", 470, 590, 9),
    line(plan, 48, 570, 11),
    line(receipt.description, 48, 554, 9),
    ...(period ? [line(period, 250, 570, 10)] : []),
    line(amount, 470, 570, 11, "F2"),
    line("Subtotal", 360, 500, 10),
    line(amount, 470, 500, 10),
    line("Total paid", 360, 478, 12, "F2"),
    line(amount, 470, 478, 12, "F2"),
    ...(receipt.paymentMethodSummary
      ? [line(`Payment method ${receipt.paymentMethodSummary}`, 48, 430, 10)]
      : []),
    line(`Razorpay payment ${receipt.providerPaymentId}`, 48, 412, 10),
    line("No tax was added. Seller tax registration is not configured.", 48, 72, 8),
    line(`${receipt.receiptNumber}  ·  Page 1 of 1`, 48, 52, 8),
  ];
  const stream = commands.join("\n");
  const streamBytes = new TextEncoder().encode(stream);
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Count 1 /Kids [3 0 R] >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj\n",
    `4 0 obj << /Length ${streamBytes.length} >> stream\n${stream}\nendstream endobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
    "6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj\n",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += object;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}
