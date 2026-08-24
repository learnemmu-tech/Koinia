type CollectionTabHeaderProps = {
  title: string;
  count: number;
};

function getCountLabel(title: string, count: number): string {
  const singular =
    title === "Songs"
      ? "song"
      : title === "Articles"
        ? "article"
        : "sermon";
  return `${count} ${count === 1 ? singular : `${singular}s`}`;
}

export function CollectionTabHeader({ title, count }: CollectionTabHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h3 className="font-heading text-xl font-bold sm:text-2xl md:text-3xl">
        {title}
      </h3>
      <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        {getCountLabel(title, count)}
      </span>
    </div>
  );
}
