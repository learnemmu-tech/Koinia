import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SuperAdminEmptyState } from "@/components/super-admin/super-admin-empty-state";
import { SuperAdminPagination } from "@/components/super-admin/super-admin-pagination";
import { parseShortCaption } from "@/lib/short-caption";
import {
  formatMembershipRole,
  formatMembershipStatus,
  formatPublishStatus,
  formatShortDate,
} from "@/lib/super-admin/labels";
import type { SuperAdminPagedList } from "@/lib/super-admin/church-queries";

function TableShell({
  children,
  empty,
  emptyMessage,
  page,
  totalPages,
  total,
  buildHref,
}: {
  children: ReactNode;
  empty: boolean;
  emptyMessage: string;
  page: number;
  totalPages: number;
  total: number;
  buildHref: (page: number) => string;
}) {
  if (empty) return <SuperAdminEmptyState message={emptyMessage} />;
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card">
        {children}
      </div>
      <SuperAdminPagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        buildHref={buildHref}
      />
    </div>
  );
}

export function SuperAdminMembersTable({
  list,
  buildHref,
}: {
  list: SuperAdminPagedList<{
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    role: string;
    createdAt: Date;
  }>;
  buildHref: (page: number) => string;
}) {
  return (
    <TableShell
      empty={list.total === 0}
      emptyMessage="This church has no members yet."
      page={list.page}
      totalPages={list.totalPages}
      total={list.total}
      buildHref={buildHref}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.items.map((member) => {
            const name =
              [member.firstName, member.lastName].filter(Boolean).join(" ").trim() ||
              "Member";
            return (
              <TableRow key={`${member.userId}-${member.createdAt.toISOString()}`}>
                <TableCell className="font-medium">{name}</TableCell>
                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                <TableCell>{formatMembershipRole(member.role)}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {formatMembershipStatus(member.status)}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatShortDate(member.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableShell>
  );
}

export function SuperAdminSongsTable({
  list,
  buildHref,
}: {
  list: SuperAdminPagedList<{
    id: string;
    songTitle: string;
    artist: string | null;
    category: string;
    published: boolean;
    createdAt: Date;
  }>;
  buildHref: (page: number) => string;
}) {
  return (
    <TableShell
      empty={list.total === 0}
      emptyMessage="This church has no worship songs yet."
      page={list.page}
      totalPages={list.totalPages}
      total={list.total}
      buildHref={buildHref}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Artist</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.items.map((song) => (
            <TableRow key={song.id}>
              <TableCell className="font-medium">{song.songTitle}</TableCell>
              <TableCell className="text-muted-foreground">
                {song.artist?.trim() || "—"}
              </TableCell>
              <TableCell>{song.category}</TableCell>
              <TableCell>
                <Badge variant={song.published ? "secondary" : "outline"}>
                  {formatPublishStatus(song.published)}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatShortDate(song.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableShell>
  );
}

export function SuperAdminSermonsTable({
  list,
  buildHref,
}: {
  list: SuperAdminPagedList<{
    id: string;
    title: string;
    speaker: string;
    isPublished: boolean;
    createdAt: Date;
  }>;
  buildHref: (page: number) => string;
}) {
  return (
    <TableShell
      empty={list.total === 0}
      emptyMessage="This church has no sermons yet."
      page={list.page}
      totalPages={list.totalPages}
      total={list.total}
      buildHref={buildHref}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Speaker</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.items.map((sermon) => (
            <TableRow key={sermon.id}>
              <TableCell className="font-medium">{sermon.title}</TableCell>
              <TableCell className="text-muted-foreground">
                {sermon.speaker.trim() || "—"}
              </TableCell>
              <TableCell>
                <Badge variant={sermon.isPublished ? "secondary" : "outline"}>
                  {formatPublishStatus(sermon.isPublished)}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatShortDate(sermon.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableShell>
  );
}

export function SuperAdminArticlesTable({
  list,
  buildHref,
}: {
  list: SuperAdminPagedList<{
    id: string;
    title: string;
    author: string;
    isPublished: boolean;
    createdAt: Date;
  }>;
  buildHref: (page: number) => string;
}) {
  return (
    <TableShell
      empty={list.total === 0}
      emptyMessage="This church has no articles yet."
      page={list.page}
      totalPages={list.totalPages}
      total={list.total}
      buildHref={buildHref}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.items.map((article) => (
            <TableRow key={article.id}>
              <TableCell className="font-medium">{article.title}</TableCell>
              <TableCell className="text-muted-foreground">
                {article.author.trim() || "—"}
              </TableCell>
              <TableCell>
                <Badge variant={article.isPublished ? "secondary" : "outline"}>
                  {formatPublishStatus(article.isPublished)}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatShortDate(article.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableShell>
  );
}

export function SuperAdminEventsTable({
  list,
  buildHref,
}: {
  list: SuperAdminPagedList<{
    id: string;
    title: string;
    eventDate: string;
    location: string;
    status: string;
    createdAt: Date;
  }>;
  buildHref: (page: number) => string;
}) {
  return (
    <TableShell
      empty={list.total === 0}
      emptyMessage="This church has no events yet."
      page={list.page}
      totalPages={list.totalPages}
      total={list.total}
      buildHref={buildHref}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Event date</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.items.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium">{event.title}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatShortDate(event.eventDate)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {event.location.trim() || "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {event.status}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatShortDate(event.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableShell>
  );
}

export function SuperAdminPrayersTable({
  list,
  buildHref,
}: {
  list: SuperAdminPagedList<{
    id: string;
    title: string;
    status: string;
    isAnonymous: boolean;
    requesterName: string;
    createdAt: Date;
  }>;
  buildHref: (page: number) => string;
}) {
  return (
    <TableShell
      empty={list.total === 0}
      emptyMessage="This church has no prayer requests yet."
      page={list.page}
      totalPages={list.totalPages}
      total={list.total}
      buildHref={buildHref}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request</TableHead>
            <TableHead>From</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.items.map((prayer) => (
            <TableRow key={prayer.id}>
              <TableCell className="max-w-xs font-medium">
                <span className="line-clamp-2">{prayer.title}</span>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {prayer.isAnonymous ? "Anonymous" : prayer.requesterName.trim() || "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="capitalize">
                  {prayer.status}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatShortDate(prayer.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableShell>
  );
}

export function SuperAdminDonationsTable({
  list,
  completedDonationCount,
  buildHref,
}: {
  list: SuperAdminPagedList<{
    id: string;
    title: string;
    status: string;
    currency: string;
    targetAmount: string;
    currentAmount: string;
    createdAt: Date;
  }>;
  completedDonationCount: number;
  buildHref: (page: number) => string;
}) {
  if (list.total === 0) {
    return (
      <SuperAdminEmptyState message="This church has no donation campaigns yet." />
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {completedDonationCount.toLocaleString("en-US")} completed donation
        {completedDonationCount === 1 ? "" : "s"} recorded for this church.
        Payment credentials and donor emails are not shown.
      </p>
      <TableShell
        empty={false}
        emptyMessage=""
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        buildHref={buildHref}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Raised</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.map((campaign) => (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {campaign.status}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {campaign.currentAmount} / {campaign.targetAmount}{" "}
                  {campaign.currency}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatShortDate(campaign.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableShell>
    </div>
  );
}

export function SuperAdminShortsTable({
  list,
  buildHref,
}: {
  list: SuperAdminPagedList<{
    id: string;
    caption: string;
    category: string;
    visibility: string;
    thumbnailUrl: string | null;
    creatorName: string;
    createdAt: Date;
  }>;
  buildHref: (page: number) => string;
}) {
  return (
    <TableShell
      empty={list.total === 0}
      emptyMessage="This church has no Shorts yet."
      page={list.page}
      totalPages={list.totalPages}
      total={list.total}
      buildHref={buildHref}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Short</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Topic</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.items.map((short) => {
            const parsed = parseShortCaption(short.caption, short.category);
            return (
              <TableRow key={short.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {short.thumbnailUrl ? (
                      // Storage URLs are tenant-hosted; unoptimized avoids remotePatterns changes.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={short.thumbnailUrl}
                        alt=""
                        className="size-12 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="size-12 shrink-0 rounded-md bg-muted" />
                    )}
                    <span className="line-clamp-2 font-medium">
                      {parsed.title || "Untitled short"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {short.creatorName}
                </TableCell>
                <TableCell>{parsed.topic || short.category}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {short.visibility}
                  </Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatShortDate(short.createdAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableShell>
  );
}
