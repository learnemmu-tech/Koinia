import { SuperAdminKpiRow } from "@/components/super-admin/super-admin-kpi-row";
import { SuperAdminPageHeader } from "@/components/super-admin/super-admin-page-header";
import { SuperAdminPagination } from "@/components/super-admin/super-admin-pagination";
import { SuperAdminPlatformContentFilters } from "@/components/super-admin/super-admin-platform-content-filters";
import { SuperAdminPlatformContentNav } from "@/components/super-admin/super-admin-platform-content-nav";
import { SuperAdminPlatformContentTable } from "@/components/super-admin/super-admin-platform-content-table";
import { PlatformContentCreateMenu } from "@/components/super-admin/super-admin-platform-content-editors";
import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";
import {
  getPlatformContentMetrics,
  listPlatformContent,
  parsePlatformContentPage,
  parsePlatformContentStatus,
  parsePlatformContentTab,
} from "@/lib/super-admin/platform-content-queries";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildContentHref(
  params: Record<string, string>,
  page: number
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value.trim()) search.set(key, value.trim());
  }
  if (page > 1) search.set("page", String(page));
  const query = search.toString();
  return query
    ? `${SUPER_ADMIN_BASE}/content?${query}`
    : `${SUPER_ADMIN_BASE}/content`;
}

export default async function SuperAdminPlatformContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const tab = parsePlatformContentTab(firstParam(raw.tab));
  const q = firstParam(raw.q);
  const status = parsePlatformContentStatus(firstParam(raw.status));
  const page = parsePlatformContentPage(firstParam(raw.page));

  const filters = { search: q, status };

  // Counts respect the active filters so the type tabs match the visible rows.
  const { counts, publishedCounts } = await getPlatformContentMetrics(filters);
  const list = await listPlatformContent(tab, filters, page, counts);

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0);
  const published = Object.values(publishedCounts).reduce(
    (sum, value) => sum + value,
    0
  );

  const navParams = { q, status: status === "all" ? "" : status };
  const pageParams = {
    tab: tab === "all" ? "" : tab,
    q,
    status: status === "all" ? "" : status,
  };

  return (
    <div className="space-y-6">
      <SuperAdminPageHeader
        title="Platform Content"
        description="Public showcase content owned by FaithConnectHub. These records are never visible inside a customer's organization workspace."
        actions={<PlatformContentCreateMenu />}
      />

      <SuperAdminKpiRow
        items={[
          { label: "Total", value: total },
          { label: "Published", value: published, tone: "success" },
          {
            label: "Unpublished",
            value: Math.max(0, total - published),
            tone: "warning",
          },
          { label: "Songs", value: counts.songs },
          { label: "Sermons", value: counts.sermons },
          { label: "Articles", value: counts.articles },
          { label: "Shorts", value: counts.shorts },
          { label: "Events", value: counts.events },
          { label: "Donations", value: counts.donations },
        ]}
      />

      <SuperAdminPlatformContentNav
        activeTab={tab}
        counts={counts}
        total={total}
        params={navParams}
      />

      <SuperAdminPlatformContentFilters
        tab={tab}
        q={q}
        status={status === "all" ? "" : status}
      />

      <SuperAdminPlatformContentTable list={list} tab={tab} />

      <SuperAdminPagination
        page={list.page}
        totalPages={list.totalPages}
        totalItems={list.total}
        buildHref={(nextPage) => buildContentHref(pageParams, nextPage)}
      />
    </div>
  );
}
