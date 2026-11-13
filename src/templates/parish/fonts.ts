import { Cormorant_Garamond, Outfit } from "next/font/google";

export const parishDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-parish-display",
  display: "swap",
});

export const parishSans = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-parish-sans",
  display: "swap",
});
