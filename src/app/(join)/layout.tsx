export default function JoinLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-muted/30">
      {children}
    </div>
  );
}
