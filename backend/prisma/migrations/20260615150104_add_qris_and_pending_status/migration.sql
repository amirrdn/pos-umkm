-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "qrisUrl" TEXT;
