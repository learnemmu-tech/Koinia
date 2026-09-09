"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { siteConfig } from "@/config/site";
import type { FirebaseDonationCampaign } from "@/types/firebase-donation";
import { DONATION_CURRENCIES } from "@/types/firebase-donation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
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
import { Textarea } from "@/components/ui/textarea";
import {
  createDonationCampaign,
  updateDonationCampaign,
} from "@/lib/donation-campaign-mutations";
import {
  donationCampaignFormSchema,
  type DonationCampaignFormValues,
} from "@/lib/donation-form-validation";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useInvalidateAdminQueries } from "@/hooks/use-invalidate-admin-queries";
import { notifyIfDonationCampaignPublished } from "@/lib/notify-if-published";
import { useTenantNotifyFields } from "@/hooks/use-tenant-notify-fields";
import { uploadSongFileLocal } from "@/lib/local-upload";
import { MAX_IMAGE_SIZE_LABEL, validateImageFile } from "@/lib/upload-limits";

type AddDonationCampaignModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialCampaign?: FirebaseDonationCampaign | null;
  churchId: string;
  contentScope?: "platform_public" | "organization";
};

export function AddDonationCampaignModal({
  isOpen,
  onClose,
  onSave,
  initialCampaign,
  churchId,
  contentScope = "organization",
}: AddDonationCampaignModalProps) {
  const t = useTranslations("donations");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");
  const tErrors = useTranslations("errors");
  const { user } = useFirebaseAuth();
  const { invalidateDonations } = useInvalidateAdminQueries();
  const tenantFields = useTenantNotifyFields();
  const [bannerFile, setBannerFile] = useState<File | undefined>();
  const [bannerPreview, setBannerPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form = useForm<DonationCampaignFormValues>({
    resolver: zodResolver(donationCampaignFormSchema),
    defaultValues: {
      title: "",
      description: "",
      targetAmount: 10000,
      currency: "INR",
      status: "inactive",
    },
  });

  useEffect(() => {
    if (initialCampaign) {
      form.reset({
        title: initialCampaign.title,
        description: initialCampaign.description,
        targetAmount: initialCampaign.targetAmount,
        currency: initialCampaign.currency,
        status: initialCampaign.status,
      });
      setBannerPreview(initialCampaign.bannerImage ?? "");
    } else {
      form.reset({
        title: "",
        description: "",
        targetAmount: 10000,
        currency: "INR",
        status: "inactive",
      });
      setBannerPreview("");
    }
    setBannerFile(undefined);
    setUploadProgress(0);
  }, [initialCampaign, isOpen, form]);

  function handleBannerChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      event.target.value = "";
      return;
    }

    setBannerFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function onSubmit(values: DonationCampaignFormValues) {
    setLoading(true);
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      if (!idToken) {
        toast.error(tErrors("signedInRequired"));
        return;
      }
      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        targetAmount: values.targetAmount,
        currency: values.currency,
        status: values.status,
        bannerImage: initialCampaign?.bannerImage ?? "",
      };

      if (initialCampaign) {
        const wasStatus = initialCampaign.status;
        await updateDonationCampaign(initialCampaign.id, payload);

        if (bannerFile) {
          const formData = new FormData();
          formData.append("file", bannerFile);
          const url = await uploadSongFileLocal(
            initialCampaign.id,
            "cover",
            formData,
            (progress) => setUploadProgress(progress),
            idToken,
            { kind: "donation", replaceUrl: initialCampaign.bannerImage }
          );
          await updateDonationCampaign(initialCampaign.id, { bannerImage: url });
        }

        await notifyIfDonationCampaignPublished({
          contentId: initialCampaign.id,
          contentTitle: payload.title,
          status: payload.status,
          wasStatus,
          idToken,
        });

        toast.success(t("updatedSuccess"));
      } else {
        const campaignId = await createDonationCampaign({
          ...payload,
          contentScope,
          churchId: contentScope === "platform_public" ? "" : churchId,
          organizationId:
            contentScope === "platform_public" ? undefined : tenantFields.organizationId,
          branchId:
            contentScope === "platform_public" ? undefined : tenantFields.branchId,
        });

        if (bannerFile) {
          const formData = new FormData();
          formData.append("file", bannerFile);
          const url = await uploadSongFileLocal(
            campaignId,
            "cover",
            formData,
            (progress) => setUploadProgress(progress),
            idToken,
            { kind: "donation" }
          );
          await updateDonationCampaign(campaignId, { bannerImage: url });
        }

        await notifyIfDonationCampaignPublished({
          contentId: campaignId,
          contentTitle: payload.title,
          status: payload.status,
          idToken,
        });

        toast.success(t("createdSuccess"));
      }

      await invalidateDonations();
      onSave();
      form.reset();
      setBannerFile(undefined);
      setBannerPreview("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("saveFailed")
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !loading) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {initialCampaign ? t("editModalTitle") : t("addModalTitle")}
          </DialogTitle>
          <DialogDescription>
            {initialCampaign
              ? t("editModalDescription")
              : t("addModalDescription", { siteName: siteConfig.name })}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForms("campaignTitle")}</FormLabel>
                  <FormControl>
                    <Input placeholder={tForms("placeholders.campaignTitle")} disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForms("description")}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={tForms("placeholders.campaignDescription")}
                      rows={4}
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tForms("targetAmount")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tForms("currency")}</FormLabel>
                    <Select
                      disabled={loading}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={tForms("selectCurrency")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {DONATION_CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>{tForms("bannerImage")}</FormLabel>
              {bannerPreview ?
                <div className="relative overflow-hidden rounded-xl border border-border/50">
                  <img
                    src={bannerPreview}
                    alt={tForms("campaignBannerPreviewAlt")}
                    className="aspect-[16/9] w-full object-cover"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute right-2 top-2 size-8 rounded-full"
                    onClick={() => {
                      setBannerPreview("");
                      setBannerFile(undefined);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              : null}
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 px-4 py-6 text-center transition-colors hover:bg-muted/30">
                <Upload className="size-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {tForms("uploadBanner", { max: MAX_IMAGE_SIZE_LABEL })}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={loading}
                  onChange={handleBannerChange}
                />
              </label>
              {uploadProgress > 0 && uploadProgress < 100 ?
                <p className="text-xs text-muted-foreground">
                  {tForms("uploadingProgress", { percent: uploadProgress })}
                </p>
              : null}
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{tForms("status")}</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={tForms("selectStatus")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">{tCommon("active")}</SelectItem>
                      <SelectItem value="inactive">{tCommon("inactive")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                {tCommon("cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ?
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    {tCommon("saving")}
                  </>
                : initialCampaign ?
                  tCommon("saveChanges")
                : t("create")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
