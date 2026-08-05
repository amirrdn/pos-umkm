import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { loadTenantUsersByIds, resolveTenantUser } from '../lib/tenantUserLookup';

/**
 * ============================================================================
 * SERVICE: CASHIER SHIFT & CASH RECONCILIATION SERVICE
 * ============================================================================
 * Manages POS cashier shifts: opening shifts with starting cash, tracking active
 * shift expected cash vs completed sales, closing shifts with cash discrepancy calculation,
 * and retrieving tenant shift history for financial auditing.
 * ============================================================================
 */

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

/**
 * Opens a new cashier shift with starting cash balance.
 * Validates that no active OPEN shift exists for the user.
 *
 * @param input OpenShiftInput containing tenantId, userId, starting cash, and outletId.
 * @returns Newly created Shift entity with user details.
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
 * Retrieves the currently active OPEN shift for a cashier with real-time cash metrics.
 *
 * @param tenantId Tenant ID context.
 * @param userId Cashier User ID.
 * @returns Active shift with expected cash calculations, or null if no shift is open.
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
 * Closes an active cashier shift and performs physical cash reconciliation.
 * Calculates variance (difference) between expected cash balance and actual physical count.
 *
 * @param input CloseShiftInput containing shiftId, tenantId, userId, and actual cash count.
 * @returns Closed shift entity with cash discrepancy metrics.
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
 * Retrieves full shift audit history for a tenant (Owner & Admin audit overview).
 *
 * @param tenantId Tenant ID context.
 * @returns List of shift history records with resolved user profiles.
 */
export async function getShiftHistory(tenantId: string) {
  const shifts = await prisma.shift.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
  });

  const userMap = await loadTenantUsersByIds(
    tenantId,
    shifts.map((shift) => shift.userId)
  );

  return shifts.map((shift) => ({
    ...shift,
    user: resolveTenantUser(userMap, shift.userId),
  }));
}
