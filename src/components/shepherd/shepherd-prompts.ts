import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Church,
  Compass,
  HeartHandshake,
  HelpCircle,
  Lightbulb,
  MessageSquareHeart,
  Sparkles,
  Users,
  UserRound,
} from "lucide-react";

import type { ShepherdAudienceMode } from "@/lib/shepherd/validation";

export type ShepherdPrompt = {
  id: string;
  label: string;
  description: string;
  prompt: string;
  icon: LucideIcon;
};

export const MINISTRY_PROMPTS: ShepherdPrompt[] = [
  {
    id: "sermon",
    label: "Prepare a Sermon",
    description: "Build a clear outline with Scripture.",
    prompt: "Help me prepare a sermon outline about faith. Include Scripture.",
    icon: Church,
  },
  {
    id: "ten-min",
    label: "10-Minute Message",
    description: "Prepare a short message quickly.",
    prompt:
      "Give me a 10-minute message about David that I can share with a congregation.",
    icon: MessageSquareHeart,
  },
  {
    id: "bible-study",
    label: "Bible Study",
    description: "Shape a small-group study plan.",
    prompt: "Create a Bible study outline about Joseph for a small group.",
    icon: BookOpen,
  },
  {
    id: "character",
    label: "Bible Character",
    description: "Explore a life and leadership lesson.",
    prompt: "Who was Moses, and what can leaders learn from his life?",
    icon: UserRound,
  },
  {
    id: "topics",
    label: "Find a Sermon Topic",
    description: "Discover focused preaching ideas.",
    prompt:
      "Suggest five sermon topics about prayer with a key Scripture for each.",
    icon: Lightbulb,
  },
  {
    id: "prayer",
    label: "Prepare a Prayer",
    description: "Write a congregational prayer.",
    prompt: "Prepare a short congregational prayer about faith and unity.",
    icon: HeartHandshake,
  },
  {
    id: "youth",
    label: "Youth Message",
    description: "Speak to young believers clearly.",
    prompt: "Prepare a 15-minute youth message about forgiveness.",
    icon: Users,
  },
  {
    id: "family",
    label: "Family Message",
    description: "Share a family-friendly word.",
    prompt: "Prepare a short family-friendly message about trusting God.",
    icon: Sparkles,
  },
];

export const MEMBER_PROMPTS: ShepherdPrompt[] = [
  {
    id: "understand",
    label: "Understand Scripture",
    description: "Read a passage with clarity.",
    prompt: "Help me understand Romans 8 in plain language.",
    icon: BookOpen,
  },
  {
    id: "ask",
    label: "Ask a Bible Question",
    description: "Get a thoughtful biblical answer.",
    prompt: "Why did David spare Saul when he had the chance to harm him?",
    icon: HelpCircle,
  },
  {
    id: "character",
    label: "Bible Character",
    description: "Learn from a biblical life story.",
    prompt: "Who was Joseph in the Bible, and what does his story teach?",
    icon: UserRound,
  },
  {
    id: "verses",
    label: "Find Bible Verses",
    description: "Gather verses for a need.",
    prompt: "Give me Bible verses about forgiveness with brief explanations.",
    icon: Compass,
  },
  {
    id: "pray",
    label: "Help Me Pray",
    description: "Find words for personal prayer.",
    prompt: "Help me prepare a personal prayer about faith and courage.",
    icon: HeartHandshake,
  },
  {
    id: "devotional",
    label: "Devotional",
    description: "A short daily reflection.",
    prompt: "Give me a short daily devotion about trusting God.",
    icon: Sparkles,
  },
  {
    id: "grow",
    label: "Grow in Faith",
    description: "Practical encouragement from Scripture.",
    prompt: "How does the Bible encourage someone who feels afraid?",
    icon: Lightbulb,
  },
];

export function promptsForMode(mode: ShepherdAudienceMode): ShepherdPrompt[] {
  return mode === "ministry" ? MINISTRY_PROMPTS : MEMBER_PROMPTS;
}
