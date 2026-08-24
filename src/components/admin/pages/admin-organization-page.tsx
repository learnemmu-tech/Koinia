"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MapPin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { RequireAdmin } from "@/components/auth/require-admin";
import { AdminListPagination } from "@/components/admin/admin-list-pagination";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { PlanBadge } from "@/components/subscription/plan-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganization } from "@/context/organization-context";
import { filterBySearch, paginateItems } from "@/lib/admin-list-utils";
import { isIndependentChurchWorkspace } from "@/lib/organization/workspace-type";
import {
  deleteBranchAction,
  updateBranchAction,
  updateOrganizationAction,
} from "@/lib/organization/organization-mutations";
import { OrganizationInvitationsPanel } from "@/components/organization/organization-invitations-panel";
import { OrganizationMembersPanel } from "@/components/organization/organization-members-panel";
import { adminSectionClass } from "@/lib/responsive-classes";
import type { FirebaseBranch } from "@/types/branch";

const AddChurchModal = dynamic(
  () =>
    import("@/components/admin/add-church-modal").then((mod) => mod.AddChurchModal),
  { ssr: false }
);

const BranchModal = dynamic(
  () =>
    import("@/components/admin/organization/branch-modal").then(
      (mod) => mod.BranchModal
    ),
  { ssr: false }
);

function OrganizationSettingsForm() {
  const { authUser } = useFirebaseAuth();
  const { organization, loading, refetch } = useOrganization();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!organization) return;
    setName(organization.name);
    setDescription(organization.description ?? "");
    setLogo(organization.logo ?? "");
  }, [organization]);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!organization || !authUser) return;

    setSaving(true);
    try {
      await updateOrganizationAction(
        organization.id,
        authUser.uid,
        authUser.email,
        {
          name: name.trim(),
          description: description.trim() || undefined,
          logo: logo.trim() || undefined,
        }
      );
      toast.success("Organization settings saved");
      refetch();
    } catch {
      toast.error("Failed to save organization settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !organization) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No organization found for your account.
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>
                Identity and branding for your organization tenant.
              </CardDescription>
            </div>
            <PlanBadge planId={organization.subscriptionPlan} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-logo">Logo URL</Label>
            <Input
              id="org-logo"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Status</span>
            <Badge variant="secondary">{organization.status}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ?
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving…
            </>
          : "Save settings"}
        </Button>
      </div>
    </form>
  );
}

