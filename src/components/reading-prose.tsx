import { parseReadingContent } from "@/lib/reading-prose-parser";
import { cn } from "@/lib/utils";

type ReadingProseProps = {
  content: string;
  className?: string;
};

const containerClassName =
  "mx-auto w-full min-w-0 max-w-[min(100%,47rem)] font-reading text-left antialiased";

const bodyClassName =
  "text-fluid-base font-normal leading-[1.8] text-foreground/75";

/**
 * Long-form reading body for articles & sermons.
 */
export function ReadingProse({ content, className }: ReadingProseProps) {
  const blocks = parseReadingContent(content);

  if (blocks.length === 0) {
    return (
      <p className={cn(containerClassName, bodyClassName, "text-muted-foreground")}>
        No content available.
      </p>
    );
  }

  return (
    <div className={cn(containerClassName, className)}>
      {blocks.map((block, index) => {
        if (block.type === "h2") {
          return (
            <h2
              key={index}
              className="mb-4 mt-10 text-fluid-2xl font-semibold leading-snug text-foreground first:mt-0 sm:mb-5 sm:mt-12"
            >
              {block.text}
            </h2>
          );
        }

        if (block.type === "h3") {
          return (
            <h3
              key={index}
              className="mb-3 mt-8 text-fluid-xl font-semibold leading-snug text-foreground first:mt-0 sm:mb-4 sm:mt-10"
            >
              {block.text}
            </h3>
          );
        }

        if (block.type === "reference") {
          return (
            <p
              key={index}
              className="mb-3 mt-8 text-sm font-medium text-primary/70 first:mt-0 sm:mt-10"
            >
              {block.text}
            </p>
          );
        }

        return (
          <p
            key={index}
            className={cn(bodyClassName, "mb-5 last:mb-0 sm:mb-6", {
              "flex gap-3": Boolean(block.verseNumber),
            })}
          >
            {block.verseNumber ? (
              <span className="mt-0.5 inline-block min-w-[1.25rem] shrink-0 text-sm font-medium tabular-nums leading-[1.8] text-muted-foreground/75">
                {block.verseNumber}
              </span>
            ) : null}
            <span className={block.verseNumber ? "min-w-0 flex-1" : undefined}>
              {block.text}
            </span>
          </p>
        );
      })}
    </div>
  );
}
