import { PrismaClient, POSstatus, TransactionStatus, MutationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai seeding data Transaksi Pembelian & Penjualan (Bulan Agustus 2026) untuk owner@tokoutama.com...');

  // 1. Ambil User Owner & Tenant
  const user = await prisma.user.findUnique({
    where: { email: 'owner@tokoutama.com' },
    include: {
      tenant: true,
      userOutlets: { include: { outlet: true } }
    }
  });

  if (!user || !user.tenantId || !user.tenant) {
    throw new Error('User owner@tokoutama.com atau Tenant [Toko Utama] tidak ditemukan. Jalankan seed utama terlebih dahulu.');
  }

  const tenantId: string = user.tenantId;
  const userId: string = user.id;
  const outletId: string = user.userOutlets[0]?.outletId || 'outlet-default-uuid-111';

  console.log(`🏢 Tenant: ${user.tenant.name} (${tenantId})`);
  console.log(`👤 User: ${user.name} (${userId})`);
  console.log(`🏪 Outlet ID: ${outletId}`);

  // 2. Ambil Produk & Pelanggan
  const products = await prisma.product.findMany({
    where: { tenantId }
  });

  if (products.length === 0) {
    throw new Error('Tidak ada produk ditemukan untuk tenant. Seeding produk terlebih dahulu.');
  }

  const customers = await prisma.customer.findMany({
    where: { tenantId }
  });

  // 3. Seed Supplier untuk Toko Utama
  const suppliersData = [
    {
      id: 'sup-food-001',
      tenantId,
      name: 'PT Food & Beverage Supplier',
      contactName: 'Pak Hendra',
      phone: '081234567890',
      email: 'hendra@foodsupplier.co.id',
      address: 'Jl. Industri Bahan Pangan No. 45, Jakarta',
    },
    {
      id: 'sup-sembako-002',
      tenantId,
      name: 'CV Sembako Jaya',
      contactName: 'Bu Rina',
      phone: '081987654321',
      email: 'rina@sembakojaya.com',
      address: 'Gudang Grosir No. 12, Bandung',
    },
    {
      id: 'sup-kopi-003',
      tenantId,
      name: 'PT Kopi Nusantara',
      contactName: 'Pak Anton',
      phone: '085678901234',
      email: 'anton@kopinusantara.id',
      address: 'Kawasan Industri Roastery No. 8, Surabaya',
    },
  ];

  const seededSuppliers: any[] = [];
  for (const s of suppliersData) {
    const sup = await prisma.supplier.upsert({
      where: { id: s.id },
      update: { name: s.name, contactName: s.contactName, phone: s.phone },
      create: s,
    });
    seededSuppliers.push(sup);
  }
  console.log(`🚚 ${seededSuppliers.length} Supplier berhasil di-seed.`);

  // 4. SEED TRANSAKSI PEMBELIAN (PURCHASE ORDERS / STOK MASUK) - BULAN AGUSTUS 2026
  console.log('📦 Seeding Transaksi Pembelian (Purchase Orders)...');

  const purchaseOrderConfigs = [
    {
      poNumber: 'PO-20260802-001',
      day: 2,
      supplier: seededSuppliers[2], // PT Kopi Nusantara
      status: POSstatus.RECEIVED,
      items: [
        { product: products.find(p => p.sku === 'PROD-001') || products[0], qty: 100 },
        { product: products.find(p => p.sku === 'PROD-005') || products[1], qty: 50 },
      ]
    },
    {
      poNumber: 'PO-20260805-002',
      day: 5,
      supplier: seededSuppliers[0], // PT Food & Beverage
      status: POSstatus.RECEIVED,
      items: [
        { product: products.find(p => p.sku === 'PROD-002') || products[1], qty: 80 },
        { product: products.find(p => p.sku === 'PROD-003') || products[2], qty: 60 },
      ]
    },
    {
      poNumber: 'PO-20260809-003',
      day: 9,
      supplier: seededSuppliers[1], // CV Sembako Jaya
      status: POSstatus.RECEIVED,
      items: [
        { product: products.find(p => p.sku === 'PROD-004') || products[3], qty: 200 },
      ]
    },
    {
      poNumber: 'PO-20260814-004',
      day: 14,
      supplier: seededSuppliers[2], // PT Kopi Nusantara
      status: POSstatus.RECEIVED,
      items: [
        { product: products.find(p => p.sku === 'PROD-001') || products[0], qty: 120 },
        { product: products.find(p => p.sku === 'PROD-005') || products[4], qty: 60 },
      ]
    },
    {
      poNumber: 'PO-20260818-005',
      day: 18,
      supplier: seededSuppliers[0], // PT Food & Beverage
      status: POSstatus.RECEIVED,
      items: [
        { product: products.find(p => p.sku === 'PROD-002') || products[1], qty: 100 },
        { product: products.find(p => p.sku === 'PROD-003') || products[2], qty: 70 },
      ]
    },
    {
      poNumber: 'PO-20260822-006',
      day: 22,
      supplier: seededSuppliers[1], // CV Sembako Jaya
      status: POSstatus.RECEIVED,
      items: [
        { product: products.find(p => p.sku === 'PROD-004') || products[3], qty: 250 },
      ]
    },
    {
      poNumber: 'PO-20260826-007',
      day: 26,
      supplier: seededSuppliers[2], // PT Kopi Nusantara
      status: POSstatus.RECEIVED,
      items: [
        { product: products.find(p => p.sku === 'PROD-001') || products[0], qty: 150 },
      ]
    },
    {
      poNumber: 'PO-20260829-008',
      day: 29,
      supplier: seededSuppliers[0], // PT Food & Beverage
      status: POSstatus.RECEIVED,
      items: [
        { product: products.find(p => p.sku === 'PROD-003') || products[2], qty: 50 },
        { product: products.find(p => p.sku === 'PROD-005') || products[4], qty: 40 },
      ]
    },
    {
      poNumber: 'PO-20260831-009',
      day: 31,
      supplier: seededSuppliers[1], // CV Sembako Jaya
      status: POSstatus.ORDERED,
      items: [
        { product: products.find(p => p.sku === 'PROD-002') || products[1], qty: 60 },
      ]
    },
  ];

  let poCount = 0;
  for (const poConf of purchaseOrderConfigs) {
    const poDate = new Date(2026, 7, poConf.day, 10, 30, 0); // 7 = August (0-indexed)

    // Hitung total amount
    let totalAmount = 0;
    const itemRecords = poConf.items.map(it => {
      const costPrice = Number(it.product.purchasePrice);
      const subTotal = costPrice * it.qty;
      totalAmount += subTotal;
      return {
        productId: it.product.id,
        quantity: it.qty,
        costPrice,
        subTotal,
      };
    });

    // Check exist
    const existingPO = await prisma.purchaseOrder.findUnique({
      where: {
        tenantId_poNumber: {
          tenantId,
          poNumber: poConf.poNumber,
        }
      }
    });

    if (existingPO) {
      console.log(`⏩ PO ${poConf.poNumber} sudah ada, melewatinya.`);
      continue;
    }

    const createdPO = await prisma.purchaseOrder.create({
      data: {
        tenantId,
        supplierId: poConf.supplier.id,
        poNumber: poConf.poNumber,
        status: poConf.status,
        totalAmount,
        outletId,
        createdById: userId,
        expectedDate: poDate,
        recievedDate: poConf.status === POSstatus.RECEIVED ? poDate : null,
        createdAt: poDate,
        updatedAt: poDate,
        items: {
          create: itemRecords,
        }
      }
    });

    // Jika status RECEIVED, tambahkan stok ke OutletStock dan catat ke StockLedger
    if (poConf.status === POSstatus.RECEIVED) {
      for (const it of itemRecords) {
        // Ambil stok saat ini
        const outletStock = await prisma.outletStock.findUnique({
          where: {
            outletId_productId: {
              outletId,
              productId: it.productId,
            }
          }
        });

        const currentStock = outletStock ? outletStock.stock : 0;
        const newStock = currentStock + it.quantity;

        // Upsert OutletStock
        await prisma.outletStock.upsert({
          where: {
            outletId_productId: {
              outletId,
              productId: it.productId,
            }
          },
          update: {
            stock: newStock,
          },
          create: {
            tenantId,
            outletId,
            productId: it.productId,
            stock: newStock,
          }
        });

        // Catat di StockLedger
        await prisma.stockLedger.create({
          data: {
            tenantId,
            productId: it.productId,
            userId,
            outletId,
            purchaseOrderId: createdPO.id,
            type: MutationType.RESTOCK,
            quantity: it.quantity,
            stockBefore: currentStock,
            stockAfter: newStock,
            note: `Restock dari Transaksi Pembelian PO (${poConf.poNumber})`,
            createdAt: poDate,
          }
        });
      }
    }

    poCount++;
  }

  console.log(`✅ ${poCount} Transaksi Pembelian (Purchase Orders) Agustus 2026 berhasil di-seed!`);

  // 5. SEED TRANSAKSI PENJUALAN (SALES TRANSACTIONS / POS) - BULAN AGUSTUS 2026
  console.log('🛒 Seeding Transaksi Penjualan (POS Checkout Transactions)...');

  let txCount = 0;
  // Buat transaksi penjualan yang tersebar sepanjang bulan Agustus 2026
  for (let day = 1; day <= 31; day++) {
    const transactionsPerDay = (day % 3) + 1; // 1-3 transaksi per hari

    for (let t = 1; t <= transactionsPerDay; t++) {
      const invoiceNumber = `INV-202608${day.toString().padStart(2, '0')}-${t.toString().padStart(3, '0')}`;
      const txDate = new Date(2026, 7, day, 8 + (t * 3), 15 + (t * 10), 0); // Agustus 2026

      const existingTx = await prisma.transaction.findUnique({
        where: {
          tenantId_invoiceNumber: {
            tenantId,
            invoiceNumber,
          }
        }
      });

      if (existingTx) {
        continue;
      }

      // Pilih 1 - 3 produk secara acak/berurutan
      const prodIndex1 = (day + t) % products.length;
      const prodIndex2 = (day + t + 2) % products.length;
      const selectedProducts = [products[prodIndex1]];
      if (t % 2 === 0 && prodIndex1 !== prodIndex2) {
        selectedProducts.push(products[prodIndex2]);
      }

      let subTotal = 0;
      const itemsData = selectedProducts.map(p => {
        const qty = (t % 2) + 1;
        const price = Number(p.sellingPrice);
        const cost = Number(p.purchasePrice);
        const itemSubtotal = price * qty;
        subTotal += itemSubtotal;
        return {
          productId: p.id,
          quantity: qty,
          priceAtTransaction: price,
          costAtTransaction: cost,
          subtotal: itemSubtotal,
        };
      });

      const discount = day % 5 === 0 ? 5000 : 0;
      const tax = Math.round((subTotal - discount) * 0.1);
      const grandTotal = subTotal - discount + tax;
      const paymentMethod = t % 2 === 0 ? 'QRIS' : 'CASH';
      const customer = customers.length > 0 ? customers[(day + t) % customers.length] : null;

      const createdTx = await prisma.transaction.create({
        data: {
          tenantId,
          userId,
          outletId,
          invoiceNumber,
          subTotal,
          discount,
          tax,
          grandTotal,
          paymentMethod,
          status: TransactionStatus.COMPLETED,
          customerId: customer?.id || null,
          createdAt: txDate,
          items: {
            create: itemsData
          },
          payments: {
            create: [
              {
                paymentMethod,
                amount: grandTotal,
                createdAt: txDate,
              }
            ]
          }
        }
      });

      // Potong stok dan catat StockLedger (SALE)
      for (const it of itemsData) {
        const outletStock = await prisma.outletStock.findUnique({
          where: {
            outletId_productId: {
              outletId,
              productId: it.productId,
            }
          }
        });

        const currentStock = outletStock ? outletStock.stock : 50;
        const newStock = Math.max(0, currentStock - it.quantity);

        await prisma.outletStock.upsert({
          where: {
            outletId_productId: {
              outletId,
              productId: it.productId,
            }
          },
          update: { stock: newStock },
          create: { tenantId, outletId, productId: it.productId, stock: newStock }
        });

        await prisma.stockLedger.create({
          data: {
            tenantId,
            productId: it.productId,
            userId,
            outletId,
            transactionId: createdTx.id,
            type: MutationType.SALE,
            quantity: -it.quantity,
            stockBefore: currentStock,
            stockAfter: newStock,
            note: `Penjualan POS Invoice #${invoiceNumber}`,
            createdAt: txDate,
          }
        });
      }

      txCount++;
    }
  }

  console.log(`✅ ${txCount} Transaksi Penjualan (Sales Transactions) Agustus 2026 berhasil di-seed!`);
  console.log('🎉 Seeding data transaksi pembelian & penjualan bulan Agustus 2026 selesai dengan sukses!');
}

main()
  .catch((e) => {
    console.error('❌ Terjadi kesalahan saat seeding transaksi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
