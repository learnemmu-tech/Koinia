"use client";



import { useEffect, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { ImagePlus, Loader2, X } from "lucide-react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";



import { OnboardingWizardShell } from "@/components/onboarding/onboarding-wizard-shell";

import { OnboardingSuccessScreen } from "@/components/onboarding/onboarding-success-screen";

import { WorkspaceTypeSelector } from "@/components/onboarding/workspace-type-selector";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useFirebaseAuth } from "@/context/firebase-auth-context";

import { setAuthSession } from "@/lib/auth/set-auth-session";

import { useOrganization } from "@/context/organization-context";

import { buildCreateWorkspaceAuthHref, WAITING_APPROVAL_PATH } from "@/lib/auth/auth-flow";

import { useWorkspaceAccess } from "@/hooks/use-workspace-access";

import { firebaseAuth } from "@/lib/firebase-auth-service";
import { waitForUserProfileUpdate, buildPostOnboardingProfilePatch, isWorkspaceProfileComplete } from "@/lib/auth/wait-for-user-profile";

import { COUNTRIES } from "@/lib/countries";

import { MAX_IMAGE_SIZE_LABEL, validateImageFile } from "@/lib/upload-limits";

import type { WorkspaceType } from "@/types/organization";

import { cn } from "@/lib/utils";



