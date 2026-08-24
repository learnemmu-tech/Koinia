"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Clipboard, Facebook, Mail, Twitter } from "lucide-react";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { Icons } from "./icons";
import { DropdownMenuItem } from "./ui/dropdown-menu";

type ShareOptionsProps = React.ComponentProps<"div"> & {
  isDropDownItem?: boolean;
};

type ShareOption = {
  label: string;
  href?: string;
  icon: React.FC<{ className: string }>;
};

function getShareUrl(pathname: string) {
  return `${siteConfig.url}${pathname}`;
}

const shareOptions: ShareOption[] = [
  {
    label: "Copy Link",
    icon: ({ className }) => <Clipboard className={className} />,
  },
  {
    label: "WhatsApp",
    icon: ({ className }) => <Icons.WhatsApp className={className} />,
  },
  {
    label: "Telegram",
    icon: ({ className }) => <Icons.Telegram className={className} />,
  },
  {
    label: "Twitter",
    icon: ({ className }) => <Twitter className={className} />,
  },
  {
    label: "Facebook",
    icon: ({ className }) => <Facebook className={className} />,
  },
  {
    label: "Email",
    icon: ({ className }) => <Mail className={className} />,
  },
];

export function ShareOptions({ isDropDownItem, ...props }: ShareOptionsProps) {
  const pathname = usePathname();

  const [isCopied, setIsCopied] = React.useState(false);

  const shareUrl = getShareUrl(pathname);

  function copy() {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  function getHref(label: string) {
    const encoded = encodeURIComponent(shareUrl);

    switch (label) {
      case "WhatsApp":
        return `https://wa.me/?text=${encoded}`;
      case "Telegram":
        return `https://t.me/share/url?url=${encoded}`;
      case "Twitter":
        return `https://twitter.com/intent/tweet?url=${encoded}`;
      case "Facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encoded}`;
      case "Email":
        return `mailto:?body=${encoded}`;
      default:
        return undefined;
    }
  }

  if (isDropDownItem) {
    return (
      <>
        {shareOptions.map(({ label, icon: Icon }) =>
          label === "Copy Link" ?
            <DropdownMenuItem key={label} onClick={copy}>
              <Icon className="mr-2 size-4" />
              {isCopied ? "Copied!" : label}
            </DropdownMenuItem>
          : <DropdownMenuItem key={label} asChild>
              <a href={getHref(label)} target="_blank" rel="noreferrer">
                <Icon className="mr-2 size-4" />
                {label}
              </a>
            </DropdownMenuItem>
        )}
      </>
    );
  }

  return (
    <div {...props} className={cn("grid gap-2", props.className)}>
      {shareOptions.map(({ label, icon: Icon }) =>
        label === "Copy Link" ?
          <button
            key={label}
            type="button"
            onClick={copy}
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent"
          >
            <Icon className="size-4" />
            {isCopied ? "Copied!" : label}
          </button>
        : <a
            key={label}
            href={getHref(label)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent"
          >
            <Icon className="size-4" />
            {label}
          </a>
      )}
    </div>
  );
}
