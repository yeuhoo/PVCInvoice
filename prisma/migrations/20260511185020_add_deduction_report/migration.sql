-- CreateEnum
CREATE TYPE "DeductionReportStatus" AS ENUM ('DRAFT', 'SUBMITTED');

-- CreateTable
CREATE TABLE "DeductionReport" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "template" TEXT NOT NULL,
    "title" TEXT,
    "status" "DeductionReportStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeductionReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionReportRow" (
    "id" SERIAL NOT NULL,
    "reportId" INTEGER NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "employeeNum" TEXT NOT NULL DEFAULT '',
    "dedCode" TEXT NOT NULL DEFAULT '',
    "startDate" TEXT NOT NULL DEFAULT '',
    "endDate" TEXT NOT NULL DEFAULT '',
    "rate" TEXT NOT NULL DEFAULT '',
    "amount" TEXT NOT NULL DEFAULT '',
    "payeeReference" TEXT NOT NULL DEFAULT '',
    "goalAmount" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "DeductionReportRow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeductionReport_clientId_idx" ON "DeductionReport"("clientId");

-- CreateIndex
CREATE INDEX "DeductionReport_createdById_idx" ON "DeductionReport"("createdById");

-- CreateIndex
CREATE INDEX "DeductionReport_status_idx" ON "DeductionReport"("status");

-- CreateIndex
CREATE INDEX "DeductionReportRow_reportId_idx" ON "DeductionReportRow"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "DeductionReportRow_reportId_rowIndex_key" ON "DeductionReportRow"("reportId", "rowIndex");

-- AddForeignKey
ALTER TABLE "DeductionReport" ADD CONSTRAINT "DeductionReport_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionReport" ADD CONSTRAINT "DeductionReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionReport" ADD CONSTRAINT "DeductionReport_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionReportRow" ADD CONSTRAINT "DeductionReportRow_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "DeductionReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
