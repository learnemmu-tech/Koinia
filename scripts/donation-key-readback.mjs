import { readFileSync } from "node:fs";

const { decryptDonationField } = await import("../src/lib/donations/receiving-validation.ts");
const plain = decryptDonationField(readFileSync(process.argv[2], "utf8"));
if (plain !== "123456789012") process.exit(1);
