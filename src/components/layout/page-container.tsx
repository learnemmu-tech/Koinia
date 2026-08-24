import type { ElementType, ReactNode } from "react";

import {
  adminSectionClass,
  pageContentClass,
  pageDetailClass,
  pageNarrowClass,
  pageProseClass,
  pageShellClass,
} from "@/lib/responsive-classes";
import { cn } from "@/lib/utils";

export type PageContainerVariant =
  | "shell"
  | "content"
  | "detail"
  | "prose"
  | "narrow"
  | "admin"
  | "full";

const variantClassMap: Record<PageContainerVariant, string> = {
  shell: pageShellClass,
  content: pageContentClass,
  detail: pageDetailClass,
  prose: pageProseClass,
  narrow: pageNarrowClass,
  admin: adminSectionClass,
  full: "w-full min-w-0",
};

type PageContainerProps = {
  variant?: PageContainerVariant;
  className?: string;
  children: ReactNode;
  as?: ElementType;
};

export function PageContainer({
  variant = "content",
  className,
  children,
  as: Component = "div",
}: PageContainerProps) {
  return (
    <Component className={cn(variantClassMap[variant], className)}>
      {children}
    </Component>
  );
}
