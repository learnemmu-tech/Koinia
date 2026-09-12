import { z } from "zod";

export const shepherdChatRoleSchema = z.enum(["user", "assistant"]);

export const shepherdChatMessageSchema = z.object({
  role: shepherdChatRoleSchema,
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty.")
    .max(4000, "Message is too long."),
});

export const shepherdChatRequestSchema = z.object({
  messages: z
    .array(shepherdChatMessageSchema)
    .min(1, "At least one message is required.")
    .max(24, "Conversation is too long for this request."),
});

export type ShepherdChatMessage = z.infer<typeof shepherdChatMessageSchema>;
export type ShepherdChatRequest = z.infer<typeof shepherdChatRequestSchema>;

export type ShepherdAudienceMode = "ministry" | "member";
