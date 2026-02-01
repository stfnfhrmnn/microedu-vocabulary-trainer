-- Ensure network-related tables exist for family/class/study group features
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "networks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" varchar(100) NOT NULL,
  "type" varchar(20) NOT NULL,
  "invite_code" varchar(7) NOT NULL UNIQUE,
  "owner_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "settings" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamptz DEFAULT now(),
  "archived_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "network_members" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "network_id" uuid NOT NULL REFERENCES "networks"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role" varchar(20) NOT NULL,
  "nickname" varchar(50),
  "visibility" varchar(20) DEFAULT 'visible',
  "join_status" varchar(20) DEFAULT 'active',
  "joined_at" timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS "network_member_idx" ON "network_members" ("network_id", "user_id");

CREATE TABLE IF NOT EXISTS "network_shared_books" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "book_id" uuid NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
  "owner_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "network_id" uuid NOT NULL REFERENCES "networks"("id") ON DELETE CASCADE,
  "permissions" varchar(20) DEFAULT 'copy',
  "copy_count" integer DEFAULT 0,
  "shared_at" timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "book_copies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "original_book_id" uuid REFERENCES "books"("id") ON DELETE SET NULL,
  "copied_book_id" uuid NOT NULL REFERENCES "books"("id") ON DELETE CASCADE,
  "copied_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "copied_from_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "copied_at" timestamptz DEFAULT now()
);
