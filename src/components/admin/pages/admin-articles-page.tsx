"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

import { ArticleList } from "@/components/admin/article-list";
import { AdminChurchNotice } from "@/components/admin/admin-church-notice";
import { AdminListPagination } from "@/components/admin/admin-list-pagination";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { ContentLoadMore } from "@/components/ui/content-load-more";
import { adminSectionClass } from "@/lib/responsive-classes";
import {
  useAdminArticles,
  useAdminChurchBlocked,
  useAdminChurchId,
} from "@/hooks/use-admin-collections";
import { useInvalidateAdminQueries } from "@/hooks/use-invalidate-admin-queries";
import { filterBySearch, paginateItems } from "@/lib/admin-list-utils";
import type { FirebaseArticle } from "@/types/firebase-article";

const AddArticleModal = dynamic(
  () =>
    import("@/components/admin/add-article-modal").then(
      (mod) => mod.AddArticleModal
    ),
  { ssr: false }
);

export function AdminArticlesPageClient({ embedded = false }: { embedded?: boolean }) {
  const searchParams = useSearchParams();
  const adminChurchId = useAdminChurchId();
  const blocked = useAdminChurchBlocked();
  const { data: articles, loading, loadMore, hasMore, loadingMore } =
    useAdminArticles();
  const { invalidateArticles } = useInvalidateAdminQueries();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] =
    useState<FirebaseArticle | null>(null);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      setSelectedArticle(null);
      setModalOpen(true);
      return;
    }

    const editId = searchParams.get("edit")?.trim();
    if (!editId || loading) return;

    const article = articles.find((item) => item.id === editId);
    if (article) {
      setSelectedArticle(article);
      setModalOpen(true);
    }
  }, [searchParams, articles, loading]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredArticles = useMemo(
    () =>
      filterBySearch(articles, search, (article) =>
        [article.title, article.author, article.category]
          .filter(Boolean)
          .join(" ")
      ),
    [articles, search]
  );

  const { pageItems, totalPages, safePage } = useMemo(
    () => paginateItems(filteredArticles, page),
    [filteredArticles, page]
  );

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  return (
    <div className={embedded ? "space-y-4" : adminSectionClass}>
      {!embedded ?
        <AdminPageHeader
          title="Articles"
          description="Manage faith articles and devotionals"
          actionLabel="Add Article"
          onAction={() => {
            setSelectedArticle(null);
            setModalOpen(true);
          }}
          actionDisabled={blocked}
        />
      : null}

      {blocked ? <AdminChurchNotice /> : null}

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search articles…"
        actionLabel={embedded ? "Add Article" : undefined}
        onAction={
          embedded ?
            () => {
              setSelectedArticle(null);
              setModalOpen(true);
            }
          : undefined
        }
        actionDisabled={blocked}
      />

      <ArticleList
        articles={pageItems}
        loading={loading}
        onEdit={(article) => {
          setSelectedArticle(article);
          setModalOpen(true);
        }}
        onDelete={() => void invalidateArticles()}
      />

      <AdminListPagination
        page={safePage}
        totalPages={totalPages}
        totalItems={filteredArticles.length}
        onPageChange={setPage}
      />

      <ContentLoadMore
        hasMore={hasMore}
        loading={loadingMore}
        onLoadMore={loadMore}
      />

      <AddArticleModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedArticle(null);
        }}
        onSave={() => {
          setModalOpen(false);
          setSelectedArticle(null);
        }}
        initialArticle={selectedArticle}
        churchId={adminChurchId ?? ""}
      />
    </div>
  );
}
