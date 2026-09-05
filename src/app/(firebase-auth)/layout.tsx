import { AuthLogo, AuthBrandPanel } from "./_components/auth-brand-panel";

type FirebaseAuthLayoutProps = {
  children: React.ReactNode;
};

export default function FirebaseAuthLayout({
  children,
}: FirebaseAuthLayoutProps) {
  return (
    <div className="grid min-h-svh bg-background text-foreground lg:grid-cols-2">
      <div className="flex flex-col gap-4 bg-background p-6 text-foreground md:p-10">
        <div className="flex justify-center md:justify-start">
          <AuthLogo />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      <AuthBrandPanel />
    </div>
  );
}
