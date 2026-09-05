type HomeEmptyStateProps = {
  title: string;
  description: string;
};

export function HomeEmptyState({ title, description }: HomeEmptyStateProps) {
  return (
    <div className="rounded-xl border border-border/40 px-3 py-3.5">
      <p className="text-sm font-medium text-white">{title}</p>
      <p className="mt-0.5 text-xs text-[#A1A1A1]">{description}</p>
    </div>
  );
}
