import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { SuperAdminChurchSectionNav } from "@/components/super-admin/super-admin-church-section-nav";
import {
  SuperAdminArticlesTable,
  SuperAdminDonationsTable,
  SuperAdminEventsTable,
  SuperAdminMembersTable,
  SuperAdminPrayersTable,
  SuperAdminSermonsTable,
  SuperAdminShortsTable,
  SuperAdminSongsTable,
} from "@/components/super-admin/super-admin-church-tables";
import { SuperAdminKpiRow } from "@/components/super-admin/super-admin-kpi-row";
import { SuperAdminPageHeader } from "@/components/super-admin/super-admin-page-header";
import { SuperAdminSection } from "@/components/super-admin/super-admin-section";
import { ChurchStatusBadge } from "@/components/super-admin/super-admin-status-badges";
import { SUPER_ADMIN_BASE } from "@/lib/auth/auth-paths";
import {
  listSuperAdminChurchArticles,
  listSuperAdminChurchDonations,
  listSuperAdminChurchEvents,
  listSuperAdminChurchMembers,
  listSuperAdminChurchPrayers,
  listSuperAdminChurchSermons,
  listSuperAdminChurchShorts,
  listSuperAdminChurchSongs,
  getSuperAdminChurchOverview,
  parseSuperAdminChurchTab,
  type SuperAdminChurchTab,
} from "@/lib/super-admin/church-queries";
import {
  formatEnrollmentMode,
  formatShortDate,
  formatWorkspaceType,
} from "@/lib/super-admin/labels";

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function churchHref(churchId: string, tab: SuperAdminChurchTab, page: number) {
  const params = new URLSearchParams({ tab });
  if (page > 1) params.set("page", String(page));
  return `${SUPER_ADMIN_BASE}/churches/${churchId}?${params.toString()}`;
}

export default async function SuperAdminChurchDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ churchId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { churchId } = await params;
  const raw = await searchParams;
  const tab = parseSuperAdminChurchTab(firstParam(raw.tab));
  const page = Number.parseInt(firstParam(raw.page), 10) || 1;

  const overview = await getSuperAdminChurchOverview(churchId);
  if (!overview) notFound();

  const { church, members, content } = overview;
  const orgId = church.organizationId;

  const location = [church.city, church.state, church.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");

  const section = await loadChurchSection(tab, church.id, orgId, page);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link href={`${SUPER_ADMIN_BASE}/organizations`} className="hover:text-foreground">
            Organizations
          </Link>
          <span aria-hidden>/</span>
          <Link
            href={`${SUPER_ADMIN_BASE}/organizations/${church.organizationId}`}
            className="hover:text-foreground"
          >
            {church.organizationName}
          </Link>
          <span aria-hidden>/</span>
          <Link href={`${SUPER_ADMIN_BASE}/churches`} className="hover:text-foreground">
            Churches
          </Link>
        </nav>
        <SuperAdminPageHeader
          title={church.name}
          description="Read-only inspection workspace for this church and its content records."
        />
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetaField
            label="Organization"
            value={
              <Link
                href={`${SUPER_ADMIN_BASE}/organizations/${church.organizationId}`}
                className="hover:underline"
              >
                {church.organizationName}
              </Link>
            }
          />
          <MetaField
            label="Organization type"
            value={formatWorkspaceType(church.workspaceType)}
          />
          <MetaField
            label="Status"
            value={<ChurchStatusBadge isActive={church.isActive} />}
          />
          <MetaField label="Created" value={formatShortDate(church.createdAt)} />
          {location ? <MetaField label="Location" value={location} /> : null}
          {church.pastorName?.trim() ? (
            <MetaField label="Pastor" value={church.pastorName} />
          ) : null}
          {church.denomination?.trim() ? (
            <MetaField label="Denomination" value={church.denomination} />
          ) : null}
          {church.enrollmentMode ? (
            <MetaField
              label="Enrollment"
              value={formatEnrollmentMode(church.enrollmentMode)}
            />
          ) : null}
        </div>
      </div>

      <SuperAdminSection title="Summary">
        <SuperAdminKpiRow
          items={[
            { label: "Members", value: members.total },
            { label: "Active", value: members.active },
            { label: "Pending", value: members.pending },
            { label: "Songs", value: content.songs },
            { label: "Sermons", value: content.sermons },
            { label: "Articles", value: content.articles },
            { label: "Events", value: content.events },
            { label: "Prayer requests", value: content.prayerRequests },
            { label: "Donations", value: content.donations },
            { label: "Shorts", value: content.shorts },
          ]}
        />
      </SuperAdminSection>

      <SuperAdminSection
        title="Church records"
        description="Read-only tables for each content area. Only the active tab is loaded."
      >
        <SuperAdminChurchSectionNav
          churchId={church.id}
          activeTab={tab}
          counts={{
            members: members.total,
            songs: content.songs,
            sermons: content.sermons,
            articles: content.articles,
            events: content.events,
            prayers: content.prayerRequests,
            donations: content.campaigns,
            shorts: content.shorts,
          }}
        />
        <div className="mt-4">{section}</div>
      </SuperAdminSection>
    </div>
  );
}

async function loadChurchSection(
  tab: SuperAdminChurchTab,
  churchId: string,
  organizationId: string,
  page: number
) {
  const buildHref = (nextPage: number) => churchHref(churchId, tab, nextPage);

  switch (tab) {
    case "songs": {
      const list = await listSuperAdminChurchSongs(churchId, organizationId, page);
      return <SuperAdminSongsTable list={list} buildHref={buildHref} />;
    }
    case "sermons": {
      const list = await listSuperAdminChurchSermons(
        churchId,
        organizationId,
        page
      );
      return <SuperAdminSermonsTable list={list} buildHref={buildHref} />;
    }
    case "articles": {
      const list = await listSuperAdminChurchArticles(
        churchId,
        organizationId,
        page
      );
      return <SuperAdminArticlesTable list={list} buildHref={buildHref} />;
    }
    case "events": {
      const list = await listSuperAdminChurchEvents(
        churchId,
        organizationId,
        page
      );
      return <SuperAdminEventsTable list={list} buildHref={buildHref} />;
    }
    case "prayers": {
      const list = await listSuperAdminChurchPrayers(
        churchId,
        organizationId,
        page
      );
      return <SuperAdminPrayersTable list={list} buildHref={buildHref} />;
    }
    case "donations": {
      const list = await listSuperAdminChurchDonations(
        churchId,
        organizationId,
        page
      );
      return (
        <SuperAdminDonationsTable
          list={list}
          completedDonationCount={list.completedDonationCount}
          buildHref={buildHref}
        />
      );
    }
    case "shorts": {
      const list = await listSuperAdminChurchShorts(
        churchId,
        organizationId,
        page
      );
      return <SuperAdminShortsTable list={list} buildHref={buildHref} />;
    }
    default: {
      const list = await listSuperAdminChurchMembers(
        churchId,
        organizationId,
        page
      );
      return <SuperAdminMembersTable list={list} buildHref={buildHref} />;
    }
  }
}

function MetaField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
