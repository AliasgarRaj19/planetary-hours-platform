-- CreateTable
CREATE TABLE "PlanetaryHourContent" (
    "id" SERIAL NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "hourNumber" INTEGER NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "suggestion" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanetaryHourContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanetaryHourContent_dayOfWeek_hourNumber_key" ON "PlanetaryHourContent"("dayOfWeek", "hourNumber");
