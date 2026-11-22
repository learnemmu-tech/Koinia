import { isIfscFormat } from "./receiving-validation";

export type IfscIdentity = {
  ifsc: string;
  bankName: string;
  branch: string;
  city: string;
  state: string;
};

export async function lookupIfsc(code: string): Promise<IfscIdentity> {
  const ifsc = code.trim().toUpperCase();
  if (!isIfscFormat(ifsc)) {
    throw new Error("Enter an IFSC in the form ABCD0123456.");
  }
  const response = await fetch(`https://ifsc.razorpay.com/${encodeURIComponent(ifsc)}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (response.status === 404) {
    throw new Error("This IFSC was not found. It does not prove an account exists.");
  }
  if (!response.ok) {
    throw new Error("Bank lookup is unavailable. You can still enter the bank and branch.");
  }
  const body = (await response.json()) as {
    BANK?: string;
    BRANCH?: string;
    CITY?: string;
    STATE?: string;
  };
  if (!body.BANK?.trim()) {
    throw new Error("This IFSC was not found. It does not prove an account exists.");
  }
  return {
    ifsc,
    bankName: body.BANK.trim(),
    branch: body.BRANCH?.trim() ?? "",
    city: body.CITY?.trim() ?? "",
    state: body.STATE?.trim() ?? "",
  };
}
