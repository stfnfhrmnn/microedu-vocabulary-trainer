-- Make section/chapter fields optional to support unsorted vocab items
ALTER TABLE "vocabulary_items"
  ALTER COLUMN "section_id" DROP NOT NULL,
  ALTER COLUMN "chapter_id" DROP NOT NULL,
  ALTER COLUMN "local_section_id" DROP NOT NULL,
  ALTER COLUMN "local_chapter_id" DROP NOT NULL;
