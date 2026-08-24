"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { FirebaseBranch } from "@/types/branch";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { slugifyChurchSlug } from "@/lib/church-scope";
import {
  createBranchAction,
  updateBranchAction,
} from "@/lib/organization/organization-mutations";

type BranchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  organizationId: string;
  churchId: string;
  userId: string;
  userEmail: string | null;
  initialBranch?: FirebaseBranch | null;
};

type BranchFormState = {
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  isActive: boolean;
};

const EMPTY_FORM: BranchFormState = {
  name: "",
  slug: "",
  description: "",
  address: "",
  city: "",
  state: "",
  country: "",
  phone: "",
  email: "",
  isActive: true,
};

export function BranchModal({
  isOpen,
  onClose,
  onSave,
  organizationId,
  churchId,
  userId,
  userEmail,
  initialBranch,
}: BranchModalProps) {
  const [form, setForm] = useState<BranchFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (initialBranch) {
      setForm({
        name: initialBranch.name,
        slug: initialBranch.slug,
        description: initialBranch.description ?? "",
        address: initialBranch.address ?? "",
        city: initialBranch.city ?? "",
        state: initialBranch.state ?? "",
        country: initialBranch.country ?? "",
        phone: initialBranch.phone ?? "",
        email: initialBranch.email ?? "",
        isActive: initialBranch.isActive,
      });
      setSlugTouched(true);
    } else {
      setForm(EMPTY_FORM);
      setSlugTouched(false);
    }
  }, [initialBranch, isOpen]);

  function updateField<K extends keyof BranchFormState>(
    key: K,
    value: BranchFormState[K]
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugTouched) {
        next.slug = slugifyChurchSlug(String(value));
      }
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Church name is required");
      return;
    }

    setLoading(true);
    try {
      const input = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugifyChurchSlug(form.name),
        description: form.description.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        country: form.country.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        isActive: form.isActive,
      };

      if (initialBranch) {
        await updateBranchAction(
          organizationId,
          initialBranch.id,
          userId,
          userEmail,
          input
        );
        toast.success("Church updated");
      } else {
        await createBranchAction(organizationId, userId, userEmail, {
          organizationId,
          churchId,
          ...input,
        });
        toast.success("Church created");
      }
      onSave();
    } catch {
      toast.error("Failed to save church");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialBranch ? "Edit Church" : "Add Church"}
          </DialogTitle>
          <DialogDescription>
            Manage a church location under your organization.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branch-name">Church name</Label>
            <Input
              id="branch-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-slug">Slug</Label>
            <Input
              id="branch-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                updateField("slug", e.target.value);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-description">Description</Label>
            <Textarea
              id="branch-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="branch-address">Address</Label>
              <Input
                id="branch-address"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-city">City</Label>
              <Input
                id="branch-city"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-state">State</Label>
              <Input
                id="branch-state"
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-country">Country</Label>
              <Input
                id="branch-country"
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-phone">Phone</Label>
              <Input
                id="branch-phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch-email">Email</Label>
              <Input
                id="branch-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive churches are hidden from member-facing flows.
              </p>
            </div>
            <Switch
              checked={form.isActive}
              onCheckedChange={(checked) => updateField("isActive", checked)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ?
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              : initialBranch ?
                "Save changes"
              : "Create church"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
