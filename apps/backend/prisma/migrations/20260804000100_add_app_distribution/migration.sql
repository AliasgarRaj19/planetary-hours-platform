CREATE TYPE "AppPlatform" AS ENUM ('android');

CREATE TYPE "AppDistributionMode" AS ENUM ('direct_apk', 'google_play');

CREATE TABLE "AppDistribution" (
    "id" SERIAL NOT NULL,
    "platform" "AppPlatform" NOT NULL,
    "activeMode" "AppDistributionMode" NOT NULL,
    "storeUrl" TEXT,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppDistribution_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppDistributionArtifact" (
    "id" SERIAL NOT NULL,
    "distributionId" INTEGER NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "publicUrl" TEXT NOT NULL,
    "checksumSha256" TEXT NOT NULL,
    "versionName" TEXT,
    "versionCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppDistributionArtifact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AppDistribution_platform_key" ON "AppDistribution"("platform");

CREATE INDEX "AppDistributionArtifact_distributionId_createdAt_idx" ON "AppDistributionArtifact"("distributionId", "createdAt");

ALTER TABLE "AppDistributionArtifact" ADD CONSTRAINT "AppDistributionArtifact_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "AppDistribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "AppDistribution" ("platform", "activeMode", "storeUrl", "isEnabled", "updatedAt")
VALUES ('android', 'direct_apk', NULL, true, CURRENT_TIMESTAMP)
ON CONFLICT ("platform") DO NOTHING;

INSERT INTO "AppDistributionArtifact" (
    "distributionId",
    "fileName",
    "originalFileName",
    "mimeType",
    "sizeBytes",
    "storagePath",
    "publicUrl",
    "checksumSha256",
    "versionName",
    "versionCode"
)
SELECT
    "id",
    'planetary-hours-1.0.3-build6.apk',
    'planetary-hours-1.0.3-build6.apk',
    'application/vnd.android.package-archive',
    0,
    '',
    'https://planetaryhours.in/downloads/planetary-hours-1.0.3-build6.apk',
    '',
    '1.0.3',
    7
FROM "AppDistribution"
WHERE "platform" = 'android'
  AND NOT EXISTS (
    SELECT 1
    FROM "AppDistributionArtifact"
    WHERE "distributionId" = "AppDistribution"."id"
  );
