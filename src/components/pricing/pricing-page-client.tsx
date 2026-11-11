"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, ChevronRight, Mail, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RazorpaySubscriptionButton } from "@/components/subscription/razorpay-subscription-button";
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
import { useSubscriptionOptional } from "@/context/subscription-context";
import { hasActivePaidEntitlement } from "@/lib/subscription/trial";
import { cn } from "@/lib/utils";
import type { BillingInterval } from "@/types/subscription";
import {
  formatPlanPrice,
  getPlanComparisonRows,
  PLANS,
  PRICING_TABLE_COLUMNS,
  PRO_PLUS_DISPLAY,
} from "@/lib/subscription/plans";
import {
  typeHeroTitleClass,
  typeSectionTitleClass,
} from "@/lib/responsive-classes";

const FAQ_ITEMS = [
  {
    question: "Can I upgrade later?",
    answer:
      "Yes. You can start with the 14-day free trial and upgrade to Starter or Pro. Pro+ and Enterprise are marked coming soon and cannot be purchased yet.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "When billing launches, you'll be able to cancel or downgrade at the end of your billing period. Your content remains accessible according to your plan limits.",
  },
  {
    question: "What happens after the 14-day trial?",
    answer:
      "Your existing content is preserved. Paid checkout is not live yet, so you can keep exploring plans on the pricing page. We'll notify you before any future charge.",
  },
  {
    question: "Do you offer Enterprise plans?",
    answer:
      "Enterprise is coming soon. Planned options include white-label, custom domain, API access, dedicated support, and an SLA. It cannot be purchased yet.",
  },
  {
    question: "Is payment required today?",
    answer:
      "The 14-day trial does not require payment. Starter and Pro can be purchased. Pro+ and Enterprise are coming soon.",
  },
];

function ComparisonCell({ value }: { value: string | boolean }) {
  if (typeof value === "boolean") {
    return value ?
        <Check className="mx-auto size-4 text-foreground" aria-label="Yes" />
      : <X className="mx-auto size-4 text-muted-foreground/40" aria-label="No" />;
  }
  if (value === "Unlimited") {
    return <span className="text-xs font-medium text-primary sm:text-sm">Unlimited</span>;
  }
  return <span className="text-sm tabular-nums">{value}</span>;
}

export function PricingPageClient() {
  const subscription = useSubscriptionOptional();
  const paidSubscription = subscription?.snapshot?.subscription;
  const activePaidPlanId =
    paidSubscription && hasActivePaidEntitlement(paidSubscription)
      ? paidSubscription.planId
      : null;
  const [interval, setInterval] = useState<BillingInterval>("monthly");
  const [perView, setPerView] = useState(1);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const measure = () => {
      const width = scroller.clientWidth;
      setPerView(width >= 1080 ? 4 : width >= 680 ? 2 : 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, []);

  function scrollPlans(direction: -1 | 1) {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector<HTMLElement>("[data-pricing-card]");
    const distance = card?.getBoundingClientRect().width ?? scroller.clientWidth;
    scroller.scrollBy({ left: direction * (distance + 16), behavior: "smooth" });
  }

  return (
    <div className="min-w-0 overflow-x-hidden">
      <section className="relative px-4 pb-4 pt-10 text-center sm:pb-3 sm:pt-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl space-y-3">
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
              <span className="ml-1.5 text-xs text-muted-foreground">Save ~17%</span>
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl overflow-x-hidden px-4 pb-16">
        <div className="mb-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Previous plans"
            onClick={() => scrollPlans(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Next plans"
            onClick={() => scrollPlans(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div
          ref={scrollerRef}
          className="flex items-stretch gap-4 overflow-x-auto scroll-smooth pb-1 pt-3 [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
        >
        {PRICING_TABLE_COLUMNS.map((planId) => {
          const plan = planId === "pro_plus" ? PRO_PLUS_DISPLAY : PLANS[planId];
          const price = formatPlanPrice(plan, interval);

          return (
            <div
              key={planId}
              data-pricing-card
              className="flex min-w-0 shrink-0 snap-start"
              style={{
                flexBasis: `calc((100% - ${(perView - 1) * 16}px) / ${perView})`,
              }}
            >
            <Card
              className={cn(
                "relative flex h-full w-full flex-col border-border/60 shadow-sm transition-shadow hover:shadow-md",
                plan.highlighted && "border-primary/40 ring-1 ring-primary/20"
              )}
            >
              {plan.highlighted ?
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Popular
                </div>
              : null}
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="min-h-10">{plan.tagline}</CardDescription>
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
              <CardFooter className="mt-auto">
                {plan.comingSoon ?
                  <Button className="w-full" disabled>
                    Coming soon
                  </Button>
                : plan.contactSales ?
                  <Button className="w-full" asChild>
                    <Link href={`mailto:${siteConfig.author.email}?subject=Enterprise%20Plan`}>
                      <Mail className="mr-2 size-4" />
                      Contact Sales
                    </Link>
                  </Button>
                : plan.monthlyPrice === 0 ?
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/signup">{plan.ctaLabel ?? "Start 14-day trial"}</Link>
                  </Button>
                : planId === "starter" || planId === "professional" ?
                  activePaidPlanId === planId ?
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  : <div className="w-full">
                      <RazorpaySubscriptionButton
                        planId={planId}
                        label="Start Subscription"
                      />
                    </div>
                : null}
              </CardFooter>
            </Card>
            </div>
          );
        })}
        </div>
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
                  {PRICING_TABLE_COLUMNS.map((id) => (
                    <th key={id} className="px-3 py-3 text-center font-semibold">
                      {id === "pro_plus" ? PRO_PLUS_DISPLAY.name : PLANS[id].name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {getPlanComparisonRows().map((row) => (
                  <tr
                    key={row.label}
                    className="border-b border-border/40 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-muted-foreground">
                      {row.label}
                    </td>
                    {PRICING_TABLE_COLUMNS.map((id) => (
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
