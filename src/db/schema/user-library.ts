import {
  index,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import {
  favoriteItemTypeEnum,
  recentlyViewedItemTypeEnum,
} from "./enums";
import { users } from "./tenants";

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemType: favoriteItemTypeEnum("item_type").notNull(),
    itemId: uuid("item_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("favorites_user_item_unique").on(
      table.userId,
      table.itemType,
      table.itemId
    ),
    index("favorites_user_id_created_at_idx").on(table.userId, table.createdAt),
  ]
);

export const recentlyViewed = pgTable(
  "recently_viewed",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemType: recentlyViewedItemTypeEnum("item_type").notNull(),
    itemId: uuid("item_id").notNull(),
    viewedAt: timestamp("viewed_at", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("recently_viewed_user_item_unique").on(
      table.userId,
      table.itemType,
      table.itemId
    ),
    index("recently_viewed_user_id_viewed_at_idx").on(
      table.userId,
      table.viewedAt
    ),
  ]
);
