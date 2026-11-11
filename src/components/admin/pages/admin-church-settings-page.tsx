"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { RequireAdmin } from "@/components/auth/require-admin";
import { RequireOrganizationAdmin } from "@/components/auth/require-organization-admin";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DonationSettingsPanel } from "@/components/admin/donation-settings-panel";
import { ChurchMembersPanel } from "@/components/church/church-members-panel";
import { ChurchJoinUrlCard } from "@/components/church/church-join-url-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COUNTRIES } from "@/lib/countries";
import {
  validateChurchAddress,
  validateChurchPhone,
} from "@/lib/organization/onboarding-contact";
import { MAX_IMAGE_SIZE_LABEL, validateImageFile } from "@/lib/upload-limits";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActiveBranch } from "@/context/active-branch-context";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganization } from "@/context/organization-context";
import { updateChurchInOrganizationAction } from "@/lib/organization/organization-mutations";
import { uploadSongFileLocal } from "@/lib/local-upload";
import { adminSectionClass } from "@/lib/responsive-classes";
import { isIndependentChurchWorkspace } from "@/lib/organization/workspace-type";

function ChurchGeneralForm({
  churchId,
  organizationId,
  initial,
}: {
  churchId: string;
  organizationId: string;
  initial: {
    name: string;
    phone: string;
    website: string;
    address: string;
    city: string;
    country: string;
    logoUrl: string;
  };
}) {
  const { user } = useFirebaseAuth();
  const { refetch } = useOrganization();
  const [form, setForm] = useState(initial);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const snapshot = JSON.stringify(initial);
  useEffect(() => {
    setForm(JSON.parse(snapshot) as typeof initial);
  }, [snapshot]);

  function setField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Church name is required.");
      return;
    }
    if (!form.city.trim()) {
      toast.error("City is required.");
      return;
    }
    if (!form.country.trim()) {
      toast.error("Country is required.");
      return;
    }
    const phoneError = validateChurchPhone(form.phone);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }
    const addressError = validateChurchAddress(form.address);
    if (addressError) {
      toast.error(addressError);
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      await updateChurchInOrganizationAction(
        organizationId,
        churchId,
        user.uid,
        user.email,
        {
          name: form.name.trim(),
          phone: form.phone.trim(),
          website: form.website.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          country: form.country.trim(),
        }
      );

      if (logoFile) {
        const invalid = validateImageFile(logoFile);
        if (invalid) throw new Error(invalid);
        const token = await user.getIdToken();
        const body = new FormData();
        body.append("file", logoFile);
        const logoUrl = await uploadSongFileLocal(churchId, "cover", body, undefined, token, {
          kind: "church-logo",
          replaceUrl: form.logoUrl || undefined,
        });
        await updateChurchInOrganizationAction(
          organizationId,
          churchId,
          user.uid,
          user.email,
          { logoUrl }
        );
        setForm((current) => ({ ...current, logoUrl }));
        setLogoFile(null);
        setPreview(null);
      }

      await refetch();
      toast.success("Church details saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save church details.");
    } finally {
      setSaving(false);
    }
  }

  const logoSrc = preview || form.logoUrl;
  const countryOptions =
    form.country && !(COUNTRIES as readonly string[]).includes(form.country) ?
      [form.country, ...COUNTRIES]
    : COUNTRIES;

  return (
    <form
      className="max-w-[600px] space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <input
          id="church-logo-upload"
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={saving}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const invalid = validateImageFile(file);
            if (invalid) {
              toast.error(invalid);
              return;
            }
            setLogoFile(file);
            setPreview(URL.createObjectURL(file));
          }}
        />
        <label
          htmlFor="church-logo-upload"
          className={cn(
            "relative flex size-24 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-accent transition-colors",
            saving ? "cursor-not-allowed opacity-60" : "hover:border-primary/40"
          )}
        >
          {logoSrc ?
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="size-full object-cover" />
          : <Plus className="size-7 text-muted-foreground" />}
        </label>
        <p className="text-xs text-muted-foreground">
          PNG or JPG, max {MAX_IMAGE_SIZE_LABEL}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="church-name">
          Church Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="church-name"
          value={form.name}
          onChange={(event) => setField("name", event.target.value)}
          placeholder="Enter your church name"
          required
          disabled={saving}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="church-phone">
            Phone Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="church-phone"
            type="tel"
            value={form.phone}
            onChange={(event) => setField("phone", event.target.value)}
            placeholder="+91 98765 43210"
            required
            disabled={saving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="church-website">Website (optional)</Label>
          <Input
            id="church-website"
            type="url"
            value={form.website}
            onChange={(event) => setField("website", event.target.value)}
            placeholder="https://yourchurch.org"
            disabled={saving}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="church-city">
            City <span className="text-destructive">*</span>
          </Label>
          <Input
            id="church-city"
            value={form.city}
            onChange={(event) => setField("city", event.target.value)}
            placeholder="Enter your city"
            required
            disabled={saving}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="church-country">
            Country <span className="text-destructive">*</span>
          </Label>
          <select
            id="church-country"
            value={form.country}
            disabled={saving}
            required
            onChange={(event) => setField("country", event.target.value)}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 md:text-sm"
          >
            <option value="">Select country</option>
            {countryOptions.map((countryOption) => (
              <option key={countryOption} value={countryOption}>
                {countryOption}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="church-address">
          Church Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="church-address"
          value={form.address}
          onChange={(event) => setField("address", event.target.value)}
          placeholder="Street, area, and postal code"
          required
          disabled={saving}
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function ChurchSettingsContent() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("navigation");
  const { churches, organization } = useOrganization();
  const { activeBranch } = useActiveBranch();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isIndependent = isIndependentChurchWorkspace(organization);
  const church = churches[0];
  const churchName = activeBranch?.name ?? church?.name ?? t("yourChurch");

  const activeTab = useMemo(() => {
    const tab = searchParams.get("tab");
    if (tab === "members" && isIndependent) return tab;
    if (tab === "join-url" && isIndependent) return tab;
    if (tab === "donations") return tab;
    if (tab === "website") return tab;
    return "general";
  }, [searchParams, isIndependent]);

  function handleTabChange(value: string) {
    const query = value === "general" ? "" : `?tab=${value}`;
    router.replace(`/dashboard/church-settings${query}`, { scroll: false });
  }

  return (
    <div className={adminSectionClass}>
      <AdminPageHeader
        title={t("churchSettings")}
        description={
          churchName ?
            t("churchSettingsFor", { name: churchName })
          : t("churchSettingsGeneric")
        }
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="general">{t("general")}</TabsTrigger>
          {isIndependent ?
            <TabsTrigger value="join-url">{t("joinUrl")}</TabsTrigger>
          : null}
          <TabsTrigger value="donations">{t("donationSettings")}</TabsTrigger>
          <TabsTrigger value="website">Website</TabsTrigger>
          {isIndependent ?
            <TabsTrigger value="members">{tNav("members")}</TabsTrigger>
          : null}
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {church && organization ?
            <ChurchGeneralForm
              churchId={church.id}
              organizationId={organization.id}
              initial={{
                name: church.name ?? churchName,
                phone: church.phone ?? "",
                website: church.website ?? "",
                address: church.address ?? "",
                city: church.city ?? "",
                country: church.country ?? activeBranch?.country ?? organization.settings?.country ?? "",
                logoUrl: church.logoUrl ?? "",
              }}
            />
          : <p className="text-sm text-muted-foreground">{t("noChurchSelected")}</p>}
        </TabsContent>

        {isIndependent && activeBranch?.slug && organization ?
          <TabsContent value="join-url">
            <ChurchJoinUrlCard
              organizationId={organization.id}
              branchId={activeBranch.id}
              slug={activeBranch.slug}
              churchName={churchName}
              settings={activeBranch.settings}
              section="join-url"
            />
          </TabsContent>
        : null}

        <TabsContent value="donations">
          <DonationSettingsPanel />
        </TabsContent>

        <TabsContent value="website">
          <p className="text-sm text-muted-foreground">
            Choose the public website template, branding, social links, and SEO for
            this church. Presentation changes only — content records stay the same.
          </p>
          <a
            href="/dashboard/website"
            className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Open website settings
          </a>
        </TabsContent>

        {isIndependent && activeBranch ?
          <TabsContent value="members" className="space-y-6">
            <ChurchJoinUrlCard
              organizationId={organization!.id}
              branchId={activeBranch.id}
              slug={activeBranch.slug}
              churchName={churchName}
              settings={activeBranch.settings}
              section="enrollment"
            />
            <ChurchMembersPanel
              branchId={activeBranch.id}
              churchName={churchName}
            />
          </TabsContent>
        : null}
      </Tabs>
    </div>
  );
}

export function AdminChurchSettingsPageClient() {
  return (
    <RequireAdmin>
      <RequireOrganizationAdmin>
        <ChurchSettingsContent />
      </RequireOrganizationAdmin>
    </RequireAdmin>
  );
}
