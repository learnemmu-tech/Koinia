"use client";

import React, { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { siteConfig } from "@/config/site";
import type { FirebaseEvent } from "@/types/firebase-event";
import { EVENT_TYPES } from "@/types/firebase-event";

import { EventDatePicker } from "@/components/admin/event-date-picker";
import { EventTimePicker } from "@/components/admin/event-time-picker";
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
  createEventFormSchema,
  type EventFormValues,
} from "@/lib/event-form-validation";
import { createEvent, updateEvent } from "@/lib/event-mutations";
import { notifyIfEventPublished } from "@/lib/notify-if-published";
import { useTenantNotifyFields } from "@/hooks/use-tenant-notify-fields";
import { uploadSongFileLocal } from "@/lib/local-upload";
import { MAX_IMAGE_SIZE_LABEL, validateImageFile } from "@/lib/upload-limits";
import { useFirebaseAuth } from "@/context/firebase-auth-context";
import { useInvalidateAdminQueries } from "@/hooks/use-invalidate-admin-queries";

type AddEventModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialEvent?: FirebaseEvent | null;
  churchId: string;
};

export function AddEventModal({
  isOpen,
  onClose,
  onSave,
  initialEvent,
  churchId,
}: AddEventModalProps) {
  const { user } = useFirebaseAuth();
  const { invalidateEvents } = useInvalidateAdminQueries();
  const tenantFields = useTenantNotifyFields();
  const [bannerFile, setBannerFile] = useState<File | undefined>();
  const [bannerPreview, setBannerPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const eventSchema = useMemo(
    () => createEventFormSchema(initialEvent?.eventDate),
    [initialEvent?.eventDate]
  );

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "Sunday Service",
      speakerName: "",
      eventDate: "",
      eventTime: "",
      location: "",
      status: "draft",
    },
  });

  useEffect(() => {
    if (initialEvent) {
      form.reset({
        title: initialEvent.title,
        description: initialEvent.description,
        eventType: initialEvent.eventType,
        speakerName: initialEvent.speakerName,
        eventDate: initialEvent.eventDate,
        eventTime: initialEvent.eventTime,
        location: initialEvent.location,
        status: initialEvent.status,
      });
      setBannerPreview(initialEvent.bannerImage ?? "");
    } else {
      form.reset({
        title: "",
        description: "",
        eventType: "Sunday Service",
        speakerName: "",
        eventDate: "",
        eventTime: "",
        location: "",
        status: "draft",
      });
      setBannerPreview("");
    }
    setBannerFile(undefined);
    setUploadProgress(0);
  }, [initialEvent, isOpen, form]);

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

  async function onSubmit(values: EventFormValues) {
    setLoading(true);
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      if (!idToken) {
        toast.error("You must be signed in to upload files.");
        return;
      }

      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        eventType: values.eventType,
        speakerName: values.speakerName.trim(),
        eventDate: values.eventDate,
        eventTime: values.eventTime.trim(),
        location: values.location.trim(),
        status: values.status,
        bannerImage: initialEvent?.bannerImage ?? "",
      };

      if (initialEvent) {
        await updateEvent(initialEvent.id, payload);

        let bannerImageUrl = initialEvent.bannerImage ?? "";
        if (bannerFile) {
          const formData = new FormData();
          formData.append("file", bannerFile);
          const url = await uploadSongFileLocal(
            initialEvent.id,
            "cover",
            formData,
            (progress) => setUploadProgress(progress),
            idToken
          );
          await updateEvent(initialEvent.id, { bannerImage: url });
          bannerImageUrl = url;
        }

        await notifyIfEventPublished({
          contentId: initialEvent.id,
          contentTitle: payload.title,
          image: bannerImageUrl,
          status: payload.status,
          wasStatus: initialEvent.status,
          idToken,
          churchId,
          organizationId: tenantFields.organizationId,
        });

        toast.success("Event updated successfully");
      } else {
        const eventId = await createEvent({ ...payload, churchId });

        let bannerImageUrl = payload.bannerImage;
        if (bannerFile) {
          const formData = new FormData();
          formData.append("file", bannerFile);
          const url = await uploadSongFileLocal(
            eventId,
            "cover",
            formData,
            (progress) => setUploadProgress(progress),
            idToken
          );
          await updateEvent(eventId, { bannerImage: url });
          bannerImageUrl = url;
        }

        await notifyIfEventPublished({
          contentId: eventId,
          contentTitle: payload.title,
          image: bannerImageUrl,
          status: payload.status,
          idToken,
          churchId,
          organizationId: tenantFields.organizationId,
        });

        toast.success("Event created successfully");
      }

      await invalidateEvents();
      onSave();
      form.reset();
      setBannerFile(undefined);
      setBannerPreview("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save event");
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
          <DialogTitle>{initialEvent ? "Edit Event" : "Create Event"}</DialogTitle>
          <DialogDescription>
            {initialEvent
              ? "Update event details and publish when ready"
              : `Add a new ministry event to ${siteConfig.name}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Sunday Worship Service"
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Full event description"
                      rows={4}
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
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EVENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name="speakerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Speaker Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Pastor name or guest speaker"
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
                name="eventDate"
                render={({ field, fieldState }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Event Date</FormLabel>
                    <FormControl>
                      <EventDatePicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={loading}
                        aria-invalid={fieldState.invalid}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventTime"
                render={({ field, fieldState }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Event Time</FormLabel>
                    <FormControl>
                      <EventTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={loading}
                        aria-invalid={fieldState.invalid}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <FormLabel>Banner Image</FormLabel>
              {bannerPreview ?
                <div className="relative overflow-hidden rounded-xl border border-border/50">
                  <img
                    src={bannerPreview}
                    alt="Event banner preview"
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
                  Upload banner (max {MAX_IMAGE_SIZE_LABEL})
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
                  Uploading… {uploadProgress}%
                </p>
              : null}
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Church sanctuary or venue"
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
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    disabled={loading}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ?
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Saving…
                  </>
                : initialEvent ?
                  "Save Changes"
                : "Create Event"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
