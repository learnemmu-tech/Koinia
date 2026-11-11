CREATE TABLE IF NOT EXISTS "content_likes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "item_type" text NOT NULL,
  "item_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "content_likes_user_item_unique" UNIQUE ("user_id", "item_type", "item_id"),
  CONSTRAINT "content_likes_user_id_users_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "content_likes_item_idx"
  ON "content_likes" ("item_type", "item_id");
