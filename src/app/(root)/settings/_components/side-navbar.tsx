"use client";

import React from "react";
import {
  Bell,
  CreditCard,
  DownloadCloud,
  Headphones,
  ImageDown,
  Key,
  Languages,
  Palette,
  Radius,
  SunMoon,
  UserCog2,
  UserX2,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SideNavItems } from "./side-navbar-items";

export type SidebarNavItem = {
  section: string;
  href: string;
  items: {
    hash: string;
    title: string;
    icon: React.ReactNode;
  }[];
};

const iconClass = "mr-2 h-5 w-5";

function useSettingsNavItems(): SidebarNavItem[] {
  const ts = useTranslations("settings");
  const tn = useTranslations("navigation");
  const tb = useTranslations("billing");
  const tc = useTranslations("common");

  return [
    {
      section: ts("account"),
      href: "/settings",
      items: [
        {
          title: ts("editProfile"),
          hash: "edit-profile",
          icon: <UserCog2 className={iconClass} />,
        },
        {
          title: ts("changePassword"),
          hash: "change-password",
          icon: <Key className={iconClass} />,
        },
        {
          title: ts("deleteAccount"),
          hash: "delete-account",
          icon: <UserX2 className={iconClass} />,
        },
      ],
    },
    {
      section: tn("billing"),
      href: "/settings/billing",
      items: [
        {
          title: tb("subscription"),
          hash: "subscription",
          icon: <CreditCard className={iconClass} />,
        },
      ],
    },
    {
      section: ts("notifications"),
      href: "/settings/notifications",
      items: [
        {
          title: tn("notificationPreferences"),
          hash: "email",
          icon: <Bell className={iconClass} />,
        },
      ],
    },
    {
      section: tc("appearance"),
      href: "/settings/appearance",
      items: [
        {
          title: ts("mode"),
          hash: "mode",
          icon: <SunMoon className={iconClass} />,
        },
        {
          title: ts("themes"),
          hash: "theme",
          icon: <Palette className={iconClass} />,
        },
        {
          title: ts("radius"),
          hash: "radius",
          icon: <Radius className={iconClass} />,
        },
      ],
    },
    {
      section: ts("preferences"),
      href: "/settings/preferences",
      items: [
        {
          title: tc("language"),
          hash: "language",
          icon: <Languages className={iconClass} />,
        },
        {
          title: ts("streamQuality"),
          hash: "stream-quality",
          icon: <Headphones className={iconClass} />,
        },
        {
          title: ts("downloadQuality"),
          hash: "download-quality",
          icon: <DownloadCloud className={iconClass} />,
        },
        {
          title: ts("imageQuality"),
          hash: "image-quality",
          icon: <ImageDown className={iconClass} />,
        },
      ],
    },
  ];
}

export function SideNavbar() {
  const sidebarNavItems = useSettingsNavItems();

  return (
    <nav className="flex flex-col gap-2">
      {sidebarNavItems.map(({ section, href, items }, i) => (
        <React.Fragment key={`${section}-${i}`}>
          <div key={i} className="hidden flex-col gap-2 lg:flex">
            <h3 className="font-semibold drop-shadow-sm dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-lg md:text-xl">
              {section}
            </h3>

            <SideNavItems
              items={items}
              href={href}
              className="flex flex-col gap-0.5"
            />
          </div>

          <Accordion key={section} type="multiple" className="lg:hidden">
            <AccordionItem value={section.toLowerCase()}>
              <AccordionTrigger>
                <h3 className="font-semibold drop-shadow-sm dark:bg-gradient-to-br dark:from-neutral-200 dark:to-neutral-600 dark:bg-clip-text dark:text-transparent sm:text-lg md:text-xl">
                  {section}
                </h3>
              </AccordionTrigger>

              <AccordionContent>
                <SideNavItems
                  items={items}
                  href={href}
                  className="flow-row flex flex-wrap gap-2"
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </React.Fragment>
      ))}
    </nav>
  );
}
