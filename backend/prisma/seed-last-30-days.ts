/// <reference types="node" />
import 'dotenv/config';
import { PrismaClient, POSstatus, TransactionStatus, MutationType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ============================================================================
 * SEEDING SCRIPT: 30-DAY SINGLE-TENANT DEMO TRANSACTIONS
 * ============================================================================
 * Seeds 30-day transactional history, purchase orders, supplier directory,
 * low-stock thresholds, and sales items for demo accounts.
 * ============================================================================
 */
async function main() {
  console.log('🌱 Starting 30-day dummy data seeding (July 3 - August 1, 2026)...');

  /**
   * 1. Retrieve Owner User & Tenant Context
   */
  const targetEmail = process.env.SEED_OWNER_EMAIL || 'owner@example.com';
  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: {
      tenant: true,
      userOutlets: { include: { outlet: true } }
    }
  });

  if (!user || !user.tenantId || !user.tenant) {
    throw new Error(`User ${targetEmail} or associated Tenant not found.`);
  }

  const tenantId: string = user.tenantId;
  const userId: string = user.id;
  const outletId: string = user.userOutlets[0]?.outletId || 'outlet-default-uuid-111';

  console.log(`🏢 Tenant: ${user.tenant.name} (${tenantId})`);
  console.log(`👤 User: ${user.name} (${userId})`);
  console.log(`🏪 Outlet ID: ${outletId}`);

  /**
   * 2. Retrieve Product Catalog & Customer Directory
   */
  const products = await prisma.product.findMany({
    where: { tenantId }
  });

  if (products.length === 0) {
    throw new Error('No products found for tenant.');
  }

  const customers = await prisma.customer.findMany({
    where: { tenantId }
  });

  /**
   * 3. Seed Supplier Records
   */
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

  /**
   * 4. Configure Low Stock Thresholds for Testing Alert Widgets
   */
  console.log('⚠️ Setting low stock thresholds for sample products...');
  if (products.length >= 2) {
    await prisma.outletStock.upsert({
      where: { outletId_productId: { outletId, productId: products[0].id } },
      update: { stock: 4, minStock: 15 },
      create: { tenantId, outletId, productId: products[0].id, stock: 4, minStock: 15 }
    });

    await prisma.outletStock.upsert({
      where: { outletId_productId: { outletId, productId: products[1].id } },
      update: { stock: 3, minStock: 10 },
      create: { tenantId, outletId, productId: products[1].id, stock: 3, minStock: 10 }
    });
  }

  /**
   * 5. Seed Purchase Orders for Restocking History (July & August 2026)
   */
  console.log('📦 Seeding Purchase Orders...');
  const poDates = [
    { day: 5, month: 6, year: 2026, num: 'PO-20260705-001' },
    { day: 12, month: 6, year: 2026, num: 'PO-20260712-002' },
    { day: 19, month: 6, year: 2026, num: 'PO-20260719-003' },
    { day: 26, month: 6, year: 2026, num: 'PO-20260726-004' },
    { day: 1, month: 7, year: 2026, num: 'PO-20260801-005' },
  ];

  for (const p of poDates) {
    const poDate = new Date(p.year, p.month, p.day, 9, 0, 0);
    const supplier = seededSuppliers[p.day % seededSuppliers.length];

    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { tenantId_poNumber: { tenantId, poNumber: p.num } }
    });

    if (!existingPO) {
      let totalAmount = 0;
      const items = products.slice(0, 3).map(prod => {
        const qty = 50 + (p.day * 2);
        const costPrice = Number(prod.purchasePrice);
        const subTotal = costPrice * qty;
        totalAmount += subTotal;
        return { productId: prod.id, quantity: qty, costPrice, subTotal };
      });

      const createdPO = await prisma.purchaseOrder.create({
        data: {
          tenantId,
          supplierId: supplier.id,
          poNumber: p.num,
          status: POSstatus.RECEIVED,
          totalAmount,
          outletId,
          createdById: userId,
          expectedDate: poDate,
          recievedDate: poDate,
          createdAt: poDate,
          updatedAt: poDate,
          items: { create: items }
        }
      });

      for (const it of items) {
        await prisma.stockLedger.create({
          data: {
            tenantId,
            productId: it.productId,
            userId,
            outletId,
            purchaseOrderId: createdPO.id,
            type: MutationType.RESTOCK,
            quantity: it.quantity,
            stockBefore: 10,
            stockAfter: 10 + it.quantity,
            note: `Restock Pembelian Supplier ${supplier.name} (${p.num})`,
            createdAt: poDate,
          }
        });
      }
    }
  }

  /**
   * 6. Seed 30-Day Daily Sales Transactions (July 3 - August 1, 2026)
   */
  console.log('🛒 Seeding Sales Transactions (July 3 - August 1, 2026)...');

  const startDate = new Date(2026, 6, 3);
  const endDate = new Date(2026, 7, 1);

  let currentDate = new Date(startDate);
  let totalTxSeeded = 0;

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();

    const isToday = (month === 7 && day === 1);
    const txPerDay = isToday ? 10 : (day % 4) + 3;

    const monthStr = (month + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');

    for (let t = 1; t <= txPerDay; t++) {
      const invoiceNumber = `INV-${year}${monthStr}${dayStr}-${t.toString().padStart(3, '0')}`;
      const hour = 8 + (t * 1);
      const minute = (t * 12) % 60;
      const txDate = new Date(year, month, day, hour, minute, 0);

      const existingTx = await prisma.transaction.findUnique({
        where: { tenantId_invoiceNumber: { tenantId, invoiceNumber } }
      });

      if (existingTx) {
        continue;
      }

      const p1 = products[(day + t) % products.length];
      const p2 = products[(day + t + 1) % products.length];
      const selectedProds = [p1];
      if (t % 2 === 0 && p1.id !== p2.id) {
        selectedProds.push(p2);
      }

      let subTotal = 0;
      const itemsData = selectedProds.map(p => {
        const qty = (t % 3) + 1;
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

      const discount = (t % 3 === 0) ? 5000 : 0;
      const tax = Math.round((subTotal - discount) * 0.1);
      const grandTotal = subTotal - discount + tax;
      const paymentMethod = (t % 2 === 0) ? 'QRIS' : 'CASH';
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

      for (const it of itemsData) {
        await prisma.stockLedger.create({
          data: {
            tenantId,
            productId: it.productId,
            userId,
            outletId,
            transactionId: createdTx.id,
            type: MutationType.SALE,
            quantity: -it.quantity,
            stockBefore: 50,
            stockAfter: 50 - it.quantity,
            note: `Penjualan Kasir Invoice #${invoiceNumber}`,
            createdAt: txDate,
          }
        });
      }

      totalTxSeeded++;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`✅ ${totalTxSeeded} Sales transactions (July 3 - August 1, 2026) seeded successfully.`);
  console.log('🎉 30-day dummy data seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during 30-day seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
