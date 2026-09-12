"use client";

import { ThemeProvider } from "next-themes";

type AuthLightShellProps = {
  children: React.ReactNode;
};

/**
 * Forces FaithConnectHub light authentication appearance for this route tree.
 * Nested forcedTheme keeps Sign In / Sign Up light even if the user previously
 * selected dark (or system→dark) in the main app ThemeProvider.
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
