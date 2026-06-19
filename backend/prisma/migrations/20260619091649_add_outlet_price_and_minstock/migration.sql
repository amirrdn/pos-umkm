-- AlterTable
ALTER TABLE "outlet_stocks" ADD COLUMN     "minStock" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "outlet_product_prices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "outlet_product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "outlet_product_prices_outletId_productId_key" ON "outlet_product_prices"("outletId", "productId");

-- AddForeignKey
ALTER TABLE "outlet_product_prices" ADD CONSTRAINT "outlet_product_prices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outlet_product_prices" ADD CONSTRAINT "outlet_product_prices_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "outlets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outlet_product_prices" ADD CONSTRAINT "outlet_product_prices_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
