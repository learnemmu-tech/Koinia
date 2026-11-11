DO $$ BEGIN
  CREATE TYPE "stored_object_visibility" AS ENUM ('public_read', 'private');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "stored_object_status" AS ENUM ('pending', 'ready', 'failed', 'deleting');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "stored_object_purpose" AS ENUM ('image', 'audio', 'video');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "stored_objects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "church_id" uuid NOT NULL,
  "uploaded_by" uuid,
  "object_key" text NOT NULL,
  "original_filename" text NOT NULL,
  "mime_type" text NOT NULL,
  "extension" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "sha256" text,
  "visibility" "stored_object_visibility" NOT NULL,
  "status" "stored_object_status" DEFAULT 'pending' NOT NULL,
  "purpose" "stored_object_purpose" NOT NULL,
  "published" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "ready_at" timestamptz,
  CONSTRAINT "stored_objects_object_key_unique" UNIQUE ("object_key"),
  CONSTRAINT "stored_objects_church_organization_fk"
    FOREIGN KEY ("church_id", "organization_id")
    REFERENCES "churches" ("id", "organization_id") ON DELETE restrict,
  CONSTRAINT "stored_objects_uploaded_by_users_id_fk"
    FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE set null,
  CONSTRAINT "stored_objects_private_not_published"
    CHECK (visibility = 'public_read' OR published = false)
);

CREATE INDEX IF NOT EXISTS "stored_objects_church_id_status_idx"
  ON "stored_objects" ("church_id", "status");
CREATE INDEX IF NOT EXISTS "stored_objects_organization_id_church_id_idx"
  ON "stored_objects" ("organization_id", "church_id");
