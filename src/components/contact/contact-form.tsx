"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { siteConfig } from "@/config/site";
import {
  contactFormSchema,
  type ContactFormValues,
} from "@/lib/contact-validation";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  async function onSubmit(values: ContactFormValues) {
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        toast.error(data.error ?? "Unable to send your message. Please try again.");
        return;
      }

      setSubmitted(true);
      form.reset();
      toast.success(data.message ?? "Message sent successfully.");
    } catch {
      toast.error("Unable to send your message. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="size-5 text-primary" />
        </div>
        <h3 className="font-heading text-lg font-semibold">Message sent</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thank you for contacting us. We&apos;ve sent a confirmation to your
          email and will respond as soon as we can.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-6 rounded-full"
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <Input placeholder="How can we help?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea
                  rows={6}
                  placeholder="Share your question or feedback..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            You can also email us at{" "}
            <a
              href={`mailto:${siteConfig.author.email}`}
              className="font-medium text-primary hover:underline"
            >
              {siteConfig.author.email}
            </a>
          </p>

          <Button
            type="submit"
            className="rounded-full"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ?
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Sending...
              </>
            : <>
                <Send className="mr-2 size-4" />
                Send Message
              </>
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
