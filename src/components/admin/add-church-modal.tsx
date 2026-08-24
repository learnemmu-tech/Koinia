"use client";

import { useEffect, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import type { FirebaseChurch } from "@/types/firebase-church";

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
import { createChurch, updateChurch } from "@/lib/church-mutations";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import {
  createChurchInOrganizationAction,
  updateChurchInOrganizationAction,
} from "@/lib/organization/organization-mutations";
import { slugifyChurchSlug } from "@/lib/church-scope";
import { uploadSongFileLocal } from "@/lib/local-upload";
import { MAX_IMAGE_SIZE_LABEL, validateImageFile } from "@/lib/upload-limits";

type AddChurchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (result?: { churchId: string; branchId: string }) => void;
  initialChurch?: FirebaseChurch | null;
  organizationId?: string;
  userId?: string;
  userEmail?: string | null;
};

type ChurchFormState = {
  name: string;
  slug: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  pastorName: string;
  establishedYear: string;
  primaryColor: string;
  secondaryColor: string;
  welcomeMessage: string;
  isActive: boolean;
};

const EMPTY_FORM: ChurchFormState = {
  name: "",
  slug: "",
  description: "",
  address: "",
  city: "",
  state: "",
  country: "",
  phone: "",
  email: "",
  website: "",
  pastorName: "",
  establishedYear: "",
  primaryColor: "#6366f1",
  secondaryColor: "#8b5cf6",
  welcomeMessage: "",
  isActive: true,
};