export function ChurchOnboardingForm() {

  const router = useRouter();

  const queryClient = useQueryClient();

  const { authUser, refreshProfile, profileReady } = useFirebaseAuth();

  const {

    churches,

    loading: orgLoading,

    refetch,

    membership,

  } = useOrganization();

  const { isMembershipPending } = useWorkspaceAccess();



  const [step, setStep] = useState(1);

  const [workspaceType, setWorkspaceType] =

    useState<WorkspaceType>("independent_church");



  const [name, setName] = useState("");

  const [city, setCity] = useState("");

  const [country, setCountry] = useState("India");

  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");

  const [website, setWebsite] = useState("");

  const [logoFile, setLogoFile] = useState<File | undefined>();

  const [logoPreview, setLogoPreview] = useState("");

  const [loading, setLoading] = useState(false);

  const [successJoinSlug, setSuccessJoinSlug] = useState<string | null>(null);



  useEffect(() => {
    if (!profileReady) return;

    if (!authUser) {
      router.replace(buildCreateWorkspaceAuthHref("/signin"));
      return;
    }

    if (isMembershipPending) {
      router.replace(WAITING_APPROVAL_PATH);
    }
  }, [authUser, profileReady, isMembershipPending, router]);



  function handleLogoPick(file: File | undefined) {

    if (!file) return;

    const error = validateImageFile(file);

    if (error) {

      toast.error(error);

      return;

    }

    const reader = new FileReader();

    reader.onloadend = () => {

      setLogoFile(file);

      setLogoPreview(reader.result as string);

    };

    reader.readAsDataURL(file);

  }



  function clearLogo() {

    setLogoFile(undefined);

    setLogoPreview("");

  }



  async function handleSubmit(event: React.FormEvent) {

    event.preventDefault();



    if (!name.trim()) {

      toast.error(

        workspaceType === "independent_church" ?

          "Church name is required"

        : "Organization name is required"

      );

      return;

    }



    if (!city.trim()) {

      toast.error("City is required");

      return;

    }

    if (!country.trim()) {

      toast.error("Country is required");

      return;

    }



    const user = firebaseAuth.currentUser;

    if (!user) {

      toast.error("Please sign in to continue");

      return;

    }



    setLoading(true);

    try {

      const token = await user.getIdToken();

      let logoUrl: string | undefined;
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        const { uploadOnboardingLogoLocal } = await import("@/lib/local-upload");
        try {
          logoUrl = await uploadOnboardingLogoLocal(
            user.uid,
            formData,
            undefined,
            token
          );
        } catch {
          toast.message("Logo upload failed. Continuing with the default logo.");
        }
      }

      const requestBody = {
        name: name.trim(),
        ...(logoUrl ? { logoUrl } : {}),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        website: website.trim() || undefined,
        city: city.trim(),
        state: "N/A",
        country: country.trim(),
        workspaceType,
      };

      const response = await fetch("/api/onboarding/church", {

        method: "POST",

        headers: {

          Authorization: `Bearer ${token}`,

          "Content-Type": "application/json",

        },

        body: JSON.stringify(requestBody),

      });



      if (!response.ok) {

        const body = (await response.json().catch(() => ({}))) as {

          error?: string;

        };

        throw new Error(body.error ?? "Failed to create workspace");

      }



      const result = (await response.json()) as {

        organizationId?: string;

        churchId?: string;

        branchId?: string;

        joinSlug?: string;

      };

      if (!result.organizationId?.trim()) {
        throw new Error("Workspace creation did not return an organization id.");
      }

      const profilePatch = buildPostOnboardingProfilePatch({
        organizationId: result.organizationId,
        churchId: result.churchId,
        activeBranchId: result.branchId,
      });

      if (logoFile && result.churchId && !logoUrl) {

        const formData = new FormData();

        formData.append("file", logoFile);

        const { uploadSongFileLocal } = await import("@/lib/local-upload");

        try {

          await uploadSongFileLocal(

            result.churchId,

            "cover",

            formData,

            undefined,

            token

          );

        } catch {

          toast.message("Workspace created. You can upload a logo from church settings.");

        }

      }



      let resolvedProfile = await refreshProfile(profilePatch);

      if (!isWorkspaceProfileComplete(resolvedProfile)) {
        const confirmed = await waitForUserProfileUpdate(user.uid, {
          organizationId: result.organizationId,
          needsChurchOnboarding: false,
        });
        if (confirmed) {
          resolvedProfile = await refreshProfile(profilePatch);
        }
      }

      if (!resolvedProfile || !isWorkspaceProfileComplete(resolvedProfile)) {
        throw new Error(
          "Workspace was created but your profile could not be loaded. Please refresh the page."
        );
      }

      await refetch();

      let activeMembership = membership;

      if (resolvedProfile) {
        const orgResponse = await fetch("/api/organization", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (orgResponse.ok) {
          const orgData = (await orgResponse.json()) as {
            membership?: typeof membership;
            churches?: unknown[];
          };

          activeMembership = orgData.membership ?? activeMembership;
        }

        setAuthSession(true, {
          role: resolvedProfile.role,
          profile: resolvedProfile,
          membership: activeMembership,
          churchesCount:
            workspaceType === "multi_church_org" ? 0 : churches.length + 1,
          workspaceType,
        });
      }

      await queryClient.refetchQueries({ queryKey: ["membership-routing"] });
      await queryClient.refetchQueries({ queryKey: ["organization"] });

      if (workspaceType === "independent_church" && result.joinSlug?.trim()) {
        sessionStorage.setItem("onboarding_show_success", "1");
        setSuccessJoinSlug(result.joinSlug.trim());
        return;
      }

      router.replace("/dashboard");

    } catch (error) {

      toast.error(

        error instanceof Error ? error.message : "Failed to complete onboarding"

      );

    } finally {

      setLoading(false);

    }

  }



  if (successJoinSlug) {

    return (

      <OnboardingSuccessScreen

        churchName={name.trim()}

        joinSlug={successJoinSlug}

      />

    );

  }



  if (step === 1) {

    return (

      <OnboardingWizardShell

        step={1}

        totalSteps={2}

        title="Create Your Workspace"

        description="Choose how your ministry will be organized on FaithConnectHub."

      >

        <WorkspaceTypeSelector

          value={workspaceType}

          onChange={setWorkspaceType}

        />



        <div className="mt-8 flex justify-center">

          <Button

            type="button"

            className="h-11 min-w-[200px] rounded-lg px-8 text-[15px] font-medium"

            onClick={() => setStep(2)}

          >

            Continue

          </Button>

        </div>

      </OnboardingWizardShell>

    );

  }



  const isIndependent = workspaceType === "independent_church";



  return (

    <OnboardingWizardShell

      step={2}

      totalSteps={2}

      variant="form"

      title="Create Your Workspace"

      description={

        isIndependent ?

          "Tell us about your church. We will set up your workspace and join link."

        : "Tell us about your organization. You can add churches after setup."

      }

    >

      <form onSubmit={handleSubmit} className="space-y-5">

        <div className="space-y-2">

          <Label htmlFor="workspace-name">

            {isIndependent ? "Church Name" : "Organization Name"}{" "}

            <span className="text-destructive">*</span>

          </Label>

          <Input

            id="workspace-name"

            value={name}

            onChange={(e) => setName(e.target.value)}

            placeholder={

              isIndependent ? "Grace Gospel Chapel" : "Grace Ministries Network"

            }

            required

            disabled={loading}

          />

        </div>



        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">
              City <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter your city"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">
              Country <span className="text-destructive">*</span>
            </Label>
            <Select value={country} onValueChange={setCountry} disabled={loading}>
              <SelectTrigger id="country">
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((countryOption) => (
                  <SelectItem key={countryOption} value={countryOption}>
                    {countryOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>



        <div className="grid gap-4 sm:grid-cols-2">

          <div className="space-y-2">

            <Label htmlFor="phone">Phone (optional)</Label>

            <Input

              id="phone"

              type="tel"

              value={phone}

              onChange={(e) => setPhone(e.target.value)}

              placeholder="+1 (555) 123-4567"

              disabled={loading}

            />

          </div>



          <div className="space-y-2">

            <Label htmlFor="email">Email (optional)</Label>

            <Input

              id="email"

              type="email"

              value={email}

              onChange={(e) => setEmail(e.target.value)}

              placeholder="hello@yourchurch.org"

              disabled={loading}

            />

          </div>

        </div>



        <div className="space-y-2">

          <Label htmlFor="website">Website (optional)</Label>

          <Input

            id="website"

            type="url"

            value={website}

            onChange={(e) => setWebsite(e.target.value)}

            placeholder="https://yourchurch.org"

            disabled={loading}

          />

        </div>



        <div className="space-y-2">

          <Label>Logo (optional)</Label>

          <input

            id="logo-upload"

            type="file"

            accept="image/*"

            className="sr-only"

            disabled={loading}

            onChange={(e) => handleLogoPick(e.target.files?.[0])}

          />

          <div className="flex items-center gap-4">

            {logoPreview ?

              <div className="relative">

                <img

                  src={logoPreview}

                  alt="Logo preview"

                  className="size-14 rounded-lg border border-white/10 object-cover"

                />

                <button

                  type="button"

                  onClick={clearLogo}

                  className="absolute -right-1.5 -top-1.5 rounded-full border bg-background p-0.5 shadow-sm"

                  aria-label="Remove logo"

                >

                  <X className="size-3" />

                </button>

              </div>

            : null}

            <label

              htmlFor="logo-upload"

              className={cn(

                "inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/15 px-4 text-sm text-muted-foreground transition-colors",

                loading ?

                  "cursor-not-allowed opacity-60"

                : "hover:border-primary/40 hover:bg-white/[0.03]"

              )}

            >

              <ImagePlus className="size-4" />

              {logoPreview ? "Change logo" : "Upload logo"}

            </label>

          </div>

          <p className="text-xs text-muted-foreground">

            PNG or JPG, max {MAX_IMAGE_SIZE_LABEL}. Skip to use a default logo.

          </p>

        </div>



        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">

          <Button

            type="button"

            variant="outline"

            className="h-11 rounded-lg sm:min-w-[120px]"

            disabled={loading}

            onClick={() => setStep(1)}

          >

            Back

          </Button>

          <Button

            type="submit"

            className="h-11 min-w-[200px] rounded-lg text-[15px] font-medium"

            disabled={loading}

          >

            {loading ?

              <>

                <Loader2 className="mr-2 size-4 animate-spin" />

                Creating workspace…

              </>

            : "Create workspace"}

          </Button>

        </div>

      </form>

    </OnboardingWizardShell>

  );

}


