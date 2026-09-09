"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useOrganizationOptional } from "@/context/organization-context";
import { useActiveBranchOptional } from "@/context/active-branch-context";
import { useActiveChurchScope } from "@/context/active-church-context";
import { getLegacyDefaultChurchId } from "@/lib/church-scope";
import { MULTI_CHURCH_ENABLED } from "@/lib/feature-flags";
import { createPrayerRequest } from "@/lib/prayer-request-mutations";
import {
  PRAYER_CATEGORIES,
  PRAYER_REQUEST_MAX,
  PRAYER_TITLE_MAX,
  PRAYER_NAME_MAX,
  type PrayerRequestSubmitValues,
} from "@/lib/prayer-request-validation";

function getDefaultName(
  profile: { firstName?: string; lastName?: string } | null,
  authUser: { displayName?: string | null } | null
): string {
  if (profile?.firstName || profile?.lastName) {
    return `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
  }

  return authUser?.displayName?.trim() ?? "";
}

type PrayerRequestFormProps = {
  variant?: "page" | "dialog";
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function PrayerRequestForm({
  variant = "page",
  onSuccess,
  onCancel,
}: PrayerRequestFormProps) {
  const router = useRouter();
  const tPrayer = useTranslations("prayer");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const { authUser, profile, loading, user } = useFirebaseAuth();
  const organization = useOrganizationOptional();
  const activeBranch = useActiveBranchOptional();
  const { churchId, isLoading: churchLoading } = useActiveChurchScope();
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const prayerRequestSubmitSchema = useMemo(
    () =>
      z.object({
        name: z
          .string()
          .max(
            PRAYER_NAME_MAX,
            tValidation("maxLength", { count: PRAYER_NAME_MAX })
          ),
        email: z
          .string()
          .email(tValidation("invalidEmail"))
          .max(120)
          .optional()
          .or(z.literal("")),
        title: z
          .string()
          .min(1, tValidation("prayerTitleRequired"))
          .max(
            PRAYER_TITLE_MAX,
            tValidation("maxLength", { count: PRAYER_TITLE_MAX })
          ),
        request: z
          .string()
          .min(1, tValidation("prayerRequestRequired"))
          .max(
            PRAYER_REQUEST_MAX,
            tValidation("maxLength", { count: PRAYER_REQUEST_MAX })
          ),
        category: z.enum([
          "general",
          "health",
          "family",
          "finances",
          "salvation",
          "guidance",
          "thanksgiving",
          "other",
        ]),
        isAnonymous: z.boolean(),
        shareWithCommunity: z.boolean(),
      }),
    [tValidation]
  );

  const form = useForm<PrayerRequestSubmitValues>({
    resolver: zodResolver(prayerRequestSubmitSchema),
    defaultValues: {
      name: "",
      email: "",
      title: "",
      request: "",
      category: "general",
      isAnonymous: false,
      shareWithCommunity: true,
    },
  });

  const isAnonymous = form.watch("isAnonymous");

  useEffect(() => {
    if (loading || !authUser) return;

    const defaultName = getDefaultName(profile, authUser);
    if (defaultName && !form.getValues("name")) {
      form.setValue("name", defaultName, { shouldDirty: false });
    }
  }, [authUser, profile, loading, form]);

  async function onSubmit(values: PrayerRequestSubmitValues) {
    if (!authUser) {
      setSubmitError(tPrayer("signInRequired"));
      return;
    }

    const effectiveChurchId = churchId || getLegacyDefaultChurchId();
    if (MULTI_CHURCH_ENABLED && !effectiveChurchId) {
      setSubmitError(tPrayer("noChurchConfigured"));
      return;
    }

    setSubmitError(null);

    try {
      const resolvedName =
        values.isAnonymous ?
          ""
        : values.name.trim() || getDefaultName(profile, authUser);

      const prayerId = await createPrayerRequest(
        effectiveChurchId,
        authUser.uid,
        {
          ...values,
          name: resolvedName,
        },
        {
          email: authUser.email,
          organizationId:
            organization?.organization?.id ?? profile?.organizationId ?? undefined,
          branchId:
            activeBranch?.activeBranchId ??
            profile?.activeBranchId ??
            undefined,
        }
      );

      if (user) {
        void user
          .getIdToken()
          .then((token) =>
            fetch("/api/email/prayer-submitted", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                prayerId,
                prayerTitle: values.title.trim(),
              }),
            })
          )
          .catch(() => {
            // Email failure must not block submission success
          });
      }

      setSubmitted(true);
      onSuccess?.();
    } catch {
      setSubmitError(tPrayer("submitFailed"));
    }
  }

  if (loading || churchLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          {tPrayer("signInToSubmit")}
        </p>
        <Button asChild className="mt-4 rounded-full">
          <Link href="/signin?callbackUrl=/prayer-requests">{tCommon("signIn")}</Link>
        </Button>
      </div>
    );
  }

  if (submitted) {
    const successContent = (
      <div className="space-y-4">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
          🙏
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {tPrayer("submitSuccess")}
        </p>
        {variant === "page" ?
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild variant="default" className="rounded-full">
              <Link href="/prayer-requests">{tPrayer("viewPrayerRequests")}</Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => router.push("/")}
            >
              {tPrayer("backHome")}
            </Button>
          </div>
        : onCancel ?
          <Button
            type="button"
            variant="default"
            className="mt-2 rounded-full"
            onClick={onCancel}
          >
            {tPrayer("done")}
          </Button>
        : null}
      </div>
    );

    if (variant === "dialog") {
      return successContent;
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />
        <div className="space-y-4 p-6 sm:p-8">{successContent}</div>
      </div>
    );
  }

  const isDialog = variant === "dialog";

  const formBody = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isDialog ? tPrayer("titleLabel") : tPrayer("prayerTitle")}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={tPrayer("titlePlaceholder")}
                  maxLength={PRAYER_TITLE_MAX}
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="request"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {isDialog ? tPrayer("descriptionLabel") : tPrayer("prayerRequest")}
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={tPrayer("requestPlaceholder")}
                  rows={isDialog ? 5 : 6}
                  maxLength={PRAYER_REQUEST_MAX}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{tPrayer("category")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={tPrayer("categoryPlaceholder")} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PRAYER_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {tPrayer(`categories.${category.value}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isAnonymous"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 p-4">
              <div className="space-y-1">
                <FormLabel>
                  {isDialog ?
                    tPrayer("makeAnonymous")
                  : tPrayer("submitAnonymously")}
                </FormLabel>
                <FormDescription>
                  {isDialog ?
                    tPrayer("anonymousDescriptionDialog")
                  : tPrayer("anonymousDescription")}
                </FormDescription>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {!isDialog ?
          <FormField
            control={form.control}
            name="shareWithCommunity"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-muted/20 p-4">
                <div className="space-y-1">
                  <FormLabel>{tPrayer("shareWithCommunity")}</FormLabel>
                  <FormDescription>
                    {tPrayer("shareWithCommunityDescription")}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        : null}

        {!isAnonymous ?
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{tPrayer("nameOptional")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={tPrayer("namePlaceholder")}
                    autoComplete="name"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {tPrayer("namePrefilledHint")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        : null}

        {submitError ?
          <p className="text-sm text-destructive" role="alert">
            {submitError}
          </p>
        : null}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          {variant === "dialog" && onCancel ?
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={onCancel}
              disabled={form.formState.isSubmitting}
            >
              {tCommon("cancel")}
            </Button>
          : null}
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="rounded-full sm:min-w-[160px]"
          >
            {form.formState.isSubmitting ?
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
            : isDialog ?
              null
            : <Send className="mr-2 size-4" aria-hidden />}
            {isDialog ?
              tPrayer("submitRequest")
            : tPrayer("submitPrayerRequest")}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (variant === "dialog") {
    return formBody;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />
      <div className="space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary/60">
            {tPrayer("formEyebrow")}
          </p>
          <h2 className="font-heading text-xl font-semibold text-foreground sm:text-2xl">
            {tPrayer("submitTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {tPrayer("submitDescription")}
          </p>
        </div>

        {formBody}
      </div>
    </div>
  );
}