function OrganizationChurchesPanel() {
  const { authUser } = useFirebaseAuth();
  const { organization, churches, branchesByChurch, loading, refetch } =
    useOrganization();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<FirebaseBranch | null>(
    null
  );
  const [busyBranchId, setBusyBranchId] = useState<string | null>(null);

  const allChurches = useMemo(
    () => Object.values(branchesByChurch).flat(),
    [branchesByChurch]
  );

  const filteredChurches = useMemo(
    () =>
      filterBySearch(allChurches, search, (branch) =>
        [branch.name, branch.slug, branch.city, branch.country]
          .filter(Boolean)
          .join(" ")
      ),
    [allChurches, search]
  );

  const { pageItems, totalPages, safePage } = useMemo(
    () => paginateItems(filteredChurches, page),
    [filteredChurches, page]
  );

  async function handleDeleteChurch(branchId: string) {
    if (!organization || !authUser) return;
    setBusyBranchId(branchId);
    try {
      await deleteBranchAction(
        organization.id,
        branchId,
        authUser.uid,
        authUser.email
      );
      toast.success("Church deleted");
      refetch();
    } catch {
      toast.error("Failed to delete church");
    } finally {
      setBusyBranchId(null);
    }
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Churches"
        description="Create and manage churches in your organization."
        actionLabel="Create Church"
        onAction={() => {
          setEditingBranch(null);
          setModalOpen(true);
        }}
      />

      <AdminToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search churches…"
      />

      {pageItems.length === 0 && !loading ?
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No churches yet. Create your first church to start inviting admins
            and managing content.
          </CardContent>
        </Card>
      : <div className="space-y-3">
          {pageItems.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{branch.name}</p>
                    <Badge variant={branch.isActive ? "default" : "secondary"}>
                      {branch.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {branch.address || branch.city ?
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {[branch.address, branch.city, branch.state, branch.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingBranch(branch);
                      setBranchModalOpen(true);
                    }}
                  >
                    <Pencil className="mr-1 size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={busyBranchId === branch.id}
                    onClick={() => void handleDeleteChurch(branch.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }

      <AdminListPagination
        page={safePage}
        totalPages={totalPages}
        totalItems={filteredChurches.length}
        onPageChange={setPage}
      />

      {organization && authUser ?
        <>
          <AddChurchModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onSave={() => {
              setModalOpen(false);
              refetch();
            }}
            organizationId={organization.id}
            userId={authUser.uid}
            userEmail={authUser.email}
          />
          {editingBranch ?
            <BranchModal
              isOpen={branchModalOpen}
              onClose={() => {
                setBranchModalOpen(false);
                setEditingBranch(null);
              }}
              onSave={() => {
                setBranchModalOpen(false);
                setEditingBranch(null);
                refetch();
              }}
              organizationId={organization.id}
              churchId={editingBranch.churchId}
              userId={authUser.uid}
              userEmail={authUser.email}
              initialBranch={editingBranch}
            />
          : null}
        </>
      : null}
    </div>
  );
}

export function OrganizationBranchesPanel() {
  const { authUser } = useFirebaseAuth();
  const { organization, churches, branchesByChurch, loading, refetch } =
    useOrganization();
  const [selectedChurchId, setSelectedChurchId] = useState<string>("");
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<FirebaseBranch | null>(
    null
  );
  const [busyBranchId, setBusyBranchId] = useState<string | null>(null);

  const activeChurches = churches.filter((c) => c.isActive);

  useEffect(() => {
    if (!selectedChurchId && activeChurches[0]) {
      setSelectedChurchId(activeChurches[0].id);
    }
  }, [activeChurches, selectedChurchId]);

  const branches = selectedChurchId ?
    (branchesByChurch[selectedChurchId] ?? [])
  : [];

  async function handleDeleteBranch(branchId: string) {
    if (!organization || !authUser) return;
    setBusyBranchId(branchId);
    try {
      await deleteBranchAction(
        organization.id,
        branchId,
        authUser.uid,
        authUser.email
      );
      toast.success("Church deleted");
      refetch();
    } catch {
      toast.error("Failed to delete church");
    } finally {
      setBusyBranchId(null);
    }
  }

  async function handleToggleBranch(branch: FirebaseBranch) {
    if (!organization || !authUser) return;
    setBusyBranchId(branch.id);
    try {
      await updateBranchAction(
        organization.id,
        branch.id,
        authUser.uid,
        authUser.email,
        { isActive: !branch.isActive }
      );
      toast.success(branch.isActive ? "Church disabled" : "Church activated");
      refetch();
    } catch {
      toast.error("Failed to update church");
    } finally {
      setBusyBranchId(null);
    }
  }

  if (loading && !organization) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activeChurches.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Add a church first before creating branches. Branches are optional —
          single-location churches work without them.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Churches"
        description="Manage churches in your organization."
        actionLabel="Create Church"
        onAction={() => {
          setEditingBranch(null);
          setBranchModalOpen(true);
        }}
      />

      <div className="max-w-xs space-y-2">
        <Label>Church</Label>
        <Select value={selectedChurchId} onValueChange={setSelectedChurchId}>
          <SelectTrigger>
            <SelectValue placeholder="Select church" />
          </SelectTrigger>
          <SelectContent>
            {activeChurches.map((church) => (
              <SelectItem key={church.id} value={church.id}>
                {church.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {branches.length === 0 ?
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No branches for this church. Branches are optional — your church
            can operate as a single location.
          </CardContent>
        </Card>
      : <div className="space-y-3">
          {branches.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{branch.name}</p>
                    <Badge variant={branch.isActive ? "default" : "secondary"}>
                      {branch.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {branch.address || branch.city ?
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {[branch.address, branch.city, branch.state, branch.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  : null}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingBranch(branch);
                      setBranchModalOpen(true);
                    }}
                  >
                    <Pencil className="mr-1 size-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busyBranchId === branch.id}
                    onClick={() => void handleToggleBranch(branch)}
                  >
                    {branch.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={busyBranchId === branch.id}
                    onClick={() => void handleDeleteBranch(branch.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }

      {organization && authUser && selectedChurchId ?
        <BranchModal
          isOpen={branchModalOpen}
          onClose={() => {
            setBranchModalOpen(false);
            setEditingBranch(null);
          }}
          onSave={() => {
            setBranchModalOpen(false);
            setEditingBranch(null);
            refetch();
          }}
          organizationId={organization.id}
          churchId={selectedChurchId}
          userId={authUser.uid}
          userEmail={authUser.email}
          initialBranch={editingBranch}
        />
      : null}
    </div>
  );
}

function OrganizationPageContent() {
  const { organization } = useOrganization();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isIndependent = isIndependentChurchWorkspace(organization);

  const tabParam = searchParams.get("tab");
  const activeTab = useMemo(() => {
    const allowed = new Set(["settings"]);
    if (!isIndependent) {
      allowed.add("churches");
      allowed.add("invitations");
      allowed.add("members");
      allowed.add("roles");
    }
    if (tabParam && allowed.has(tabParam)) return tabParam;
    return "settings";
  }, [tabParam, isIndependent]);

  function handleTabChange(value: string) {
    router.replace(`/dashboard/organization?tab=${value}`, { scroll: false });
  }

  return (
    <div className={adminSectionClass}>
      <AdminPageHeader
        title="Organization"
        description="Manage your organization, churches, members, and invitations."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="settings">General</TabsTrigger>
          {!isIndependent ?
            <>
              <TabsTrigger value="churches">Churches</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            </>
          : null}
          <TabsTrigger value="billing" asChild>
            <a href="/dashboard/billing">Billing</a>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <OrganizationSettingsForm />
        </TabsContent>
        {!isIndependent ?
          <>
            <TabsContent value="churches">
              <OrganizationChurchesPanel />
            </TabsContent>
            <TabsContent value="invitations">
              <OrganizationInvitationsPanel />
            </TabsContent>
            <TabsContent value="members">
              <OrganizationMembersPanel />
            </TabsContent>
            <TabsContent value="roles">
              <OrganizationMembersPanel />
            </TabsContent>
          </>
        : null}
      </Tabs>
    </div>
  );
}

export function AdminOrganizationPageClient() {
  return (
    <RequireAdmin>
      <OrganizationPageContent />
    </RequireAdmin>
  );
}
