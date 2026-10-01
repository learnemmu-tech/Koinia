"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { AboutCopyItem } from "@/lib/templates/about-content";

export function HeritageAboutBeliefs({ items }: { items: AboutCopyItem[] }) {
  if (items.length === 0) return null;

  const useAccordion = items.length > 1 || (items[0]?.body.length ?? 0) > 280;

  if (!useAccordion) {
    return (
      <div className="heritage-about-belief">
        {items[0].title ? <h3>{items[0].title}</h3> : null}
        <p>{items[0].body}</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="heritage-about-accordion">
      {items.map((item, index) => (
        <AccordionItem key={`${item.title}-${index}`} value={`belief-${index}`}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>
            <p className="whitespace-pre-line">{item.body}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
