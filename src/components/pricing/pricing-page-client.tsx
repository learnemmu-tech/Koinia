"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Mail, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import type { BillingInterval, PlanId } from "@/types/subscription";
import {
  formatPlanPrice,
  PLAN_ORDER,
  PLANS,
} from "@/lib/subscription/plans";
import {
  typeHeroTitleClass,
  typeSectionTitleClass,
} from "@/lib/responsive-classes";

const FAQ_ITEMS = [
  {
    question: "Can I upgrade later?",
    answer:
      "Yes. You can start on Free and upgrade to Starter, Professional, or Enterprise as your ministry grows. Plan changes will be available once billing is enabled.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "When billing launches, you'll be able to cancel or downgrade at the end of your billing period. Your content remains accessible according to your plan limits.",
  },
  {
    question: "What happens after a trial?",
    answer:
      "Trial periods will convert to your selected paid plan unless you cancel before the trial ends. We'll notify you before any charge.",
  },
  {
    question: "Do you offer Enterprise plans?",
    answer:
      "Yes. Enterprise includes unlimited churches, white-label options, custom domains, API access, dedicated support, and SLA. Contact our team for a custom quote.",
  },
  {
    question: "Is payment required today?",
    answer:
      "No. FaithConnectHub is building toward full billing integration. You can explore plans now; checkout and invoices will be added in a future release.",
  },
];

type ComparisonRow = {
  label: string;
  values: Record<PlanId, string | boolean>;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Churches",
    values: { free: "1", starter: "1", professional: "5", enterprise: "Unlimited" },
  },
  {
    label: "Members",
    values: { free: "50", starter: "500", professional: "Unlimited", enterprise: "Unlimited" },
  },
  {
    label: "Songs",
    values: { free: "20", starter: "Unlimited", professional: "Unlimited", enterprise: "Unlimited" },
  },
  {
    label: "Sermons",
    values: { free: "20", starter: "Unlimited", professional: "Unlimited", enterprise: "Unlimited" },
  },
  {
    label: "Articles",
    values: { free: "20", starter: "Unlimited", professional: "Unlimited", enterprise: "Unlimited" },
  },
  {
    label: "Email notifications",
    values: { free: false, starter: true, professional: true, enterprise: true },
  },
  {
    label: "Analytics",
    values: { free: false, starter: true, professional: true, enterprise: true },
  },
  {
    label: "Advanced analytics",
    values: { free: false, starter: false, professional: true, enterprise: true },
  },
  {
    label: "Custom branding",
    values: { free: false, starter: true, professional: true, enterprise: true },
  },
  {
    label: "Event registration",
    values: { free: false, starter: false, professional: true, enterprise: true },
  },
  {
    label: "Multiple admins",
    values: { free: false, starter: true, professional: true, enterprise: true },
  },
  {
    label: "White label",
    values: { free: false, starter: false, professional: false, enterprise: true },
  },
  {
    label: "Custom domain",
    values: { free: false, starter: false, professional: false, enterprise: true },
  },
  {
    label: "API access",
    values: { free: false, starter: false, professional: false, enterprise: true },
  },
  {
    label: "Dedicated support",
    values: { free: false, starter: false, professional: false, enterprise: true },
  },
  {
    label: "SLA",
    values: { free: false, starter: false, professional: false, enterprise: true },
  },
];

function ComparisonCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ?
        <Check className="mx-auto size-4 text-green-600" aria-label="Yes" />
      : <X className="mx-auto size-4 text-muted-foreground/40" aria-label="No" />;
  }
  if (value === "Unlimited") {
    return <span className="text-xs font-medium text-primary sm:text-sm">Unlimited</span>;
  }
  return <span className="text-sm tabular-nums">{value}</span>;
}

export function PricingPageClient() {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <div className="min-w-0 overflow-x-hidden">
      <section className="relative px-4 py-16 text-center sm:py-20 md:py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary/70">
            Pricing
          </p>
          <h1 className={typeHeroTitleClass}>
            Plans that grow with your ministry
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            From a single church getting started to multi-campus networks at
            scale — choose the plan that fits {siteConfig.name} today and upgrade
            when you&apos;re ready.
          </p>

          <div className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                interval === "monthly" ?
                  "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("yearly")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                interval === "yearly" ?
                  "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              )}
            >
              Yearly
              <span className="ml-1.5 text-xs text-green-600">Save ~17%</span>
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {PLAN_ORDER.map((planId) => {
          const plan = PLANS[planId];
          const price = formatPlanPrice(plan, interval);

          return (
            <Card
              key={planId}
              className={cn(
                "relative flex flex-col border-border/60 shadow-sm transition-shadow hover:shadow-md",
                plan.highlighted && "border-primary/40 ring-1 ring-primary/20 lg:scale-[1.02]"
              )}
            >
              {plan.highlighted ?
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Popular
                </div>
              : null}
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.tagline}</CardDescription>
                <div className="pt-2">
                  <p className="text-3xl font-bold tracking-tight">{price}</p>
                  {!plan.contactSales && plan.monthlyPrice !== 0 ?
                    <p className="text-xs text-muted-foreground">
                      per {interval === "yearly" ? "year" : "month"}
                    </p>
                  : null}
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <ul className="space-y-2.5">
                  {plan.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {plan.contactSales ?
                  <Button className="w-full" asChild>
                    <Link href={`mailto:${siteConfig.author.email}?subject=Enterprise%20Plan`}>
                      <Mail className="mr-2 size-4" />
                      Contact Sales
                    </Link>
                  </Button>
                : plan.monthlyPrice === 0 ?
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/signup">Get started free</Link>
                  </Button>
                : <Button className="w-full" disabled>
                    Coming Soon
                  </Button>}
              </CardFooter>
            </Card>
          );
        })}
      </section>

      <section className="bg-muted/30 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <h2 className={typeSectionTitleClass}>Compare plans</h2>
            <p className="mt-2 text-muted-foreground">
              Every feature, every limit — side by side.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="px-4 py-3 font-semibold">Feature</th>
                  {PLAN_ORDER.map((id) => (
                    <th key={id} className="px-3 py-3 text-center font-semibold">
                      {PLANS[id].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-muted-foreground">
                      {row.label}
                    </td>
                    {PLAN_ORDER.map((id) => (
                      <td key={id} className="px-3 py-3 text-center">
                        <ComparisonCell value={row.values[id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <div className="mb-8 text-center">
          <h2 className={typeSectionTitleClass}>Frequently asked questions</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={item.question} value={`faq-${index}`}>
              <AccordionTrigger className="text-left">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-20">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-primary/5 p-8 text-center sm:p-12">
          <h2 className={typeSectionTitleClass}>Need Enterprise?</h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Unlimited churches, white-label branding, custom domains, API access,
            and dedicated support for large ministry networks.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href={`mailto:${siteConfig.author.email}?subject=Enterprise%20Plan%20Inquiry`}>
                <Mail className="mr-2 size-4" />
                Contact Sales
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Talk to us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
