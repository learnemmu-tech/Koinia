"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

type ContentLoadMoreProps = {
  hasMore?: boolean;
  loading?: boolean;
  onLoadMore?: () => void;
};

export function ContentLoadMore({
  hasMore,
  loading,
  onLoadMore,
}: ContentLoadMoreProps) {
  const t = useTranslations("common");

  if (!hasMore || !onLoadMore) return null;

  return (
    <div className="flex justify-center pt-4">
      <Button
        type="button"
        variant="outline"
        className="rounded-full"
        disabled={loading}
        onClick={() => onLoadMore()}
      >
        {loading ?
          <>
            <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            {t("loading")}
          </>
        : t("loadMore")}
      </Button>
    </div>
  );
}
