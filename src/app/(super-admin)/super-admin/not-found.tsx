export default function SuperAdminNotFound() {
  return (
    <div className="rounded-2xl border border-dashed border-border/70 bg-card px-6 py-16 text-center">
      <p className="font-medium">Not found</p>
      <p className="mt-1 text-sm text-muted-foreground">
        This organization or church does not exist.
      </p>
    </div>
  );
}
