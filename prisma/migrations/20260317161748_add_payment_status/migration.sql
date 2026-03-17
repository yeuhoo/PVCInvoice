-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('ReceivedPayment', 'InvoiceReady', 'BilledAlready', 'InvoiceSent', 'InitialBilling', 'SampleOnly', 'Cancel', 'ACH', 'CancelAndIssueNew', 'PleaseBill', 'ACHReturn', 'BilledNeedsMonthlyStatement', 'BilledButDidntCharge', 'FCACH', 'CreditCard');

-- AlterTable
ALTER TABLE "InvoiceRecord" ADD COLUMN     "paymentStatus" "PaymentStatus";
