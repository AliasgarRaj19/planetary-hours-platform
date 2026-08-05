CREATE TYPE "BlogArticleStatus" AS ENUM ('draft', 'published', 'unpublished');

CREATE TABLE "BlogCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogArticle" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "bodyMarkdown" TEXT NOT NULL DEFAULT '',
    "status" "BlogArticleStatus" NOT NULL DEFAULT 'draft',
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlogArticle_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BlogArticleCategory" (
    "articleId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,

    CONSTRAINT "BlogArticleCategory_pkey" PRIMARY KEY ("articleId","categoryId")
);

CREATE UNIQUE INDEX "BlogCategory_slug_key" ON "BlogCategory"("slug");

CREATE INDEX "BlogCategory_slug_idx" ON "BlogCategory"("slug");

CREATE UNIQUE INDEX "BlogArticle_slug_key" ON "BlogArticle"("slug");

CREATE INDEX "BlogArticle_status_publishedAt_idx" ON "BlogArticle"("status", "publishedAt");

CREATE INDEX "BlogArticle_slug_idx" ON "BlogArticle"("slug");

CREATE INDEX "BlogArticleCategory_categoryId_idx" ON "BlogArticleCategory"("categoryId");

ALTER TABLE "BlogArticleCategory" ADD CONSTRAINT "BlogArticleCategory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "BlogArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlogArticleCategory" ADD CONSTRAINT "BlogArticleCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "BlogCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
