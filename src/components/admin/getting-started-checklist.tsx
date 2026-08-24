"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  HeartHandshake,
  ListMusic,
  Mic2,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAdminAnalytics } from "@/hooks/use-admin-analytics";
import { useOrganization } from "@/context/organization-context";
import { adminSectionClass } from "@/lib/responsive-classes";
import { cn } from "@/lib/utils";

type OnboardingTask = {
  id: string;
  title: string;
  description: string;
  done: boolean;
  href: string;
  cta: string;
  icon: LucideIcon;
  accent: string;
};

export function GettingStartedChecklist() {
  const analytics = useAdminAnalytics();
  const { branchesByChurch } = useOrganization();
  const hasChurch = Object.values(branchesByChurch).flat().length > 0;

  const tasks: OnboardingTask[] = [
    {
      id: "church",
      title: "Church created",
      description: "Your ministry workspace is live and ready to customize.",
      done: hasChurch,
      href: "/dashboard/organization?tab=churches",
      cta: hasChurch ? "View" : "Create",
      icon: CheckCircle2,
      accent: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20",
    },
    {
      id: "sermon",
      title: "Create your first sermon",
      description: "Share messages with your congregation online.",
      done: analytics.counts.sermons > 0,
      href: "/dashboard/content?tab=sermons",
      cta: "Create",
      icon: Mic2,
      accent: "from-violet-500/10 to-violet-500/5 border-violet-500/20",
    },
    {
      id: "song",
      title: "Upload your first song",
      description: "Build your worship library for your community.",
      done: analytics.counts.songs > 0,
      href: "/dashboard/content?tab=songs",
      cta: "Upload",
      icon: ListMusic,
      accent: "from-blue-500/10 to-blue-500/5 border-blue-500/20",
    },
    {
      id: "article",
      title: "Publish your first article",
      description: "Share devotionals, news, and ministry updates.",
      done: analytics.counts.articles > 0,
      href: "/dashboard/content?tab=articles",
      cta: "Publish",
      icon: BookOpen,
      accent: "from-amber-500/10 to-amber-500/5 border-amber-500/20",
    },
    {
      id: "event",
      title: "Create your first event",
      description: "Promote services, gatherings, and special occasions.",
      done: analytics.counts.events > 0,
      href: "/dashboard/content?tab=events",
      cta: "Create",
      icon: CalendarDays,
      accent: "from-orange-500/10 to-orange-500/5 border-orange-500/20",
    },
    {
      id: "donations",
      title: "Configure donations",
      description: "Set up campaigns so supporters can give online.",
      done: analytics.counts.donations > 0,
      href: "/dashboard/content?tab=donations",
      cta: "Configure",
      icon: HeartHandshake,
      accent: "from-rose-500/10 to-rose-500/5 border-rose-500/20",
    },
    {
      id: "invite",
      title: "Invite team members",
      description: "Bring pastors, volunteers, and staff into your workspace.",
      done: analytics.counts.users > 1,
      href: "/dashboard/organization?tab=invitations",
      cta: "Invite",
      icon: Users,
      accent: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20",
    },
  ];

  const completedCount = tasks.filter((t) => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);
  const allDone = completedCount === tasks.length;
  const pendingTasks = tasks.filter((t) => !t.done);

  if (allDone) return null;

  return (
    <section className={cn("space-y-4", adminSectionClass)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Get started
          </h2>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {tasks.length} complete — pick up where you left off.
          </p>
        </div>
        <div className="w-full sm:max-w-xs">
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {pendingTasks.map((task) => {
          const Icon = task.icon;
          return (
            <Card
              key={task.id}
              className={cn(
                "group relative overflow-hidden border bg-gradient-to-br transition-shadow hover:shadow-md",
                task.accent
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-background/80 shadow-sm">
                    <Icon className="size-5 text-foreground" />
                  </div>
                  {task.done ? (
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  ) : null}
                </div>
                <CardTitle className="text-base">{task.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {task.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button asChild size="sm" className="gap-1.5">
                  <Link href={task.href}>
                    {task.cta}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
