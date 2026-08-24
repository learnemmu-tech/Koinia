import { Dancing_Script, Inter, JetBrains_Mono } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import localFont from "next/font/local";

/* -----------------------------------------------------------------------------------------------
 * Google Fonts
 * -----------------------------------------------------------------------------------------------*/

export const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const fontGeist = GeistSans;

export const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const fontScript = Dancing_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/* -----------------------------------------------------------------------------------------------
 * Local Fonts
 * -----------------------------------------------------------------------------------------------*/

export const fontHeading = localFont({
  src: "../../public/fonts/CalSans-SemiBold.woff",
  variable: "--font-heading",
});

// ...
