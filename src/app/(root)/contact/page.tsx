import { Mail } from "lucide-react";

import { ContactForm } from "@/components/contact/contact-form";
import { siteConfig } from "@/config/site";
import { pageNarrowClass, typePageTitleClass } from "@/lib/responsive-classes";

export const metadata = {
  title: "Contact Us",
  description: `Get in touch with the ${siteConfig.name} team.`,
};

export default function ContactPage() {
  return (
    <div className={`${pageNarrowClass} space-y-8 pb-12 pt-2`}>
      <div className="space-y-3 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="size-5 text-primary" />
        </div>
        <h1 className={typePageTitleClass}>Contact Us</h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
          Have a question, prayer need, or feedback? We&apos;d love to hear from
          you. Fill out the form below and our team will get back to you.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm sm:p-6 md:p-8">
        <ContactForm />
      </div>
    </div>
  );
}
