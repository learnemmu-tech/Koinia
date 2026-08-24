"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Loader2, Users } from "lucide-react";

import { AdminChurchNotice } from "@/components/admin/admin-church-notice";
import { AdminListPagination } from "@/components/admin/admin-list-pagination";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminChurchBlocked } from "@/hooks/use-admin-collections";
import { useAdminUsers } from "@/hooks/use-admin-users";
import { adminSectionClass } from "@/lib/responsive-classes";
import { filterBySearch, paginateItems } from "@/lib/admin-list-utils";

export function AdminUsersPageClient() {
  const blocked = useAdminChurchBlocked();
  const { users, loading } = useAdminUsers();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const filteredUsers = useMemo(
    () =>
      filterBySearch(users, search, (user) =>
        [user.name, user.email, user.role].filter(Boolean).join(" ")
      ),
    [users, search]
  );

  const { pageItems, totalPages, safePage } = useMemo(
    () => paginateItems(filteredUsers, page),
    [filteredUsers, page]
  );

  useEffect(() => {
    if (safePage !== page) setPage(safePage);
  }, [safePage, page]);

  return (
    <div className={adminSectionClass}>
      <AdminPageHeader
        title="Users"
        description="View registered members and their roles"
      />

      {blocked ? <AdminChurchNotice /> : null}

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users…"
      />

      {loading ?
        <div className="flex items-center justify-center rounded-2xl border border-border/50 py-20">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      : filteredUsers.length === 0 ?
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-20 text-center">
          <Users className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {search ? "No users match your search." : "No users found yet."}
          </p>
        </div>
      : <>
          <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageItems.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="min-w-0 font-medium">
                      <div className="min-w-0">
                        <p className="truncate">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground sm:hidden">
                          {user.email || "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-[200px] truncate sm:table-cell">
                      {user.email || "—"}
                    </TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {user.createdAt ?
                        format(new Date(user.createdAt), "MMM d, yyyy")
                      : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <AdminListPagination
            page={safePage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            onPageChange={setPage}
          />
        </>
      }
    </div>
  );
}
