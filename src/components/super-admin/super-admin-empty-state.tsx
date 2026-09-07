export function SuperAdminEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card px-6 py-12 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
