import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

// ==========================================
// INTERFACE
// ==========================================

export interface OpenShiftInput {
  tenantId: string;
  userId: string;
  cashStart: number;
  outletId: string;
}

export interface CloseShiftInput {
  shiftId: string;
  tenantId: string;
  userId: string;
  cashActual: number;
}

// ==========================================
// SERVICE FUNCTIONS
// ==========================================

/**
 * Membuka shift baru untuk kasir.
 * Memastikan tidak ada shift OPEN yang sedang aktif untuk kasir yang bersangkutan.
 */
export async function openShift({ tenantId, userId, cashStart, outletId }: OpenShiftInput) {
  const existingActiveShift = await prisma.shift.findFirst({
    where: {
      tenantId,
      userId,
      status: 'OPEN',
    },
  });

  if (existingActiveShift) {
    throw new Error('Anda sudah memiliki shift yang sedang aktif. Harap tutup shift sebelumnya terlebih dahulu.');
  }

  const shift = await prisma.shift.create({
    data: {
      tenantId,
      userId,
      cashStart: new Prisma.Decimal(cashStart),
      status: 'OPEN',
      outletId,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return shift;
}

/**
 * Mengambil data shift yang sedang aktif milik kasir.
 * Mengembalikan null jika kasir tidak memiliki shift aktif.
 */
export async function getActiveShift(tenantId: string, userId: string) {
  const shift = await prisma.shift.findFirst({
    where: {
      tenantId,
      userId,
      status: 'OPEN',
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!shift) return null;

  const cashSales = await prisma.transaction.aggregate({
    where: {
      shiftId: shift.id,
      paymentMethod: 'CASH',
      status: 'COMPLETED',
    },
    _sum: { grandTotal: true },
    _count: true,
  });

  const totalCashSales = new Prisma.Decimal(cashSales._sum.grandTotal ?? 0);
  const cashExpected = new Prisma.Decimal(shift.cashStart).add(totalCashSales);

  return {
    ...shift,
    totalCashSales,
    cashExpected,
    totalTransactions: cashSales._count,
  };
}

/**
 * Menutup shift kerja kasir dan melakukan rekonsiliasi kas.
 * Menghitung selisih antara kas yang diharapkan dan kas aktual fisik.
 */
export async function closeShift({ shiftId, tenantId, userId, cashActual }: CloseShiftInput) {
  const shift = await prisma.shift.findFirst({
    where: {
      id: shiftId,
      tenantId,
      userId,
      status: 'OPEN',
    },
    include: {
      transactions: {
        where: {
          paymentMethod: 'CASH',
          status: 'COMPLETED',
        },
        select: { grandTotal: true },
      },
    },
  });

  if (!shift) {
    throw new Error('Shift aktif tidak ditemukan atau Anda tidak memiliki akses untuk menutupnya.');
  }

  const totalCashSales = shift.transactions.reduce(
    (sum: Prisma.Decimal, tx: { grandTotal: Prisma.Decimal }) =>
      sum.add(new Prisma.Decimal(tx.grandTotal)),
    new Prisma.Decimal(0)
  );

  const cashExpected = new Prisma.Decimal(shift.cashStart).add(totalCashSales);
  const cashActualDecimal = new Prisma.Decimal(cashActual);
  const difference = cashActualDecimal.sub(cashExpected);

  const closedShift = await prisma.shift.update({
    where: { id: shiftId },
    data: {
      status: 'CLOSED',
      endTime: new Date(),
      cashExpected,
      cashActual: cashActualDecimal,
      difference,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return {
    ...closedShift,
    totalCashSales,
    totalTransactions: shift.transactions.length,
  };
}

/**
 * Mengambil semua riwayat shift untuk sebuah tenant.
 * Endpoint ini diperuntukkan bagi owner/admin untuk audit kas.
 */
export async function getShiftHistory(tenantId: string) {
  const shifts = await prisma.shift.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { transactions: true },
      },
    },
  });

  return shifts;
}
