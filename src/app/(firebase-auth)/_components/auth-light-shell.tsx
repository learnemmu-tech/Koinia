"use client";

import { ThemeProvider } from "next-themes";

type AuthLightShellProps = {
  children: React.ReactNode;
};

/**
 * Forces FaithConnectHub light authentication appearance for this route tree.
 * Nested forcedTheme avoids inheriting the app ThemeProvider defaultTheme="dark"
 * without changing global dark-theme tokens or dashboard appearance.
 */
export function AuthLightShell({ children }: AuthLightShellProps) {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <div className="auth-light light min-h-dvh bg-[#F6F1E7] text-[#1C2B3A] lg:h-dvh lg:overflow-hidden">
        {children}
      </div>
    </ThemeProvider>
  );
}
