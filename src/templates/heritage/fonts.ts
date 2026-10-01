import { Inter, Manrope } from "next/font/google";

/** Headings — geometric sans, even color, professional weight. */
export const heritageDisplay = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heritage-display",
  display: "swap",
});

/** Body, navigation, labels, and controls. */
export const heritageSans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heritage-sans",
  display: "swap",
});
