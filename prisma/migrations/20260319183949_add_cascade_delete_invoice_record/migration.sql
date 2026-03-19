-- DropForeignKey
ALTER TABLE "InvoiceRecord" DROP CONSTRAINT "InvoiceRecord_invoiceId_fkey";

-- AddForeignKey
ALTER TABLE "InvoiceRecord" ADD CONSTRAINT "InvoiceRecord_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
