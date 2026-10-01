import type { TemplatePages } from "@/lib/templates/types";
import { HeritageMemberGate } from "@/templates/heritage/components/heritage-member-gate";
import { HeritageShell } from "@/templates/heritage/components/heritage-shell";
import { HeritageAboutPage } from "@/templates/heritage/pages/about";
import { HeritageArticleDetailPage } from "@/templates/heritage/pages/article-detail";
import { HeritageContactPage, HeritagePrayerPage } from "@/templates/heritage/pages/contact";
import { HeritageEventDetailPage, HeritageEventsPage } from "@/templates/heritage/pages/events";
import { HeritageGiveDetailPage, HeritageGivePage } from "@/templates/heritage/pages/give";
import { HeritageHomePage } from "@/templates/heritage/pages/home";
import { HeritageArticlesPage, HeritageMinistriesPage } from "@/templates/heritage/pages/ministries";
import { HeritageSermonDetailPage } from "@/templates/heritage/pages/sermon-detail";
import { HeritageSermonsPage } from "@/templates/heritage/pages/sermons";
import { HeritageVideosPage } from "@/templates/heritage/pages/videos";

export const heritagePages: TemplatePages = {
  Shell: HeritageShell,
  Home: HeritageHomePage,
  About: HeritageAboutPage,
  Sermons: HeritageSermonsPage,
  SermonDetail: HeritageSermonDetailPage,
  Events: HeritageEventsPage,
  EventDetail: HeritageEventDetailPage,
  Ministries: HeritageMinistriesPage,
  Articles: HeritageArticlesPage,
  ArticleDetail: HeritageArticleDetailPage,
  Videos: HeritageVideosPage,
  Give: HeritageGivePage,
  GiveDetail: HeritageGiveDetailPage,
  Contact: HeritageContactPage,
  Prayer: HeritagePrayerPage,
  MemberGate: HeritageMemberGate,
};
