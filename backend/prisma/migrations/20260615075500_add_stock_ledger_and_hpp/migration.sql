-- CreateEnum
CREATE TYPE "MutationType" AS ENUM ('SALE', 'RESTOCK', 'ADJUSTMENT_PLUS', 'ADJUSTMENT_MINUS', 'RETURN');

-- AlterTable
ALTER TABLE "transaction_items" ADD COLUMN     "costAtTransaction" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "stock_ledgers" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "type" "MutationType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "stockBefore" INTEGER NOT NULL,
    "stockAfter" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_ledgers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "stock_ledgers" ADD CONSTRAINT "stock_ledgers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledgers" ADD CONSTRAINT "stock_ledgers_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_ledgers" ADD CONSTRAINT "stock_ledgers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
