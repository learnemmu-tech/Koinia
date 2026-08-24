import { ReadingProse } from "@/components/reading-prose";

type ArticleContentProps = {
  content: string;
  className?: string;
};

export function ArticleContent({ content, className }: ArticleContentProps) {
  return <ReadingProse content={content} className={className} />;
}
