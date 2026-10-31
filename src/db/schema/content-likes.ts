import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "./tenants";

export const contentLikes = pgTable(
  "content_likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(),
    itemId: uuid("item_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("content_likes_user_item_unique").on(
      table.userId,
      table.itemType,
      table.itemId
    ),
    index("content_likes_item_idx").on(table.itemType, table.itemId),
  ]
);