export function AddChurchModal({
  isOpen,
  onClose,
  onSave,
  initialChurch,
  organizationId,
  userId,
  userEmail,
}: AddChurchModalProps) {
  const { user } = useFirebaseAuth();
  const [form, setForm] = useState<ChurchFormState>(EMPTY_FORM);
  const [logoFile, setLogoFile] = useState<File | undefined>();
  const [bannerFile, setBannerFile] = useState<File | undefined>();
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (initialChurch) {
      setForm({
        name: initialChurch.name,
        slug: initialChurch.slug,
        description: initialChurch.description ?? "",
        address: initialChurch.address ?? "",
        city: initialChurch.city ?? "",
        state: initialChurch.state ?? "",
        country: initialChurch.country ?? "",
        phone: initialChurch.phone ?? "",
        email: initialChurch.email ?? "",
        website: initialChurch.website ?? "",
        pastorName: initialChurch.pastorName ?? "",
        establishedYear: initialChurch.establishedYear
          ? String(initialChurch.establishedYear)
          : "",
        primaryColor: initialChurch.primaryColor ?? "#6366f1",
        secondaryColor: initialChurch.secondaryColor ?? "#8b5cf6",
        welcomeMessage: initialChurch.welcomeMessage ?? "",
        isActive: initialChurch.isActive,
      });
      setLogoPreview(initialChurch.logoUrl ?? "");
      setBannerPreview(initialChurch.bannerUrl ?? "");
      setSlugTouched(true);
    } else {
      setForm(EMPTY_FORM);
      setLogoPreview("");
      setBannerPreview("");
      setSlugTouched(false);
    }
    setLogoFile(undefined);
    setBannerFile(undefined);
  }, [initialChurch, isOpen]);

  function updateField<K extends keyof ChurchFormState>(
    key: K,
    value: ChurchFormState[K]
  ) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "name" && !slugTouched) {
        next.slug = slugifyChurchSlug(String(value));
      }
      return next;
    });
  }

  function handleImagePick(
    file: File | undefined,
    kind: "logo" | "banner"
  ) {
    if (!file) return;
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (kind === "logo") {
        setLogoFile(file);
        setLogoPreview(reader.result as string);
      } else {
        setBannerFile(file);
        setBannerPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  }

  async function uploadImage(
    churchId: string,
    file: File,
    idToken: string
  ): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    return uploadSongFileLocal(churchId, "cover", formData, undefined, idToken);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Church name is required");
      return;
    }

    const useOrgFlow = Boolean(organizationId && userId);
    if (useOrgFlow) {
      if (!form.city.trim()) {
        toast.error("City is required");
        return;
      }
      if (!form.country.trim()) {
        toast.error("Country is required");
        return;
      }
    }

    setLoading(true);
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      if (!idToken) {
        toast.error("You must be signed in to upload files.");
        setLoading(false);
        return;
      }

      const establishedYear = form.establishedYear.trim()
        ? Number.parseInt(form.establishedYear, 10)
        : undefined;

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
        website: form.website.trim() || undefined,
        pastorName: form.pastorName.trim() || undefined,
        establishedYear: Number.isFinite(establishedYear)
          ? establishedYear
          : undefined,
        primaryColor: form.primaryColor.trim() || undefined,
        secondaryColor: form.secondaryColor.trim() || undefined,
        welcomeMessage: form.welcomeMessage.trim() || undefined,
        isActive: form.isActive,
        logoUrl: initialChurch?.logoUrl,
        bannerUrl: initialChurch?.bannerUrl,
      };

      if (initialChurch) {
        if (useOrgFlow) {
          await updateChurchInOrganizationAction(
            organizationId!,
            initialChurch.id,
            userId!,
            userEmail,
            input
          );
        } else {
          await updateChurch(initialChurch.id, input);
        }

        let logoUrl = input.logoUrl;
        let bannerUrl = input.bannerUrl;

        if (logoFile) {
          logoUrl = await uploadImage(initialChurch.id, logoFile, idToken);
        }
        if (bannerFile) {
          bannerUrl = await uploadImage(initialChurch.id, bannerFile, idToken);
        }

        if (logoUrl !== input.logoUrl || bannerUrl !== input.bannerUrl) {
          const imageUpdate = { logoUrl, bannerUrl };
          if (useOrgFlow) {
            await updateChurchInOrganizationAction(
              organizationId!,
              initialChurch.id,
              userId!,
              userEmail,
              imageUpdate
            );
          } else {
            await updateChurch(initialChurch.id, imageUpdate);
          }
        }

        toast.success("Church updated successfully");
      } else {
        const created =
          useOrgFlow ?
            await createChurchInOrganizationAction(
              organizationId!,
              userId!,
              userEmail,
              input
            )
          : { churchId: await createChurch(input), branchId: "" };

        const churchId = created.churchId;

        let logoUrl = "";
        let bannerUrl = "";

        if (logoFile) {
          logoUrl = await uploadImage(churchId, logoFile, idToken);
        }
        if (bannerFile) {
          bannerUrl = await uploadImage(churchId, bannerFile, idToken);
        }

        if (logoUrl || bannerUrl) {
          const imageUpdate = { logoUrl, bannerUrl };
          if (useOrgFlow) {
            await updateChurchInOrganizationAction(
              organizationId!,
              churchId,
              userId!,
              userEmail,
              imageUpdate
            );
          } else {
            await updateChurch(churchId, imageUpdate);
          }
        }

        toast.success("Church created successfully");
        onSave(
          useOrgFlow ?
            { churchId, branchId: created.branchId }
          : { churchId, branchId: "" }
        );
        onClose();
        return;
      }

      onSave();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save church"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialChurch ? "Edit Church" : "Add Church"}
          </DialogTitle>
          <DialogDescription>
            Configure church profile, branding, and activation status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset disabled={loading} className="space-y-5 disabled:opacity-70">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="church-name">Church Name</Label>
              <Input
                id="church-name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Grace Community Church"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="church-slug">Slug</Label>
              <Input
                id="church-slug"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  updateField("slug", e.target.value);
                }}
                placeholder="grace-community-church"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pastor-name">Pastor Name</Label>
              <Input
                id="pastor-name"
                value={form.pastorName}
                onChange={(e) => updateField("pastorName", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="church-description">Description</Label>
            <Textarea
              id="church-description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="church-city">City</Label>
              <Input
                id="church-city"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="church-state">State</Label>
              <Input
                id="church-state"
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="church-country">Country</Label>
              <Input
                id="church-country"
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="established-year">Established Year</Label>
              <Input
                id="established-year"
                type="number"
                value={form.establishedYear}
                onChange={(e) => updateField("establishedYear", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="church-email">Email</Label>
              <Input
                id="church-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="church-phone">Phone</Label>
              <Input
                id="church-phone"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="church-website">Website</Label>
              <Input
                id="church-website"
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="church-address">Address</Label>
              <Input
                id="church-address"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="h-10 w-14 px-1"
                />
                <Input
                  value={form.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) =>
                    updateField("secondaryColor", e.target.value)
                  }
                  className="h-10 w-14 px-1"
                />
                <Input
                  value={form.secondaryColor}
                  onChange={(e) =>
                    updateField("secondaryColor", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="welcome-message">Welcome Message</Label>
            <Textarea
              id="welcome-message"
              value={form.welcomeMessage}
              onChange={(e) => updateField("welcomeMessage", e.target.value)}
              rows={2}
              placeholder="Welcome to our church family..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {(["logo", "banner"] as const).map((kind) => {
              const preview = kind === "logo" ? logoPreview : bannerPreview;
              const file = kind === "logo" ? logoFile : bannerFile;

              return (
                <div key={kind} className="space-y-2">
                  <Label className="capitalize">{kind}</Label>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 p-4 transition hover:bg-muted/40">
                    {preview ?
                      <div className="relative w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={preview}
                          alt={`${kind} preview`}
                          className="mx-auto max-h-24 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          className="absolute right-0 top-0 rounded-full bg-background p-1 shadow"
                          onClick={(e) => {
                            e.preventDefault();
                            if (kind === "logo") {
                              setLogoFile(undefined);
                              setLogoPreview("");
                            } else {
                              setBannerFile(undefined);
                              setBannerPreview("");
                            }
                          }}
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    : (
                      <>
                        <Upload className="size-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          Upload {kind} ({MAX_IMAGE_SIZE_LABEL})
                        </span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleImagePick(e.target.files?.[0], kind)
                      }
                    />
                    {file ?
                      <span className="text-xs text-muted-foreground">
                        {file.name}
                      </span>
                    : null}
                  </label>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Inactive churches are hidden from the public church selector.
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
                  Saving...
                </>
              : initialChurch ?
                "Save Changes"
              : "Create Church"}
            </Button>
          </div>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
