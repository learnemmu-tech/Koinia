import { AuthLogo, AuthBrandPanel } from "./_components/auth-brand-panel";

type FirebaseAuthLayoutProps = {
  children: React.ReactNode;
};

export default function FirebaseAuthLayout({
  children,
}: FirebaseAuthLayoutProps) {
  return (
    <div className="dark grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 bg-zinc-950 p-6 text-white md:p-10">
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
