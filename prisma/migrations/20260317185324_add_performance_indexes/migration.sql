-- CreateIndex
CREATE INDEX "Invoice_clientId_idx" ON "Invoice"("clientId");

-- CreateIndex
CREATE INDEX "Invoice_createdById_idx" ON "Invoice"("createdById");

-- CreateIndex
CREATE INDEX "Invoice_createdAt_idx" ON "Invoice"("createdAt");

-- CreateIndex
CREATE INDEX "Invoice_brokerId_idx" ON "Invoice"("brokerId");

-- CreateIndex
CREATE INDEX "InvoiceRecord_status_idx" ON "InvoiceRecord"("status");

-- CreateIndex
CREATE INDEX "InvoiceRecord_paymentStatus_idx" ON "InvoiceRecord"("paymentStatus");

-- CreateIndex
CREATE INDEX "InvoiceRecord_createdById_idx" ON "InvoiceRecord"("createdById");

-- CreateIndex
CREATE INDEX "InvoiceRecord_updatedById_idx" ON "InvoiceRecord"("updatedById");
