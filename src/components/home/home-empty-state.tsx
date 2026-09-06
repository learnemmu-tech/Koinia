type HomeEmptyStateProps = {
  title: string;
  description: string;
};

export function HomeEmptyState({ title, description }: HomeEmptyStateProps) {
  return (
    <div className="app-mobile-card rounded-xl border border-border/40 px-3 py-3.5">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
