import type { TemplatePages } from "@/lib/templates/types";
import { ParishShell } from "@/templates/parish/components/parish-shell";
import { ParishHomePage } from "@/templates/parish/pages/home";
import {
  ParishAboutPage,
  ParishArticleDetailPage,
  ParishArticlesPage,
  ParishContactPage,
  ParishEventDetailPage,
  ParishEventsPage,
  ParishGiveDetailPage,
  ParishGivePage,
  ParishMemberGate,
  ParishMinistriesPage,
  ParishPrayerPage,
  ParishSermonDetailPage,
  ParishSermonsPage,
  ParishVideosPage,
} from "@/templates/parish/pages/site";

export const parishPages: TemplatePages = {
  Shell: ParishShell,
  Home: ParishHomePage,
  About: ParishAboutPage,
  Sermons: ParishSermonsPage,
  SermonDetail: ParishSermonDetailPage,
  Events: ParishEventsPage,
  EventDetail: ParishEventDetailPage,
  Ministries: ParishMinistriesPage,
  Articles: ParishArticlesPage,
  ArticleDetail: ParishArticleDetailPage,
  Videos: ParishVideosPage,
  Give: ParishGivePage,
  GiveDetail: ParishGiveDetailPage,
  Contact: ParishContactPage,
  Prayer: ParishPrayerPage,
  MemberGate: ParishMemberGate,
};
